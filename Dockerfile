# ─── More-of-Less Studio — Combined Image ────────────────────────────────────
# Runs Next.js frontend (port 3000) + Node.js API server (port 8000) together.
# Ideal for Coolify, self-hosted VPS, Hostinger, or any single-container host.
#
# To deploy frontend to Vercel + API separately, use Dockerfile.api instead.

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY stubs/workflow-builder/package.json ./stubs/workflow-builder/
COPY stubs/ai-agent/package.json            ./stubs/ai-agent/
COPY packages/studio/package.json           ./packages/studio/

RUN npm install --ignore-scripts

# ─── Stage 2: Build packages + Next.js ───────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

# Build stub CSS files and studio package, then Next.js
RUN npm run build:packages && npm run build

# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache ffmpeg tini && \
    addgroup -S mol && adduser -S mol -G mol

ENV NODE_ENV=production \
    PORT=3000 \
    API_PORT=8000 \
    STORAGE_ROOT=/app/storage \
    DATABASE_URL=file:/app/data/mol.db

# Next.js assets
COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/public         ./public
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/package.json   ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# API server (pure Node.js — no build step needed)
COPY --from=builder /app/apps/api       ./apps/api

RUN mkdir -p /app/storage /app/data

COPY docker/start.sh /start.sh
RUN chmod +x /start.sh && chown -R mol:mol /app /start.sh

USER mol

EXPOSE 3000 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8000/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/start.sh"]
