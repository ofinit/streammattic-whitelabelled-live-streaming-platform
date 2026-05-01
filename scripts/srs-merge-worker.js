#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * SRS DVR merge worker.
 *
 * Run this on the same server/container where SRS writes recordings. It reads
 * local FLV files from /root/recordings, merges them with local FFmpeg, and
 * updates PostgreSQL directly. It does not use SSH or Next.js API routes.
 */

const fs = require("fs/promises")
const path = require("path")
const { spawn } = require("child_process")
const { Pool } = require("pg")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: Number.parseInt(process.env.SRS_MERGE_DB_POOL_MAX || "4", 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

const CONFIG = {
  liveDir: (process.env.SRS_LIVE_RECORDINGS_DIR || "/root/recordings/recordings/live").replace(/\/$/, ""),
  finalDir: (process.env.SRS_FINAL_RECORDINGS_DIR || "/root/recordings/final").replace(/\/$/, ""),
  publicBaseUrl: (process.env.SRS_PUBLIC_RECORDINGS_BASE_URL || "https://rtmplive.in/recordings").replace(/\/$/, ""),
  intervalMs: Number.parseInt(process.env.SRS_MERGE_INTERVAL_MS || "300000", 10),
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

function safeName(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_")
}

function isInside(parent, child) {
  const rel = path.relative(parent, child)
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel)
}

function concatEscape(filePath) {
  return filePath.replace(/'/g, "'\\''")
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFlvFiles(streamId) {
  const dir = path.join(CONFIG.liveDir, streamId)
  if (!(await pathExists(dir))) return { dir, files: [] }
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".flv")) continue
    const fullPath = path.join(dir, entry.name)
    const stat = await fs.stat(fullPath)
    if (stat.size <= 0) continue
    files.push({ path: fullPath, name: entry.name, mtimeMs: stat.mtimeMs })
  }
  files.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name))
  return { dir, files }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(CONFIG.ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000)
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`))
    })
  })
}

async function claimSession(client) {
  const result = await client.query(`
    UPDATE stream_sessions
    SET merge_status = 'merging', updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM stream_sessions
      WHERE is_active = false
        AND merged = false
        AND merge_status IN ('pending', 'merge_ready', 'failed')
        AND merge_after IS NOT NULL
        AND merge_after <= NOW()
      ORDER BY merge_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, event_id, stream_id
  `)
  return result.rows[0] || null
}

async function claimDeletionJob(client) {
  const result = await client.query(`
    UPDATE stream_recording_deletion_jobs
    SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM stream_recording_deletion_jobs
      WHERE status IN ('pending', 'failed')
        AND attempts < 5
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `)
  return result.rows[0] || null
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function pathFromPublicUrl(url) {
  if (!url || typeof url !== "string") return null
  if (!url.startsWith(CONFIG.publicBaseUrl)) return null
  const relative = decodeURIComponent(url.slice(CONFIG.publicBaseUrl.length).replace(/^\/+/, ""))
  return path.join(CONFIG.finalDir, relative)
}

async function deletePathIfSafe(targetPath, deleted) {
  if (!targetPath || typeof targetPath !== "string") return
  let resolved = targetPath
  if (/^https?:\/\//i.test(targetPath)) {
    resolved = pathFromPublicUrl(targetPath)
    if (!resolved) return
  }
  resolved = path.resolve(resolved)
  const liveRoot = path.resolve(CONFIG.liveDir)
  const finalRoot = path.resolve(CONFIG.finalDir)
  if (resolved !== liveRoot && resolved !== finalRoot && !isInside(liveRoot, resolved) && !isInside(finalRoot, resolved)) {
    console.warn(`[srs-merge-worker] refused to delete outside recording roots: ${resolved}`)
    return
  }
  await fs.rm(resolved, { recursive: true, force: true })
  deleted.push(resolved)
}

async function processDeletionJob(job) {
  const streamIds = normalizeJsonArray(job.stream_ids).map(String).filter(Boolean)
  const paths = normalizeJsonArray(job.paths).map(String).filter(Boolean)
  const deleted = []
  const client = await pool.connect()
  try {
    for (const streamId of streamIds) {
      const safeStream = safeName(streamId)
      await deletePathIfSafe(path.join(CONFIG.liveDir, safeStream), deleted)
      await deletePathIfSafe(path.join(CONFIG.finalDir, safeStream), deleted)
    }
    for (const p of paths) {
      await deletePathIfSafe(p, deleted)
    }
    await client.query(
      `
        UPDATE stream_recording_deletion_jobs
        SET status = 'deleted',
            error_message = NULL,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      [job.id],
    )
    console.log(`[srs-merge-worker] deleted DVR assets for event ${job.event_id || job.event_slug || job.id}: ${deleted.length} path(s)`)
  } catch (error) {
    await client.query(
      `
        UPDATE stream_recording_deletion_jobs
        SET status = 'failed',
            error_message = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [job.id, error.message],
    )
    console.error(`[srs-merge-worker] DVR delete failed for job ${job.id}:`, error)
  } finally {
    client.release()
  }
}

async function recordFailure(client, session, sourceDir, message) {
  await client.query(
    `
      INSERT INTO stream_recordings (session_id, event_id, stream_id, source_dir, output_path, public_url, status, error_message)
      VALUES ($1, $2, $3, $4, '', '', 'failed', $5)
    `,
    [session.id, session.event_id, session.stream_id, sourceDir, message],
  )
  await client.query(
    `
      UPDATE stream_sessions
      SET merge_status = 'failed', merge_error = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [session.id, message],
  )
}

async function recordSuccess(client, session, sourceDir, outputPath, publicUrl, fileSizeBytes) {
  await client.query(
    `
      INSERT INTO stream_recordings (
        session_id, event_id, stream_id, source_dir, output_path, public_url, file_size_bytes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'merged')
    `,
    [session.id, session.event_id, session.stream_id, sourceDir, outputPath, publicUrl, fileSizeBytes],
  )
  await client.query(
    `
      UPDATE stream_sessions
      SET merged = true,
          merge_status = 'merged',
          merged_at = NOW(),
          final_recording_path = $2,
          final_recording_url = $3,
          merge_error = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [session.id, outputPath, publicUrl],
  )
}

async function mergeSession(session) {
  const streamId = session.stream_id
  const { dir: sourceDir, files } = await listFlvFiles(streamId)
  const client = await pool.connect()
  try {
    if (files.length === 0) {
      await recordFailure(client, session, sourceDir, "No FLV files found for stream")
      return
    }

    const outDir = path.join(CONFIG.finalDir, safeName(streamId))
    await fs.mkdir(outDir, { recursive: true })
    const workDir = path.join(outDir, `.merge-${safeName(session.id)}-${stamp()}`)
    await fs.mkdir(workDir, { recursive: true })
    const listPath = path.join(workDir, "list.txt")
    const outputName = `${safeName(streamId)}-${stamp()}.mp4`
    const tempOutput = path.join(workDir, `${outputName}.tmp.mp4`)
    const finalOutput = path.join(outDir, outputName)
    const listBody = files.map((file) => `file '${concatEscape(file.path)}'`).join("\n") + "\n"
    await fs.writeFile(listPath, listBody, "utf8")

    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      tempOutput,
    ])

    await fs.rename(tempOutput, finalOutput)
    await fs.rm(workDir, { recursive: true, force: true })
    const stat = await fs.stat(finalOutput)
    const publicUrl = `${CONFIG.publicBaseUrl}/${encodeURIComponent(streamId)}/${encodeURIComponent(outputName)}`
    await recordSuccess(client, session, sourceDir, finalOutput, publicUrl, stat.size)
    console.log(`[srs-merge-worker] merged ${streamId}: ${publicUrl}`)
  } catch (error) {
    await recordFailure(client, session, sourceDir, error.message)
    console.error(`[srs-merge-worker] merge failed for ${streamId}:`, error)
  } finally {
    client.release()
  }
}

async function tick() {
  const client = await pool.connect()
  try {
    while (true) {
      await client.query("BEGIN")
      const job = await claimDeletionJob(client)
      await client.query("COMMIT")
      if (!job) break
      await processDeletionJob(job)
    }

    while (true) {
      await client.query("BEGIN")
      const session = await claimSession(client)
      await client.query("COMMIT")
      if (!session) break
      await mergeSession(session)
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("[srs-merge-worker] tick failed:", error)
  } finally {
    client.release()
  }
}

async function main() {
  console.log("[srs-merge-worker] starting", CONFIG)
  await tick()
  setInterval(() => {
    tick().catch((error) => console.error("[srs-merge-worker] unhandled tick error:", error))
  }, CONFIG.intervalMs)
}

process.on("SIGTERM", async () => {
  console.log("[srs-merge-worker] received SIGTERM")
  await pool.end()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("[srs-merge-worker] received SIGINT")
  await pool.end()
  process.exit(0)
})

main().catch(async (error) => {
  console.error("[srs-merge-worker] fatal:", error)
  await pool.end()
  process.exit(1)
})
