# Stream-Livee / Streammattic — development handbook

Canonical technical entry point for contributors. Product overview and deploy shortcuts remain in [README.md](../README.md). Template work is covered in [TEMPLATE_IMPLEMENTATION_PLAYBOOK.md](./TEMPLATE_IMPLEMENTATION_PLAYBOOK.md). **Coolify / ozero.cloud:** [deploy-coolify-ozero.md](./deploy-coolify-ozero.md). CloudJiffy / Jelastic: [deploy-cloudjiffy.md](./deploy-cloudjiffy.md).

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Data:** PostgreSQL via `pg` ([`lib/db.ts`](../lib/db.ts)); connection string **`DATABASE_URL`**
- **Auth:** Email/password via [`POST /api/auth/login`](../app/api/auth/login/route.ts) (HTTP-only `sm_session` cookie), [`GET /api/auth/me`](../app/api/auth/me/route.ts); session gates in [`middleware.ts`](../middleware.ts)
- **Optional cache:** Upstash Redis ([`lib/redis.ts`](../lib/redis.ts)) — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. If unset, cached code paths fall back to the database.

## Database: local vs production

| Concern | Local | Production (typical) |
| --- | --- | --- |
| Env file | `.env.local` | `.env.production` on the server |
| Migrate command | `npm run db:migrate` | `npm run db:migrate:production` |
| Connection | `localhost`, Docker service `postgres`, or a restored clone | Postgres on LAN or managed host (see deploy doc) |

**Where production `DATABASE_URL` lives:** Only in the deployment environment (e.g. Coolify env vars, server `.env.production` — never committed). On **ozero.cloud / Coolify**, use the database dashboard **internal** URL for the app; see [Internal vs external URLs](./deploy-coolify-ozero.md#internal-vs-external-urls).

**Schema source of truth:** [`scripts/run-migration.js`](../scripts/run-migration.js) — idempotent `CREATE` statements; re-runs skip objects that already exist. It seeds `platform_settings` (no built-in admin account). For a first admin, run [`scripts/seed-production-admin.js`](../scripts/seed-production-admin.js). For new environments, use the npm scripts above rather than older `scripts/migrate-*.js` helpers unless you are repairing a legacy database.

**Backups and cloning prod to local:** [`scripts/README-BACKUP-RESTORE.md`](../scripts/README-BACKUP-RESTORE.md) (`PRODUCTION_DATABASE_URL`, `db:backup`, `db:setup-local`).

**Admin database export/import (optional):** Set `ADMIN_DATABASE_TOOLS_ENABLED=true` to enable [`/admin/database`](../app/admin/database/page.tsx) and [`/api/admin/database/*`](../app/api/admin/database/) (admin-only; requires `pg_dump` / `psql` on the host for full functionality). Optional `BACKUP_DIR` overrides the default `./backups` directory for server-side backup listing and import.

**Docker:** [`docker-compose.yml`](../docker-compose.yml) runs the app and Postgres 16; set `DATABASE_URL` to use hostname `postgres` when the app runs inside Compose. [`docker-compose.cloudjiffy.yml`](../docker-compose.cloudjiffy.yml) runs the app container only against an external database.

## Security notes

- Do not commit `.env.local`, `.env.production`, or real credentials.
- Do not rely on a template admin email in production; create or promote admins deliberately (e.g. `scripts/seed-production-admin.js` or database role update).

## UI: `AiImagePickerDialog` inside the event form (nested Radix Dialog)

Create/Edit Event → template **Event media & info** uses [`components/media/ai-image-picker-dialog.tsx`](../components/media/ai-image-picker-dialog.tsx) with **`nestedInDialog`**. A second Radix `Dialog` broke native **file input** (click to browse). The stable pattern is:

1. **Portal into the event dialog content** — [`EventFormDialogContentElementContext`](../components/events/event-form-dialog-portal-context.tsx) + `ref` on `DialogContent` in [`event-form-dialog.tsx`](../components/events/event-form-dialog.tsx) so the picker mounts **inside** the same Radix content node (avoids `inert` / focus-trap issues on `document.body`).
2. **Full-area transparent `<input type="file">`** — `absolute inset-0`, `opacity-0`, `z-10`; hint copy sits in a sibling with **`pointer-events-none`**. Do **not** rely on `<label>` + **`display: none`** (`hidden`) for the file control in this context; activation is unreliable when nested.
3. **`onChange` must snapshot files before reset** — `const files = Array.from(e.target.files ?? [])` then `e.target.value = ""`. Clearing the input first empties the **live** `FileList`, so uploads from the picker silently see no files (drag-and-drop uses `dataTransfer` and was unaffected).

**Photo gallery** passes **`hideAiSection`** so that slot is upload-only (no wallet / AI prompt); other slots keep upload + optional AI.

## Regenerating the snapshot below

The following block is **machine-generated**. Refresh it after API or dependency changes:

```bash
npm run docs:generate
```

To include a **Postgres schema snapshot** from a live database, set `DATABASE_URL` for that run (for example use `--env-file=.env.local`).

---

<!-- AUTO-GENERATED:BEGIN -->

## Generated snapshot

| Field | Value |
| --- | --- |
| Package | `my-v0-project@0.1.0` |

### Key dependencies

| Package | Version |
| --- | --- |
| `next` | 16.0.10 |
| `react` | 19.2.0 |
| `react-dom` | 19.2.0 |
| `pg` | ^8.13.0 |
| `@upstash/redis` | ^1.36.3 |
| `zod` | 3.25.76 |

### App Router API modules (`route.ts`)

These files define HTTP handlers; URL shape follows Next.js dynamic segments.

| File | Approx. URL prefix |
| --- | --- |
| `app/api/admin/analytics/overview/route.ts` | `/api/admin/analytics/overview` |
| `app/api/admin/analytics/revenue-attribution/route.ts` | `/api/admin/analytics/revenue-attribution` |
| `app/api/admin/analytics/revenue/route.ts` | `/api/admin/analytics/revenue` |
| `app/api/admin/analytics/visitors/route.ts` | `/api/admin/analytics/visitors` |
| `app/api/admin/dashboard/route.ts` | `/api/admin/dashboard` |
| `app/api/admin/database/backups/route.ts` | `/api/admin/database/backups` |
| `app/api/admin/database/export/route.ts` | `/api/admin/database/export` |
| `app/api/admin/database/import/route.ts` | `/api/admin/database/import` |
| `app/api/admin/email-templates/route.ts` | `/api/admin/email-templates` |
| `app/api/admin/event-visitors/route.ts` | `/api/admin/event-visitors` |
| `app/api/admin/events/route.ts` | `/api/admin/events` |
| `app/api/admin/gst/route.ts` | `/api/admin/gst` |
| `app/api/admin/integrations/route.ts` | `/api/admin/integrations` |
| `app/api/admin/invoices/zip/route.ts` | `/api/admin/invoices/zip` |
| `app/api/admin/maintenance/fix-validity/route.ts` | `/api/admin/maintenance/fix-validity` |
| `app/api/admin/openrouter-model-pricing/route.ts` | `/api/admin/openrouter-model-pricing` |
| `app/api/admin/orders/route.ts` | `/api/admin/orders` |
| `app/api/admin/photo-gallery-addon/route.ts` | `/api/admin/photo-gallery-addon` |
| `app/api/admin/pricing/route.ts` | `/api/admin/pricing` |
| `app/api/admin/refunds/[id]/route.ts` | `/api/admin/refunds/[id]` |
| `app/api/admin/refunds/route.ts` | `/api/admin/refunds` |
| `app/api/admin/run-migration/route.ts` | `/api/admin/run-migration` |
| `app/api/admin/system-logs/route.ts` | `/api/admin/system-logs` |
| `app/api/admin/system-tasks/automation/route.ts` | `/api/admin/system-tasks/automation` |
| `app/api/admin/system-tasks/run/route.ts` | `/api/admin/system-tasks/run` |
| `app/api/admin/transactions/route.ts` | `/api/admin/transactions` |
| `app/api/admin/users/[id]/domains/route.ts` | `/api/admin/users/[id]/domains` |
| `app/api/admin/users/[id]/photo-gallery/route.ts` | `/api/admin/users/[id]/photo-gallery` |
| `app/api/admin/users/[id]/route.ts` | `/api/admin/users/[id]` |
| `app/api/admin/users/route.ts` | `/api/admin/users` |
| `app/api/admin/wallets/adjust/route.ts` | `/api/admin/wallets/adjust` |
| `app/api/admin/wallets/route.ts` | `/api/admin/wallets` |
| `app/api/admin/youtube-override/route.ts` | `/api/admin/youtube-override` |
| `app/api/analytics/track/route.ts` | `/api/analytics/track` |
| `app/api/auth/change-password/route.ts` | `/api/auth/change-password` |
| `app/api/auth/email-update/request/route.ts` | `/api/auth/email-update/request` |
| `app/api/auth/email-update/verify/route.ts` | `/api/auth/email-update/verify` |
| `app/api/auth/forgot-password/route.ts` | `/api/auth/forgot-password` |
| `app/api/auth/impersonate/route.ts` | `/api/auth/impersonate` |
| `app/api/auth/login/route.ts` | `/api/auth/login` |
| `app/api/auth/logout/route.ts` | `/api/auth/logout` |
| `app/api/auth/me/route.ts` | `/api/auth/me` |
| `app/api/auth/profile/route.ts` | `/api/auth/profile` |
| `app/api/auth/register/route.ts` | `/api/auth/register` |
| `app/api/auth/reset-password/route.ts` | `/api/auth/reset-password` |
| `app/api/auth/theme/route.ts` | `/api/auth/theme` |
| `app/api/auth/youtube/callback/route.ts` | `/api/auth/youtube/callback` |
| `app/api/auth/youtube/route.ts` | `/api/auth/youtube` |
| `app/api/branding/lookup/route.ts` | `/api/branding/lookup` |
| `app/api/branding/route.ts` | `/api/branding` |
| `app/api/client-gallery/albums/[id]/assets/[assetId]/route.ts` | `/api/client-gallery/albums/[id]/assets/[assetId]` |
| `app/api/client-gallery/albums/[id]/assets/route.ts` | `/api/client-gallery/albums/[id]/assets` |
| `app/api/client-gallery/albums/[id]/route.ts` | `/api/client-gallery/albums/[id]` |
| `app/api/client-gallery/albums/[id]/upload/route.ts` | `/api/client-gallery/albums/[id]/upload` |
| `app/api/client-gallery/albums/route.ts` | `/api/client-gallery/albums` |
| `app/api/client-gallery/public/[token]/route.ts` | `/api/client-gallery/public/[token]` |
| `app/api/client-gallery/storage/route.ts` | `/api/client-gallery/storage` |
| `app/api/client-gallery/storage/test/route.ts` | `/api/client-gallery/storage/test` |
| `app/api/client-gallery/templates/route.ts` | `/api/client-gallery/templates` |
| `app/api/credits/pricing/route.ts` | `/api/credits/pricing` |
| `app/api/credits/purchase/route.ts` | `/api/credits/purchase` |
| `app/api/credits/route.ts` | `/api/credits` |
| `app/api/cron/studio-subscription-reminders/route.ts` | `/api/cron/studio-subscription-reminders` |
| `app/api/dashboard/route.ts` | `/api/dashboard` |
| `app/api/domains/cloudflare/configure/route.ts` | `/api/domains/cloudflare/configure` |
| `app/api/domains/cloudflare/status/route.ts` | `/api/domains/cloudflare/status` |
| `app/api/events/[id]/analytics/route.ts` | `/api/events/[id]/analytics` |
| `app/api/events/[id]/route.ts` | `/api/events/[id]` |
| `app/api/events/route.ts` | `/api/events` |
| `app/api/favicon/resolve/route.ts` | `/api/favicon/resolve` |
| `app/api/generate-image/route.ts` | `/api/generate-image` |
| `app/api/gst/config/route.ts` | `/api/gst/config` |
| `app/api/health/route.ts` | `/api/health` |
| `app/api/invoices/[invoiceId]/pdf/route.ts` | `/api/invoices/[invoiceId]/pdf` |
| `app/api/invoices/route.ts` | `/api/invoices` |
| `app/api/invoices/zip/route.ts` | `/api/invoices/zip` |
| `app/api/notifications/read/route.ts` | `/api/notifications/read` |
| `app/api/notifications/route.ts` | `/api/notifications` |
| `app/api/orders/route.ts` | `/api/orders` |
| `app/api/payments/create/route.ts` | `/api/payments/create` |
| `app/api/payments/verify/instamojo/route.ts` | `/api/payments/verify/instamojo` |
| `app/api/payments/verify/razorpay/route.ts` | `/api/payments/verify/razorpay` |
| `app/api/photo-gallery-addon/status/route.ts` | `/api/photo-gallery-addon/status` |
| `app/api/refunds/route.ts` | `/api/refunds` |
| `app/api/settings/route.ts` | `/api/settings` |
| `app/api/stream/create/route.ts` | `/api/stream/create` |
| `app/api/stream/start/route.ts` | `/api/stream/start` |
| `app/api/stream/status/route.ts` | `/api/stream/status` |
| `app/api/stream/stop/route.ts` | `/api/stream/stop` |
| `app/api/stream/webhook/route.ts` | `/api/stream/webhook` |
| `app/api/stream/youtube/route.ts` | `/api/stream/youtube` |
| `app/api/streamer/analytics/route.ts` | `/api/streamer/analytics` |
| `app/api/streamer/dashboard/route.ts` | `/api/streamer/dashboard` |
| `app/api/streamer/integrations/route.ts` | `/api/streamer/integrations` |
| `app/api/streaming/backend-info/route.ts` | `/api/streaming/backend-info` |
| `app/api/streaming/stats/route.ts` | `/api/streaming/stats` |
| `app/api/studio/analytics/route.ts` | `/api/studio/analytics` |
| `app/api/studio/branding/route.ts` | `/api/studio/branding` |
| `app/api/studio/cloudflare/setup/route.ts` | `/api/studio/cloudflare/setup` |
| `app/api/studio/dashboard/route.ts` | `/api/studio/dashboard` |
| `app/api/studio/domains/route.ts` | `/api/studio/domains` |
| `app/api/studio/domains/verify/route.ts` | `/api/studio/domains/verify` |
| `app/api/studio/events/[eventId]/visitors/route.ts` | `/api/studio/events/[eventId]/visitors` |
| `app/api/studio/events/check-slug/route.ts` | `/api/studio/events/check-slug` |
| `app/api/studio/events/route.ts` | `/api/studio/events` |
| `app/api/studio/events/seed-mock/route.ts` | `/api/studio/events/seed-mock` |
| `app/api/studio/events/suspend/route.ts` | `/api/studio/events/suspend` |
| `app/api/studio/integrations/route.ts` | `/api/studio/integrations` |
| `app/api/studio/setup/route.ts` | `/api/studio/setup` |
| `app/api/upload/route.ts` | `/api/upload` |
| `app/api/uploads/[...path]/route.ts` | `/api/uploads/[...path]` |
| `app/api/user/billing/route.ts` | `/api/user/billing` |
| `app/api/users/[id]/route.ts` | `/api/users/[id]` |
| `app/api/users/route.ts` | `/api/users` |
| `app/api/wallet/route.ts` | `/api/wallet` |
| `app/api/wallets/adjust/route.ts` | `/api/wallets/adjust` |
| `app/api/wallets/route.ts` | `/api/wallets` |
| `app/api/wallets/transactions/route.ts` | `/api/wallets/transactions` |
| `app/api/watch/[eventId]/crew-credentials/route.ts` | `/api/watch/[eventId]/crew-credentials` |
| `app/api/watch/[eventId]/presence/route.ts` | `/api/watch/[eventId]/presence` |
| `app/api/watch/[eventId]/route.ts` | `/api/watch/[eventId]` |
| `app/api/watch/[eventId]/session/route.ts` | `/api/watch/[eventId]/session` |
| `app/api/watch/[eventId]/visitor/route.ts` | `/api/watch/[eventId]/visitor` |
| `app/api/webhooks/instamojo/route.ts` | `/api/webhooks/instamojo` |
| `app/api/webhooks/razorpay/route.ts` | `/api/webhooks/razorpay` |
| `app/api/youtube/channels/route.ts` | `/api/youtube/channels` |

### Database (from `DATABASE_URL` at generation time)


*Schema snapshot skipped: `DATABASE_URL` is not set.*

To include a snapshot from your database, run with an env file, for example:

```bash
node --env-file=.env.local scripts/generate-dev-handbook.js
```

<!-- AUTO-GENERATED:END -->
