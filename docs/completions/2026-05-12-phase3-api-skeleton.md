# Completion: Phase 3 — Backend API Skeleton

## Summary
Implemented full detached backend API with proper routing, storage adapter, job repository,
and all required endpoints. 18 integration tests passing.

## Files changed
- `apps/api/package.json` — added test script
- `apps/api/src/index.js` — main server with router, error handling, secret redaction
- `apps/api/src/router.js` — minimal path router with param extraction
- `apps/api/src/middleware.js` — CORS, body parsing, response helpers
- `apps/api/src/storage/local.js` — local filesystem artifact storage adapter
- `apps/api/src/db/repository.js` — in-memory + disk-backed repository
- `apps/api/src/routes/health.js` — GET /health
- `apps/api/src/routes/projects.js` — CRUD /v1/projects
- `apps/api/src/routes/assets.js` — POST /v1/assets/upload, GET /v1/assets/:id
- `apps/api/src/routes/characters.js` — CRUD /v1/characters
- `apps/api/src/routes/jobs.js` — all job endpoints with SSE, cancel, remake
- `apps/api/tests/api.test.mjs` — 18 integration tests

## Tests run
```
node --test tests/api.test.mjs
18 pass, 0 fail
```

## Security checks
- Provider secrets not returned in response bodies
- Error messages strip secret-looking strings (sk-, hf_, fal_, nvapi-)
- Frontend receives no secret keys

## Known gaps
- Asset upload test (needs binary body — deferred to Phase 5 with FFmpeg)
- SSE events test (deferred — requires long-running connection)
- No auth middleware yet (Phase 11)

## Next task
Phase 4: Frontend backend adapter — connect existing pauli UI to backend, disable BYOK in production mode
