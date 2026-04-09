-- Studio annual subscription: renewal date, reminder deduplication

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS studio_subscription_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS studio_subscription_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_end_at TIMESTAMPTZ NOT NULL,
  threshold_days INT NOT NULL CHECK (threshold_days IN (0, 1, 2, 3, 7, 15, 30)),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_end_at, threshold_days)
);

CREATE INDEX IF NOT EXISTS idx_studio_sub_reminders_user ON studio_subscription_reminders(user_id);

-- Existing studio accounts: one year from migration (adjust via admin if needed)
UPDATE users
SET studio_subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE role = 'studio'
  AND studio_subscription_expires_at IS NULL;
