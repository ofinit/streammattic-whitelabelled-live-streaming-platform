/** Shared parsing for album create/update JSON bodies. */

const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
const MAX_LOCATION = 500
const MAX_EVENT_TYPE = 100
const MAX_NOTES = 5000

export type ParsedAlbumMetadata = {
  title: string
  description: string | null
  location: string | null
  eventType: string | null
  startsAt: string | null
  endsAt: string | null
  expiresAt: string | null
  notes: string | null
  galleryTemplateId: string
}

function trimOrNull(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  if (t.length === 0) return null
  return t.slice(0, max)
}

function parseOptionalIso(v: unknown): string | null {
  if (v == null || v === "") return null
  if (typeof v !== "string") return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function parseAlbumCreateBody(
  body: Record<string, unknown>,
  normalizeTemplateId: (id: string | undefined | null) => string,
): { ok: true; data: ParsedAlbumMetadata } | { ok: false; error: string } {
  const titleRaw = typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : ""
  if (titleRaw.length === 0) {
    return { ok: false, error: "Title is required" }
  }

  const galleryTemplateId = normalizeTemplateId(
    typeof body.galleryTemplateId === "string" ? body.galleryTemplateId : typeof body.gallery_template_id === "string" ? body.gallery_template_id : null,
  )

  return {
    ok: true,
    data: {
      title: titleRaw,
      description: trimOrNull(body.description, MAX_DESCRIPTION),
      location: trimOrNull(body.location, MAX_LOCATION),
      eventType: trimOrNull(body.eventType, MAX_EVENT_TYPE) ?? trimOrNull(body.event_type, MAX_EVENT_TYPE),
      startsAt: parseOptionalIso(body.startsAt ?? body.starts_at),
      endsAt: parseOptionalIso(body.endsAt ?? body.ends_at),
      expiresAt: parseOptionalIso(body.expiresAt ?? body.expires_at),
      notes: trimOrNull(body.notes, MAX_NOTES),
      galleryTemplateId,
    },
  }
}
