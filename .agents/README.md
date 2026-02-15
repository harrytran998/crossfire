# .agents - Multi AI Agent Workspace

This folder is the canonical, tool-agnostic AI workspace for this repository.

## Source Mapping

Initial source was mirrored from `.claude/` to keep existing knowledge unchanged.

| Source (`.claude`) | Canonical (`.agents`) |
| --- | --- |
| `agents/` | `agents/` |
| `commands/` | `commands/` |
| `rules/` | `rules/` |
| `skills/` | `skills/` |
| `hooks/` | `hooks/` |
| `mcp/` | `mcp/` |
| `settings.json` | `settings.json` |
| `CLAUDE.md` | `CLAUDE.md` |

Compatibility aliases are included:

- `personas -> agents`
- `prompts -> commands`
- `policies -> rules`
- `capabilities -> skills`

## Tool Adapters

- GPT Codex: use root `AGENTS.md` (entrypoint) and `.agents/adapters/codex/AGENTS.md`
- Claude Code: can continue using `.claude/` or switch to `.agents/`
- Other tools (Cursor/Cline/Aider/Windsurf): load prompts, rules, and roles from `.agents/`

## Maintenance

When changing AI guidance, update `.agents/` first.
If needed, sync back to `.claude/` for legacy compatibility.
