---
description: Create a detailed implementation plan for a feature or task
argument-hint: "[feature-name]"
---

# Plan Command

## Usage

```
claude plan [feature-name]
```

Creates a structured implementation plan with task breakdown, dependencies, and timelines.

## Steps

1. **Analyze Feature Request** - Parse feature description and acceptance criteria
2. **Identify Dependencies** - Map external dependencies and blocked tasks
3. **Break Down Tasks** - Create atomic, implementable tasks with clear acceptance criteria
4. **Estimate Scope** - Evaluate complexity and estimate effort
5. **Create Timeline** - Propose milestones and sprint allocation
6. **Document Architecture** - Note any structural changes needed
7. **Generate Plan** - Output structured plan in Markdown with:
   - Feature overview
   - Task breakdown (with dependencies)
   - Architecture notes
   - Risk assessment
   - Testing strategy
   - Deployment considerations

## Options

- `--include-design` - Include design system changes in plan
- `--include-migration` - Include database migration planning
- `--include-performance` - Include performance optimization considerations
- `--epic` - Create epic-level plan spanning multiple features

## Examples

```bash
# Plan a new API endpoint
claude plan "Add user authentication endpoints"

# Plan with database migration
claude plan "Implement user roles system" --include-migration

# Create epic-level plan
claude plan "Multi-tenant support" --epic
```

## Tech Stack Considerations

- **TypeScript** - Type-driven design
- **Effect** - Error handling and composition strategy
- **Kysely** - Database schema changes
- **PostgreSQL** - Migration safety
- **Moonrepo** - Monorepo task coordination
