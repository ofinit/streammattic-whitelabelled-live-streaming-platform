# Production Dockerfile for StreamLivee (Node + Next.js)
FROM node:20-alpine AS base

# Full install (incl. devDeps) — required for PostCSS/Tailwind during `next build`
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image: production deps only (no Tailwind/PostCSS in final node_modules)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV UPLOAD_DIR=/app/uploads

# Coolify/Traefik UI health checks need curl or wget in the image (https://coolify.io/docs/knowledge-base/health-checks)
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Docker-level probe (Coolify: if UI + Dockerfile both define checks, Dockerfile takes precedence)
# https://coolify.io/docs/knowledge-base/health-checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/api/health > /dev/null || exit 1

CMD ["npm", "start"]
