# Codex Adapter

Codex should treat `.agents/` as the primary instruction source.

## Load Order

1. `.agents/CLAUDE.md` for project context
2. `.agents/rules/*.md` for coding and architecture constraints
3. `.agents/agents/*.md` for specialized role behavior
4. `.agents/commands/*.md` for command-style workflows
5. `.agents/skills/*/SKILL.md` for deep guidance

## Role Routing

Map user intent to role files in `.agents/agents/`:

- Implementation or bug fixes -> `developer.md`
- Schema/migration/query work -> `database.md`
- CI/CD/deployment/infra -> `devops.md`
- Design/architecture/refactor planning -> `architect.md`
- Security audit/threats -> `security-reviewer.md`
- Code review tasks -> `code-reviewer.md`
- Planning/roadmap/sprint -> `planner.md`
- Tests/TDD/coverage -> `tdd-guide.md`
- Gameplay mechanics/balance -> `game-designer.md`
