# Agent / contributor notes

- **Production deploy:** This project is **not** deployed on Vercel. Use **Coolify** (e.g. ozero.cloud) per [docs/deploy-coolify-ozero.md](docs/deploy-coolify-ozero.md).
- **Development handbook:** [docs/DEVELOPMENT_HANDBOOK.md](docs/DEVELOPMENT_HANDBOOK.md) — stack, database, Redis, deploy pointers.
- **Coolify / ozero.cloud deploy:** [docs/deploy-coolify-ozero.md](docs/deploy-coolify-ozero.md).
- **Photo gallery add-on (BYOS, DNS, face-index pricing notes):** [docs/photo-gallery-addon.md](docs/photo-gallery-addon.md).
- **Refresh generated sections** after API or dependency changes: `npm run docs:generate` (commit the updated handbook; CI enforces this).
