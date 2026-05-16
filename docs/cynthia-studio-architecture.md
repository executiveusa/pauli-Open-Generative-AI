# Cynthia Studio LatAm Architecture (Incremental Upgrade)

## Direction
Incrementally evolve current launcher UX into a cinematic operating layer while preserving existing Next.js + Electron + workspace topology.

## Core Modules
1. **Creative Domain Layer (`packages/shared/src/schemas`)**
   - Canonical schema validators for character, storyboard, shot, job, and localization entities.
2. **Router Layer (`packages/shared/src/model-routing`)**
   - Provider/capability policy routing surface for local + cloud adapters.
3. **Studio Apps (`app/`, `src/components`, `packages/studio`)**
   - UI migration path for Hero Frame First, storyboard planning, and Cine Studio controls.
4. **Execution Layer (`apps/workers/*`)**
   - Durable generation jobs, media processing, and artifact persistence.
5. **Security & Consent Layer**
   - Provider key custody server-side, consent/rights records, and safety ledger checks before generation.

## Key Security Gaps (Current)
- Client API key flows exist and must migrate to backend-only secret interfaces.
- Need explicit redaction standards for provider logs and debug events.
- Need immutable consent + rights records attached to each generation job.

## Compatibility Strategy
- Preserve existing routes and studios while introducing upgraded Cynthia paths behind feature flags.
- Provide typed placeholder provider adapters when real provider integrations are unavailable.
