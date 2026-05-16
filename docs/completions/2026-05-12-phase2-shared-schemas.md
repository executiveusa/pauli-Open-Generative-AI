# Completion: Phase 2 — Shared Schemas, State Machine, Router, Prompt Builder

## Summary
Implemented all stable shared types, state machine, provider routing, character passport system,
and music video prompt builder. 33 tests written and passing.

## Files changed
- `packages/shared/package.json` — added exports map and test script
- `packages/shared/src/index.js` — barrel export
- `packages/shared/src/types/core.js` — Project, Asset, MediaJob, JobArtifact factories + validation
- `packages/shared/src/jobs/mediaJobState.js` — explicit state machine with canTransition, assertTransition, applyTransition
- `packages/shared/src/model-routing/types.js` — ProviderRoute constants, makeStubRoute, validateRoute
- `packages/shared/src/model-routing/selectProvider.js` — full priority-ordered provider selection with all filters
- `packages/shared/src/character/passport.js` — CharacterPassport factory, validate, deriveSeed, passportToPromptFragments
- `packages/shared/src/prompts/musicVideoPromptBuilder.js` — buildScenePrompt, continuityCCheck
- `packages/shared/tests/core.test.mjs` — 33 unit tests

## Tests run
```
node --test tests/core.test.mjs
33 pass, 0 fail
```

## Build run
N/A — shared package is imported, not built separately.

## Security checks
- No secrets introduced
- No provider keys in package

## Known gaps
- TypeScript types not yet added (JS JSDoc used for now)
- No integration tests yet (Phase 3+)

## Risks
- None for this phase

## Next task
Phase 3: Backend API skeleton — `apps/api` with /health, projects, assets, jobs endpoints
