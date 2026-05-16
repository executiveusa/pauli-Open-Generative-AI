# Completion: Phase 4 — Frontend Backend Adapter

## Summary
Built the More-of-Less studio UI with full backend-only API client. No provider secrets in frontend.
All new studio pages call the backend exclusively. Existing studio tabs preserved.

## Files changed
- `lib/apiClient.js` — frontend API client: projects, assets, characters, jobs, providers, SSE
- `components/mol/JobMonitor.jsx` — real-time job status via SSE (Taste-Skill Bento design)
- `components/mol/FileUploader.jsx` — drag-and-drop upload to backend (no provider secrets)
- `app/mol/layout.jsx` — More-of-Less nav layout
- `app/mol/dashboard/page.jsx` — bento grid dashboard
- `app/mol/music-video/page.jsx` — full music video form + job monitor
- `app/mol/visualizer/page.jsx` — visualizer mode selector + job monitor
- `app/mol/mix-master/page.jsx` — mix/master presets + autotune toggle
- `app/mol/character-lab/page.jsx` — character passport form + list
- `app/mol/workflow-monitor/page.jsx` — watch any job by ID
- `.gitignore` — added storage/ dirs

## Security
- apiClient.js: no provider key, no localStorage key, no NEXT_PUBLIC_* secrets
- All API calls go to NEXT_PUBLIC_API_BASE_URL (safe public URL only)
- Existing BYOK tabs not removed (preserves existing users) but not used in new tabs
- Production: ENABLE_DEV_BYOK=false (default) hides old key modal pathway

## Tests
- JavaScript syntax validated on all non-JSX files via node --check
- JSX files pass visual review (no build env available without npm install)

## Known gaps
- npm install not run — deferred to Phase 11 deploy
- No Playwright e2e tests yet (Phase 11)

## Next task
Phase 5: FFmpeg media worker — wrapper, probe, audio/video ops, visualizer
