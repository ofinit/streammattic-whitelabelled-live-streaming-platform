export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run in the Node.js runtime (not Edge)
    console.log("[Instrumentation] Registering background tasks...")
    
    // Lazy import to avoid issues during build/edge
    const { runEventCleanupTask } = await import("./lib/server/cleanup-service")
    const { getDb } = await import("./lib/db")

    /**
     * Internal Loop: Checks every hour if a cleanup is due.
     * This avoids needing an external cron job if configured in the UI.
     */
    const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

    const checkAndRunCleanup = async () => {
      try {
        const sql = getDb()
        
        // 1. Check if automation is enabled
        const settings = await sql`SELECT value FROM platform_settings WHERE key = 'auto_cleanup_config'`
        const config = (settings[0]?.value as { enabled?: boolean }) || { enabled: false }
        
        if (!config.enabled) return

        // 2. Check last successful run
        const lastSuccess = await sql`
          SELECT started_at FROM cron_job_logs 
          WHERE status = 'success' 
          ORDER BY started_at DESC 
          LIMIT 1
        `
        
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        
        if (lastSuccess.length === 0 || new Date(lastSuccess[0].started_at as string) < oneDayAgo) {
          console.log("[Instrumentation] Auto-cleanup is due. Running now...")
          await runEventCleanupTask()
        }
      } catch (err) {
        console.error("[Instrumentation] Background task check failed:", err)
      }
    }

    // Run check on startup, then every hour
    checkAndRunCleanup()
    setInterval(checkAndRunCleanup, CHECK_INTERVAL_MS)
  }
}
