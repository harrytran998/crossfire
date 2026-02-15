# Crossfire Web Game - Detailed Execution Plan

> **API + Database First** implementation strategy with Bun + Effect + Better Auth + PostgreSQL 18 + Kysely

---

## 📊 Progress Tracker

**Total: 10/42 tasks completed**

### Phase 0: Foundation & Infrastructure (10/10) ✅

- [x] `P0-W1-T01` Create Monorepo Structure ✅
- [x] `P0-W1-T02` Docker Compose Infrastructure ✅
- [x] `P0-W1-T03` TypeScript Configuration ✅
- [x] `P0-W1-T04` Code Quality Tooling (oxlint + oxfmt) ✅
- [x] `P0-W1-T05` Environment Configuration System ✅
- [x] `P0-W1-T06` CI/CD Pipeline ✅
- [x] `P0-W2-T07` Kysely Schema Implementation ✅
- [x] `P0-W2-T08` Database Migration System (golang-migrate) ✅
- [x] `P0-W2-T09` Shared Package - Types & Utilities ✅
- [x] `P0-W2-T10` Effect Platform Setup ✅

### Phase 1: Authentication & Core Backend (0/8)

- [ ] `P1-W3-T11` Better Auth Setup
- [ ] `P1-W3-T12` Auth REST API Endpoints
- [ ] `P1-W3-T13` Player Service Layer
- [ ] `P1-W3-T14` Player Stats & Progression Service
- [ ] `P1-W3-T15` Player REST API Endpoints
- [ ] `P1-W4-T16` Weapons & Attachments Service
- [ ] `P1-W4-T17` Maps Service
- [ ] `P1-W4-T18` Static Data REST API

### Phase 2: Core API Development (0/9)

- [ ] `P2-W5-T19` Inventory Service
- [ ] `P2-W5-T20` Loadout Service
- [ ] `P2-W5-T21` Inventory & Loadout REST API
- [ ] `P2-W6-T22` Match Service
- [ ] `P2-W6-T23` Match History REST API
- [ ] `P2-W7-T24` Leaderboard Service
- [ ] `P2-W7-T25` Leaderboard REST API
- [ ] `P2-W8-T26` Friends Service
- [ ] `P2-W8-T27` Friends REST API

### Phase 3: Real-time & WebSocket (0/6)

- [ ] `P3-W9-T28` Bun WebSocket Server Setup
- [ ] `P3-W9-T29` Message Protocol Implementation
- [ ] `P3-W10-T30` Room Service
- [ ] `P3-W10-T31` Room WebSocket Handlers
- [ ] `P3-W11-T32` Matchmaking Service
- [ ] `P3-W11-T33` Matchmaking REST API

### Phase 4: Game Logic API (0/4)

- [ ] `P4-W12-T34` Achievement Service
- [ ] `P4-W12-T35` Achievement REST API
- [ ] `P4-W13-T36` Telemetry Service (TimescaleDB)
- [ ] `P4-W13-T37` Admin REST API

### Phase 5: Frontend Foundation (0/6)

- [ ] `P5-W14-T38` Vite + React Setup
- [ ] `P5-W14-T39` UI Component Library
- [ ] `P5-W14-T40` Authentication UI
- [ ] `P5-W15-T41` Three.js Integration
- [ ] `P5-W15-T42` WebSocket Client

---

## Executive Summary

This execution plan provides a step-by-step roadmap for building the Crossfire Web Game, starting with **Database + API** as requested. The plan is organized into phases and waves to maximize parallel execution where possible.

**Total Estimated Time**: 12-14 weeks (Phase 1 only)  
**Team Size**: 2-3 developers  
**Primary Focus**: Backend API infrastructure before Frontend

---

## 🏗️ Architecture Design: Clean + Modular + Event-Driven

### Core Principles

| Principle              | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Clean Architecture** | Separation of concerns with Domain → Application → Infrastructure → Presentation |
| **Modular Design**     | Self-contained modules with clear boundaries, each owns its data and logic       |
| **Event-Driven**       | Async communication via events for loose coupling and unlimited scalability      |
| **Effect Platform**    | Functional, type-safe services with built-in error handling and concurrency      |

### Technology Stack

| Layer             | Technology       | Purpose                                           |
| ----------------- | ---------------- | ------------------------------------------------- |
| **Runtime**       | Bun              | Ultra-fast JS runtime with native WebSocket       |
| **Framework**     | Effect           | Functional programming, typed errors, concurrency |
| **Query Builder** | Kysely           | Type-safe SQL query builder for PostgreSQL        |
| **Migrations**    | golang-migrate   | Database migration management (CLI)               |
| **Database**      | PostgreSQL 18.2  | Persistent data with UUID v7, advanced search     |
| **Time-series**   | TimescaleDB 2.25 | Analytics and telemetry data                      |
| **Cache**         | Redis 8.x        | Real-time state, sessions                         |
| **Monorepo**      | Moonrepo         | Task runner and monorepo management               |
| **Linting**       | oxlint 1.47.x    | Fast Rust-based linter (ESLint compatible)        |
| **Formatting**    | oxfmt 0.32.x     | Fast Rust-based formatter (Prettier compatible)   |
| **Auth**          | Better Auth      | Authentication with PostgreSQL adapter            |

### Module Structure

Each module follows Clean Architecture with 4 layers:

```
apps/server/src/modules/{module}/
├── domain/                    # Core business logic (no dependencies)
│   ├── entities/              # Domain entities and value objects
│   ├── repositories/          # Repository interfaces (contracts)
│   ├── services/              # Domain services
│   ├── events/                # Domain events
│   └── errors/                # Domain-specific errors
│
├── application/               # Use cases and orchestration
│   ├── usecases/              # Application use cases
│   ├── commands/              # Command handlers (CQRS)
│   ├── queries/               # Query handlers (CQRS)
│   ├── dto/                   # Data transfer objects
│   └── mappers/               # Entity-DTO mappers
│
├── infrastructure/            # External implementations
│   ├── repositories/          # Kysely repository implementations
│   ├── adapters/              # External service adapters
│   ├── persistence/           # Database models and mappings
│   └── event-publishers/      # Event publishing logic
│
└── presentation/              # External interfaces
    ├── http/                  # REST controllers and routes
    ├── websocket/             # WebSocket handlers
    └── grpc/                  # gRPC service definitions (future)
```

### Complete Module List

| Module           | Purpose                        | Events Published                                           | Events Consumed                       |
| ---------------- | ------------------------------ | ---------------------------------------------------------- | ------------------------------------- |
| **auth**         | Authentication & authorization | `UserRegistered`, `UserLoggedIn`, `SessionExpired`         | -                                     |
| **player**       | Player profiles & stats        | `PlayerCreated`, `ProfileUpdated`, `LevelUp`               | `UserRegistered`, `MatchEnded`        |
| **inventory**    | Weapon ownership               | `WeaponAcquired`, `WeaponExpired`, `LoadoutChanged`        | `PlayerCreated`, `LevelUp`            |
| **match**        | Match history & results        | `MatchStarted`, `MatchEnded`, `PlayerKill`, `PlayerDeath`  | `RoomGameStarted`                     |
| **room**         | Game rooms & participants      | `RoomCreated`, `PlayerJoined`, `PlayerLeft`, `GameStarted` | `PlayerReady`                         |
| **matchmaking**  | Queue & matching               | `QueueJoined`, `QueueLeft`, `MatchFound`                   | -                                     |
| **leaderboard**  | Rankings & leaderboards        | `RankUpdated`, `LeaderboardRefreshed`                      | `MatchEnded`, `PlayerKill`            |
| **friend**       | Friends & social               | `FriendRequestSent`, `FriendAdded`, `FriendRemoved`        | -                                     |
| **achievement**  | Achievements & unlocks         | `AchievementUnlocked`, `ProgressUpdated`                   | `PlayerKill`, `MatchEnded`, `LevelUp` |
| **telemetry**    | Analytics & metrics            | `MatchEvent`, `PlayerTelemetry`, `ServerMetrics`           | All game events                       |
| **notification** | User notifications             | `NotificationSent`                                         | All domain events                     |

### Project Directory Structure

```
crossfire/
├── apps/
│   ├── server/                          # Bun + Effect Backend
│   │   ├── src/
│   │   │   ├── modules/                  # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── player/
│   │   │   │   ├── match/
│   │   │   │   ├── room/
│   │   │   │   ├── inventory/
│   │   │   │   ├── matchmaking/
│   │   │   │   ├── leaderboard/
│   │   │   │   ├── friend/
│   │   │   │   ├── achievement/
│   │   │   │   ├── telemetry/
│   │   │   │   └── notification/
│   │   │   │
│   │   │   ├── core/                     # Shared infrastructure
│   │   │   │   ├── events/
│   │   │   │   ├── database/
│   │   │   │   ├── cache/
│   │   │   │   └── config/
│   │   │   │
│   │   │   ├── http/
│   │   │   ├── websocket/
│   │   │   └── index.ts
│   │   │
│   │   └── tests/
│   │
│   └── web/                               # React Frontend (Phase 5)
│
├── packages/
│   ├── shared/                            # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   └── package.json
│   │
│   ├── database/                          # Kysely + Migrations
│   │   ├── src/
│   │   │   ├── client.ts                  # Kysely client factory
│   │   │   ├── types.ts                   # Generated DB types
│   │   │   └── seeds/
│   │   ├── migrations/                    # golang-migrate SQL files
│   │   │   ├── 000001_create_users.up.sql
│   │   │   ├── 000001_create_users.down.sql
│   │   │   └── ...
│   │   ├── scripts/
│   │   │   ├── migrate.sh
│   │   │   ├── generate-types.ts
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── tsconfig/                          # Shared TypeScript configs
│
├── docker/
│   ├── postgres/
│   │   └── init/
│   │       ├── 01-extensions.sql
│   │       └── 02-timescaledb.sql
│   └── redis/
│       └── redis.conf
│
├── docs/
├── .moon/
│   ├── workspace.yml
│   ├── toolchains.yml
│   └── tasks/
│       └── all.yml
├── EXECUTION_PLAN.md
├── TODO.md
├── docker-compose.yml
├── oxlint.config.ts
├── .oxfmtrc.json
└── package.json
```

---

## Phase Overview

| Phase       | Focus                       | Duration  | Parallel Tasks   |
| ----------- | --------------------------- | --------- | ---------------- |
| **Phase 0** | Foundation & Infrastructure | 1-2 weeks | 6 parallel tasks |
| **Phase 1** | Database & Authentication   | 2-3 weeks | 5 parallel tasks |
| **Phase 2** | Core API Development        | 3-4 weeks | 6 parallel tasks |
| **Phase 3** | Real-time & WebSocket       | 2-3 weeks | 4 parallel tasks |
| **Phase 4** | Game Logic API              | 2 weeks   | 3 parallel tasks |
| **Phase 5** | Frontend Foundation (Later) | 3-4 weeks | 4 parallel tasks |

---

# PHASE 0: Foundation & Infrastructure

**Duration**: 1-2 weeks  
**Goal**: Setup development environment, project structure, and tooling  
**Parallel Opportunities**: 6 tasks can run simultaneously in Wave 1

---

## Wave 1: Project Setup (Week 1)

**All tasks in this wave can run in PARALLEL**

### T01: Create Monorepo Structure

```yaml
Task ID: P0-W1-T01
Category: devops
Skills: git-master, bun
Dependencies: None
Duration: 2-3 hours
Priority: P0

Description: |
  Initialize Moonrepo monorepo with Bun workspaces structure.

Files to Create:
  - package.json (root)
  - .moon/workspace.yml
  - .moon/toolchains.yml
  - .moon/tasks/all.yml
  - .gitignore
  - README.md
  - apps/server/package.json
  - apps/server/moon.yml
  - apps/web/package.json (placeholder)
  - packages/shared/package.json
  - packages/shared/moon.yml
  - packages/database/package.json
  - packages/database/moon.yml

Moonrepo Configuration:
  # .moon/workspace.yml
  projects:
    - "apps/*"
    - "packages/*"

  # .moon/toolchains.yml
  bun:
    version: "1.3.9"
    syncProjectWorkspaceDependencies: true

Acceptance Criteria:
  - [ ] bun install works
  - [ ] moon setup runs successfully
  - [ ] moon run :build works
  - [ ] Git repository initialized
```

### T02: Docker Compose Infrastructure

```yaml
Task ID: P0-W1-T02
Category: devops
Skills: docker
Dependencies: None
Duration: 3-4 hours
Priority: P0

Description: |
  Setup Docker Compose with PostgreSQL 18, TimescaleDB, Redis.

Services:
  - PostgreSQL 18 (with UUID v7 support)
  - TimescaleDB extension
  - Redis 7

Files to Create:
  - docker-compose.yml
  - docker-compose.dev.yml
  - .env.example
  - docker/postgres/init/01-extensions.sql
  - docker/postgres/init/02-timescaledb.sql

PostgreSQL 18 Features:
  - uuidv7() function for time-ordered UUIDs
  - Async I/O for better performance
  - Improved btree index performance

Acceptance Criteria:
  - [ ] docker-compose up starts all services
  - [ ] PostgreSQL 18 accessible on port 5432
  - [ ] Redis accessible on port 6379
  - [ ] SELECT uuidv7() works
```

### T03: TypeScript Configuration

```yaml
Task ID: P0-W1-T03
Category: devops
Skills: bun
Dependencies: None
Duration: 2 hours
Priority: P0

Description: |
  Configure TypeScript with strict mode across all packages.

Files to Create:
  - tsconfig.json (root)
  - packages/tsconfig/base.json
  - packages/tsconfig/node.json
  - packages/tsconfig/browser.json
  - apps/server/tsconfig.json
  - packages/shared/tsconfig.json
  - packages/database/tsconfig.json

Acceptance Criteria:
  - [ ] Strict mode enabled
  - [ ] Path aliases configured (@crossfire/*)
  - [ ] Type checking passes
```

### T04: Code Quality Tooling (oxlint + oxfmt)

```yaml
Task ID: P0-W1-T04
Category: quick
Skills: bun
Dependencies: None
Duration: 2 hours
Priority: P0

Description: |
  Setup oxlint and oxfmt for fast linting and formatting.
  These Rust-based tools are 10-100x faster than ESLint/Prettier.

Files to Create:
  - oxlint.config.ts              # Oxlint TypeScript config
  - .oxfmtrc.json                 # Oxfmt configuration
  - .oxlintignore
  - .lintstagedrc
  - .husky/pre-commit

Package.json Scripts:
  {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt",
    "format:check": "oxfmt --check"
  }

Acceptance Criteria:
  - [ ] oxlint runs without errors
  - [ ] oxfmt formats code
  - [ ] Pre-commit hooks work
  - [ ] VS Code extension compatible
```

### T05: Environment Configuration System

```yaml
Task ID: P0-W1-T05
Category: ultrabrain
Skills: effect
Dependencies: None
Duration: 4-5 hours
Priority: P0

Description: |
  Create type-safe environment configuration using Effect Config.

Files to Create:
  - packages/shared/src/config/index.ts
  - packages/shared/src/config/server.config.ts
  - packages/shared/src/config/database.config.ts
  - packages/shared/src/config/redis.config.ts
  - .env.example

Acceptance Criteria:
  - [ ] All config values typed
  - [ ] Validation with Effect Schema
  - [ ] Secrets properly redacted
```

### T06: CI/CD Pipeline

```yaml
Task ID: P0-W1-T06
Category: devops
Skills: git-master
Dependencies: None
Duration: 3 hours
Priority: P1

Description: |
  Setup GitHub Actions for CI/CD with Moonrepo.

Files to Create:
  - .github/workflows/ci.yml
  - .github/workflows/pr.yml
  - .github/PULL_REQUEST_TEMPLATE.md

CI Jobs:
  - moon setup
  - moon run :lint (oxlint)
  - moon run :format (oxfmt --check)
  - moon run :typecheck
  - moon run :test (placeholder)
  - moon ci (affected tasks only)

Moonrepo CI Commands:
  - moon ci              # Run all affected tasks
  - moon query affected  # List affected projects

Acceptance Criteria:
  - [ ] CI runs on every PR
  - [ ] All jobs pass
```

---

## Wave 2: Database & Shared Package (Week 1-2)

### T07: Kysely Schema Implementation

```yaml
Task ID: P0-W2-T07
Category: ultrabrain
Skills: database
Dependencies: P0-W1-T01, P0-W1-T02
Duration: 8-10 hours
Priority: P0

Description: |
  Create SQL migration files and setup Kysely type generation.

Files to Create:
  - packages/database/migrations/*.up.sql
  - packages/database/migrations/*.down.sql
  - packages/database/src/client.ts
  - packages/database/src/types.ts (generated)
  - packages/database/scripts/generate-types.ts

Database Tables:
  - users, sessions (Better Auth compatible)
  - players, player_stats, player_progression
  - weapons, weapon_attachments, maps
  - player_inventory, player_loadouts
  - game_rooms, room_participants
  - matches, match_participants
  - friendships, leaderboards, achievements
  - match_events, player_telemetry (TimescaleDB)

PostgreSQL 18 Features:
  - uuidv7() for primary keys (time-ordered UUIDs)
  - Improved btree index performance

Acceptance Criteria:
  - [ ] All migration files created
  - [ ] Migrations apply successfully
  - [ ] Kysely types generated
  - [ ] UUID v7 used for primary keys
```

### T08: Database Migration System (golang-migrate)

```yaml
Task ID: P0-W2-T08
Category: devops
Skills: database
Dependencies: P0-W2-T07
Duration: 2-3 hours
Priority: P0

Description: |
  Setup golang-migrate CLI for managing database migrations.

Installation:
  brew install golang-migrate

Files to Create:
  - packages/database/scripts/migrate.sh
  - packages/database/scripts/create-migration.sh
  - packages/database/scripts/seed.ts

package.json Scripts:
  {
    "db:migrate": "migrate -database $DATABASE_URL -path packages/database/migrations up",
    "db:rollback": "migrate -database $DATABASE_URL -path packages/database/migrations down 1",
    "db:create": "./scripts/create-migration.sh",
    "db:seed": "bun packages/database/scripts/seed.ts",
    "db:generate": "kysely-codegen --out-file packages/database/src/types.ts"
  }

Acceptance Criteria:
  - [ ] golang-migrate CLI installed
  - [ ] Migrations apply successfully
  - [ ] Rollback works
  - [ ] Seed script works
```

### T09: Shared Package - Types & Utilities

```yaml
Task ID: P0-W2-T09
Category: quick
Skills: bun
Dependencies: P0-W1-T03
Duration: 4-6 hours
Priority: P0

Description: |
  Create shared package with common types and utilities.

Files to Create:
  - packages/shared/src/types/index.ts
  - packages/shared/src/types/auth.types.ts
  - packages/shared/src/types/player.types.ts
  - packages/shared/src/utils/index.ts
  - packages/shared/src/constants/index.ts

Acceptance Criteria:
  - [ ] All shared types exported
  - [ ] No circular dependencies
```

### T10: Effect Platform Setup

```yaml
Task ID: P0-W2-T10
Category: ultrabrain
Skills: effect
Dependencies: P0-W1-T01
Duration: 4-5 hours
Priority: P0

Description: |
  Initialize Effect platform in server package with Bun runtime.

Files to Create:
  - apps/server/src/index.ts
  - apps/server/src/services/index.ts
  - apps/server/src/layers/index.ts
  - apps/server/src/errors/index.ts

Reference Pattern (HazelChat):
  - BunHttpServer.layerConfig()
  - BunRuntime.runMain
  - DevTools.layer() from @effect/experimental

Acceptance Criteria:
  - [ ] Effect program runs
  - [ ] Bun serve integration works
  - [ ] Layer composition works
```

---

# PHASE 1-5: Detailed Tasks

_See full task details in original plan. Key changes:_

**Technology Updates:**

- PostgreSQL 16 → PostgreSQL 18 (UUID v7, improved performance)
- Prisma → Kysely + golang-migrate (type-safe query builder + CLI migrations)
- ESLint/Prettier → oxlint/oxfmt (10-100x faster Rust-based tools)

**Key Integration Points:**

1. **Kysely Repository Pattern:**

```typescript
// packages/database/src/client.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})
```

2. **golang-migrate Workflow:**

```bash
# Create migration
migrate create -ext sql -dir migrations -seq create_players

# Apply
migrate -database $DATABASE_URL -path migrations up

# Generate Kysely types
kysely-codegen --out-file src/types.ts
```

3. **oxlint Configuration:**

```typescript
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: { correctness: 'error', suspicious: 'warn' },
  plugins: ['typescript', 'import', 'unicorn'],
})
```

---

# Dependency Graph

```
Phase 0 (Foundation)
├── Wave 1 (All PARALLEL)
│   ├── T01 (Moonrepo) ──┐
│   ├── T02 (Docker) ────┤
│   ├── T03 (TypeScript)─┤
│   ├── T04 (oxlint) ────┤
│   ├── T05 (Config) ────┤
│   └── T06 (CI/CD) ─────┘
│
└── Wave 2
    ├── T07 (Kysely Schema) ─┬── T08 (golang-migrate)
    ├── T09 (Shared) ────────┤
    └── T10 (Effect Setup) ──┘
```

---

# Critical Path

```
T01 → T07 → T11 → T13 → T19 → T28 → T30 → T42
      ↓     ↓     ↓     ↓     ↓     ↓
     (DB) (Auth)(Player)(Inv) (WS) (Room)(Client)
```

**Critical Path Duration**: ~8-9 weeks  
**With Full Parallelism**: ~12-14 weeks (complete)

---

# Acceptance Criteria Summary

## Phase 0 Complete When:

- [x] All infrastructure running (Docker Compose)
- [x] PostgreSQL 18.2 with UUID v7 working
- [x] Kysely types generated from schema
- [x] Migrations apply successfully
- [x] CI/CD pipeline passing
- [x] oxlint/oxfmt configured

**Phase 0 Status: ✅ COMPLETE (as of Feb 2026)**

### Implementation Notes:
- **T01 Monorepo**: Moonrepo + Bun workspaces with 5 packages (server, web, shared, database, tsconfig)
- **T02 Docker**: PostgreSQL 18 + Redis 8 with TimescaleDB extension
- **T03 TypeScript**: Strict mode enabled, project references configured
- **T04 Linting**: oxlint with type-aware rules via tsgolint, oxfmt for formatting
- **T05 Config**: Effect Config system with Redacted secrets
- **T06 CI/CD**: GitHub Actions with lint, format, typecheck, test, build jobs
- **T07 Schema**: 12 migration pairs (24 files) covering all game tables
- **T08 Migrations**: golang-migrate with moon task integration
- **T09 Shared**: Types, utils, constants, and Effect config services
- **T10 Effect**: Bun server with Layer composition and typed errors

---

_Plan Version: 2.2_  
_Created: February 2026_  
_Changes: Updated all dependencies to latest versions (React 19, Three.js 0.182, Vite 7, PostgreSQL 18.2, Redis 8, etc.)_  
_Estimated Duration: 12-14 weeks for Phase 1-4 (API + Database)_
