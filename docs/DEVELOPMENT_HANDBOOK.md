# Stream-Livee / Streammattic — development handbook

Canonical technical entry point for contributors. Product overview and deploy shortcuts remain in [README.md](../README.md). Template work is covered in [TEMPLATE_IMPLEMENTATION_PLAYBOOK.md](./TEMPLATE_IMPLEMENTATION_PLAYBOOK.md). **Coolify / ozero.cloud:** [deploy-coolify-ozero.md](./deploy-coolify-ozero.md). CloudJiffy / Jelastic: [deploy-cloudjiffy.md](./deploy-cloudjiffy.md).

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Data:** PostgreSQL via `pg` ([`lib/db.ts`](../lib/db.ts)); connection string **`DATABASE_URL`**
- **Auth:** NextAuth v5 ([`app/api/auth/[...nextauth]/route.ts`](../app/api/auth/[...nextauth]/route.ts)), session gates in [`middleware.ts`](../middleware.ts)
- **Optional cache:** Upstash Redis ([`lib/redis.ts`](../lib/redis.ts)) — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. If unset, cached code paths fall back to the database.

## Database: local vs production

| Concern | Local | Production (typical) |
| --- | --- | --- |
| Env file | `.env.local` | `.env.production` on the server |
| Migrate command | `npm run db:migrate` | `npm run db:migrate:production` |
| Connection | `localhost`, Docker service `postgres`, or a restored clone | Postgres on LAN or managed host (see deploy doc) |

**Where production `DATABASE_URL` lives:** Only in the deployment environment (e.g. Coolify env vars, server `.env.production` — never committed). On **ozero.cloud / Coolify**, use the database dashboard **internal** URL for the app; see [Internal vs external URLs](./deploy-coolify-ozero.md#internal-vs-external-urls).

**Schema source of truth:** [`scripts/run-migration.js`](../scripts/run-migration.js) — idempotent `CREATE` statements; re-runs skip objects that already exist. It seeds a default admin user and `platform_settings`. For new environments, use the npm scripts above rather than older `scripts/migrate-*.js` helpers unless you are repairing a legacy database.

**Backups and cloning prod to local:** [`scripts/README-BACKUP-RESTORE.md`](../scripts/README-BACKUP-RESTORE.md) (`PRODUCTION_DATABASE_URL`, `db:backup`, `db:setup-local`).

**Docker:** [`docker-compose.yml`](../docker-compose.yml) runs the app and Postgres 16; set `DATABASE_URL` to use hostname `postgres` when the app runs inside Compose. [`docker-compose.cloudjiffy.yml`](../docker-compose.cloudjiffy.yml) runs the app container only against an external database.

## Security notes

- Do not commit `.env.local`, `.env.production`, or real credentials.
- The migration seeds `admin@streamlivee.com` with a default password for development; change it before any real deployment.

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
| Snapshot time (HEAD commit, ISO) | `2026-04-05T14:52:11+05:30` |
| Git revision | `4230168` |
| Package | `my-v0-project@0.1.0` |

### Key dependencies

| Package | Version |
| --- | --- |
| `next` | 16.0.10 |
| `react` | 19.2.0 |
| `react-dom` | 19.2.0 |
| `next-auth` | ^5.0.0-beta.30 |
| `pg` | ^8.13.0 |
| `@upstash/redis` | ^1.36.3 |
| `zod` | 3.25.76 |
| `@stackframe/stack` | ^2.8.71 |

### App Router API modules (`route.ts`)

These files define HTTP handlers; URL shape follows Next.js dynamic segments.

| File | Approx. URL prefix |
| --- | --- |
| `app/api/admin/analytics/overview/route.ts` | `/api/admin/analytics/overview` |
| `app/api/admin/dashboard/route.ts` | `/api/admin/dashboard` |
| `app/api/admin/events/route.ts` | `/api/admin/events` |
| `app/api/admin/gst/route.ts` | `/api/admin/gst` |
| `app/api/admin/integrations/route.ts` | `/api/admin/integrations` |
| `app/api/admin/invoices/zip/route.ts` | `/api/admin/invoices/zip` |
| `app/api/admin/orders/route.ts` | `/api/admin/orders` |
| `app/api/admin/pricing/route.ts` | `/api/admin/pricing` |
| `app/api/admin/refunds/[id]/route.ts` | `/api/admin/refunds/[id]` |
| `app/api/admin/refunds/route.ts` | `/api/admin/refunds` |
| `app/api/admin/run-migration/route.ts` | `/api/admin/run-migration` |
| `app/api/admin/transactions/route.ts` | `/api/admin/transactions` |
| `app/api/admin/users/[id]/route.ts` | `/api/admin/users/[id]` |
| `app/api/admin/users/route.ts` | `/api/admin/users` |
| `app/api/admin/wallets/adjust/route.ts` | `/api/admin/wallets/adjust` |
| `app/api/admin/wallets/route.ts` | `/api/admin/wallets` |
| `app/api/admin/youtube-override/route.ts` | `/api/admin/youtube-override` |
| `app/api/auth/[...nextauth]/route.ts` | `/api/auth/[...nextauth]` |
| `app/api/auth/change-password/route.ts` | `/api/auth/change-password` |
| `app/api/auth/demo-login/route.ts` | `/api/auth/demo-login` |
| `app/api/auth/email-update/request/route.ts` | `/api/auth/email-update/request` |
| `app/api/auth/email-update/verify/route.ts` | `/api/auth/email-update/verify` |
| `app/api/auth/impersonate/route.ts` | `/api/auth/impersonate` |
| `app/api/auth/login/route.ts` | `/api/auth/login` |
| `app/api/auth/logout/route.ts` | `/api/auth/logout` |
| `app/api/auth/magic-link/request/route.ts` | `/api/auth/magic-link/request` |
| `app/api/auth/magic-link/session/route.ts` | `/api/auth/magic-link/session` |
| `app/api/auth/me/route.ts` | `/api/auth/me` |
| `app/api/auth/profile/route.ts` | `/api/auth/profile` |
| `app/api/auth/providers/route.ts` | `/api/auth/providers` |
| `app/api/auth/register/route.ts` | `/api/auth/register` |
| `app/api/auth/stack-exchange/route.ts` | `/api/auth/stack-exchange` |
| `app/api/auth/youtube/callback/route.ts` | `/api/auth/youtube/callback` |
| `app/api/auth/youtube/route.ts` | `/api/auth/youtube` |
| `app/api/branding/route.ts` | `/api/branding` |
| `app/api/credits/pricing/route.ts` | `/api/credits/pricing` |
| `app/api/credits/purchase/route.ts` | `/api/credits/purchase` |
| `app/api/credits/route.ts` | `/api/credits` |
| `app/api/dashboard/route.ts` | `/api/dashboard` |
| `app/api/domains/cloudflare/configure/route.ts` | `/api/domains/cloudflare/configure` |
| `app/api/domains/cloudflare/status/route.ts` | `/api/domains/cloudflare/status` |
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
| `app/api/refunds/route.ts` | `/api/refunds` |
| `app/api/settings/route.ts` | `/api/settings` |
| `app/api/stream/create/route.ts` | `/api/stream/create` |
| `app/api/stream/start/route.ts` | `/api/stream/start` |
| `app/api/stream/status/route.ts` | `/api/stream/status` |
| `app/api/stream/stop/route.ts` | `/api/stream/stop` |
| `app/api/stream/webhook/route.ts` | `/api/stream/webhook` |
| `app/api/stream/youtube/route.ts` | `/api/stream/youtube` |
| `app/api/streamer/dashboard/route.ts` | `/api/streamer/dashboard` |
| `app/api/streaming/backend-info/route.ts` | `/api/streaming/backend-info` |
| `app/api/streaming/stats/route.ts` | `/api/streaming/stats` |
| `app/api/studio/branding/route.ts` | `/api/studio/branding` |
| `app/api/studio/cloudflare/setup/route.ts` | `/api/studio/cloudflare/setup` |
| `app/api/studio/dashboard/route.ts` | `/api/studio/dashboard` |
| `app/api/studio/domains/route.ts` | `/api/studio/domains` |
| `app/api/studio/domains/verify/route.ts` | `/api/studio/domains/verify` |
| `app/api/studio/events/check-slug/route.ts` | `/api/studio/events/check-slug` |
| `app/api/studio/events/route.ts` | `/api/studio/events` |
| `app/api/studio/integrations/route.ts` | `/api/studio/integrations` |
| `app/api/upload/route.ts` | `/api/upload` |
| `app/api/uploads/[...path]/route.ts` | `/api/uploads/[...path]` |
| `app/api/users/[id]/route.ts` | `/api/users/[id]` |
| `app/api/users/route.ts` | `/api/users` |
| `app/api/wallets/adjust/route.ts` | `/api/wallets/adjust` |
| `app/api/wallets/route.ts` | `/api/wallets` |
| `app/api/wallets/transactions/route.ts` | `/api/wallets/transactions` |
| `app/api/watch/[eventId]/crew-credentials/route.ts` | `/api/watch/[eventId]/crew-credentials` |
| `app/api/watch/[eventId]/presence/route.ts` | `/api/watch/[eventId]/presence` |
| `app/api/watch/[eventId]/route.ts` | `/api/watch/[eventId]` |
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
