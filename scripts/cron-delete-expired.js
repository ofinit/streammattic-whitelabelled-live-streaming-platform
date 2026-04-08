const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

/** 
 * Extracts local path from image URL.
 * URL format: http://domain/api/uploads/subdir/filename.webp
 */
function getLocalPathFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const parts = url.split("/api/uploads/");
  if (parts.length < 2) return null;
  return path.join(UPLOAD_DIR, parts[1]);
}

async function runCleanup() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const jobId = crypto.randomUUID();
  await client.query(
    "INSERT INTO cron_job_logs (id, status, started_at) VALUES ($1, 'running', NOW())",
    [jobId]
  );

  let deletedCount = 0;
  try {
    // 1. Find expired events
    const expiredRes = await client.query(`
      SELECT e.id, e.title, u.email as owner_email, 
             e.hero_image_url, e.player_image_url, e.photo_gallery_urls, e.photographer_logo_url, e.thumbnail
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.validity_expires_at < NOW()
    `);

    const expiredEvents = expiredRes.rows || [];
    console.log(`Found ${expiredEvents.length} expired events to delete.`);

    for (const event of expiredEvents) {
      console.log(`Cleaning up event: ${event.title} (${event.id})`);
      
      // 2. Collect image paths
      const pathsToDelete = new Set();
      [event.hero_image_url, event.player_image_url, event.photographer_logo_url, event.thumbnail].forEach(url => {
        const p = getLocalPathFromUrl(url);
        if (p) pathsToDelete.add(p);
      });

      if (Array.isArray(event.photo_gallery_urls)) {
        event.photo_gallery_urls.forEach(url => {
          const p = getLocalPathFromUrl(url);
          if (p) pathsToDelete.add(p);
        });
      }

      // 3. Delete files from disk
      let assetsDeleted = 0;
      for (const filepath of pathsToDelete) {
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            assetsDeleted++;
          }
        } catch (err) {
          console.error(`Failed to delete file: ${filepath}`, err.message);
        }
      }

      // 4. Delete event from DB
      await client.query("DELETE FROM events WHERE id = $1", [event.id]);
      deletedCount++;

      // 5. Log per-event deletion
      await client.query(
        `INSERT INTO deleted_events_log (event_id, event_title, owner_email, reason, assets_found, assets_deleted)
         VALUES ($1, $2, $3, 'expired', $4, $5)`,
        [event.id, event.title, event.owner_email, pathsToDelete.size, assetsDeleted]
      );
    }

    // 6. Finalize job log
    await client.query(
      "UPDATE cron_job_logs SET status = 'success', ended_at = NOW(), deleted_count = $1 WHERE id = $2",
      [deletedCount, jobId]
    );

    console.log(`Cleanup complete. Deleted ${deletedCount} events.`);
  } catch (err) {
    console.error("Cleanup job failed:", err);
    await client.query(
      "UPDATE cron_job_logs SET status = 'failure', ended_at = NOW(), error_message = $1 WHERE id = $2",
      [err.message, jobId]
    );
  } finally {
    await client.end();
  }
}

// Minimal crypto fallback for older Node versions in scripts
if (typeof crypto === "undefined") {
  global.crypto = { randomUUID: () => require("crypto").randomUUID() };
}

runCleanup().catch(console.error);
