import fs from "fs"
import path from "path"
import crypto from "crypto"
import { getDb } from "@/lib/db"

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")

/** 
 * Extracts local path from image URL.
 * URL format: http://domain/api/uploads/subdir/filename.webp
 */
function getLocalPathFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null
  const parts = url.split("/api/uploads/")
  if (parts.length < 2) return null
  return path.join(UPLOAD_DIR, parts[1])
}

export async function runEventCleanupTask() {
  const sql = getDb()
  const jobId = crypto.randomUUID()

  console.log(`[Cleanup Service] Starting job ${jobId}`)
  
  await sql`
    INSERT INTO cron_job_logs (id, status, started_at) 
    VALUES (${jobId}, 'running', NOW())
  `

  let deletedCount = 0
  try {
    // 1. Find expired events
    const expiredEvents = await sql`
      SELECT e.id, e.title, u.email as "ownerEmail", 
             e.hero_image_url as "heroImageUrl", e.player_image_url as "playerImageUrl", 
             e.photo_gallery_urls as "photoGalleryUrls", e.photographer_logo_url as "photographerLogoUrl", 
             e.thumbnail
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.validity_expires_at < NOW()
    `

    console.log(`[Cleanup Service] Found ${expiredEvents.length} expired events to delete.`)

    for (const event of expiredEvents) {
      console.log(`[Cleanup Service] Cleaning up event: ${event.title} (${event.id})`)
      
      // 2. Collect image paths
      const pathsToDelete = new Set<string>()
      const candidateUrls = [
        event.heroImageUrl, 
        event.playerImageUrl, 
        event.photographerLogoUrl, 
        event.thumbnail
      ] as (string | null | undefined)[]

      candidateUrls.forEach(url => {
        const p = getLocalPathFromUrl(url)
        if (p) pathsToDelete.add(p)
      })

      if (Array.isArray(event.photoGalleryUrls)) {
        event.photoGalleryUrls.forEach((url: any) => {
          const p = getLocalPathFromUrl(url)
          if (p) pathsToDelete.add(p)
        })
      }

      // 3. Delete files from disk
      let assetsDeleted = 0
      for (const filepath of pathsToDelete) {
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
            assetsDeleted++
          }
        } catch (err: any) {
          console.error(`[Cleanup Service] Failed to delete file: ${filepath}`, err.message)
        }
      }

      // 4. Break optional FK links (orders/refund_requests do not use ON DELETE CASCADE)
      await sql`UPDATE orders SET event_id = NULL WHERE event_id = ${event.id as string}`
      await sql`UPDATE refund_requests SET event_id = NULL WHERE event_id = ${event.id as string}`

      // 5. Remove dependent rows (some deployments use FK to events without CASCADE)
      await sql`DELETE FROM event_dates WHERE event_id = ${event.id as string}`.catch(() => {})

      await sql`DELETE FROM events WHERE id = ${event.id as string}`
      deletedCount++

      // 6. Log per-event deletion
      await sql`
        INSERT INTO deleted_events_log (event_id, event_title, owner_email, reason, assets_found, assets_deleted)
        VALUES (
          ${event.id as string}, 
          ${event.title as string}, 
          ${event.ownerEmail as string | null}, 
          'expired', 
          ${pathsToDelete.size}, 
          ${assetsDeleted}
        )
      `
    }

    // 7. Finalize job log
    await sql`
      UPDATE cron_job_logs 
      SET status = 'success', ended_at = NOW(), deleted_count = ${deletedCount} 
      WHERE id = ${jobId}
    `

    console.log(`[Cleanup Service] Job ${jobId} complete. Deleted ${deletedCount} events.`)
    return { success: true, deletedCount, jobId }
  } catch (err: any) {
    console.error(`[Cleanup Service] Job ${jobId} failed:`, err)
    await sql`
      UPDATE cron_job_logs 
      SET status = 'failure', ended_at = NOW(), error_message = ${err.message} 
      WHERE id = ${jobId}
    `
    return { success: false, error: err.message, jobId }
  }
}
