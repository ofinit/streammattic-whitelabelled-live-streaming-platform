# Deploy Stream-Livee on CloudJiffy (Jelastic)

This guide matches a typical topology: **Ubuntu VPS** for the app and **PostgreSQL** on a separate node in the same environment. Use the database node’s **internal LAN IP** in `DATABASE_URL` from the VPS so traffic stays private.

## 1. Security

- Do not commit real passwords or `.env.production` to git.
- Create an **application user** for the app; avoid using the database admin account in `DATABASE_URL`.
- Rotate any credentials that were shared in plain text.

## 2. Initialize PostgreSQL

1. Open your Postgres admin UI (e.g. PhpPgAdmin) or connect with `psql` as an admin user.
2. Edit [`scripts/jelastic-init-db.sql`](../scripts/jelastic-init-db.sql): set a strong password instead of `CHANGE_ME_STRONG_PASSWORD`.
3. Run the script once.
4. Set on the app server (replace host with your DB internal IP, e.g. `192.168.8.103`):

   `DATABASE_URL=postgresql://streamlivee_app:YOUR_PASSWORD@192.168.8.103:5432/streamlivee`

## 3. Configure the application server

1. Copy [`.env.production.example`](../.env.production.example) to `.env.production` on the VPS (same directory you build from, or pass vars another way).
2. Fill in `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, and optional `NEXT_PUBLIC_PLATFORM_*` for customer DNS instructions.

## 4. Run database migrations (once per environment)

From the project root with Node 20+ and dependencies installed:

```bash
npm run db:migrate:production
```

Or: `node --env-file=.env.production scripts/run-migration.js`

## 5. Run with Docker

Build and run (uploads persisted on the host):

```bash
docker build -t streamlivee .
docker run -d --name streamlivee --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.production \
  -v streamlivee_uploads:/app/uploads \
  streamlivee
```

Alternatively use Docker Compose with an external database only:

```bash
docker compose -f docker-compose.cloudjiffy.yml --env-file .env.production up -d
```

## 6. Nginx + HTTPS (custom domain)

See [`deploy/nginx/streamlivee.conf.example`](../deploy/nginx/streamlivee.conf.example). Point your domain to the VPS, install a certificate (e.g. Let’s Encrypt), and proxy to `127.0.0.1:3000`. Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` use the same public `https://` origin.

## 7. Smoke test

- Open the site over HTTPS.
- Sign in and confirm sessions work.
- Upload an image and confirm it is served after container restart (volume mounted on `/app/uploads`).
