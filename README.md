# Streammattic.com

*Whitelabelled live streaming platform*

[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/tVlixt0Wqe4)

## Overview

This repository contains the StreamLivee / Streammattic whitelabelled live streaming platform. It can run locally, on any VPS, or in Docker.

**Contributor / architecture reference:** [docs/DEVELOPMENT_HANDBOOK.md](docs/DEVELOPMENT_HANDBOOK.md) (run `npm run docs:generate` after API or dependency changes).

## Templates

Event watch-page templates (`tpl-*`) are documented in **[docs/TEMPLATE_IMPLEMENTATION_PLAYBOOK.md](docs/TEMPLATE_IMPLEMENTATION_PLAYBOOK.md)** — includes what the Wedding template implements and a tiered checklist for adding or completing other templates.

## Deploy (generic)

- **Local:** Set `DATABASE_URL` to your local Postgres, then `npm run dev`.
- **VPS / production:** Run `npm run build` then `npm start`. Set `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and optionally `UPLOAD_DIR` for file uploads. See `.env.example` for all options.
- **Coolify (e.g. [ozero.cloud](https://ozero.cloud)):** See [docs/deploy-coolify-ozero.md](docs/deploy-coolify-ozero.md) — Postgres + app on Coolify, `Dockerfile`, env vars, volume on `/app/uploads`, migrations.
- **CloudJiffy (Jelastic):** Use [docs/deploy-cloudjiffy.md](docs/deploy-cloudjiffy.md), `.env.production.example`, `docker-compose.cloudjiffy.yml`, and [deploy/nginx/streamlivee.conf.example](deploy/nginx/streamlivee.conf.example). On the server: `npm run db:migrate:production` (after copying env to `.env.production`), then build/run Docker as in the doc.
- **Docker (local stack):** From project root run `docker compose up --build`. The app will use the `postgres` service; set `NEXT_PUBLIC_APP_URL` via `.env` or environment. Uploads are stored in a named volume; for backups see `scripts/README-BACKUP-RESTORE.md`.

## Optional: Streamer → Studio upgrade CTA

- **`NEXT_PUBLIC_STUDIO_SALES_EMAIL`** — If set, the streamer dashboard and [`/streamer/upgrade`](app/streamer/upgrade/page.tsx) show a **Contact sales** button with a `mailto:` link for studio / white-label onboarding.
- Studio annual pricing shown to streamers comes from the **`studio_annual_subscription`** platform setting (configured in **Admin → Pricing**). Streamers receive this key only via `GET /api/settings` (not exposed to other non-admin roles in that aggregate response).