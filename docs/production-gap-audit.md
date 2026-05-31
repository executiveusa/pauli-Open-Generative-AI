# Production Gap Audit — Cynthia Studio / More-of-Less

**Audit Date:** 2026-05-24  
**Branch:** `claude/production-audit-tenancy-Y9OFg`

---

## Current Working Features

| Feature | Status | Location |
|---------|--------|----------|
| Next.js 15 frontend | ✅ Working | `/app` |
| More-of-Less studio pages (Cine, Music Video, Visualizer, Mix & Master, Character Lab, Jobs, Workflow Monitor) | ✅ UI present | `/app/mol/*` |
| Character Passport schema + CRUD | ✅ Schema + API | `/packages/shared/src/character/passport.js`, `/app/api/v1/characters` |
| GenerationJob schema + queue entry | ✅ Schema | `/packages/shared/src/schemas/cynthia.js` |
| Model Router (supercomputer.js) | ✅ Logic | `/packages/shared/src/model-routing/supercomputer.js` |
| Provider adapters (Mock, OpenAI-compat, MuAPI, Local) | ✅ Stubs | `/lib/gateway/adapters/` |
| NVIDIA NIM proxy intent | ✅ Env vars | `.env.example` |
| Bilingual i18n (ES/EN + 5 LatAm locales) | ✅ Working | `/lib/i18n/` |
| Worker: ffmpeg audio/video/visualizer | ✅ Working | `/apps/workers/media/` |
| Worker: fal.ai, huggingface, muapi providers | ✅ Stubs | `/apps/workers/models/` |
| API routes: health, projects, assets, characters, jobs | ✅ Working | `/apps/api/src/routes/` |
| JSON file persistence (fallback) | ✅ Working | `/apps/api/src/storage/local.js` |
| HeroFrame prompt compiler | ✅ Working | `/lib/prompts/heroFrameCompiler.js` |
| Consent schema | ✅ Schema | `/packages/shared/src/schemas/` |
| Evaluation schema | ✅ Schema | `/packages/shared/src/schemas/` |
| Storyboard + Shot CRUD API | ✅ Routes | `/app/api/v1/storyboards/` |
| Provider key management routes | ✅ Routes | `/app/api/v1/keys/` |
| i18n locales (es-MX, es-AR, es-CO, es-CL, es-PE, es-US) | ✅ Working | `/lib/i18n/locales/` |
| Docker + docker-compose | ✅ Present | `/Dockerfile`, `/docker-compose.yml` |
| Railway deployment config | ✅ Present | `/railway.toml` |
| Vercel config | ✅ Present | `/vercel.json` |

---

## Critical Bugs Found and Fixed

| Bug | Severity | Fix |
|-----|----------|-----|
| `middleware.js` proxied ALL `/api/v1/*` to `https://api.muapi.ai` — local routes unreachable | **CRITICAL** | Fixed: middleware now handles auth gating, not external proxy |
| `local-user` fallback in characters route and generate route | **HIGH** | Tracked for Phase 1+2 fix |
| `.env.example` contains real IP addresses (31.220.58.212) | **HIGH** | Noted — must rotate before production |

---

## Production Gaps

### 1. Tenancy (CRITICAL)

- No Organization, Workspace, Membership, or RBAC models
- All queries fetch by ID without tenant scope — tenant A can read tenant B data
- `ownerUserId: 'local-user'` fallback used in at least 2 routes
- **Fix:** Prisma schema with full multi-tenant model (Phase 1)

### 2. Persistence (CRITICAL)

- Production storage is an in-memory `Map` with JSON disk fallback
- No migrations, no indexes, no ACID guarantees
- No Postgres adapter
- **Fix:** Prisma + Postgres (Phase 1)

### 3. Auth (CRITICAL)

- No real session or identity system
- Next.js middleware was broken (was proxying to MuAPI, not gating auth)
- No tenant context propagated to API
- **Fix:** Auth.js / NextAuth with tenant context (Phase 2)

### 4. Inference (HIGH)

- Job creation queues to JSON file but never executes
- No queue worker that picks up jobs and calls providers
- No BullMQ/Redis queue (only planned in README)
- Provider adapters exist but return mock data
- NVIDIA NIM proxy env vars present but no server-side adapter enforcing them
- **Fix:** Job runner + real provider adapters (Phase 3+4+6)

### 5. Character System (MEDIUM)

- Character Passport schema is good but missing: locale, ageBand, voiceProfile, consentLedger, canonicalHeroFrameArtifactId, minorFlag, politicalLikenessFlag
- No reference asset storage
- **Fix:** Extended schema (Phase 7)

### 6. Backend (HIGH)

- No tenant middleware on API routes
- No credential vault (keys stored in env only — no per-tenant BYOK)
- No billing/usage limits
- No observability beyond console.error
- **Fix:** Tenant middleware + vault (Phase 1-3)

### 7. Security (HIGH)

- `.env.example` has real IP addresses for NVIDIA proxy
- Secrets redaction only in error handler, not in logs
- CORS set to `*` — needs to be restricted in production
- No rate limiting
- **Fix:** Env audit + CORS config + rate limiting

### 8. Deployment (MEDIUM)

- Vercel project ID `prj_uCjAUcoQqdbrqZyree0RydI7t9Z7` referenced but not linked
- No CI/CD workflow files (no `.github/workflows/`)
- No preview gate checks
- **Fix:** Vercel CLI setup + CI (Phase 14+17)

---

## Security Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Real IP in `.env.example` committed to git | HIGH | Rotate before going public |
| `local-user` fallback bypasses auth | HIGH | All routes need real user identity |
| In-memory store loses data on restart | HIGH | Replace with Postgres |
| No tenant isolation — cross-tenant data leakage possible | CRITICAL | Phase 1 fix |
| CORS `*` in API middleware | MEDIUM | Restrict to known origins in production |
| No audit log | MEDIUM | Phase 16 |

---

## Commands to Run Locally

```bash
# Install deps
npm install

# Run Next.js dev
npm run dev

# Run API server (port 8000)
cd apps/api && node src/index.js

# Run with free mode (NVIDIA NIM proxy)
NVIDIA_NIM_PROXY_ENABLED=true \
NVIDIA_NIM_PROXY_BASE_URL=<your-proxy-url> \
NVIDIA_NIM_PROXY_API_KEY=<your-key> \
NVIDIA_NIM_PROXY_MODEL=moonshotai/kimi-k2-thinking \
npm run dev

# Run tests
cd apps/api && node --test tests/api.test.mjs
cd apps/workers/media && node --test tests/*.test.mjs
```
