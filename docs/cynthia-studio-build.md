# Cynthia Studio LatAm — Build Checklist

> **Project:** Cynthia Studio — consistent AI character platform for LatAm storytelling  
> **Branch:** `claude/cynthia-studio-latam`  
> **Last updated:** 2026-05-16

---

## Phase Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done / merged |
| 🔄 | In progress |
| ⬜ | Planned / not started |

---

## Build Phases

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 0 | **Repo Audit** — Inventory existing code, establish branch, confirm no TypeScript, confirm env model | ✅ | See `docs/repo-inventory.md` |
| 1 | **Shared Domain Schemas** — CharacterPassport extended, Storyboard, Shot, Location, Job, Artifact, Evaluation, ConsentRecord, ProviderCredential, ModelCapability, CameraPresets, MotionPresets, RoutingModes, LocalePacks | ✅ | `packages/shared/src/schemas/cynthia.js` |
| 2 | **Bilingual i18n Foundation** — English + Spanish dictionaries, locale switcher, `useLocale` hook, locale packs for es-MX/CO/AR/CL/PE/US, pt-BR placeholder | ✅ | `lib/i18n/`, `components/LocaleSwitcher.jsx` |
| 3 | **Cynthia Gateway Placeholder** — GatewayClient, adapters: Mock, CynthiaGateway, OpenAI, MuAPI, Local | ✅ | `lib/gateway/` |
| 4 | **Supercomputer Model Router** — Full routing engine: auto-best, fast-draft, cheapest, highest-quality, best-consistency, best-latam, byok-only, compare | 🔄 | `lib/model-routing/` in progress |
| 5 | **Character Passport UI** — Create/edit/list pages, bilingual form, consent workflow, reference asset uploader | ⬜ | `app/cynthia/characters/` |
| 6 | **Cine Studio Hero Frame Generator** — Shot builder, camera/motion pickers, bilingual prompt preview, artifact save | ⬜ | `app/cynthia/cine-studio/` |
| 7 | **Storyboard Builder** — Multi-shot storyboard editor, continuity lock system, shot ordering, aspect ratio | ⬜ | `app/cynthia/storyboards/` |
| 8 | **Location Profile System** — Location library, cultural context tagging, LatAm scenes presets | ⬜ | `app/cynthia/locations/` |
| 9 | **Talking Characters (Lip Sync)** — Audio input → lip sync job, character passport injection, bilingual subtitle support | ⬜ | `app/cynthia/talking/` |
| 10 | **BYOK Provider Management UI** — Key input (masked), test-key endpoint, per-provider status badges | ⬜ | `app/cynthia/settings/providers/` |
| 11 | **Job Queue & Artifact Manager** — Job list with polling, artifact gallery, compare view, evaluation panel | ⬜ | `app/cynthia/jobs/` |
| 12 | **Evaluation System** — Rule-based + manual scoring, identity/wardrobe/location consistency, LatAm cultural fit | ⬜ | `lib/evaluation/`, `app/cynthia/evaluation/` |
| 13 | **Cynthia Gateway Integration** — Real gateway client, server-side proxy route, BYOK passthrough, rate limiting | ⬜ | `lib/gateway/adapters/CynthiaGatewayAdapter.js` (real impl) |
| 14 | **Rights & Consent Management** — ConsentRecord CRUD, minor/political figure guard rails, revocation workflow | ⬜ | `app/cynthia/consent/` |
| 15 | **LatAm Cultural Prompting Engine** — Locale-aware prompt enrichment, dialect injection, cultural context layering | ⬜ | `lib/prompts/latam/` |
| 16 | **Social Ad & Storyboard Export** — Export to video, SRT subtitles, social format presets (9:16, 1:1, 4:5) | ⬜ | `lib/export/` |
| 17 | **Production Hardening** — Auth guards, rate limiting, server-side secrets audit, Docker compose, Railway deploy | ⬜ | Ops / infra |

---

## Known Build Status

### What exists in the repo (pre-Cynthia)
- Next.js 15 App Router frontend (`app/`)
- Express-like API backend (`apps/api/`)
- MuAPI proxy routes (`app/api/app/`)
- Existing character passport v1 (`packages/shared/src/character/passport.js`)
- Media job state machine (`packages/shared/src/jobs/`)
- Model routing v1 (`packages/shared/src/model-routing/`)
- Shared domain types (`packages/shared/src/types/core.js`)
- Brand config (`lib/brandConfig.js`)
- Gateway stub (`lib/gateway/`)
- i18n stub (`lib/i18n/`)

### Known Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| HF_TOKEN, FAL_KEY, MUAPI_KEY exposed via client-side leaks | HIGH | Audit all `NEXT_PUBLIC_*` usage; move to server-side only |
| No auth on most API routes | HIGH | Phase 17 — add auth middleware |
| Character continuity depends on seed determinism | MEDIUM | Test across providers in Phase 4 |
| LatAm dialect prompting accuracy unverified | MEDIUM | Native speaker review in Phase 15 |
| MuAPI rate limits unknown | MEDIUM | Add retry/backoff in MuAPIAdapter |
| pt-BR locale disabled | LOW | Planned for future release |
| Minor character detection is self-reported | HIGH | Add `isMinor` guard on all generation jobs |

---

## API Key Security Model

### Principles
1. **Server-side only** — No API key ever reaches the browser. All keys are read from `process.env` in server components, API routes, or workers only.
2. **NEXT_PUBLIC_ is public** — Never prefix a secret with `NEXT_PUBLIC_`. Only brand/config values go there.
3. **BYOK encrypted at rest** — User-supplied keys are stored encrypted in the file-based DB, never in plain text in the client.
4. **Test-key endpoint** — `/api/cynthia/providers/test-key` verifies a BYOK key server-side, returns `{ok: bool}` only.
5. **Cynthia Gateway** — All model calls can be proxied through the Cynthia Gateway, so users need only one key.

### Env Var Tiers

| Tier | Prefix | Client-visible | Example |
|------|--------|----------------|---------|
| Brand/config | `NEXT_PUBLIC_BRAND_*` | Yes | `NEXT_PUBLIC_BRAND_NAME` |
| Server secrets | (no prefix) | No | `HF_TOKEN`, `FAL_KEY`, `MUAPI_KEY`, `OPENAI_API_KEY` |
| Gateway | (no prefix) | No | `CYNTHIA_GATEWAY_URL`, `CYNTHIA_GATEWAY_API_KEY` |
| Local workers | (no prefix) | No | `LTX_WORKER_BASE_URL`, `COMFYUI_BASE_URL` |

### Keys in `.env.example` (server-side, never NEXT_PUBLIC_)
- `HF_TOKEN` — Hugging Face, used by workers only
- `FAL_KEY` — Fal.ai, used by API routes only
- `MUAPI_KEY` — MuAPI, used by server-side proxy only
- `OPENAI_API_KEY` — OpenAI DALL-E / future Sora, server-side only
- `CYNTHIA_GATEWAY_API_KEY` — Cynthia Gateway auth token
- `CYNTHIA_GATEWAY_URL` — Gateway base URL

### BYOK Flow
1. User enters key in UI → POST to `/api/cynthia/providers/save-key` (HTTPS only)
2. Server validates key format, stores encrypted in `data/byok/{userId}/{provider}.enc`
3. On generation: server decrypts key, passes to adapter in-memory only
4. Key is never returned in API responses — only `isConfigured: true/false`
