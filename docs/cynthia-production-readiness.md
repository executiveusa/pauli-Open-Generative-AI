# Cynthia Studio LatAm — Production Readiness Deep Dive (May 16, 2026)

## Current Distance to Production
**Estimated readiness: ~45%** for a managed beta, **~25%** for enterprise-grade production.

## What is already in place
- Multi-surface product shell exists (Next.js app, Electron shell, reusable studio package).
- Existing media worker abstractions and provider folders exist (local, Hugging Face, MuAPI, fal).
- Baseline shared schema package and initial Phase 0/1 Cynthia documentation now exist.

## Critical gaps to launch video creation reliably
1. **Durable job orchestration**
   - Need queue + retry + resumable state persistence across restarts.
2. **Artifact storage strategy**
   - Need canonical artifact metadata + cloud/object storage abstractions.
3. **Provider routing policy**
   - Need policy evaluation for latency/cost/capability with `fal` fallback when primary provider fails.
4. **Character continuity evaluation loop**
   - Need automated scoring for face consistency, prompt fidelity, and locale quality.
5. **Security hardening**
   - BYOK needs encrypted server-side custody and redacted logs.

## OpenClip + Drive integrations plan
- Added CLI scaffolding (`tools/cynthia-cli`) with connector verification placeholders for:
  - OpenClip
  - Google Drive
  - Microsoft OneDrive
- This is phase-0 scaffolding only; production implementation still needs:
  - OAuth flows
  - chunked upload/download
  - resumable transfer manifests
  - signed URL or brokered token exchange

## fal.ai fallback recommendation
- Route failures from primary video route to `fal` capability route with explicit policy guardrails.
- Keep provider adapters server-side only.

## Next 3 build steps
1. Implement Phase 2 Character Passport UI/API flow with durable storage.
2. Implement job queue + artifact store abstraction and provider route ledger.
3. Implement OpenClip/GDrive/OneDrive connector adapters behind secure service APIs.
