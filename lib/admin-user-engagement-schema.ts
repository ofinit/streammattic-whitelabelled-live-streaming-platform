import { getDb } from "@/lib/db"

export async function ensureAdminUserEngagementSchema() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS user_addon_entitlements (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      photo_gallery_enabled BOOLEAN NOT NULL DEFAULT false,
      photo_gallery_opt_in BOOLEAN NOT NULL DEFAULT false,
      photo_gallery_subscription_expires_at TIMESTAMPTZ,
      photo_gallery_billing_period_start TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS user_credits (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      rtmp INTEGER NOT NULL DEFAULT 0,
      youtube_api INTEGER NOT NULL DEFAULT 0,
      youtube_embed INTEGER NOT NULL DEFAULT 0,
      third_party INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS admin_user_engagement_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      campaign_type TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'email',
      status TEXT NOT NULL DEFAULT 'logged',
      subject TEXT,
      note TEXT,
      follow_up_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_user_engagement_logs_user_created
    ON admin_user_engagement_logs(user_id, created_at DESC)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_user_engagement_logs_follow_up
    ON admin_user_engagement_logs(follow_up_at)
    WHERE follow_up_at IS NOT NULL
  `
}
