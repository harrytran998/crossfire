# Multi-Tool Adapter Notes

This folder explains how to consume `.agents/` from different AI coding tools.

## GPT Codex

- Entrypoint: `AGENTS.md` at repository root
- Detailed mapping: `.agents/adapters/codex/AGENTS.md`

## Claude Code

- Native config remains in `.claude/`
- Canonical shared config is mirrored in `.agents/`

## Cursor

- Add links/imports in Cursor rules that point to `.agents/rules/` and `.agents/agents/`
- Use `.agents/commands/` as reusable slash-command prompt sources

## Cline / Roo Code

- Treat `.agents/README.md` as index
- Load role from `.agents/agents/`, then append `.agents/rules/*.md`

## Aider / Continue / Windsurf

- Use `AGENTS.md` as startup instruction
- Pull task-specific guidance from `.agents/commands/` and `.agents/skills/`
