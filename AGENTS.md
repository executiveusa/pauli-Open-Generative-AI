# AGENTS.md — More-of-Less Build Agent Instructions

Before modifying this repo, read `.skills/more-of-less-studio-builder/SKILL.md` and follow it exactly.

## Mandatory MCP Tool: jcodemunch-mcp

Every agent working on this repo MUST install and use **jcodemunch-mcp** for all codebase exploration.

**Why:** jcodemunch-mcp uses tree-sitter AST indexing to retrieve exact symbols (functions, classes, methods) at byte-level precision — cutting code-reading token usage by 95%+ compared to brute-force file reads. It also provides structural queries (`find_importers`, `get_blast_radius`, `get_class_hierarchy`, dead code detection, impact analysis) that native tools cannot.

**Install before starting any task:**
```bash
pip install jcodemunch-mcp
jcodemunch-mcp init
```

Or register manually with Claude Code:
```bash
claude mcp add -s user jcodemunch jcodemunch-mcp
```

**Mandatory usage rules:**
1. Before reading any file, use jcodemunch symbol lookup first.
2. Use `get_blast_radius` before modifying any shared function or type.
3. Use `find_importers` before renaming or removing any export.
4. Use `get_class_hierarchy` when extending or replacing any class.
5. Use dead code detection before deleting anything.
6. Never open full files when jcodemunch can retrieve the exact symbol needed.

**Configuration:** `~/.code-index/config.jsonc`

**Supported transports:** stdio, HTTP. Works with Claude Code, Cursor, Windsurf, Continue, Cline, and all MCP-compatible platforms.

**License note:** Free for personal/non-commercial use. Commercial use requires a paid license ($79–$1,999). See https://github.com/jgravelle/jcodemunch-mcp for license details.

---

## Quick reference

| Requirement | Where defined |
|---|---|
| Full build workflow | `.skills/more-of-less-studio-builder/SKILL.md` |
| Planning state | `.planning/STATE.md` |
| Roadmap | `.planning/ROADMAP.md` |
| Agent worklog | `docs/agent-worklog.md` |
| Security audit | `docs/security-secrets-audit.md` |
| Repo inventory | `docs/repo-inventory.md` |
| Phase completions | `docs/completions/` |

## Code Exploration Policy

Always use jCodemunch-MCP tools for code navigation. Never fall back to Read, Grep, Glob, or Bash for code exploration.
**Exception:** Use `Read` when you need to edit a file — the agent harness requires a `Read` before `Edit`/`Write` will succeed. Use jCodemunch tools to *find and understand* code, then `Read` only the specific file you're about to modify.

**Start any session:**
1. `resolve_repo { "path": "." }` — confirm the project is indexed. If not: `index_folder { "path": "." }`
2. `suggest_queries` — when the repo is unfamiliar

**Finding code:**
- symbol by name → `search_symbols` (add `kind=`, `language=`, `file_pattern=`, `decorator=` to narrow)
- decorator-aware queries → `search_symbols(decorator="X")` to find symbols with a specific decorator (e.g. `@property`, `@route`); combine with set-difference to find symbols *lacking* a decorator (e.g. "which endpoints lack CSRF protection?")
- string, comment, config value → `search_text` (supports regex, `context_lines`)
- database columns (dbt/SQLMesh) → `search_columns`

**Reading code:**
- before opening any file → `get_file_outline` first
- one or more symbols → `get_symbol_source` (single ID → flat object; array → batch)
- symbol + its imports → `get_context_bundle`
- specific line range only → `get_file_content` (last resort)

**Repo structure:**
- `get_repo_outline` → dirs, languages, symbol counts
- `get_file_tree` → file layout, filter with `path_prefix`

**Relationships & impact:**
- what imports this file → `find_importers`
- where is this name used → `find_references`
- is this identifier used anywhere → `check_references`
- file dependency graph → `get_dependency_graph`
- what breaks if I change X → `get_blast_radius`
- what symbols actually changed since last commit → `get_changed_symbols`
- find unreachable/dead code → `find_dead_code`
- class hierarchy → `get_class_hierarchy`

## Session-Aware Routing

**Opening move for any task:**
1. `plan_turn { "repo": "...", "query": "your task description", "model": "<your-model-id>" }` — get confidence + recommended files; the `model` parameter narrows the exposed tool list to match your capabilities at zero extra requests.
2. Obey the confidence level:
   - `high` → go directly to recommended symbols, max 2 supplementary reads
   - `medium` → explore recommended files, max 5 supplementary reads
   - `low` → the feature likely doesn't exist. Report the gap to the user. Do NOT search further hoping to find it.

**Interpreting search results:**
- If `search_symbols` returns `negative_evidence` with `verdict: "no_implementation_found"`:
  - Do NOT re-search with different terms hoping to find it
  - Do NOT assume a related file (e.g. auth middleware) implements the missing feature (e.g. CSRF)
  - DO report: "No existing implementation found for X. This would need to be created."
  - DO check `related_existing` files — they show what's nearby, not what exists
- If `verdict: "low_confidence_matches"`: examine the matches critically before assuming they implement the feature

**After editing files:**
- If PostToolUse hooks are installed (Claude Code only), edited files are auto-reindexed
- Otherwise, call `register_edit` with edited file paths to invalidate caches and keep the index fresh
- For bulk edits (5+ files), always use `register_edit` with all paths to batch-invalidate

**Token efficiency:**
- If `_meta` contains `budget_warning`: stop exploring and work with what you have
- If `auto_compacted: true` appears: results were automatically compressed due to turn budget
- Use `get_session_context` to check what you've already read — avoid re-reading the same files

## Model-Driven Tool Tiering

Your jcodemunch-mcp server narrows the exposed tool list based on the model you are running as. To avoid wasting requests on primitives when a composite would do, always include `model="<your-model-id>"` in your opening `plan_turn` call.

Replace `<your-model-id>` with your active model:
- Claude Opus variants → `claude-opus-4-7` (or any `claude-opus-*`)
- Claude Sonnet variants → `claude-sonnet-4-6`
- Claude Haiku variants → `claude-haiku-4-5`
- GPT-4o / GPT-5 / o1 / Llama → use the model id as printed by your runner

The `model=` parameter rides on the existing `plan_turn` call — it does **not** add a separate tool invocation. If `plan_turn` is not appropriate for a non-code task, call `announce_model(model="...")` once instead.

