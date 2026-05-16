# Skill: more-of-less-studio-builder

## Purpose
Standard operating workflow for building More-of-Less as a production-grade, modular, test-driven AI media studio.

---

## Mandatory MCP Tool: jcodemunch-mcp

**Every agent working in this repo must install and use jcodemunch-mcp before any codebase work.**

jcodemunch-mcp is an MCP server that uses tree-sitter AST indexing to retrieve exact code symbols at byte-level precision. It reduces code-reading token usage by 95%+ and provides structural analysis (blast radius, importers, class hierarchy, dead code detection) that native tools cannot.

### Setup (run once per environment)
```bash
pip install jcodemunch-mcp
jcodemunch-mcp init
```

Or register with Claude Code manually:
```bash
claude mcp add -s user jcodemunch jcodemunch-mcp
```

### Mandatory usage rules
1. Use jcodemunch symbol lookup BEFORE opening any file.
2. Run `get_blast_radius` before modifying any shared function or type.
3. Run `find_importers` before renaming or deleting any export.
4. Run `get_class_hierarchy` before extending or replacing any class.
5. Run dead code detection before removing any module or symbol.
6. Never brute-force read full files when jcodemunch can retrieve exact symbols.

Source: https://github.com/jgravelle/jcodemunch-mcp

---

## Mandatory workflow
1. Install jcodemunch-mcp (above) before any code exploration.
2. Repo reconnaissance before code changes — use jcodemunch for symbol lookups, not raw file reads.
3. GSD loop: map-codebase → define-project → gather-requirements → create-roadmap → plan-phase → execute-phase → verify-work → ship.
4. Superpowers loop: brainstorm → design → bite-size plan → TDD (RED/GREEN/REFACTOR/VERIFY) → implementation → review.
5. gstack role reviews after each meaningful phase: Product, CEO, Engineering, Design, QA, Security, Release.

---

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

---

## Architecture principles
- Frontend must be secretless.
- Backend-only provider calls.
- Durable media jobs with IDs, status, logs, artifacts, provider route, and completion record.
- Character Passport required for consistent characters.
- FFmpeg wrapper is the baseline media engine.
- Provider routing supports local, Hugging Face, ComfyUI, fal.ai, Muapi, and stub.

---

## Security requirements
- No provider secrets in frontend or `NEXT_PUBLIC_*` except safe public URLs.
- Redact secrets in logs.
- Consent and rights checks for likeness/voice/content provenance.

---

## Completion protocol
At phase end, create `docs/completions/{YYYY-MM-DD}-{phase}-{task}.md` including summary, files changed, tests/checks, security scan, gaps, risks, and exact next task.
