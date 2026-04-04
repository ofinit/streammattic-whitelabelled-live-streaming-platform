# Deploy on Coolify (e.g. ozero.cloud)

Use this when your app and PostgreSQL run on a **Coolify**-managed stack—such as **[ozero.cloud](https://ozero.cloud)** or any other host that gives you a Coolify control plane. Coolify deploys Docker images, wires reverse proxies (typically Traefik), SSL, and optional databases on a shared Docker network.

## What you need in the repo

- **[`Dockerfile`](../Dockerfile)** — production build (`npm run build` / `npm start`), listens on **port 3000**, uploads under **`/app/uploads`**.
- **Environment variables** — mirror [`.env.production.example`](../.env.production.example); see below.
- **Schema** — applied with [`scripts/run-migration.js`](../scripts/run-migration.js) against your production `DATABASE_URL` (run once per new database).

## 1. PostgreSQL on Coolify

1. In Coolify, create a **PostgreSQL** resource (version 16 matches local [`docker-compose.yml`](../docker-compose.yml)).
2. Note the **internal hostname** Coolify assigns (often the service name on the deployment network, e.g. `postgres` or a generated name). Use that host in `DATABASE_URL`, **not** `localhost`, from the **app** container.
3. Create a database and user if the UI does not do it automatically; set a strong password.
4. Build your connection string:

   `postgresql://USER:PASSWORD@HOST:5432/DATABASE`

   Use the port Coolify shows (usually `5432`).

### Internal vs external URLs

On **ozero.cloud**, the PostgreSQL resource page usually shows **two** connection URLs:

| URL | When to use it |
| --- | --- |
| **Internal** (Docker network hostname, not `localhost` and not your public IP) | Set this as **`DATABASE_URL` for the Next.js app** when the app runs on the **same Coolify server** as the database. This is the normal production path. |
| **External** (public IP or hostname on port 5432) | Use only from **outside** that network—for example running [`scripts/run-migration.js`](../scripts/run-migration.js) or `npm run db:migrate:production` from your **laptop** while **external access** is enabled. |

**URL scheme:** The UI may show `postgres://`. The `pg` client accepts **`postgres://`** and **`postgresql://`**; either is fine.

**Security**

- **Never commit** real `DATABASE_URL` values, passwords, or internal hostnames to git. Use Coolify’s **environment** UI (or a server-only `.env.production` that stays out of version control).
- If the database is **publicly reachable**, restrict access (firewall / disable external access) when you no longer need off-server connections, and **rotate the database password** if it was exposed (screenshots, tickets, chat).

**Operations:** Ensure the PostgreSQL service is **started** before the app deploys or before you run migrations.

## 2. Application service

**Option A — Dockerfile (recommended)**  

- New resource → **Dockerfile** from Git (this repo root).
- Set **port** to **3000** (Coolify / Traefik will publish HTTPS).
- Add a **persistent volume** mounted at **`/app/uploads`** so uploads survive redeploys (matches the Dockerfile layout).
- Set **`UPLOAD_DIR=/app/uploads`** in the application environment so [`app/api/upload`](../app/api/upload/route.ts) and [`app/api/generate-image`](../app/api/generate-image/route.ts) write WebP files to the same path the volume uses (the [`Dockerfile`](../Dockerfile) sets this by default).

**Option B — Docker Compose**  

- Point Coolify at [`docker-compose.yml`](../docker-compose.yml) if you want app + Postgres in one stack on the same server. Override `DATABASE_URL` in Coolify env so the app uses the bundled `postgres` service name as host. For **external** Postgres (separate Coolify resource), use [`docker-compose.cloudjiffy.yml`](../docker-compose.cloudjiffy.yml) as a template: app only + `DATABASE_URL` to the DB service hostname from step 1.

## 3. Required environment variables

Set these in Coolify’s **environment** for the app (never commit real values):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | **Internal** URL from the DB dashboard when app and Postgres are on the same server ([see above](#internal-vs-external-urls)) |
| `AUTH_SECRET` | Long random string (≥32 chars) |
| `NEXTAUTH_URL` | Public `https://` origin users open in the browser |
| `NEXT_PUBLIC_APP_URL` | Same origin as `NEXTAUTH_URL` for callbacks and links |
| `NEXT_PUBLIC_PLATFORM_A_RECORD_IP` | Public IPv4 for apex **A** records shown to customers (your Coolify / proxy host) |
| `NEXT_PUBLIC_PLATFORM_CNAME_TARGET` | Hostname for **CNAME** records (subdomains / `www`) in customer DNS instructions |
| `NEXT_PUBLIC_DOMAIN_VERIFICATION_TXT_PREFIX` | Optional; default `_verify` for ownership TXT records ([`lib/platform-dns.ts`](../lib/platform-dns.ts)) |

Set the **`NEXT_PUBLIC_PLATFORM_*`** values in the **same** build/runtime env as the app so Studio DNS dialogs show your infrastructure—not empty placeholders. Copy shapes from [`.env.production.example`](../.env.production.example).

Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` ([`lib/redis.ts`](../lib/redis.ts)); payment, OAuth, Cloudflare, Fal, etc. per [`.env.example`](../.env.example).

**Healthcheck:** Use **`GET`** or **`HEAD`** to **`/api/health`** on port **3000** (internal). That route is **public** (no auth cookie), returns **200**, and **`GET`** responds with plain text **`OK`** (for Coolify “Response Text” matching). See [`app/api/health/route.ts`](../app/api/health/route.ts). Do not rely on **`/`** for probes (`curl -I /` sends **HEAD**, which can differ from **GET** for page routes).

## 4. Run database migrations (once per environment)

After Postgres is reachable from your laptop or from a one-off container:

```bash
# From your machine, if DATABASE_URL points at the new DB (VPN or allowed IP):
npm run db:migrate:production
# (expects .env.production — or:)
node --env-file=.env.production scripts/run-migration.js
```

Or use **Coolify → application → terminal / execute command** (if available) with the same env vars loaded, running:

`node scripts/run-migration.js`

The script is **idempotent**; safe to re-run if objects already exist.

### Copy local database contents to production (optional)

Use this when you have data in **local** Postgres and want it on **ozero.cloud** (after the schema exists). **Never commit** connection strings.

1. **Schema first:** Run [migrations](#4-run-database-migrations-once-per-environment) against the production DB.
2. **Backup from local:** See [`scripts/README-BACKUP-RESTORE.md`](../scripts/README-BACKUP-RESTORE.md). Ensure `DATABASE_URL` in `.env.local` points at your **local** database, then run `npm run db:backup` or `node --env-file=.env.local scripts/backup-db.js` (use `--api` if you do not have `pg_dump`).
3. **Restore into production:** Set `DATABASE_URL` in `.env.production` to the Coolify **external** URL (add `?sslmode=require` if the host requires TLS), then run `node --env-file=.env.production scripts/restore-local.js backups/postgres-backup-....sql`.
4. **Turn off** public database access in Coolify when you no longer need restores from your laptop.

## 5. Domains and SSL

In Coolify, attach your domain to the application resource and enable HTTPS. Ensure **`NEXTAUTH_URL`** and **`NEXT_PUBLIC_APP_URL`** use that exact **`https://`** URL.

## 6. Smoke test

- Open the site over HTTPS, sign in, confirm sessions.
- Upload an asset and confirm it still loads after **redeploy** (volume on `/app/uploads`).

## Related docs

- [README.md](../README.md) — overview and other deploy paths  
- [DEVELOPMENT_HANDBOOK.md](./DEVELOPMENT_HANDBOOK.md) — stack and DB details  
- [deploy-cloudjiffy.md](./deploy-cloudjiffy.md) — alternative VPS + external Postgres (same env ideas, different host)
