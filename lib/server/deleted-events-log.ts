import { getDb } from "@/lib/db"

export type DeletedEventLogInput = {
  eventId: string
  eventTitle: string | null
  ownerEmail: string | null
  ownerUserId: string | null
  studioId: string | null
  reason: string
  assetsFound?: number
  assetsDeleted?: number
}

type SqlFn = ReturnType<typeof getDb>

export async function insertDeletedEventLog(sql: SqlFn, input: DeletedEventLogInput): Promise<void> {
  const assetsFound = input.assetsFound ?? 0
  const assetsDeleted = input.assetsDeleted ?? 0
  await sql`
    INSERT INTO deleted_events_log (
      event_id, event_title, owner_email, owner_user_id, studio_id,
      reason, assets_found, assets_deleted
    )
    VALUES (
      ${input.eventId},
      ${input.eventTitle},
      ${input.ownerEmail},
      ${input.ownerUserId},
      ${input.studioId},
      ${input.reason},
      ${assetsFound},
      ${assetsDeleted}
    )
  `
}
