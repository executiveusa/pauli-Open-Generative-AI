# Music Studio Integration Build Plan

**Goal:** Integrate ACE-Step as a production-grade Music Studio module within Cynthia Studio LatAm.

**Non-negotiables:**
- Tenant-safe: all queries scoped to organizationId, workspaceId, projectId
- Provider-routed: through existing Supercomputer, not hardcoded
- Durable-job: uses existing MediaJob state machine
- Artifact-producing: outputs become jobArtifacts in gallery
- Bilingual: Spanish/English first-class support
- No secrets to browser: ACESTEP_API_URL server-side only
- Rights-aware: artist imitation and voice cloning blocked/gated

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend (app/mol/music/)                           │
│  - MusicPromptComposer                                      │
│  - LyricsEditor                                             │
│  - StyleTagPicker (LatAm presets)                           │
│  - MusicJobProgress                                         │
│  - BottomAudioPlayer (persistent)                           │
│  - MusicLibrary                                             │
└─────────────────────────────────────────────────────────────┘
           ↓ (POST /v1/music/generate)
┌─────────────────────────────────────────────────────────────┐
│ Node.js API Server (apps/api/src/routes/music.js)          │
│  - Auth + tenant context required                           │
│  - Validate request (no artist imitation)                   │
│  - Create MusicGenerationRequest                            │
│  - Enqueue job via Supercomputer router                     │
│  - Return job ID + SSE stream path                          │
└─────────────────────────────────────────────────────────────┘
           ↓ (router.selectProvider())
┌─────────────────────────────────────────────────────────────┐
│ Supercomputer Model Router                                  │
│  - Rank ACE-Step 1.5 first for music requests               │
│  - Check ACE-Step health (local Gradio reachable)           │
│  - Fall back to mock or other provider if not healthy       │
│  - Return selected provider ID                              │
└─────────────────────────────────────────────────────────────┘
           ↓ (call selected provider adapter)
┌─────────────────────────────────────────────────────────────┐
│ ACE-Step Provider Adapter (apps/workers/models/ace-step/)   │
│  - POST to ACESTEP_API_URL                                  │
│  - Poll job status                                          │
│  - Download MP3 from Gradio temp storage                    │
│  - Return normalized MusicArtifact                          │
└─────────────────────────────────────────────────────────────┘
           ↓ (async music job worker)
┌─────────────────────────────────────────────────────────────┐
│ Music Job Worker (apps/workers/music-worker.js)             │
│  - Claims queued music jobs                                 │
│  - Calls provider adapter                                   │
│  - Stores artifact in STORAGE_ROOT                          │
│  - Generates waveform preview                               │
│  - Updates job status + artifacts                           │
│  - Emits JobStatusChanged event                             │
└─────────────────────────────────────────────────────────────┘
           ↓ (artifact created)
┌─────────────────────────────────────────────────────────────┐
│ Artifact Library & Client Portal                            │
│  - /v1/music/library (tenant-scoped list)                   │
│  - /v1/music/artifacts/:id (access checks)                  │
│  - Client can play, comment, request revision               │
└─────────────────────────────────────────────────────────────┘
           ↓ (user sends to video)
┌─────────────────────────────────────────────────────────────┐
│ Music-to-Video Workflow                                     │
│  - MusicArtifact → Storyboard generator                     │
│  - Lyrics → Subtitle track                                  │
│  - BPM → Cut rhythm suggestions                             │
│  - Create new Music Video job                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Schemas & Types

### MusicGenerationMode
```typescript
type MusicGenerationMode = 
  | 'simple'         // Basic text-to-song
  | 'custom'         // Advanced BPM/key/controls
  | 'instrumental'   // No vocals
  | 'lyrics'         // Provided lyrics + melody
  | 'cover'          // Reference audio → new style
  | 'repaint'        // Edit section of existing song
  | 'stem-extraction'// Demucs vocal isolation
```

### MusicGenerationRequest
```javascript
{
  // Provenance
  id: "musicgen_123abc",
  organizationId: "org_...",
  workspaceId: "ws_...",
  clientId: "cli_...",
  projectId: "proj_...",
  createdByUserId: "user_...",
  
  // Mode & Language
  mode: "simple" | "custom" | "instrumental" | ...,
  language: "en" | "es" | "pt",
  locale: "es-MX" | "es-CO" | "es-AR" | ... | "en-US",
  
  // Content
  title: "Mi Canción",
  prompt: "upbeat reggaetón with...",
  lyrics: "Verso 1:\nLa noche...",
  genre: "reggaetón" | "cumbia" | ...,
  mood: "energetic" | "melancholic" | ...,
  styleTags: ["tropical", "urban", "2024"],
  culturalStyle: "LatAm",
  instruments: ["guitar", "percussion", "synth"],
  
  // Controls
  bpm: 120,
  key: "Cm",
  timeSignature: "4/4",
  durationSeconds: 120,
  seed: 42,
  inferenceSteps: 27,
  batchSize: 1,
  
  // Optional
  referenceAudioAssetId: "asset_...",
  sourceAudioAssetId: "asset_...",
  repaintRange: { startSec: 0, endSec: 30 },
  vocalStyle: "female_lead" | "male_lead" | ...,
  
  // Safety & Billing
  rightsIntent: "original" | "cover" | "remix" | "clone",
  providerRoute: "auto" | "ace-step-local" | "ace-step-cloud" | ...,
  freeModeAllowed: true,
  
  // Timestamps
  createdAt: "2026-05-24T...",
  updatedAt: "2026-05-24T...",
}
```

### MusicArtifact
```javascript
{
  // Provenance
  id: "artifact_...",
  organizationId: "org_...",
  workspaceId: "ws_...",
  clientId: "cli_...",
  projectId: "proj_...",
  jobId: "job_...",
  createdByUserId: "user_...",
  
  // Content
  kind: "song" | "instrumental" | "vocal" | "stem" | "edited-audio" | "cover" | "waveform" | "music-video" | "lyrics" | "prompt",
  title: "Mi Canción",
  durationSeconds: 120,
  bpm: 120,
  key: "Cm",
  lyrics: "Verso 1:\n...",
  prompt: "upbeat reggaetón...",
  
  // Provider Info
  providerId: "ace-step",
  modelId: "ace-step-1.5",
  
  // Storage
  storagePath: "artifacts/org_xxx/proj_yyy/artifact_zzz.mp3",
  waveformPath: "artifacts/org_xxx/proj_yyy/artifact_zzz.waveform.json",
  
  // Stems (if present)
  stems: [
    { kind: "vocals", storagePath: "..." },
    { kind: "drums", storagePath: "..." },
    { kind: "bass", storagePath: "..." },
    { kind: "other", storagePath: "..." },
  ],
  
  // Rights & Status
  rightsStatus: "owned" | "licensed" | "generated" | "unknown",
  metadata: {
    genre: "reggaetón",
    mood: "energetic",
    culturalStyle: "LatAm",
    isAIGenerated: true,
    vocalType: "synthetic",
  },
  
  // Timestamps
  createdAt: "2026-05-24T...",
  updatedAt: "2026-05-24T...",
}
```

### MusicJobInput
```javascript
{
  mode: "simple" | ...,
  title: "Mi Canción",
  prompt: "...",
  lyrics: "...",
  bpm: 120,
  key: "Cm",
  durationSeconds: 120,
  seed: 42,
  language: "es",
  locale: "es-MX",
  referenceAudioAssetId: "asset_..." | null,
  rightsIntent: "original",
  // ... and all fields from MusicGenerationRequest
}
```

### MusicRightsRecord
```javascript
{
  organizationId: "org_...",
  projectId: "proj_...",
  assetId: "artifact_...",
  rightsStatus: "owned" | "licensed" | "unknown" | "generated",
  sourceType: "original" | "user-upload" | "reference" | "licensed",
  commercialUseAllowed: true | false,
  referenceUseAllowed: true | false,
  coverUseAllowed: true | false,
  voiceConsentRequired: true | false,
  voiceConsentRecordId: "consent_..." | null,
  notes: "User confirmed original composition",
  expiresAt: "2027-05-24T..." | null,
  createdAt: "2026-05-24T...",
  updatedAt: "2026-05-24T...",
}
```

### MusicProviderCapability
```javascript
{
  providerId: "ace-step",
  modelId: "ace-step-1.5",
  displayName: "ACE-Step Local Music",
  displayNameEs: "Música ACE-Step Local",
  modality: ["audio/music"],
  supportsTextToMusic: true,
  supportsLyricsToSong: true,
  supportsInstrumental: true,
  supportsReferenceAudio: true,
  supportsAudioToAudio: true,
  supportsRepainting: true,
  supportsStemExtraction: true,
  supportsLocal: true,
  supportsFreeMode: true,
  supportsBYOK: false,
  costTier: "free-local",
  speedTier: "normal" | "slow" (depends on GPU profile),
  qualityTier: "high-local",
  regionAvailability: ["local", "self-hosted"],
  maxDurationSeconds: 240,
  defaultInferenceSteps: 27,
  allowReferenceAudio: true,
  allowAudioCover: true,
  allowRepainting: true,
  allowVoiceClone: false,
  rateLimitPerTenant: 5,
  timeoutMs: 600000,
  gpuProfile: "4gb" | "8gb" | "12gb" | "a100" | "custom",
  health: "healthy" | "unhealthy" | "unknown",
  lastHealthCheckAt: "2026-05-24T...",
}
```

---

## Routes (API Contract)

### Music Generation Routes
```
POST   /v1/music/generate           Create full song
POST   /v1/music/instrumental        Create instrumental
POST   /v1/music/lyrics              Create song with provided lyrics
POST   /v1/music/cover               Create audio cover (source + new style)
POST   /v1/music/repaint             Edit section of existing song
POST   /v1/music/stems               Extract stems (Demucs)
GET    /v1/music/providers           List providers + health
GET    /v1/music/jobs/:id            Get job status
GET    /v1/music/jobs/:id/events     SSE stream
POST   /v1/music/jobs/:id/cancel     Cancel job
POST   /v1/music/library             List artifacts (tenant-scoped)
GET    /v1/music/artifacts/:id       Get artifact (access check)
POST   /v1/music/artifacts/:id/download Download artifact
POST   /v1/music/editor/export       Export edited audio back
```

---

## File Structure

```
apps/api/src/
├── routes/
│   └── music.js                    Music generation routes
├── providers/
│   └── ace-step/
│       ├── adapter.js              ACE-Step API adapter
│       ├── health.js               Health check
│       ├── schema.js               Validation
│       └── errors.js               Error normalization
└── services/
    └── musicGeneration.js          Unified generation service

apps/workers/models/
└── ace-step/
    ├── src/
    │   ├── adapter.js              Main adapter logic
    │   ├── client.js               HTTP client
    │   ├── health.js               Health check
    │   ├── normalize.js            Response normalization
    │   └── types.js                TypeScript-style comments
    ├── tests/
    │   ├── adapter.test.mjs         Adapter tests
    │   ├── mock.test.mjs            Mock mode tests
    │   └── health.test.mjs          Health check tests
    └── package.json

packages/shared/src/
├── types/
│   └── music.js                    Music domain types
├── jobs/
│   └── musicJobState.js            Music job state transitions
├── music/
│   ├── schemas.js                  Validation schemas
│   ├── presets.js                  LatAm presets
│   ├── safety.js                   Rights/consent checking
│   └── providers.js                Provider registry
└── model-routing/
    └── supercomputer.js            (extend for music)

app/mol/
├── music/
│   ├── page.jsx                    Music Studio main page
│   ├── new/
│   │   └── page.jsx                New music creation
│   ├── library/
│   │   └── page.jsx                Music library browser
│   ├── stems/
│   │   └── page.jsx                Stem extraction UI
│   ├── editor/
│   │   └── page.jsx                Audio editor launcher
│   └── videos/
│       └── page.jsx                Music-to-video workflow
├── components/
│   ├── MusicStudioShell.jsx         Layout wrapper
│   ├── MusicPromptComposer.jsx      Main prompt UI
│   ├── LyricsEditor.jsx             Lyrics editing
│   ├── StyleTagPicker.jsx           Genre/mood selector
│   ├── LatAmPresetPicker.jsx         Regional presets
│   ├── BPMKeyDurationControls.jsx   Music parameters
│   ├── ReferenceAudioUploader.jsx    Upload reference
│   ├── ACEEngineStatusCard.jsx       Provider health
│   ├── MusicSupercomputerPanel.jsx  Router details
│   ├── MusicJobProgress.jsx          Real-time progress
│   ├── WaveformPlayer.jsx            Play generated audio
│   ├── BottomAudioPlayer.jsx         Persistent player
│   ├── StemMixer.jsx                 Stem sliders
│   ├── AudioEditorLauncher.jsx       Editor gateway
│   ├── MusicArtifactLibrary.jsx      Gallery + search
│   ├── MusicToVideoLauncher.jsx      Send to Cine Studio
│   ├── MusicRightsNotice.jsx         Safety disclaimers
│   └── ClientApprovalPanel.jsx       Review UI

docs/
├── ace-step-source-audit.md         (created)
├── music-studio-build-plan.md        (this file)
├── music-studio.md                  (user guide)
├── music-rights-and-consent.md       Safety model
├── local-gpu-setup.md                ACE-Step setup instructions
├── free-mode.md                      Free Mode integration
├── provider-routing.md               Router details
├── env-vars.md                       Environment variables
├── client-portal.md                  Client approval workflow
└── build-status.md                   Phase completion tracker
```

---

## Implementation Phases

| Phase | Goal | Status |
|-------|------|--------|
| 0 | Repo audit + docs | IN PROGRESS |
| 1 | Music schemas | Queued |
| 2 | ACE-Step adapter | Queued |
| 3 | Provider routing | Queued |
| 4 | Music routes | Queued |
| 5 | Music worker | Queued |
| 6 | Stems + FFmpeg | Queued |
| 7 | Music Studio UI | Queued |
| 8 | LatAm presets | Queued |
| 9 | Rights & consent | Queued |
| 10 | Music-to-video | Queued |
| 11 | Library + portal | Queued |
| 12 | Free Mode | Queued |
| 13 | Testing & gates | Queued |
| 14 | Documentation | Queued |

---

## Critical Decisions

### 1. Job Queue
**Current:** In-memory + JSON persistence
**Decision:** Use existing Repository pattern for Phase 1-3 MVP. Plan Redis/BullMQ upgrade path. Document in upgrade guide.

### 2. Audio Storage
**Current:** `STORAGE_ROOT` directory
**Decision:** Keep all music artifacts in `STORAGE_ROOT/artifacts/{orgId}/{projId}/`. Implement cleanup policy (30-day retention default).

### 3. FFmpeg & Demucs
**Current:** Optional, with graceful fallbacks
**Decision:** Waveform generation requires FFmpeg (fail gracefully if not installed). Stem extraction optional (show config message if Demucs missing).

### 4. ACE-Step Deployment
**Decision:** Support three modes:
- **Local**: Gradio API at `http://localhost:7860` (dev only)
- **Remote**: Cloud ACE-Step instance at `ACESTEP_API_URL`
- **Cynthia Gateway**: Proxied through Cynthia infrastructure (future)

### 5. Billing & Free Mode
**Decision:** 
- ACE-Step local is always "free" (no API billing)
- ACESTEP_API_URL usage tracked in UsageLedger
- Free Mode: prefer ACE-Step local if healthy
- Premium Mode: route to fast/premium providers if available

### 6. Rights Management
**Decision:**
- Generate only "original" compositions by default
- Block artist imitation patterns before generation
- Track commercial use intent (license check later)
- Require voice consent record for voice cloning (always blocked for now)

---

## Success Criteria

By end of Phase 14:

1. `/app/music` route exists and is linked in navigation
2. User can create a music job via simple or custom mode
3. Job routes through Supercomputer and ACE-Step appears as primary lane
4. Mock ACE-Step generation creates a real MusicArtifact
5. Real ACESTEP_API_URL can be used server-side only (never in browser)
6. Generated songs appear in Music Library
7. Bottom player can play generated artifacts
8. Stems can be requested as child jobs
9. Music can be sent to Music Video workflow
10. LatAm presets exist in Spanish and English
11. Artist imitation and unsafe voice cloning are blocked
12. Client Portal shows only approved music artifacts
13. Tenant isolation tests pass (no org cross-talk)
14. Secrets are never exposed to client
15. Build/test/lint all pass
16. All docs are updated and accurate

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ACE-Step API unavailable | Music jobs fail | Implement health check + fallback to mock mode |
| FFmpeg not installed | Waveform generation fails | Graceful error, show install instructions |
| Demucs not available | Stem extraction blocked | Capability detection, show config message |
| Tenant data leak | Security breach | Scope all queries, write tests, run analyzer |
| Voice cloning abuse | Legal liability | Block patterns, require consent, audit prompts |
| Artist imitation | Copyright issues | Validate prompts, block "style of [artist]" |
| GPU overload | DOS risk | Rate limit per tenant, timeout jobs, queue monitoring |
| Audio file bloat | Storage issues | Implement cleanup policy, log artifact sizes |

---

## Next Step

→ PHASE 1: Create MusicGenerationRequest and related domain schemas
