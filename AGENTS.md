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
