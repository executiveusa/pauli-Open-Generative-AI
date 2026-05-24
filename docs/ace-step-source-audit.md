# ACE-Step UI Source Audit

**Purpose:** Identify patterns, architectures, and code reuse opportunities from ACE-Step UI for integrating music generation into Cynthia Studio.

**Source:** https://github.com/fspecii/ace-step-ui

---

## What ACE-Step UI Does

ACE-Step UI is a full-stack React/TypeScript music generation application built around the ACE-Step 1.5 Gradio API. It provides:

- **Music generation modes**: full song, instrumental, with lyrics, audio cover, stem extraction
- **UI patterns**: React hooks, context state, Tailwind styling, progress tracking
- **Audio tools**: FFmpeg integration, Demucs stem extraction, AudioMass editor
- **Database**: SQLite for projects, tracks, preferences (NOT for production artifact storage)
- **Backend**: Express.js API layer around Gradio
- **i18n**: Multilingual support via i18n-js
- **Real-time**: BPM/key/duration controls, seed management, lyrics editing

---

## Patterns to Extract (Reusable)

### 1. Music Generation Request Schema
- Mode: `simple | custom | instrumental | lyrics | cover | repaint | stem-extraction`
- Prompt engineering: genre, mood, style tags, instruments
- Control: BPM, key, time signature, duration, seed, inference steps
- Advanced: reference audio, source audio for cover/repaint
- **ACTION**: Design generic `MusicGenerationRequest` that works with any music provider

### 2. Audio Player Component
- Bottom-sticky persistent player (like Spotify)
- Waveform visualization with scrubbing
- Play/pause/skip, volume, speed controls
- Metadata display (title, duration, artist)
- **ACTION**: Create reusable `MusicPlayer` component for Cynthia

### 3. Lyrics Editor
- Text input with line-by-line structure
- Auto-sync to BPM for timing
- Copy/paste lyrics blocks
- Generate lyrics via AI (prompt enhancement)
- **ACTION**: Create `LyricsEditor` component, integrate with text providers

### 4. Style Tag Picker
- Presets: genre, mood, instruments, cultural style
- Multi-select with autocomplete
- Custom tag input
- **ACTION**: Create `StyleTagPicker`, populate with LatAm cultural presets

### 5. Prompt Reuse & Templates
- Save/load favorite prompts
- Template library with placeholders
- Prompt enhancement (via NVIDIA NIM or text API)
- **ACTION**: Create prompt library, integrate template system

### 6. Job Progress Tracking
- Real-time status updates (via SSE or polling)
- Estimated time remaining
- Provider name visible to user
- Cancel/retry actions
- **ACTION**: Integrate with existing Workflow Monitor

### 7. Artifact Library & Management
- Search, filter, sort by date/type/genre
- Favorites/collections
- Download, share links
- Revision history
- **ACTION**: Extend existing artifact system for music-specific metadata

### 8. LatAm Music Presets
- Spanish/English bilingual
- Regional styles: reggaetón, cumbia, corrido tumbado, regional mexicano, Latin trap, etc.
- Mood/cultural nuance without stereotypes
- **ACTION**: Create comprehensive LatAm preset library

### 9. FFmpeg Integration
- Duration probing
- Waveform rendering
- Format conversion
- Loudness normalization
- **ACTION**: Use existing FFmpeg patterns in stub provider

### 10. Demucs Stem Extraction
- Vocals, drums, bass, other, optional instrumental
- Optional no-vocals mix
- **ACTION**: Create stem extraction job type with capability detection

---

## Patterns NOT to Extract (Cynthia Will Not Use)

### Database
- ACE-Step uses SQLite for projects/tracks/prefs
- **Cynthia uses**: Repository pattern (in-memory + JSON persistence for now, Postgres/SQLite later)
- **ACTION**: Do NOT copy ACE-Step database. Use existing `db/jobs.js`, `db/artifacts.js`

### Gradio Direct Exposure
- ACE-Step exposes Gradio UI directly in some contexts
- **Cynthia rule**: No provider URLs to browser. All calls through backend.
- **ACTION**: Create ACE-Step adapter that:
  - Server receives `ACESTEP_API_URL`
  - Browser never sees it
  - Adapter normalizes Gradio response to standard MusicArtifact shape

### Separate Express Server
- ACE-Step's Express layer is for Gradio API proxying + serving Gradio WebUI
- **Cynthia**: Unified Node.js API server already exists
- **ACTION**: Add ACE-Step provider adapter to existing `/apps/api`, not a new server

### Separate SQLite Database
- ACE-Step tracks are stored in SQLite
- **Cynthia**: All artifacts go through existing repository pattern
- **ACTION**: Music artifacts become JobArtifacts with `kind: 'song' | 'instrumental' | 'stem' | 'waveform'`

### React Context State Management
- ACE-Step uses React context for global audio state
- **Cynthia**: Page-level state with API calls (no Redux, no Zustand)
- **ACTION**: Use existing component + hook patterns, not new state manager

---

## Security & Tenancy Concerns from ACE-Step

1. **Voice Cloning**: ACE-Step allows voice clone prompts without consent gating
   - **Cynthia rule**: Block "use [artist] voice", "sound exactly like [artist]"
   - Require `VoiceConsentRecord` before generation

2. **Artist Imitation**: "Generate in the style of [living artist]"
   - **Cynthia rule**: Block. Allow "reggaetón style" or "70s funk" only

3. **Copyrighted Song References**: "Continue this song", "Make a cover of X"
   - **Cynthia rule**: Warn user, check rights intent, require rights record

4. **Provider Keys**: If Gradio is cloud-hosted, key exposure possible
   - **Cynthia rule**: `ACESTEP_API_URL` server-side only. No key in browser.

5. **Rate Limiting**: ACE-Step has no per-tenant rate limits
   - **Cynthia rule**: Rate limit per organizationId + userId

6. **Artifact Storage**: ACE-Step keeps generated MP3s in local filesystem
   - **Cynthia rule**: Use configured `STORAGE_ROOT`. Test artifact cleanup.

---

## ACE-Step Gradio API Contract (Reference)

The ACE-Step API endpoint expects requests like:

```javascript
POST /api/gradio-endpoint
{
  "mode": "generate",
  "prompt": "upbeat reggaetón...",
  "language": "en",
  "bpm": 120,
  "key": "Cm",
  "duration": 30,
  "seed": 42,
  "inference_steps": 27
}
```

Returns:
```json
{
  "status": "succeeded",
  "audio_path": "/tmp/output.mp3",
  "duration_seconds": 30,
  "metadata": { "bpm": 120, "key": "Cm" }
}
```

**ACTION**: Adapter must normalize this to MusicArtifact with:
- `storagePath`: Download from `/tmp/output.mp3` and store in `STORAGE_ROOT`
- `durationSeconds`, `bpm`, `key`: Extracted from Gradio response
- `providerId`: "ace-step"
- `modelId`: "ace-step-1.5"

---

## Environment & Deployment

ACE-Step UI assumes:
- Local Gradio API reachable at `ACESTEP_API_URL` (default: `http://localhost:7860`)
- FFmpeg installed
- Demucs installed (optional)
- AudioMass available (optional, for UI editing)

**Cynthia Production Needs**:
- ACE-Step Gradio can be: local self-hosted, remote cloud, or Cynthia Gateway proxied
- FFmpeg: required for waveform preview, loudness analysis
- Demucs: optional, capability detected at startup
- AudioMass: NOT embedded; use controlled editor route instead

---

## Final Non-Negotiables

1. Do NOT embed ACE-Step UI as a separate React app
2. Do NOT use ACE-Step SQLite database
3. Do NOT hardcode `ACESTEP_API_URL` in code
4. Do NOT expose `ACESTEP_API_URL` to browser
5. Do NOT store generated audio outside `STORAGE_ROOT`
6. Do NOT skip tenant isolation checks
7. Do NOT allow voice cloning without consent
8. Do NOT allow artist imitation without gating

---

## Next Steps

→ PHASE 1: Create MusicGenerationRequest and related schemas
→ PHASE 2: Create ACE-Step provider adapter
→ PHASE 3: Add music provider to Supercomputer router
→ PHASE 4: Add music job routes (/v1/music/*)
→ PHASE 5: Create music worker for job processing
→ PHASE 6: Stem extraction + FFmpeg utilities
→ PHASE 7: Music Studio UI routes and components
→ PHASE 8: LatAm music presets
→ PHASE 9: Music rights and consent safety
→ PHASE 10: Music-to-video workflow integration
→ PHASE 11: Multi-tenant library and client portal
→ PHASE 12: Free Mode integration
→ PHASE 13: Testing and quality gates
→ PHASE 14: Documentation
