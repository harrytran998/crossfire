# Crossfire AI Instructions (Codex Entrypoint)

Use `.agents/` as the canonical AI configuration for this repository.

## Required Context

- Project overview: `.agents/CLAUDE.md`
- Rules and conventions: `.agents/rules/*.md`
- Specialist roles: `.agents/agents/*.md`
- Command workflows: `.agents/commands/*.md`
- Skills: `.agents/skills/*/SKILL.md`
- Codex-specific loading notes: `.agents/adapters/codex/AGENTS.md`

## Operating Model

- Prefer the smallest relevant role set for each task.
- Follow TypeScript strictness and Clean Architecture constraints in `.agents/rules/`.
- Keep changes testable and consistent with existing conventions.
