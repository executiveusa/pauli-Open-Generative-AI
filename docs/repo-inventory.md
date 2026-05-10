# Repo Inventory

## Existing app framework
- Next.js App Router app (`app/*`) plus Electron desktop wrapper (`electron/*`).
- npm workspaces with local packages: `packages/studio`, `packages/Vibe-Workflow/...`, `packages/Open-Poe-AI/...`.

## Existing scripts
- Root scripts cover Next dev/build/start/lint, workspace builds, setup with submodules, and Electron build targets.

## Existing studio components
- Wrapper shell and key modal in `components/StandaloneShell.js` and `components/ApiKeyModal.js`.
- Shared studio component exports in `packages/studio/src/index.js` (Image/Video/LipSync/Cinema/Workflow and related studios).
- Additional legacy/non-React studio-like components in `src/components/*`.

## Existing provider integrations
- Muapi client libraries at `packages/studio/src/muapi.js` and `src/lib/muapi.js`.
- Local inference and Wan2GP providers under `electron/lib/*`.
- Model catalog/registry in `packages/studio/src/models.js` and `src/lib/models.js`.

## Existing API key handling
- BYOK model is active: keys stored in browser localStorage and injected into `x-api-key` headers.
- UI prompts for API key via modal/settings/auth flows.
- Server proxy routes pass through keys via headers/cookies.

## Existing model/workflow registry
- Large static model registry in `packages/studio/src/models.js` used by multiple studios.
- Workflow and agent capabilities via submodule-backed workspace packages.

## Existing upload/media handling
- Browser uploads and history persisted in localStorage-backed utilities.
- Uploads currently routed through Muapi endpoints and studio helper functions.

## Existing styling/theming
- Tailwind-based glassmorphism-oriented UI and global styles in app/src component stacks.

## Existing tests
- Minimal explicit automated test presence in root app; one provider smoke script found in `scripts/test_minimax_provider.js`.

## Reusable code
- Reuse `packages/studio/src/models.js` as initial model capability dataset for backend routing mapping.
- Reuse current studio UIs as façade while migrating network calls to backend adapters.
- Reuse route proxy patterns as scaffolding for new detached API service contracts.

## Risk areas
- Secretless requirement violations (localStorage BYOK, browser `x-api-key`, key-related logs).
- Dual implementation surfaces (`components/*` and `src/components/*`) increase drift risk.
- Monolithic model registry may require normalization for capability-based routing.

## Missing pieces
- Detached backend app (`apps/api`) and workers architecture.
- Durable job storage/state machine/artifact tracking.
- Character Passport schema/system.
- FFmpeg wrapper service layer.
- Provider routing policy engine and budget guardrails.
- Security policy docs for media rights and provider controls.
