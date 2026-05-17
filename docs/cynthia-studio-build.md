# Synthia Studio LatAm Build Tracker

## Build Status Checklist
- [x] Phase 0 — Repo audit and build baseline
- [x] Phase 1 — Shared domain schemas
- [ ] Phase 2 — Character Passport workflows
- [ ] Phase 3 — Hero Frame First workflow
- [ ] Phase 4 — Storyboard + shot planner UI
- [ ] Phase 5 — Cinematic controls integration
- [ ] Phase 6 — Multi-model router and BYOK
- [ ] Phase 7 — Durable jobs and rights/safety ledger
- [ ] Phase 8 — Bilingual UI and locale packs
- [ ] Phase 9 — Evaluation loop

## Phase 0 Notes
- Reviewed existing app shells: Next.js `app/`, Electron `electron/`, reusable studio package `packages/studio`, and shared library surfaces in `packages/shared`.
- Existing model/provider paths are present in `src/lib/models.js`, `src/lib/muapi.js`, `electron/lib/modelCatalog.js`, and worker providers under `apps/workers/models/*`.
- API key risk area: client-side key modal and browser state patterns require migration to server-only key vault abstractions.
- Baseline validation commands are captured in completion notes.

## Phase 1 Notes
- Added new Synthia domain schemas and validators for Character Passport, Storyboard, Shot, Generation Job, and Locale Pack.
- Added seed examples and automated schema tests.
