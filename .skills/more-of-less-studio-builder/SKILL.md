# Skill: more-of-less-studio-builder

## Purpose
Standard operating workflow for building More-of-Less — a production-grade, modular, test-driven AI audio/video media studio for non-technical creators.

---

## MANDATORY TOOL: jcodemunch-mcp
**Install before any codebase work.**
```bash
pip install jcodemunch-mcp && jcodemunch-mcp init
# OR
claude mcp add -s user jcodemunch jcodemunch-mcp
```
Source: https://github.com/jgravelle/jcodemunch-mcp

Rules:
1. Use jcodemunch symbol lookup BEFORE opening any file.
2. Run `get_blast_radius` before modifying any shared function or type.
3. Run `find_importers` before renaming/deleting any export.
4. Run `get_class_hierarchy` before extending any class.
5. Run dead code detection before removing any module.
6. Never brute-force read full files when jcodemunch can retrieve the symbol.

---

## TOKEN EFFICIENCY: mcp2cli + Uncodixfy

### mcp2cli (96-99% token reduction on tool schemas)
Source: https://github.com/knowsuchagency/mcp2cli
```bash
uvx mcp2cli --help
# or: npx skills add knowsuchagency/mcp2cli --skill mcp2cli
```
Converts MCP servers and OpenAPI specs to CLI commands at runtime — zero codegen. Eliminates repeated tool schema overhead every turn.

### Uncodixfy (UI quality constraint)
Source: https://github.com/executiveusa/pauli-Uncodixfy
- Include `uncodixify.md` in any UI prompt to block generic LLM patterns
- Prevents: floating cards, oversized rounded corners, gradient-heavy dashboards, decorative labels, glass panels
- Install: `npx skills add cyxzdev/Uncodixfy` → invoke with `/uncodixfy`

---

## PRIMARY LOOP: Ralphy Autonomous Loop
Source: https://github.com/michaelshimeles/ralphy

Execute all phases via the Ralphy loop:
```bash
ralphy --init        # auto-detect project settings → .ralphy/config.yaml
ralphy               # processes PRD.md sequentially
ralphy --prd tasks.md
```

Principles:
- Each agent gets isolated worktree + branch
- Break large tasks into micro-tasks (2-5 min each)
- Quality over speed; remove dead code continuously
- Parallel groups for independent tasks, sequential for dependent

---

## PLANNING LOOP: GSD (Get Shit Done)
Source: https://github.com/gsd-build/get-shit-done — MANDATORY

Six-step loop:
1. `/gsd-new-project` — questionnaire-driven discovery, requirements, roadmap
2. `/gsd-discuss-phase` — capture implementation decisions before planning
3. `/gsd-plan-phase` — research-plan-verify cycles, plans sized for fresh context
4. `/gsd-execute-phase` — parallel wave execution with subagents, atomic commits
5. `/gsd-verify-work` — manual acceptance + automated failure diagnosis
6. `/gsd-ship` → `/gsd-new-milestone` — deploy and cycle

Artifacts (always maintain):
- `.planning/PROJECT.md` — Vision
- `.planning/REQUIREMENTS.md` — Scope
- `.planning/ROADMAP.md` — Phase structure
- `.planning/STATE.md` — Current position
- `.planning/CONTEXT.md` — Phase-specific details
- `.planning/config.json` — Tool/mode config
- `docs/agent-worklog.md`
- `docs/repo-inventory.md`
- `docs/architecture-decisions.md`
- `docs/security-secrets-audit.md`
- `docs/model-provider-matrix.md`
- `docs/completions/{YYYY-MM-DD}-{phase}-{task}.md`

---

## IMPLEMENTATION LOOP: Superpowers TDD
Source: https://github.com/executiveusa/paulsuperpowers

Seven-stage cycle (per feature/phase):
1. Brainstorm — Socratic refinement, explore alternatives before code
2. Git Worktree Setup — isolated branch, verified test baseline
3. Plan Creation — bite-sized tasks (2-5 min), specific file paths, code samples, verify steps
4. Subagent-Driven Dev — fresh agent per task, two-stage review (spec compliance → quality)
5. TDD — RED (failing test) → GREEN (minimal pass) → REFACTOR → VERIFY
6. Code Review — review against plan, identify blockers
7. Branch Completion — tests pass, merge/PR/discard

---

## ENGINEERING SKILL SUITE: Matt Pocock Skills
Source: https://github.com/mattpocock/skills

Use these slash-commands in this build:
| Command | When to use |
|---|---|
| `/diagnose` | Structured debug: reproduce→minimize→hypothesize→instrument→fix→test |
| `/grill-with-docs` | Pre-dev interview validating plans against domain model, updating CONTEXT.md |
| `/tdd` | Red-green-refactor for every logic-heavy module |
| `/triage` | Process issues through triage state machine |
| `/improve-codebase-architecture` | After each phase — identify refactor opportunities |
| `/to-issues` | Convert plans to independently-grabbable GitHub issues |
| `/zoom-out` | Get broader system context before touching unfamiliar code |
| `/caveman` | Ultra-compressed comms — 75% token reduction |
| `/handoff` | Compact conversation into handoff doc for next agent |

---

## E2E TEST SKILL
Source: https://github.com/coleam00/link-in-bio-page-builder/.claude/skills/e2e-test/SKILL.md

Six-phase e2e protocol (run after every major phase):
1. **Parallel Research** — 3 subagents: app structure/journeys, DB schema/flows, codebase bugs
2. **App Startup** — launch dev server in background, screenshot confirms load
3. **Task Creation** — one task per user journey + responsive viewport tests
4. **Journey Testing** — browser interactions via Vercel Agent Browser CLI, screenshots each step, DB validation, fix-on-discover
5. **Cleanup** — stop server + browser session
6. **Reporting** — stats on journeys tested, screenshots, issues found/fixed

Constraints: Linux/WSL/macOS only. Frontend must be browser-accessible.

---

## DESIGN SYSTEM: Taste-Skill (Cinematic Components)
Source: git@github.com:executiveusa/pauli-taste-skill.git

### Parameters (this project)
- `DESIGN_VARIANCE: 8` — Asymmetric, artsy layouts with intentional white-space
- `MOTION_INTENSITY: 7` — Framer Motion spring physics + scroll-triggered choreography
- `VISUAL_DENSITY: 4` — Balanced breathing room, not data-heavy

### Mandatory rules
- Stack: React/Next.js with Server Components; interactive = client leaf components
- Styling: Tailwind CSS only (v3/v4 syntax strict); NEVER `h-screen` — use `min-h-[100dvh]`
- Typography: `text-4xl md:text-6xl tracking-tighter` for displays; NEVER Inter/Roboto/Arial — use Geist, Outfit, Cabinet Grotesk, or Satoshi
- Colors: Max one accent color, saturation < 80%; BANNED: AI Purple/Blue; use Zinc/Slate bases
- Layout: Centered Hero/H1 BANNED — use split-screen, left-aligned, asymmetric
- Animations: `useMotionValue` + `useTransform` only for continuous; never `useState` for animation
- Spring physics: `stiffness: 100, damping: 20` for Bento motion
- Animate only `transform` and `opacity` — never `top/left/width/height`

### Soft-Skill premium layer (for premium sections)
- Persona: Vanguard_UI_Architect — $150k+ agency-level experiences
- Vibe archetypes: Ethereal Glass | Editorial Luxury | Soft Structuralism
- Layout archetypes: Asymmetrical Bento | Z-Axis Cascade | Editorial Split
- Double-Bezel (Doppelrand): nested container depth — outer shell + inner core
- Motion: custom cubic-beziers simulating real-world mass/spring; staggered mask reveals

### Forbidden patterns (from Uncodixfy)
Neon outer glows, pure `#000000`, oversaturated accents, gradient text fills, custom cursors,
serif fonts on dashboards, generic 3-col card grids, Inter font, edge-to-edge sticky navbars,
linear/ease-in-out transitions without physics

### Creative arsenal
Bento grids, masonry layouts, parallax tilt cards, spotlight borders, glassmorphism panels,
sticky scroll stacks, horizontal scroll hijacking, dome galleries, kinetic marquees,
particle explosions, mesh gradient backgrounds, magnetic micro-physics

---

## ARCHITECTURE PRINCIPLES

### Secretless frontend (non-negotiable)
- NO provider secrets in browser code or `NEXT_PUBLIC_*` (except safe public URLs)
- NO: FAL_KEY, HF_TOKEN, MUAPI_KEY, OPENAI_API_KEY, signing secrets in client bundle
- ALL model calls go through `apps/api`, `apps/agent`, `apps/workers`

### Backend is source of truth
Browser → Our backend only. Never browser → Muapi/fal/HF directly.

### Durable jobs
Every heavy media operation = job with: ID, project ID, input JSON, status, logs, artifacts, provider route, cost estimate, errors, completion record.

### No duplication without audit
Before creating any file/function/component: search repo → reuse or extend → record decision in `docs/agent-worklog.md`.

### Character Passport
Required for consistent characters across scenes. Inject into every scene prompt. Must include prompt anchor, trigger words, LoRA config, seed policy, continuity rules, consent status.

### FFmpeg wrapper baseline
FFmpeg = mandatory audio/video engine. All commands via argument arrays (no shell strings). Log with secrets redacted. Return structured errors. Write to job artifact folder.

### Provider routing order
1. local worker (if model installed + hardware)
2. Hugging Face (free/API)
3. ComfyUI (if graph exists + server healthy)
4. fal.ai (if premium enabled + budget)
5. Muapi/Open-Generative-AI (if configured)
6. stub/mock (tests/local UI)

---

## SECURITY REQUIREMENTS
- Backend-only secrets; redact in logs
- Consent + rights checks for voice/likeness/content provenance
- Project-scoped media access; signed/backend-mediated artifact downloads
- Admin-only provider test endpoint
- Secret scan before every commit:
```bash
rg -n "(sk-|hf_|fal_|MUAPI|FAL|HUGGINGFACE|OPENAI|API_KEY|SECRET|TOKEN)" . \
  --glob '!node_modules' --glob '!*.lock' --glob '!storage'
```

---

## COMPLETION PROTOCOL
After every phase, create:
```
docs/completions/{YYYY-MM-DD}-{phase}-{task}.md
```
Must include: summary, files changed, tests run + results, build result, security scan, screenshots/artifacts, known gaps, risks, exact next task.

Do NOT claim a phase complete without running commands and recording results.

---

## PHASE CHECKLIST
- [x] Phase 1: Repo hardening + mandatory workflow files
- [ ] Phase 2: Shared schemas + state machine + router + prompt builder + tests
- [ ] Phase 3: Backend API skeleton
- [ ] Phase 4: Frontend backend adapter (secretless)
- [ ] Phase 5: FFmpeg media worker
- [ ] Phase 6: Character Passport system
- [ ] Phase 7: Music-video prompt creator (Phase A)
- [ ] Phase 8: LTX/Comfy stub adapters
- [ ] Phase 9: Final stitch + remake flow
- [ ] Phase 10: Provider integrations (HF/fal/Muapi)
- [ ] Phase 11: White-label polish + Vercel deploy
