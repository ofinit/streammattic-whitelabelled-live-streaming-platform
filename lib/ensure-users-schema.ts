import { getDb } from "@/lib/db"

/**
 * Idempotent: adds `users.theme_preference` when missing (deployments that ran DB before the column existed).
 * Without this, SELECT/UPDATE on `theme_preference` fails and `/api/auth/me` returns anonymous — looks like logout.
 */
let themePreferenceColumnPromise: Promise<void> | null = null

export async function ensureUsersThemePreferenceColumn(): Promise<void> {
  if (!themePreferenceColumnPromise) {
    themePreferenceColumnPromise = (async () => {
      const sql = getDb()
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system'
      `
    })().catch((err: unknown) => {
      themePreferenceColumnPromise = null
      throw err
    })
  }
  await themePreferenceColumnPromise
}
