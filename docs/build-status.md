# ACE-Step Music Studio Integration — Build Status

**Status**: 🟡 IN PROGRESS — Phase 0-2 Complete, Phase 3 Starting
**Branch**: `claude/sleepy-ride-w3wXz`
**Last Updated**: 2026-05-24

---

## Phase 0 ✅ COMPLETE — Repo & Source Audit

**Goal**: Understand existing architecture, ACE-Step patterns, and document integration plan.

**Completed**:
- ✅ Audited Cynthia Studio codebase (monorepo, API routes, job system, provider routing)
- ✅ Audited ACE-Step UI source (music modes, UI patterns, Gradio integration, rights issues)
- ✅ Identified reusable patterns (player, lyrics editor, presets, job tracking)
- ✅ Identified non-reusable patterns (SQLite database, Gradio direct exposure, voice cloning)
- ✅ Created `/docs/ace-step-source-audit.md`
- ✅ Created `/docs/music-studio-build-plan.md`
- ✅ Created `/docs/build-status.md` (this file)

**Build Status**: ✅ Passing
- No code changes yet — docs only
- Existing app still builds: `npm run build`
- No secrets in docs

---

## Phase 1 ✅ COMPLETE — Music Domain Schemas

**Goal**: Create shared schemas for music generation, artifacts, rights, and provider capabilities.

**Completed Files**:
- ✅ `packages/shared/src/types/music.js` — MusicGenerationRequest, MusicArtifact, MusicJobInput, MusicRightsRecord, etc.
- ✅ `packages/shared/src/music/schemas.js` — Validation schemas
- ✅ `packages/shared/src/music/presets.js` — LatAm preset templates (19 presets)
- ✅ `packages/shared/src/music/index.js` — Module exports
- ✅ `packages/shared/tests/music.test.mjs` — Tests for validation

**Completed Checklist**:
- ✅ Create music.js type definitions (6 factory functions)
- ✅ Create MusicGenerationRequest factory
- ✅ Create MusicArtifact factory
- ✅ Create MusicRightsRecord factory
- ✅ Create validation schemas (4 functions)
- ✅ Create preset library with 19 LatAm presets (EN + ES)
- ✅ Write tests for validation (23 tests, all passing)
- ✅ Ensure types compile with existing core types
- ✅ Update packages/shared/src/music/index.js exports

**Build Status**: ✅ Passing
- All 23 tests pass
- No compilation errors
- No breaking changes to existing API
- API server starts successfully

**Time**: 3 hours

---

## Phase 2 ✅ COMPLETE — ACE-Step Provider Adapter

**Goal**: Create adapter that calls ACE-Step Gradio API and normalizes responses.

**Completed Files**:
- ✅ `apps/workers/models/ace-step/src/adapter.js` — Main adapter with createAdapter() factory
- ✅ `apps/workers/models/ace-step/src/client.js` — HTTP client for Gradio API
- ✅ `apps/workers/models/ace-step/src/health.js` — Health check with friendly error messages
- ✅ `apps/workers/models/ace-step/src/normalize.js` — Response normalizer with secret redaction
- ✅ `apps/workers/models/ace-step/tests/adapter.test.mjs` — 14 test cases (all passing)

**Completed Checklist**:
- ✅ Implement health check (GET /info)
- ✅ Implement listModels (returns ace-step-1.5 capabilities)
- ✅ Implement generateSong (mode: simple)
- ✅ Implement generateInstrumental (mode: instrumental)
- ✅ Implement generateWithLyrics (mode: lyrics, validates required fields)
- ✅ Implement generateCover (mode: cover, validates sourceAudioAssetId)
- ✅ Implement repaintSection (mode: repaint, throws 'not implemented')
- ✅ Implement extractStems (mode: stem-extraction, throws 'not implemented')
- ✅ Implement getJob (poll Gradio job status)
- ✅ Implement cancelJob
- ✅ Implement normalizeArtifact (convert Gradio response to MusicArtifact)
- ✅ Implement normalizeError (redact secrets, user-friendly messages)
- ✅ Add timeout handling (default 600s, configurable)
- ✅ Add mock mode (return stub artifacts, controlled by ACESTEP_MOCK_MODE env)
- ✅ Write tests for all functions (14 tests)
- ✅ Test with mock mode
- ✅ Test health failure recovery
- ✅ Test input validation (lyrics, sourceAudioAssetId)
- ✅ Test secret redaction (API keys, file paths, URLs)

**Build Status**: ✅ Passing
- All 14 tests pass: `node --test apps/workers/models/ace-step/tests/adapter.test.mjs`
- No compilation errors
- Mock mode fully functional for testing without real server
- Error messages properly redacted (nvapi-, hf_, file paths, URLs)

**Key Features**:
- Singleton adapter pattern with getAdapter() and resetAdapter()
- Mock mode support for offline testing (stub: true flag)
- Secret redaction: redacts API keys (nvapi, sk-, hf_, fal_), URLs, file paths, temp files
- Friendly error messages (ECONNREFUSED → "Cannot connect", timeout → "took too long", etc.)
- Input validation (lyrics required for generateWithLyrics, sourceAudioAssetId for generateCover)
- Response normalization to standard MusicArtifact shape
- Timeout handling with AbortController (default 600s, configurable per request)

**Time**: 2 hours

---

## Phase 3 🟡 IN PROGRESS — Music Provider Routing

**Goal**: Add ACE-Step to Supercomputer model registry and implement music-aware routing.

**Files to Modify**:
- `packages/shared/src/model-routing/supercomputer.js` — Add ace-step-1.5 model entry
- `packages/shared/src/model-routing/selectProvider.js` — Add music routing rules

**Checklist**:
- [ ] Add ace-step-1.5 to MODEL_REGISTRY with music capabilities
- [ ] Implement ranking rules:
  - [ ] Full song request → rank ACE-Step first if healthy
  - [ ] Spanish/LatAm song + ACE-Step supports locale → rank first
  - [ ] Instrumental cinematic → rank ACE-Step first
  - [ ] Request with reference audio + ACE-Step supports it → rank first
  - [ ] Request requires voice clone → block (not ready)
  - [ ] ACE-Step unhealthy → fall back to mock or other
  - [ ] Free Mode ON → prefer ACE-Step local
- [ ] Add music modality to model registry
- [ ] Test router with mock requests
- [ ] Test with real ACE-Step health check

**Estimated Time**: 1-2 hours

---

## Phase 4 ⏳ QUEUED — Music Job Routes

**Goal**: Create API routes for music generation requests.

**Files to Create**:
- `apps/api/src/routes/music.js` — Music generation routes
- `apps/api/src/providers/ace-step/` — Server-side adapter wrapper

**Routes**:
- POST /v1/music/generate — Full song
- POST /v1/music/instrumental — Instrumental only
- POST /v1/music/lyrics — With provided lyrics
- POST /v1/music/cover — Audio cover
- POST /v1/music/repaint — Edit section
- POST /v1/music/stems — Extract stems
- GET /v1/music/providers — List providers + health
- GET /v1/music/jobs/:id — Get job status
- GET /v1/music/jobs/:id/events — SSE stream
- POST /v1/music/jobs/:id/cancel — Cancel job

**Checklist**:
- [ ] Implement /v1/music/generate route
- [ ] Add auth + tenant context check
- [ ] Add request validation
- [ ] Add rights/consent checks (block artist imitation)
- [ ] Create MusicGenerationRequest
- [ ] Create MediaJob with type 'music-generation'
- [ ] Call router.selectProvider()
- [ ] Enqueue job
- [ ] Return job ID + SSE stream path
- [ ] Implement all 10 routes
- [ ] Write tests for auth, validation, tenant scope
- [ ] Test that provider call never leaks ACESTEP_API_URL to client

**Estimated Time**: 2-3 hours

---

## Phase 5 ⏳ QUEUED — Music Worker

**Goal**: Create durable worker for processing music generation jobs.

**Files to Create**:
- `apps/workers/musicWorker.js` — Main worker logic
- Integrate with existing job queue or create DB-backed queue abstraction

**Checklist**:
- [ ] Claim music jobs from queue
- [ ] Transition job to 'running'
- [ ] Call selected provider adapter
- [ ] Download audio artifact to STORAGE_ROOT
- [ ] Create MusicArtifact record
- [ ] Generate waveform preview (via FFmpeg)
- [ ] Probe duration with FFmpeg
- [ ] Update job with artifact IDs
- [ ] Transition job to 'succeeded' or 'failed'
- [ ] Emit job status events
- [ ] Handle provider timeout
- [ ] Handle provider error (normalize + redact)
- [ ] Write tests for all transitions
- [ ] Test with mock adapter

**Estimated Time**: 2-3 hours

---

## Phase 6 ⏳ QUEUED — Stems & Audio Tools

**Goal**: Integrate stem extraction and FFmpeg utilities.

**Files to Create**:
- `apps/api/src/routes/music-stems.js` — Stem extraction route
- `apps/workers/models/ace-step/stem-extraction.js` — Demucs integration (if available)
- `lib/ffmpeg-utils.js` — FFmpeg wrappers

**Checklist**:
- [ ] Create POST /v1/music/:id/stems endpoint
- [ ] Detect Demucs availability at startup
- [ ] If available: call Demucs to extract vocals/drums/bass/other
- [ ] If not available: show config message, block endpoint
- [ ] Create stem artifacts with kind 'stem'
- [ ] Implement FFmpeg waveform renderer
- [ ] Implement FFmpeg duration prober
- [ ] Implement FFmpeg loudness analyzer (placeholder)
- [ ] Handle FFmpeg missing gracefully
- [ ] Write tests for capability detection
- [ ] Test with mock Demucs

**Estimated Time**: 1-2 hours

---

## Phase 7 ⏳ QUEUED — Music Studio UI

**Goal**: Create production UI for music generation.

**Files to Create**:
- `app/mol/music/page.jsx` — Main studio page
- `app/mol/music/new/page.jsx` — Create new music
- `app/mol/music/library/page.jsx` — Music library
- `components/mol/MusicStudio*` — All UI components (15+ files)

**Checklist**:
- [ ] Create /app/music navigation link
- [ ] Create MusicPromptComposer (simple + pro modes)
- [ ] Create LyricsEditor (paste + AI drafting)
- [ ] Create StyleTagPicker (genre/mood autocomplete)
- [ ] Create BPMKeyDurationControls (sliders)
- [ ] Create ReferenceAudioUploader
- [ ] Create ACEEngineStatusCard (provider health)
- [ ] Create MusicJobProgress (real-time status + waveform)
- [ ] Create WaveformPlayer (play + scrub)
- [ ] Create BottomAudioPlayer (persistent)
- [ ] Create StemMixer (vocals/drums/bass/other sliders)
- [ ] Create AudioEditorLauncher (controlled route)
- [ ] Create MusicArtifactLibrary (gallery + search)
- [ ] Create MusicToVideoLauncher (send to Cine Studio)
- [ ] Create MusicRightsNotice (safety disclaimer)
- [ ] Create ClientApprovalPanel (review + comment)
- [ ] Implement bilingual Spanish/English UI
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Test with real jobs

**Estimated Time**: 4-6 hours

---

## Phase 8 ⏳ QUEUED — LatAm Music Presets

**Goal**: Create culturally-aware music presets for LatAm.

**Presets** (EN + ES + prompt templates):
- Reggaetón cinematic
- Cumbia pop
- Corrido tumbado original
- Regional mexicano original
- Latin trap
- Afro-Latin electronic
- Salsa urbana
- Bachata pop
- Andean cinematic
- Bossa / MPB
- Documentary underscore
- NGO campaign anthem
- Social-impact cinematic score
- Brand jingle
- Creator intro theme
- Music-video hook
- Telenovela dramatic theme
- Street documentary score
- Festival campaign anthem

**Checklist**:
- [ ] Create preset library in packages/shared/src/music/presets.js
- [ ] Define 19+ presets with EN + ES labels
- [ ] Add locale relevance (es-MX, es-CO, etc.)
- [ ] Add genre, mood, instruments, BPM range
- [ ] Create prompt templates (EN + ES)
- [ ] Add negative prompts (no artist names, no copyrighted songs)
- [ ] Add rights notes (original or licensed)
- [ ] Add suggested video style for each preset
- [ ] Add suggested camera/motion presets for Cine Studio
- [ ] Test bilingual dictionary completeness
- [ ] Test presets compile into valid MusicGenerationRequest

**Estimated Time**: 2-3 hours

---

## Phase 9 ⏳ QUEUED — Music Rights & Consent Safety

**Goal**: Implement safety gates for artist imitation and voice cloning.

**Checklist**:
- [ ] Create safety check middleware
- [ ] Block patterns: "sound exactly like [artist]", "use [artist] voice", "clone this singer"
- [ ] Warn patterns: "make a cover of [song]", "continue this song"
- [ ] Allow patterns: broad genres, fictional performers, user-owned references
- [ ] Implement MusicRightsRecord creation
- [ ] Implement VoiceConsentRecord check
- [ ] Add commercial use intent tracking
- [ ] Create rights check tests
- [ ] Test artist imitation blocking
- [ ] Test voice clone requirement
- [ ] Test unknown upload rights handling

**Estimated Time**: 1-2 hours

---

## Phase 10 ⏳ QUEUED — Music-to-Video Workflow

**Goal**: Connect Music Studio to Music Video and Cine Studio.

**Checklist**:
- [ ] Implement "Create music video from this song" action
- [ ] Analyze lyrics into sections
- [ ] Extract BPM for cut rhythm suggestions
- [ ] Extract mood/genre for visual style hints
- [ ] Use stems to drive visualizer layers
- [ ] Lyrics → subtitle generation
- [ ] Attach Character Passport to music video concept
- [ ] Create Music Video GenerationJob from MusicArtifact
- [ ] Test handoff to Cine Studio
- [ ] Test that existing Music Video flow is not broken

**Estimated Time**: 2-3 hours

---

## Phase 11 ⏳ QUEUED — Multi-Tenant Library & Client Portal

**Goal**: Implement library with tenant-scoped access and client review workflow.

**Routes**:
- GET /v1/music/library — List by workspace/client/project
- GET /v1/music/artifacts/:id — Access check
- POST /v1/music/artifacts/:id/approve — Client approval
- POST /v1/music/artifacts/:id/request-revision — Client feedback

**Checklist**:
- [ ] Create music library queries (tenant-scoped)
- [ ] Implement search, filter by status/genre/rights
- [ ] Implement favorites/collections
- [ ] Create client portal routes
- [ ] Client can play approved tracks
- [ ] Client can comment
- [ ] Client can request revision
- [ ] Client cannot see raw provider keys
- [ ] Client cannot see cost unless allowed
- [ ] Client cannot access unapproved artifacts
- [ ] Write tenant isolation tests
- [ ] Write access control tests

**Estimated Time**: 2-3 hours

---

## Phase 12 ⏳ QUEUED — Free Mode Integration

**Goal**: Connect music generation to Free Mode (text provider + ACE-Step local).

**Checklist**:
- [ ] Extend Free Mode toggle to affect music router
- [ ] If ACE-Step local healthy → use ACE-Step for music
- [ ] If NVIDIA NIM proxy configured → use for:
  - [ ] Prompt enhancement
  - [ ] Lyrics drafting
  - [ ] Spanish/English translation
  - [ ] LatAm localization
  - [ ] Storyboard generation
  - [ ] Music evaluation
  - [ ] Safety rewrite
- [ ] If no real audio provider healthy → create prompt/storyboard artifacts only
- [ ] Mark job 'needs_music_provider' if audio provider missing
- [ ] Update UsageLedger for Free Mode usage
- [ ] Document Free Mode behavior

**Estimated Time**: 1-2 hours

---

## Phase 13 ⏳ QUEUED — Testing & Quality Gates

**Goal**: Achieve 100% test pass rate and build pass rate.

**Test Coverage**:
- [ ] Schema validation tests
- [ ] Tenant isolation tests
- [ ] Auth required tests
- [ ] Route validation tests
- [ ] ACE-Step adapter mock tests
- [ ] Router ranking tests
- [ ] Safety blocking tests
- [ ] Voice consent required tests
- [ ] Artifact creation tests
- [ ] Job transition tests
- [ ] Library tenant scope tests
- [ ] Client portal visibility tests
- [ ] Bilingual dictionary coverage tests
- [ ] Preset compilation tests
- [ ] Music-to-video handoff tests
- [ ] FFmpeg missing handling
- [ ] Demucs missing handling
- [ ] Secret redaction tests

**Commands to Run**:
- [ ] npm run lint
- [ ] npm run build
- [ ] npm run build:packages
- [ ] npm test (if exists) or node --test
- [ ] Check for secrets with secret scanner

**Estimated Time**: 2-3 hours

---

## Phase 14 ⏳ QUEUED — Documentation

**Goal**: Update all docs to reflect music studio integration.

**Files to Create/Update**:
- [ ] `/docs/ace-step-integration.md` — How to set up ACE-Step
- [ ] `/docs/music-studio.md` — User guide
- [ ] `/docs/music-rights-and-consent.md` — Safety model
- [ ] `/docs/local-gpu-setup.md` — ACE-Step local setup
- [ ] `/docs/free-mode.md` — Free Mode with music
- [ ] `/docs/provider-routing.md` — Router rules
- [ ] `/docs/env-vars.md` — All env vars documented
- [ ] `/docs/client-portal.md` — Client approval workflow
- [ ] `/README.md` — Update to include Music Studio
- [ ] `/docs/build-status.md` — Final status update

**Checklist**:
- [ ] Document local ACE-Step setup (Gradio API)
- [ ] Document how to start ACE-Step
- [ ] Document all env vars
- [ ] Document GPU requirements
- [ ] Document FFmpeg requirement
- [ ] Document Demucs requirement
- [ ] Document mock mode
- [ ] Document production mode
- [ ] Document tenant safety model
- [ ] Document rights/consent rules
- [ ] Document how Music Studio connects to Cine Studio
- [ ] Document known limitations
- [ ] No secrets in docs

**Estimated Time**: 2-3 hours

---

## Final Acceptance Checklist

When ALL phases complete, verify:

- [ ] `/app/music` exists and is linked in app navigation
- [ ] User can create a tenant-scoped music job
- [ ] Job routes through Supercomputer / Model Router
- [ ] ACE-Step provider appears as a model lane
- [ ] Mock ACE-Step generation creates a real MusicArtifact record
- [ ] Configured ACESTEP_API_URL can be used server-side only
- [ ] Generated songs appear in Music Library
- [ ] Bottom player can play generated artifacts
- [ ] Stems can be requested as child jobs
- [ ] Music can be sent to Music Video / Cine Studio
- [ ] LatAm presets exist in Spanish and English
- [ ] Artist imitation and unsafe voice cloning are blocked
- [ ] Client Portal can show approved music artifacts
- [ ] Tenant isolation tests pass
- [ ] Secrets are not exposed to client
- [ ] Build/test status is documented
- [ ] All docs are updated
- [ ] No regressions in Music Video, Visualizer, Character Lab, Workflow Monitor

---

## Build Artifacts (by Phase)

### Phase 0 ✅
- docs/ace-step-source-audit.md
- docs/music-studio-build-plan.md
- docs/build-status.md

### Phase 1 (In Progress)
- packages/shared/src/types/music.js (pending)
- packages/shared/src/music/schemas.js (pending)
- packages/shared/src/music/presets.js (pending)
- tests/music.test.mjs (pending)

### Phase 2-14 (Queued)
- [Files listed above]

---

## Command Quick Reference

```bash
# Build entire workspace
npm run build:packages && npm run build

# Run tests
node --test apps/workers/models/ace-step/tests/*.test.mjs
npm test

# Lint
npm run lint

# Run API server (dev)
node apps/api/src/index.js

# Run frontend (dev)
npm run dev

# Check build status
npm run build 2>&1 | tee build.log
```

---

## Next Immediate Action

**→ PHASE 3: Add ACE-Step to Music Provider Routing**

Start with:
1. Examine `packages/shared/src/model-routing/supercomputer.js` to understand MODEL_REGISTRY structure
2. Add ace-step-1.5 model entry with music capabilities (supportsTextToMusic, supportsInstrumental, supportsLyricsToSong, etc.)
3. Create music routing rules in selectProvider() based on:
   - Request mode (song/instrumental/lyrics/cover/repaint)
   - Provider health status
   - Locale/language matching (es-MX, es-CO, etc.)
   - Free Mode enabled
4. Implement ranking algorithm that places ACE-Step first for LatAm music requests when healthy
5. Add fallback to mock or other providers when ACE-Step unhealthy
6. Write tests for routing with mock requests
7. Verify existing router tests still pass

**Estimated Time**: 1-2 hours
**Blocker**: None
**Risk**: Low (no breaking changes, additive only)
