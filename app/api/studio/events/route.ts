import { NextRequest, NextResponse } from "next/server"
import { getEvents, getEventCount } from "@/lib/db-queries"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import type { SimulcastConfig } from "@/lib/types"
import { hashCrewPin } from "@/lib/crew-pin"
import {
  STREAM_TYPE_MAP,
  PENDING_STREAM_DB,
  getCreditColumn,
  calculateTotalCreditsRequired,
  shouldBypassCredits,
  computeIncrementalCreditsRequired,
  eventDateRowsToCreditAdditionalDates,
  inferValidityDaysForBilling,
  type CreditNeedInput,
} from "@/lib/server/credits-logic"
import {
  loadStreamAndSimulcastPricing,
  assertStreamTypeEnabled,
  assertSimulcastAllowed,
  bodyStreamTypeToDb,
} from "@/lib/server/event-stream-policy"
import { checkStudioSubscriptionActiveForEventManagement } from "@/lib/studio-subscription"


const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function generateStreamKey() {
  return `sk_live_${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 10)}`
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

function sanitizeEventForClient(ev: Record<string, unknown>): Record<string, unknown> {
  if (!ev || typeof ev !== "object") return ev
  const out = { ...ev }
  // Input ev is already camelCase from getEvents()
  const hasCrewPin = !!(out.crewPinHash as string || out.crew_pin_hash as string)
  delete out.crewPinHash
  delete out.crew_pin_hash
  out.has_crew_pin = hasCrewPin
  return out
}

async function ensureUniqueSlug(sql: ReturnType<typeof import("@/lib/db").getDb>, base: string, excludeId?: string): Promise<string> {
  let slug = toSlug(base)
  if (!slug) slug = `event-${Date.now()}`
  let candidate = slug
  let attempt = 0
  while (true) {
    const rows = excludeId
      ? await sql`SELECT id FROM events WHERE slug = ${candidate} AND id != ${excludeId}`
      : await sql`SELECT id FROM events WHERE slug = ${candidate}`
    if (rows.length === 0) return candidate
    attempt++
    candidate = `${slug}-${attempt}`
  }
}

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")
  const search = req.nextUrl.searchParams.get("search") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50)
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0)

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 })
  }

  try {
    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`.catch(() => {})

    const [events, totalCount, liveCount, scheduledCount, completedCount] = await Promise.all([
      getEvents({ studioId, search, status, limit, offset }),
      getEventCount({ studioId }),
      getEventCount({ studioId, status: "live" }),
      getEventCount({ studioId, status: "scheduled" }),
      getEventCount({ studioId, status: "ended" }),
    ])

    const eventsList = Array.isArray(events) ? events : []
    const eventsSanitized = eventsList.map((e) => toCamel(sanitizeEventForClient((e || {}) as Record<string, unknown>)))
    return NextResponse.json({ events: eventsSanitized, totalCount, liveCount, scheduledCount, completedCount })
  } catch (error) {
    console.error("[studio/events GET] Error:", error)
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sql = getDb()
    const subGatePost = await checkStudioSubscriptionActiveForEventManagement(
      sql,
      user.id as string,
      user.role as string,
    )
    if (!subGatePost.ok) {
      return NextResponse.json(
        { error: subGatePost.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" },
        { status: 403 },
      )
    }

    const host = req.headers.get("host") || ""

    const body = await req.json()
    const {
      title, subtitle, description, streamType, scheduledAt, slug: rawSlug,
      isPasswordProtected, password, allowChat, allowReactions,
      youtubeUrl, embedCode, simulcastConfig, timezone, showScheduledPage,
      additionalDates, templateId, templateData: rawTemplateData,
      heroImageUrl, playerImageUrl, photoGalleryUrls, photographerLogoUrl, photographerContact,
      validityExpiresAt, validityDays, crewPin,
    } = body

    if (!title || !title.trim()) return NextResponse.json({ error: "Event title is required" }, { status: 400 })
    const normalizedStreamType = streamType || null
    const dbStreamType = normalizedStreamType ? (STREAM_TYPE_MAP[normalizedStreamType] || normalizedStreamType) : null
    const isPendingCreate = !dbStreamType
    const insertStreamType = isPendingCreate ? PENDING_STREAM_DB : dbStreamType

    const { streamTypePricing, simulcastPricing } = await loadStreamAndSimulcastPricing(sql)
    if (!isPendingCreate) {
      const streamPol = assertStreamTypeEnabled(streamTypePricing, insertStreamType)
      if (streamPol) return NextResponse.json({ error: streamPol.error }, { status: streamPol.status })
      const simPol0 = assertSimulcastAllowed(simulcastPricing, simulcastConfig, insertStreamType)
      if (simPol0) return NextResponse.json({ error: simPol0.error }, { status: simPol0.status })
    }

    // Resolve slug: use provided (validate) or auto-generate unique one
    let finalSlug: string
    if (rawSlug && rawSlug.trim()) {
      const s = rawSlug.trim().toLowerCase()
      if (!SLUG_REGEX.test(s)) {
        return NextResponse.json({ error: "Invalid slug format. Use lowercase letters, numbers and hyphens only." }, { status: 400 })
      }
      if (s.length < 3) return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 })
      if (s.length > 80) return NextResponse.json({ error: "Slug must be 80 characters or less" }, { status: 400 })
      const taken = await sql`SELECT id FROM events WHERE slug = ${s}`
      if (taken.length > 0) return NextResponse.json({ error: "This event URL is already taken. Please choose another." }, { status: 409 })
      finalSlug = s
    } else {
      finalSlug = await ensureUniqueSlug(sql, title)
    }

    const extraDates: { label: string; scheduledAt: string; timezone: string }[] = Array.isArray(additionalDates)
      ? additionalDates.filter((d: { scheduledAt?: string }) => d.scheduledAt)
      : []

    if (isPendingCreate && extraDates.length > 0) {
      return NextResponse.json(
        {
          error:
            "Extra event days require a stream type. Remove additional days or select a stream type first.",
        },
        { status: 400 },
      )
    }

    const totalNeed = await calculateTotalCreditsRequired({
      streamType: isPendingCreate ? null : insertStreamType,
      scheduledAt,
      additionalDates: isPendingCreate ? [] : extraDates,
      validityDays: isPendingCreate ? undefined : validityDays,
      validityExpiresAt: isPendingCreate ? null : (validityExpiresAt ?? null),
    })

    const targetUserId = user.id as string
    const shouldBypassCreditsDeduction = shouldBypassCredits(user, targetUserId, host)

    if (!shouldBypassCreditsDeduction && !isPendingCreate && insertStreamType && totalNeed > 0) {
      const creditCol = getCreditColumn(insertStreamType)
      const deducted = await sql`
        UPDATE user_credits
        SET ${sql.unsafe(creditCol)} = ${sql.unsafe(creditCol)} - ${totalNeed},
            updated_at = NOW()
        WHERE user_id = ${targetUserId}
          AND ${sql.unsafe(creditCol)} >= ${totalNeed}
        RETURNING *
      `
      if (deducted.length === 0) {
        return NextResponse.json({
          error: `Insufficient ${streamType} credits. Required: ${totalNeed}. Please purchase more credits.`,
        }, { status: 400 })
      }
    }

    const streamKey = isPendingCreate ? null : generateStreamKey()
    const rtmpUrl = process.env.RTMP_SERVER_URL || "rtmp://stream.streamlivee.com/live"

    // Merge templateId into template_data for storage (app uses string ids like "tpl-wedding")
    const resolvedTemplateId =
      templateId ??
      (rawTemplateData && typeof rawTemplateData === "object" && "templateId" in rawTemplateData
        ? (rawTemplateData.templateId as string)
        : null)
    const templateDataJson =
      resolvedTemplateId || (rawTemplateData && typeof rawTemplateData === "object" && Object.keys(rawTemplateData).length > 0)
        ? JSON.stringify({
            ...(typeof rawTemplateData === "object" && rawTemplateData ? rawTemplateData : {}),
            templateId: resolvedTemplateId,
          })
        : "{}"

    // Validity: pending creates use DB clock (30 days from insert); otherwise client tiers / until date
    let validityExpiresAtValue: string | null | ReturnType<typeof sql.unsafe> = null
    if (isPendingCreate) {
      validityExpiresAtValue = sql.unsafe("NOW() + INTERVAL '30 days'")
    } else if (validityExpiresAt && typeof validityExpiresAt === "string") {
      validityExpiresAtValue = validityExpiresAt
    } else if (typeof validityDays === "number" && validityDays > 0) {
      const base = scheduledAt ? new Date(scheduledAt) : new Date()
      base.setDate(base.getDate() + validityDays)
      validityExpiresAtValue = base.toISOString()
    }

    const crewPinHash =
      crewPin != null && String(crewPin).trim() !== "" ? hashCrewPin(String(crewPin).trim()) : null
    const photoGalleryJson = Array.isArray(photoGalleryUrls) ? JSON.stringify(photoGalleryUrls) : "[]"
    const photographerContactJson =
      photographerContact && typeof photographerContact === "object" ? JSON.stringify(photographerContact) : "{}"

    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS player_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_gallery_urls JSONB DEFAULT '[]'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_logo_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_contact JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS crew_pin_hash TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS use_custom_domain BOOLEAN DEFAULT false`.catch(() => {})


    const subtitleValue =
      subtitle !== undefined && subtitle !== null ? (String(subtitle).trim() || null) : null

    const rows = await sql`
      INSERT INTO events (
        user_id, title, subtitle, description, stream_type, stream_key, rtmp_url,
        youtube_url, embed_code, status, scheduled_at,
        is_password_protected, event_password, allow_chat, allow_reactions,
        simulcast_config, slug, timezone, show_scheduled_page, template_data,
        validity_expires_at, hero_image_url, player_image_url, photo_gallery_urls,
        photographer_logo_url, photographer_contact, crew_pin_hash, use_custom_domain
      ) VALUES (
        ${user.id as string}, ${title.trim()}, ${subtitleValue}, ${description || null},
        ${insertStreamType}, ${streamKey},
        ${!isPendingCreate && ["rtmp", "youtube_api"].includes(insertStreamType || "") ? rtmpUrl : null},
        ${youtubeUrl || null}, ${embedCode || null},
        'scheduled', ${scheduledAt || null},
        ${isPasswordProtected ?? false},
        ${isPasswordProtected ? (password || null) : null},
        ${allowChat ?? true}, ${allowReactions ?? true},
        ${JSON.stringify(insertStreamType === "rtmp" ? (simulcastConfig || {}) : {})},
        ${finalSlug},
        ${timezone || "UTC"},
        ${showScheduledPage ?? false},
        ${templateDataJson}::jsonb,
        ${validityExpiresAtValue},
        ${heroImageUrl || null}, ${playerImageUrl || null}, ${photoGalleryJson}::jsonb,
        ${photographerLogoUrl || null}, ${photographerContactJson}::jsonb, ${crewPinHash},
        ${user.role === 'studio'}
      )
      RETURNING *
    `

    const event = rows[0] as Record<string, unknown>
    const eventId = event.id as string

    if (totalNeed > 0 && !shouldBypassCreditsDeduction && !isPendingCreate) {
      await sql`
        INSERT INTO credit_deductions (user_id, event_id, stream_type, amount, reason)
        VALUES (${targetUserId}, ${eventId}, ${insertStreamType}, ${totalNeed}, 'Event creation')
      `
    }

    const needsOwnKey = !isPendingCreate && ["rtmp", "youtube_api"].includes(insertStreamType || "")

    // Insert additional date rows
    for (let i = 0; i < extraDates.length; i++) {
      const d = extraDates[i]
      const extraKey = needsOwnKey ? generateStreamKey() : null
      const extraRtmp = needsOwnKey ? rtmpUrl : null
      await sql`
        INSERT INTO event_dates (event_id, label, scheduled_at, timezone, stream_key, rtmp_url, sort_order)
        VALUES (${eventId}, ${d.label || `Day ${i + 2}`}, ${d.scheduledAt}, ${d.timezone || timezone || "UTC"}, ${extraKey}, ${extraRtmp}, ${i + 1})
      `
    }

    return NextResponse.json({ event: toCamel(event) }, { status: 201 })
  } catch (error) {
    console.error("[studio/events POST] Error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const host = req.headers.get("host") || ""

    const body = await req.json()
    const {
      id, title, subtitle, description, scheduledAt, status, slug: rawSlug,
      isPasswordProtected, password, allowChat, allowReactions, timezone, showScheduledPage, showRecording,
      additionalDates, templateId, templateData: rawTemplateData,
      heroImageUrl, playerImageUrl, photoGalleryUrls, photographerLogoUrl, photographerContact,
      validityExpiresAt, validityDays, crewPin,
      streamType, youtubeUrl, embedCode, simulcastConfig,
      isSuspended,
    } = body

    if (!id) return NextResponse.json({ error: "Event id is required" }, { status: 400 })

    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`.catch(() => {})
    const existing = await sql`SELECT * FROM events WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    
    const existingRow = existing[0] as Record<string, unknown>
    // Determine if credits should be bypassed
    const targetUserId = existingRow.user_id as string
    
    if (targetUserId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (user.role === "studio" && targetUserId === user.id) {
      const subGatePut = await checkStudioSubscriptionActiveForEventManagement(
        sql,
        user.id as string,
        user.role as string,
      )
      if (!subGatePut.ok) {
        return NextResponse.json(
          { error: subGatePut.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" },
          { status: 403 },
        )
      }
    }

    const shouldBypassCreditsDeduction = shouldBypassCredits(user, targetUserId, host)
    const prevStreamType = (existingRow.stream_type || null) as string | null

    const { streamTypePricing, simulcastPricing: simulcastPricingPut } = await loadStreamAndSimulcastPricing(sql)

    let streamTypeForUpdate: string | undefined = undefined
    if (streamType !== undefined) {
      if (streamType === "" || streamType === null) {
        streamTypeForUpdate = undefined
      } else {
        const mapped = bodyStreamTypeToDb(streamType)
        streamTypeForUpdate = mapped === null ? undefined : mapped
      }
    }

    const resolvedStreamType =
      (streamTypeForUpdate !== undefined ? streamTypeForUpdate : prevStreamType) ||
      (prevStreamType === PENDING_STREAM_DB ? PENDING_STREAM_DB : "rtmp")

    const putAdditionalWithSchedule = Array.isArray(additionalDates)
      ? (additionalDates as { scheduledAt?: string }[]).filter((d) => d.scheduledAt)
      : []
    if (resolvedStreamType === PENDING_STREAM_DB && putAdditionalWithSchedule.length > 0) {
      return NextResponse.json(
        {
          error:
            "Extra event days require a stream type. Remove additional days or select a stream type first.",
        },
        { status: 400 },
      )
    }

    const rawExistingSim = existingRow.simulcast_config
    const existingSim: SimulcastConfig =
      rawExistingSim && typeof rawExistingSim === "object"
        ? (rawExistingSim as SimulcastConfig)
        : { enabled: false, customDestinations: [] }
    const simulcastForPolicy = simulcastConfig !== undefined ? simulcastConfig : existingSim

    const streamPolPut = assertStreamTypeEnabled(streamTypePricing, resolvedStreamType)
    if (streamPolPut) return NextResponse.json({ error: streamPolPut.error }, { status: streamPolPut.status })
    const simPolPut = assertSimulcastAllowed(simulcastPricingPut, simulcastForPolicy, resolvedStreamType)
    if (simPolPut) return NextResponse.json({ error: simPolPut.error }, { status: simPolPut.status })

    const storedSimulcastJson =
      resolvedStreamType === "rtmp"
        ? (simulcastConfig !== undefined ? simulcastConfig : existingSim)
        : {}

    let finalSlug: string | null = null
    if (rawSlug !== undefined && rawSlug !== null) {
      const s = rawSlug.trim().toLowerCase()
      if (s) {
        if (!SLUG_REGEX.test(s)) return NextResponse.json({ error: "Invalid slug format." }, { status: 400 })
        if (s.length < 3) return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 })
        if (s.length > 80) return NextResponse.json({ error: "Slug must be 80 characters or less" }, { status: 400 })
        const taken = await sql`SELECT id FROM events WHERE slug = ${s} AND id != ${id}`
        if (taken.length > 0) return NextResponse.json({ error: "This event URL is already taken." }, { status: 409 })
        finalSlug = s
      }
    }

    if (!shouldBypassCreditsDeduction && prevStreamType) {
      const oldDatesRows = await sql`SELECT scheduled_at FROM event_dates WHERE event_id = ${id}`
      const prevAdditional = eventDateRowsToCreditAdditionalDates(
        oldDatesRows as { scheduled_at: unknown }[],
      )

      const prevScheduled = (existingRow.scheduled_at as string) || null
      const prevValidityDays = await inferValidityDaysForBilling(
        prevScheduled,
        existingRow.validity_expires_at as string | null,
        existingRow.created_at as string | null,
      )

      const previous: CreditNeedInput = {
        streamType: prevStreamType,
        scheduledAt: prevScheduled,
        additionalDates: prevAdditional,
        validityDays: prevValidityDays,
        validityExpiresAt: (existingRow.validity_expires_at as string | null) ?? null,
      }

      const nextScheduled = (scheduledAt ?? existingRow.scheduled_at) as string | null

      let mergedValidityExpires: string | null | undefined = validityExpiresAt
      if (mergedValidityExpires === undefined && typeof validityDays === "number" && validityDays > 0) {
        const s = (existingRow.scheduled_at as string) || scheduledAt
        if (s) {
          const d = new Date(s)
          d.setDate(d.getDate() + validityDays)
          mergedValidityExpires = d.toISOString()
        }
      }
      if (mergedValidityExpires === undefined) {
        mergedValidityExpires = (existingRow.validity_expires_at as string | null) ?? undefined
      }

      let nextValidityDays: number | undefined
      if (typeof validityDays === "number" && validityDays > 0) {
        nextValidityDays = validityDays
      } else {
        nextValidityDays = await inferValidityDaysForBilling(
          nextScheduled,
          mergedValidityExpires ?? null,
          existingRow.created_at as string | null,
        )
      }

      const nextAdditional = Array.isArray(additionalDates)
        ? (additionalDates as { scheduledAt?: string }[])
            .filter((d) => d.scheduledAt)
            .map((d) => ({ scheduledAt: d.scheduledAt as string }))
        : prevAdditional

      const next: CreditNeedInput = {
        streamType: resolvedStreamType,
        scheduledAt: nextScheduled,
        additionalDates: nextAdditional,
        validityDays: nextValidityDays,
        validityExpiresAt: mergedValidityExpires ?? null,
      }

      const incrementalNeed = await computeIncrementalCreditsRequired(previous, next)

      if (incrementalNeed > 0) {
        const creditCol = getCreditColumn(resolvedStreamType)
        const deducted = await sql`
          UPDATE user_credits
          SET ${sql.unsafe(creditCol)} = ${sql.unsafe(creditCol)} - ${incrementalNeed},
              updated_at = NOW()
          WHERE user_id = ${targetUserId}
            AND ${sql.unsafe(creditCol)} >= ${incrementalNeed}
          RETURNING *
        `
        if (deducted.length === 0) {
          return NextResponse.json({
            error: `Insufficient ${resolvedStreamType} credits for this update. Required: ${incrementalNeed}.`,
          }, { status: 400 })
        }
      }
    }

    const existingTemplateData = existingRow.template_data as Record<string, unknown> | null | undefined
    const hasTemplateUpdate = templateId !== undefined || (rawTemplateData !== undefined && rawTemplateData !== null)
    const resolvedTemplateIdPut =
      templateId !== undefined
        ? templateId
        : (rawTemplateData && typeof rawTemplateData === "object" && "templateId" in rawTemplateData
            ? (rawTemplateData.templateId as string)
            : existingTemplateData && typeof existingTemplateData === "object" && "templateId" in existingTemplateData
              ? existingTemplateData.templateId
              : null)
    const newTemplateData = hasTemplateUpdate
      ? {
          ...(existingTemplateData && typeof existingTemplateData === "object" ? existingTemplateData : {}),
          ...(typeof rawTemplateData === "object" && rawTemplateData ? rawTemplateData : {}),
          templateId: resolvedTemplateIdPut,
        }
      : (existingTemplateData && typeof existingTemplateData === "object" ? existingTemplateData : {})

    let validityExpiresAtValue: string | null | undefined = validityExpiresAt
    if (validityExpiresAtValue === undefined && typeof validityDays === "number" && validityDays > 0) {
      const s = (existingRow.scheduled_at as string) || scheduledAt
      if (s) {
        const d = new Date(s)
        d.setDate(d.getDate() + validityDays)
        validityExpiresAtValue = d.toISOString()
      }
    }
    if (validityExpiresAtValue === undefined) validityExpiresAtValue = null

    const crewPinHash =
      crewPin !== undefined && crewPin !== null && String(crewPin).trim() !== ""
        ? hashCrewPin(String(crewPin).trim())
        : (crewPin === "" || crewPin === null ? null : undefined)
    const photoGalleryJson =
      photoGalleryUrls !== undefined ? (Array.isArray(photoGalleryUrls) ? JSON.stringify(photoGalleryUrls) : "[]") : undefined
    const photographerContactJson =
      photographerContact !== undefined
        ? (photographerContact && typeof photographerContact === "object" ? JSON.stringify(photographerContact) : "{}")
        : undefined

    const prev = existingRow as Record<string, unknown>
    const prevGallery = prev.photo_gallery_urls ?? []
    const prevPhotographer = prev.photographer_contact ?? {}

    /** When `incoming` is undefined, keep DB value. When null or "", clear column. */
    const resolveImageUrlColumn = (incoming: unknown, previous: unknown): string | null => {
      if (incoming === undefined) {
        return typeof previous === "string" ? previous : null
      }
      if (incoming === null) return null
      if (typeof incoming === "string" && incoming.trim() === "") return null
      if (typeof incoming === "string") return incoming.trim()
      return null
    }

    const finalHeroImageUrl = resolveImageUrlColumn(heroImageUrl, prev.hero_image_url)
    const finalPlayerImageUrl = resolveImageUrlColumn(playerImageUrl, prev.player_image_url)
    const finalPhotographerLogoUrl = resolveImageUrlColumn(photographerLogoUrl, prev.photographer_logo_url)

    const finalPhotoGallery =
      photoGalleryUrls !== undefined
        ? (Array.isArray(photoGalleryUrls) ? JSON.stringify(photoGalleryUrls) : "[]")
        : JSON.stringify(Array.isArray(prevGallery) ? prevGallery : [])
    const finalPhotographerContact =
      photographerContact !== undefined
        ? (typeof photographerContact === "object" && photographerContact ? JSON.stringify(photographerContact) : "{}")
        : JSON.stringify(typeof prevPhotographer === "object" && prevPhotographer ? prevPhotographer : {})
    const finalCrewPinHash = crewPinHash !== undefined ? crewPinHash : (prev.crew_pin_hash as string | null) ?? null

    const nextSimulcastPersisted =
      simulcastConfig !== undefined || streamTypeForUpdate !== undefined ? storedSimulcastJson : existingSim

    const youtubeUrlParam = youtubeUrl === undefined ? null : youtubeUrl ?? null
    const embedCodeParam = embedCode === undefined ? null : embedCode ?? null

    const prevSuspended = Boolean(existingRow.is_suspended ?? false)
    const nextSuspended = isSuspended !== undefined ? Boolean(isSuspended) : prevSuspended

    const rows = await sql`
      UPDATE events SET
        title = COALESCE(${title ?? null}, title),
        subtitle = COALESCE(${subtitle ?? null}, subtitle),
        description = COALESCE(${description ?? null}, description),
        status = COALESCE(${status ?? null}, status),
        scheduled_at = COALESCE(${scheduledAt ?? null}, scheduled_at),
        stream_type = COALESCE(${streamTypeForUpdate ?? null}, stream_type),
        youtube_url = COALESCE(${youtubeUrlParam}, youtube_url),
        embed_code = COALESCE(${embedCodeParam}, embed_code),
        simulcast_config = ${JSON.stringify(nextSimulcastPersisted)}::jsonb,
        is_password_protected = COALESCE(${isPasswordProtected ?? null}, is_password_protected),
        event_password = COALESCE(${password ?? null}, event_password),
        allow_chat = COALESCE(${allowChat ?? null}, allow_chat),
        allow_reactions = COALESCE(${allowReactions ?? null}, allow_reactions),
        slug = COALESCE(${finalSlug}, slug),
        timezone = COALESCE(${timezone ?? null}, timezone),
        show_scheduled_page = COALESCE(${showScheduledPage ?? null}, show_scheduled_page),
        show_recording = COALESCE(${showRecording ?? null}, show_recording),
        template_data = ${JSON.stringify(newTemplateData)}::jsonb,
        validity_expires_at = COALESCE(${validityExpiresAtValue ?? null}, validity_expires_at),
        hero_image_url = ${finalHeroImageUrl},
        player_image_url = ${finalPlayerImageUrl},
        photo_gallery_urls = ${finalPhotoGallery}::jsonb,
        photographer_logo_url = ${finalPhotographerLogoUrl},
        photographer_contact = ${finalPhotographerContact}::jsonb,
        crew_pin_hash = ${finalCrewPinHash},
        is_suspended = ${nextSuspended},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    const updatedEvent = rows[0] as Record<string, unknown>

    // Sync additional dates if provided
    if (Array.isArray(additionalDates)) {
      await sql`DELETE FROM event_dates WHERE event_id = ${id}`
      const existing = await sql`SELECT stream_type FROM events WHERE id = ${id}`
      const evStreamType =
        ((existing[0] as Record<string, unknown>)?.stream_type as string) || resolvedStreamType || PENDING_STREAM_DB
      const rtmpUrl = process.env.RTMP_SERVER_URL || "rtmp://stream.streamlivee.com/live"
      const needsOwnKey = ["rtmp", "youtube_api"].includes(evStreamType)
      for (let i = 0; i < additionalDates.length; i++) {
        const d = additionalDates[i] as { label?: string; scheduledAt?: string; timezone?: string }
        if (!d.scheduledAt) continue
        const extraKey = needsOwnKey ? generateStreamKey() : null
        const extraRtmp = needsOwnKey ? rtmpUrl : null
        await sql`
          INSERT INTO event_dates (event_id, label, scheduled_at, timezone, stream_key, rtmp_url, sort_order)
          VALUES (${id}, ${d.label || `Day ${i + 2}`}, ${d.scheduledAt}, ${d.timezone || timezone || "UTC"}, ${extraKey}, ${extraRtmp}, ${i + 1})
        `
      }
    }

    return NextResponse.json({ event: toCamel(sanitizeEventForClient(updatedEvent as Record<string, unknown>)) })
  } catch (error) {
    console.error("[studio/events PUT] Error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (user.role === "streamer" || user.role === "studio") {
      return NextResponse.json(
        {
          error:
            "Event deletion is not available for your account. Suspend the event from the menu to hide its public page.",
          code: "USE_SUSPEND",
        },
        { status: 403 },
      )
    }

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Event id is required" }, { status: 400 })

    const sql = getDb()
    const existing = await sql`SELECT * FROM events WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    const ownerId = (existing[0] as Record<string, unknown>).user_id as string
    if (ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (user.role === "studio" && ownerId === user.id) {
      const subGateDel = await checkStudioSubscriptionActiveForEventManagement(
        sql,
        user.id as string,
        user.role as string,
      )
      if (!subGateDel.ok) {
        return NextResponse.json(
          { error: subGateDel.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" },
          { status: 403 },
        )
      }
    }

    await sql`DELETE FROM events WHERE id = ${id}`
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("[studio/events DELETE] Error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
