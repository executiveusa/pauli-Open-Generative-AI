# Cynthia Studio — Architecture Overview

> **Branch:** `claude/cynthia-studio-latam`  
> **Stack:** Next.js 15 (App Router), Node.js, pure JS (no TypeScript), file-based DB

---

## Repo Structure Overview

```
pauli-Open-Generative-AI/
├── app/                        # Next.js 15 App Router pages & API routes
│   ├── api/                    # Server-side API routes (Next.js route handlers)
│   │   └── app/                # MuAPI proxy routes
│   ├── cynthia/                # [planned] Cynthia Studio pages
│   └── studio/                 # Existing studio pages
├── apps/
│   ├── api/                    # Express-like Node.js backend
│   └── workers/
│       ├── media/              # Media processing worker
│       └── models/             # Model inference workers (LTX, ComfyUI, etc.)
├── components/                 # Shared React components
│   └── LocaleSwitcher.jsx      # Bilingual locale switcher
├── docs/                       # Architecture & build docs
├── electron/                   # Electron desktop app wrapper
├── lib/
│   ├── brandConfig.js          # White-label brand env vars
│   ├── gateway/                # Model provider gateway abstraction
│   │   ├── index.js            # Factory: createGatewayClient()
│   │   ├── GatewayClient.js    # Universal client class
│   │   └── adapters/           # Provider-specific adapters
│   │       ├── MockAdapter.js
│   │       ├── CynthiaGatewayAdapter.js
│   │       ├── OpenAIAdapter.js
│   │       ├── MuAPIAdapter.js
│   │       └── LocalAdapter.js
│   └── i18n/                   # Bilingual i18n system
│       ├── index.js            # getDict(), t(), resolveLocale()
│       ├── en.js               # English dictionary
│       ├── es.js               # Spanish dictionary (LatAm)
│       ├── useLocale.js        # React hook
│       └── locales/            # Locale packs (es-MX, es-CO, es-AR, es-CL, es-PE, es-US, pt-BR)
├── packages/
│   └── shared/
│       └── src/
│           ├── types/core.js           # Core domain types, newId(), now(), validate()
│           ├── character/passport.js   # CharacterPassport v1
│           ├── schemas/
│           │   ├── cynthia.js          # Cynthia extended schemas (Phase 1)
│           │   └── seeds/              # Example JSON fixtures
│           ├── jobs/                   # Job state machine
│           ├── model-routing/          # Provider selection logic
│           └── prompts/               # Prompt builders
├── src/                        # Vite/Electron app source
└── stubs/                      # Workflow & agent stubs
```

---

## Frontend: Next.js 15 App Router

- **Framework:** Next.js 15, App Router
- **Rendering:** Server Components by default; client components where needed (`"use client"`)
- **Styling:** Tailwind CSS
- **i18n:** Custom `lib/i18n/` — no external i18n library. `useLocale()` hook stores preference in `localStorage`.
- **State:** React `useState` / `useEffect`; no global state manager
- **No TypeScript** — pure JavaScript with JSDoc annotations

### Key Constraints
- `NEXT_PUBLIC_*` env vars are client-visible — **never** put secrets there
- Server Components read secrets from `process.env` directly
- API routes in `app/api/` are server-side only

---

## Backend: apps/api

- Express-like Node.js server
- File-based JSON database in `data/` directory
- No ORM — plain `fs.promises.readFile` / `writeFile` with JSON
- Routes mirror `app/api/` for local/Electron use

---

## Workers: apps/workers

### media/
- Video/audio processing pipeline
- Reads jobs from file-based queue
- Writes artifacts to `data/artifacts/`

### models/
- Model-specific inference workers
- LTX Video (local)
- ComfyUI bridge
- HuggingFace inference

---

## Shared Library: packages/shared

All domain logic lives here. Pure JS modules, `"type": "module"`.

### Core exports:
- `types/core.js` — `newId()`, `now()`, `validate()`, `MediaJobStatuses`, `ConsentStatuses`
- `character/passport.js` — `makeCharacterPassport()`, `validatePassport()`, `passportToPromptFragments()`
- `schemas/cynthia.js` — All Cynthia Studio schemas (Phase 1)
- `jobs/mediaJobState.js` — Job state transitions
- `model-routing/selectProvider.js` — Provider routing logic
- `prompts/musicVideoPromptBuilder.js` — Prompt construction

---

## Gateway Abstraction: lib/gateway

The gateway provides a unified interface to all model providers.

### Adapter Pattern
```
GatewayClient
  └── adapter (one of):
        ├── MockAdapter         — deterministic mocks, no network
        ├── CynthiaGatewayAdapter — Cynthia-hosted gateway (1 key for all)
        ├── OpenAIAdapter       — DALL-E 3, future Sora
        ├── MuAPIAdapter        — MuAPI (delegates to /api/app/* proxy)
        └── LocalAdapter        — LTX Worker, ComfyUI (local inference)
```

### Adapter Interface (all adapters implement):
- `generate(request)` → `GenerationResponse`
- `getJob(id)` → `Job`
- `listModels()` → `ModelCapability[]`
- `evaluate(jobId, artifactId)` → `EvaluationResult`
- `testKey(provider, key)` → `{ok, error?}`
- `route(routeRequest)` → `{provider, modelId, reason}`

---

## i18n System: lib/i18n

- **Supported languages:** `en` (English), `es` (Spanish LatAm)
- **Sub-locales:** es-MX, es-CO, es-AR, es-CL, es-PE, es-US (enabled); pt-BR (disabled, future)
- **Fallback:** Any unknown locale falls back to `en`
- **pt-BR mapping:** `resolveLocale('pt-BR')` → `'en'` (disabled)

---

## Security Model: Secrets Only Server-Side

### CRITICAL: Existing API Key Risks

The `.env.example` file exposes these keys that MUST remain server-side:

| Key | Provider | Risk if exposed |
|-----|----------|----------------|
| `HF_TOKEN` | Hugging Face | Free tier abuse, model downloads |
| `FAL_KEY` | Fal.ai | Billing fraud |
| `MUAPI_KEY` | MuAPI | Billing fraud |
| `OPENAI_API_KEY` | OpenAI | Billing fraud (can be $$$) |
| `CYNTHIA_GATEWAY_API_KEY` | Cynthia Gateway | Full gateway access |

**These keys must NEVER appear in:**
- Any `NEXT_PUBLIC_*` env var
- Any client-side component (`"use client"`)
- Any API response body
- Any git commit

---

## Model Routing Flow

```
User selects routing mode
        │
        ▼
lib/gateway/index.js → createGatewayClient(config)
        │
        ▼
GatewayClient.route(routeRequest)
        │
        ├─ routingMode = 'mock'          → MockAdapter
        ├─ routingMode = 'cynthia'       → CynthiaGatewayAdapter
        ├─ routingMode = 'byok-only'     → checks BYOK key exists → adapter
        ├─ routingMode = 'auto-best'     → ModelRoutePolicy selects best provider
        ├─ routingMode = 'fast-draft'    → prefers speed tier 'instant'/'fast'
        ├─ routingMode = 'cheapest'      → prefers cost tier 'free'/'low'
        ├─ routingMode = 'compare'       → runs on multiple providers
        └─ (default)                     → MockAdapter (safe fallback)
        │
        ▼
adapter.generate(request)
        │
        ▼
GenerationResponse → Job created → artifacts saved → EvaluationResult
```

---

## Character Passport Flow

```
User creates CharacterPassport
  ├── publicName, locale, archetype, ageBand
  ├── facialDescription, hairDescription, skinTone
  ├── wardrobeCore, accessories
  ├── voiceProfile (provider, language, voice, speed, pitch)
  ├── referenceAssets (images, video)
  ├── continuityLocks (face, hair, wardrobe, bodyType)
  └── rights (consent, commercial, likenessTraining, voiceCloning)
        │
        ▼
makeCharacterPassport() → stored in data/characters/{id}.json
        │
        ▼
On generation: passport injected into GenerationRequest
        │
        ▼
GatewayClient.generate({ characterPassportId, ... })
        │
        ├── ConsentRecord checked (blockedByRights if not consented)
        ├── SafetyFlags checked (blockedBySafety if flagged)
        └── Passport → prompt fragments via passportToPromptFragments()
              │
              ▼
        Prompt sent to model provider
              │
              ▼
        Artifacts saved with isHeroFrame / isCanonical flags
```

---

## Job Lifecycle

```
Shot configured → GenerationJob created (status: 'draft')
                │
                ▼
  User confirms → status: 'queued'
                │
                ▼
  Worker picks up → status: 'running'
                │
                ├── model call fails: status: 'failed' + error
                ├── no key found: status: 'needs_key'
                ├── rights block: status: 'blocked_by_rights'
                ├── safety block: status: 'blocked_by_safety'
                └── success: status: 'succeeded'
                        │
                        ▼
                  Artifact saved (type: image/video/audio)
                        │
                        ▼
                  EvaluationResult computed (rule-based)
                        │
                        ▼
                  isHeroFrame / isCanonical set by user
```
