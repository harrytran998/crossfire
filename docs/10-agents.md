# Development Agents, Hooks, Commands & Skills

> Configuration guide for AI agents and development automation in the Crossfire project

---

## Overview

This document defines the AI agents, git hooks, commands, and skills configured in the `.claude/` folder for streamlined development workflow.

---

## 1. Project Agents

### 1.1 Primary Development Agent

```yaml
# .claude/agents/developer.md
---
name: developer
description: Primary coding agent for implementing features and fixing bugs
triggers:
  - "implement"
  - "fix"
  - "create"
  - "add"
  - "update"
skills:
  - effect
  - bun
  - kysely
  - typescript
  - database
constraints:
  - Never use `as any` or `@ts-ignore`
  - Always use Effect for error handling
  - Follow Clean Architecture module pattern
  - Use UUID v7 for primary keys
---

## Primary Responsibilities

1. **Feature Implementation**
   - Implement features following Clean Architecture
   - Create domain, application, infrastructure, presentation layers
   - Use Kysely for database queries
   - Follow Effect patterns for services

2. **Code Quality**
   - Run oxlint before committing
   - Ensure TypeScript strict mode compliance
   - Write unit tests for services

3. **Module Structure**
   Follow the module pattern:
```

modules/{module}/
├── domain/
├── application/
├── infrastructure/
└── presentation/

```

```

### 1.2 Database Agent

````yaml
# .claude/agents/database.md
---
name: database
description: Agent for database schema, migrations, and queries
triggers:
  - "migration"
  - "schema"
  - "database"
  - "sql"
  - "kysely"
skills:
  - database
  - kysely
  - postgresql
constraints:
  - Always use uuidv7() for primary keys
  - Use golang-migrate for migrations
  - Generate types with kysely-codegen
---

## Primary Responsibilities

1. **Schema Changes**
   - Create migration files with golang-migrate
   - Use PostgreSQL 18 features (UUID v7, etc.)
   - Update Kysely types after migrations

2. **Query Building**
   - Use Kysely for type-safe queries
   - Implement repository pattern
   - Use transactions for data integrity

3. **Commands**
   ```bash
   # Create migration
   migrate create -ext sql -dir packages/database/migrations -seq <name>

   # Apply migrations
   moon run database:migrate

   # Generate types
   moon run database:generate-types
````

````

### 1.3 DevOps Agent

```yaml
# .claude/agents/devops.md
---
name: devops
description: Agent for infrastructure, CI/CD, and deployment
triggers:
  - "deploy"
  - "ci"
  - "cd"
  - "infrastructure"
  - "docker"
skills:
  - docker
  - git-master
  - devops
constraints:
  - Always use moon ci for CI tasks
  - Docker compose for local development
  - Never commit secrets
---

## Primary Responsibilities

1. **CI/CD Management**
   - Configure GitHub Actions
   - Use `moon ci` for pipelines
   - Setup caching strategies

2. **Docker Management**
   - Maintain docker-compose.yml
   - PostgreSQL 18 + TimescaleDB + Redis
   - Development environment setup

3. **Commands**
   ```bash
   # Start local infrastructure
   docker compose up -d

   # Run CI locally
   moon ci

   # Check affected projects
   moon query affected
````

````

---

## 2. Git Hooks

### 2.1 Pre-commit Hook

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged (oxlint + oxfmt)
bun run lint-staged

# Type check changed files
moon run :typecheck --affected
````

### 2.2 Pre-push Hook

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run tests for affected projects
moon run :test --affected

# Check for security issues
bun audit
```

### 2.3 Commit-msg Hook

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no -- commitlint --edit "$1"
```

---

## 3. Commands Reference

### 3.1 Moonrepo Commands

| Command                     | Description                                   |
| --------------------------- | --------------------------------------------- |
| `moon setup`                | Initialize workspace and install dependencies |
| `moon run <project>:<task>` | Run task in project                           |
| `moon run :<task>`          | Run task in all projects                      |
| `moon ci`                   | Run all CI tasks                              |
| `moon check`                | Run build + test in project                   |
| `moon check --all`          | Run build + test in all projects              |
| `moon query affected`       | List changed projects                         |
| `moon sync`                 | Sync workspace configs                        |
| `moon tasks`                | List all tasks                                |
| `moon task-graph`           | View task dependency graph                    |

### 3.2 Database Commands

| Command                            | Description              |
| ---------------------------------- | ------------------------ |
| `moon run database:migrate`        | Apply pending migrations |
| `moon run database:rollback`       | Rollback last migration  |
| `moon run database:seed`           | Run seed scripts         |
| `moon run database:generate-types` | Generate Kysely types    |

### 3.3 Development Commands

| Command               | Description              |
| --------------------- | ------------------------ |
| `moon run server:dev` | Start development server |
| `moon run :lint`      | Lint all projects        |
| `moon run :format`    | Format all projects      |
| `moon run :typecheck` | Type check all projects  |
| `moon run :test`      | Run all tests            |
| `moon run :build`     | Build all projects       |

### 3.4 Docker Commands

| Command                  | Description          |
| ------------------------ | -------------------- |
| `docker compose up -d`   | Start infrastructure |
| `docker compose down`    | Stop infrastructure  |
| `docker compose logs -f` | View logs            |
| `docker compose ps`      | List services        |

---

## 4. Skills Reference

### 4.1 Built-in Skills

| Skill        | Description               | Tools                        |
| ------------ | ------------------------- | ---------------------------- |
| `effect`     | Effect framework patterns | Effect, Effect Schema, Layer |
| `bun`        | Bun runtime and ecosystem | Bun, TypeScript              |
| `database`   | PostgreSQL + Kysely       | Kysely, golang-migrate       |
| `docker`     | Containerization          | Docker, Docker Compose       |
| `git-master` | Version control           | Git, GitHub                  |
| `playwright` | Browser testing           | Playwright                   |
| `librarian`  | Documentation             | Research, writing            |

### 4.2 Project-Specific Skills

| Skill                | Description                  | Modules                                           |
| -------------------- | ---------------------------- | ------------------------------------------------- |
| `clean-architecture` | Modular Clean Architecture   | Domain, Application, Infrastructure, Presentation |
| `event-driven`       | Event-driven design patterns | Event Bus, Domain Events                          |
| `realtime-gaming`    | Real-time game development   | WebSocket, State Sync, Lag Compensation           |

---

## 5. Task Configuration

### 5.1 Global Tasks (.moon/tasks/all.yml)

```yaml
# Common tasks inherited by all projects
tasks:
  lint:
    command: 'oxlint'
    inputs: ['src/**/*', 'tests/**/*']
    options: { cache: true }

  format:
    command: 'oxfmt'
    inputs: ['src/**/*', 'tests/**/*']
    options: { cache: false }

  format:check:
    command: 'oxfmt --check'
    inputs: ['src/**/*', 'tests/**/*']

  typecheck:
    command: 'tsc --noEmit'
    inputs: ['src/**/*', 'tsconfig*.json']
    options: { cache: true }

  test:
    command: 'bun test'
    inputs: ['src/**/*', 'tests/**/*']
    deps: ['^:build']
    options: { cache: true, retryCount: 2 }

  build:
    command: 'bun build'
    inputs: ['src/**/*']
    outputs: ['dist/**/*']
    options: { cache: true }
```

### 5.2 Server Tasks (apps/server/moon.yml)

```yaml
tasks:
  build:
    command: 'bun build ./src/index.ts --outdir ./dist'
    outputs: ['dist/**/*']

  dev:
    command: 'bun run --hot src/index.ts'
    options: { cache: false, persistent: true }

  start:
    command: 'bun run dist/index.js'
    deps: ['build']

  test:
    command: 'bun test'
    inputs: ['src/**/*', 'tests/**/*']

  db:migrate:
    command: 'migrate -database $DATABASE_URL -path ../../packages/database/migrations up'

  db:seed:
    command: 'bun run scripts/seed.ts'
    deps: ['db:migrate']
```

### 5.3 Database Tasks (packages/database/moon.yml)

```yaml
tasks:
  migrate:
    command: 'migrate -database $DATABASE_URL -path migrations up'
    inputs: ['migrations/**/*.sql']

  rollback:
    command: 'migrate -database $DATABASE_URL -path migrations down 1'
    inputs: ['migrations/**/*.sql']

  create-migration:
    command: 'migrate create -ext sql -dir migrations -seq'
    options: { cache: false }

  seed:
    command: 'bun run scripts/seed.ts'
    deps: ['migrate']

  generate-types:
    command: 'kysely-codegen --out-file src/types.ts'
    deps: ['migrate']
    outputs: ['src/types.ts']
```

---

## 6. Workflow Examples

### 6.1 Adding a New Feature

```bash
# 1. Create migration for new table
moon run database:create-migration -- create_player_stats

# 2. Edit migration file
# packages/database/migrations/YYYYMMDDHHMMSS_create_player_stats.up.sql

# 3. Apply migration
moon run database:migrate

# 4. Generate Kysely types
moon run database:generate-types

# 5. Create module following Clean Architecture
# apps/server/src/modules/player-stats/

# 6. Run tests
moon run server:test

# 7. Commit changes
git add . && git commit -m "feat(player): add player stats tracking"
```

### 6.2 Running Full CI Pipeline

```bash
# Run all checks
moon ci

# Or run individually
moon run :lint
moon run :format:check
moon run :typecheck
moon run :test
moon run :build
```

### 6.3 Working with Affected Projects

```bash
# Check what's affected by current changes
moon query affected

# Run tests only on affected projects
moon run :test --affected

# Build affected projects
moon run :build --affected
```

---

## 7. Configuration Files Summary

| File                         | Purpose                  |
| ---------------------------- | ------------------------ |
| `.moon/workspace.yml`        | Workspace configuration  |
| `.moon/toolchains.yml`       | Bun/TypeScript toolchain |
| `.moon/tasks/all.yml`        | Global inherited tasks   |
| `apps/server/moon.yml`       | Server project tasks     |
| `packages/database/moon.yml` | Database project tasks   |
| `packages/shared/moon.yml`   | Shared package tasks     |
| `.husky/pre-commit`          | Pre-commit hooks         |
| `.husky/pre-push`            | Pre-push hooks           |
| `oxlint.config.ts`           | Oxlint configuration     |
| `.oxfmtrc.json`              | Oxfmt configuration      |

---

## 8. Environment Setup

### Required Tools

| Tool           | Version | Install                                     |
| -------------- | ------- | ------------------------------------------- | ----- |
| Bun            | 1.3.9+  | `curl -fsSL https://bun.sh/install          | bash` |
| Moonrepo       | Latest  | `curl -fsSL https://moonrepo.dev/install.sh | bash` |
| golang-migrate | 4.19+   | `brew install golang-migrate`               |
| Docker         | Latest  | Docker Desktop                              |

### Environment Variables (.env)

```bash
# Database
DATABASE_URL="postgres://postgres:password@localhost:5432/crossfire?sslmode=disable"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
HOST="localhost"
PORT="3000"
API_SECRET="your-secret-key"

# Better Auth
BETTER_AUTH_SECRET="your-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

---

_Document Version: 1.0_  
_Created: February 2026_  
_Related: EXECUTION_PLAN.md, TODO.md_
