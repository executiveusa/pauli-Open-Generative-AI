# Skill: more-of-less-studio-builder

## Purpose
Standard operating workflow for building More-of-Less as a production-grade, modular, test-driven AI media studio.

## Mandatory workflow
1. Repo reconnaissance before code changes.
2. GSD loop: map-codebase → define-project → gather-requirements → create-roadmap → plan-phase → execute-phase → verify-work → ship.
3. Superpowers loop: brainstorm → design → bite-size plan → TDD (RED/GREEN/REFACTOR/VERIFY) → implementation → review.
4. gstack role reviews after each meaningful phase: Product, CEO, Engineering, Design, QA, Security, Release.

## Required planning files
Maintain:
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/CONTEXT.md`
- `.planning/config.json`
- `docs/agent-worklog.md`
- `docs/repo-inventory.md`
- `docs/architecture-decisions.md`
- `docs/security-secrets-audit.md`
- `docs/model-provider-matrix.md`
- `docs/completions/*.md`

## Architecture principles
- Frontend must be secretless.
- Backend-only provider calls.
- Durable media jobs with IDs, status, logs, artifacts, provider route, and completion record.
- Character Passport required for consistent characters.
- FFmpeg wrapper is the baseline media engine.
- Provider routing supports local, Hugging Face, ComfyUI, fal.ai, Muapi, and stub.

## Security requirements
- No provider secrets in frontend or `NEXT_PUBLIC_*` except safe public URLs.
- Redact secrets in logs.
- Consent and rights checks for likeness/voice/content provenance.

## Completion protocol
At phase end, create `docs/completions/{YYYY-MM-DD}-{phase}-{task}.md` including summary, files changed, tests/checks, security scan, gaps, risks, and exact next task.
