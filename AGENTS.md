# Agent / contributor notes

- **Production deploy:** This project is **not** deployed on Vercel. Use **Coolify** (e.g. ozero.cloud) per [docs/deploy-coolify-ozero.md](docs/deploy-coolify-ozero.md).
- **Development handbook:** [docs/DEVELOPMENT_HANDBOOK.md](docs/DEVELOPMENT_HANDBOOK.md) — stack, database, Redis, deploy pointers.
- **Coolify / ozero.cloud deploy:** [docs/deploy-coolify-ozero.md](docs/deploy-coolify-ozero.md).
- **Photo gallery add-on (BYOS, DNS, face-index pricing notes):** [docs/photo-gallery-addon.md](docs/photo-gallery-addon.md).
- **Refresh generated sections** after API or dependency changes: `npm run docs:generate` (commit the updated handbook; CI enforces this).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
