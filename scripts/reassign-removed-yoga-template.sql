-- One-time: point events still using removed visual template tpl-yoga to tpl-default.
-- Run in psql after backup. The Yoga UI template lived in app code (lib/template-registry),
-- not in event_templates seeds; this only updates events.template_data JSON.

BEGIN;

UPDATE events
SET template_data = jsonb_set(
  COALESCE(template_data, '{}'::jsonb),
  '{templateId}',
  '"tpl-default"'::jsonb,
  true
)
WHERE template_data->>'templateId' = 'tpl-yoga';

COMMIT;
