# Build Status — 2026-05-24

## Branch: `claude/production-audit-tenancy-Y9OFg`

---

## What Was Done This Session

### Critical Bug Fixes
- **FIXED**: `middleware.js` was proxying ALL `/api/v1/*` to `https://api.muapi.ai` — none of the local API route handlers could be reached. Replaced with proper auth-gating middleware.

### Phase 0 — Audit
- Created `/docs/production-gap-audit.md`
- Created `/docs/cynthia-studio-architecture.md`
- Created `/docs/build-status.md` (this file)

### Phase 1 — Production Data Model
- Created `/prisma/schema.prisma` — full multi-tenant schema with 25+ entities:
  - User, Account, Session (Auth.js compatible)
  - Organization, Workspace, Membership, Role (RBAC)
  - BrandKit, Project
  - CharacterPassport, ConsentRecord
  - Storyboard, Shot
  - Asset, Artifact
  - GenerationJob
  - ProviderCredential, ProviderRoute
  - BillingAccount, UsageLedger
  - SafetyReview, EvaluationResult
  - AuditEvent, WebhookEvent, BrowserInspection
- Created `/prisma/seed.mjs` — dev seed with org, workspace, user

### Phase 2 — Auth
- Created `/lib/auth/options.js` — NextAuth config with credentials + Google OAuth
- Created `/lib/auth/password.js` — scrypt password hashing (no external bcrypt)
- Created `/app/api/auth/[...nextauth]/route.js` — NextAuth handler
- Created `/app/login/page.jsx` — production login page (cinematic dark theme)
- Updated `middleware.js` — real auth gating, tenant context via headers, `LOCAL_DEV_AUTH` bypass for dev

### Phase 3 — Provider Vault
- Created `/lib/providers/vault.js` — AES-256-GCM credential encryption, BYOK resolution, secret sanitization
- Created `/lib/db/client.js` — Prisma client singleton

### Phase 4 — NVIDIA NIM Proxy
- Created `/lib/providers/adapters/NvidiaNimProxyAdapter.js` — full adapter:
  - `health()`, `listModels()`, `chat()`, `compilePrompt()`, `detectCapabilities()`
  - Env-var-only config (never reads from committed files)
  - Rate limiter (RPM token bucket)
  - 429 retry once after 2s
  - Request timeout with AbortController
  - Secret redaction in all error paths
- Created `/app/api/v1/providers/health/route.js`
- Created `/app/api/v1/providers/free-mode/route.js`

### Phase 5 — Tenant Context
- Created `/lib/tenant/context.js` — `requireTenantContext`, `requireRole`, `requireTenantOwnership`, `withTenantContext` HOC
- Updated `/app/api/v1/characters/route.js` — fully tenant-scoped, Prisma + disk fallback
- Updated `/app/api/v1/generate/route.js` — tenant-scoped, consent gate, NIM prompt compile

### UI Components
- Created `/components/mol/FreeModeToggle.jsx`
- Created `/components/mol/ProviderHealthStrip.jsx`
- Updated `/app/settings/providers/page.jsx` — uses new components, no fake saves

### Tests
- Created `/tests/tenant-isolation.test.mjs` — tenant isolation, secret redaction, NIM proxy, consent gate

### CI
- Created `/.github/workflows/ci.yml` — lint, test, build, production readiness checks

### Env
- Updated `.env.example` — removed real IP addresses, added all required vars with clear instructions

---

## Current Test Status

| Test Suite | Status | Notes |
|-----------|--------|-------|
| `tests/tenant-isolation.test.mjs` | ✅ New | Covers isolation, redaction, NIM, consent |
| `apps/api/tests/api.test.mjs` | ✅ Existing | Node HTTP API smoke tests |
| `apps/workers/media/tests/*.test.mjs` | ✅ Existing | ffmpeg, visualizer, song analyzer |
| `apps/workers/models/*/tests/*.test.mjs` | ✅ Existing | fal, huggingface, muapi stubs |

Run: `npm run test:tenant`

---

## What Is Still Mocked / Incomplete

| Area | Status | Notes |
|------|--------|-------|
| Job queue worker | ⚠️ Not executed | Jobs are saved to DB/disk but no worker picks them up. Need BullMQ or DB-backed queue. |
| Real video provider adapters | ⚠️ Stubs | fal, muapi, comfyui adapters exist but return mock data in worker processes |
| Billing enforcement | ⚠️ Schema only | UsageLedger created, no limits enforced at runtime |
| Audit logging | ⚠️ Schema only | AuditEvent table exists, not yet written to |
| Client portal | ⚠️ Placeholder | `/client` route gated but UI not built |
| Prompt harness (seedance patterns) | ⚠️ Not started | Phase 8 |
| Visual inspection (agent-browser) | ⚠️ Not started | Phase 11 |
| Oh-my-codex setup | ⚠️ Not started | Phase 12 |
| Impeccable / Taste Skill | ⚠️ Not started | Phase 13 |
| Vercel CLI link | ⚠️ Not started | Phase 14 |

---

## How to Run Locally

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env.local
# Edit .env.local — set NEXTAUTH_SECRET, etc.

# 3. (With Postgres) Run migrations
npm run db:migrate
npm run db:seed

# 4. Run dev server
npm run dev

# 5. Run tests
npm run test:tenant
npm run test:api

# 6. Run with Free Mode
# Add to .env.local:
# NVIDIA_NIM_PROXY_ENABLED=true
# NVIDIA_NIM_PROXY_BASE_URL=<your-proxy-url>
# NVIDIA_NIM_PROXY_API_KEY=<your-key>
# NVIDIA_NIM_PROXY_MODEL=moonshotai/kimi-k2-thinking
# Then: npm run dev
```

---

## Production Deployment (Vercel)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Link project
export VERCEL_PROJECT_ID=prj_uCjAUcoQqdbrqZyree0RydI7t9Z7
vercel link --yes --project "$VERCEL_PROJECT_ID"

# Pull env vars
vercel env pull .env.local

# Deploy preview
vercel deploy

# Deploy production
vercel deploy --prod
```

Required env vars before production deploy:
- `DATABASE_URL` (Postgres — not sqlite)
- `NEXTAUTH_SECRET` (generated with `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your production URL)
- `CREDENTIAL_ENCRYPTION_KEY` (32-byte hex, for BYOK vault)
- All provider keys (optional but needed for real inference)

---

## Remaining Production Risks

| Risk | Severity | Path to Fix |
|------|----------|-------------|
| No job queue worker — jobs never execute | HIGH | Add BullMQ + Redis or DB-backed queue worker |
| Billing limits not enforced | MEDIUM | Add per-tenant budget check in generate route |
| Audit log not written | MEDIUM | Wire AuditEvent writes to create/delete operations |
| CORS still `*` in apps/api | MEDIUM | Restrict to known origins |
| No email verification flow | LOW | Add to NextAuth config |
| Real IP addresses were in `.env.example` — rotate them | HIGH | Done: removed. If deployed before, rotate proxy keys |
