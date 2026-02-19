# Crossfire Web Game - Implementation TODO

> Auto-generated from EXECUTION_PLAN.md v2.3
> Track progress by updating status: pending → in_progress → completed

---

## Technology Stack

| Layer         | Technology                |
| ------------- | ------------------------- |
| Database      | PostgreSQL 18.2 (UUID v7) |
| Query Builder | Kysely 0.28.11            |
| Migrations    | golang-migrate 4.19.x     |
| Monorepo      | Moonrepo                  |
| Linting       | oxlint 1.47.0             |
| Formatting    | oxfmt 0.32.0              |
| Runtime       | Bun 1.3.9                 |
| Framework     | Effect 3.19.16            |

---

## Phase 0: Foundation & Infrastructure

### Wave 1: Project Setup (Parallel - Week 1)

- [x] **P0-W1-T01** | Create monorepo structure (Moonrepo + Bun)
  - Category: devops | Skills: git-master, bun | Est: 2-3h
  - Files: package.json, .moon/workspace.yml, .moon/toolchains.yml, .moon/tasks/all.yml

- [x] **P0-W1-T02** | Setup Docker Compose infrastructure
  - Category: devops | Skills: docker | Est: 3-4h
  - Services: PostgreSQL 18, TimescaleDB, Redis
  - **Key**: Use PostgreSQL 18 for UUID v7 support

- [x] **P0-W1-T03** | Configure TypeScript with strict mode
  - Category: devops | Skills: bun | Est: 2h
  - Files: tsconfig.json (root + packages)

- [x] **P0-W1-T04** | Setup oxlint and oxfmt (replaces ESLint/Prettier)
  - Category: quick | Skills: bun | Est: 2h
  - Files: oxlint.config.ts, .oxfmtrc.json, .husky/pre-commit
  - **Note**: 10-100x faster than ESLint/Prettier

- [x] **P0-W1-T05** | Create environment config system (Effect Config)
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: packages/shared/src/config/\*.ts

- [x] **P0-W1-T06** | Setup GitHub Actions CI/CD
  - Category: devops | Skills: git-master | Est: 3h
  - Files: .github/workflows/ci.yml, pr.yml

### Wave 2: Database & Shared Package (Week 1-2)

- [x] **P0-W2-T07** | Implement Kysely schema + SQL migrations
  - Category: ultrabrain | Skills: database | Est: 8-10h
  - Files: packages/database/migrations/\*.sql, packages/database/src/types.ts
  - **Key**: Use uuidv7() for primary keys, kysely-codegen for types
  - **BLOCKS**: Most Phase 1+ tasks

- [x] **P0-W2-T08** | Setup golang-migrate for migrations
  - Category: devops | Skills: database | Est: 2-3h
  - Files: packages/database/scripts/migrate.sh, seed.ts
  - **Install**: `brew install golang-migrate`
  - **DEPENDS ON**: P0-W2-T07

- [x] **P0-W2-T09** | Create shared package (types & utilities)
  - Category: quick | Skills: bun | Est: 4-6h
  - Files: packages/shared/src/types/\*.ts

- [x] **P0-W2-T10** | Setup Effect platform in server

### Phase 0 Gate Fixes (must be completed before Phase 1 sign-off)

- [x] **P0-GATE-C01** | UUIDv7 migration consistency
  - Scope: migrate PK defaults from gen_random_uuid() to uuidv7() with rollback migration

- [x] **P0-GATE-C02** | Timescale bootstrap + hypertable consistency
  - Scope: explicit Timescale init script and telemetry hypertable conversion migration

- [x] **P0-GATE-C03** | Outbox/event delivery contract
  - Scope: outbox + idempotency + retry/backoff + dead-letter schema and dispatcher wiring
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: apps/server/src/index.ts, services/, layers/

---

## Phase 1: Authentication & Core Backend

### Wave 3: Better Auth Integration (Week 2)

- [x] **P1-W3-T11** | Integrate Better Auth with Effect + Kysely
  - Category: ultrabrain | Skills: effect, bun | Est: 6-8h
  - **DEPENDS ON**: P0-W2-T07, P0-W2-T10

- [x] **P1-W3-T12** | Implement Auth REST API endpoints
  - Category: integration | Skills: effect | Est: 6-8h
  - Endpoints: POST /auth/register, login, logout, refresh

- [x] **P1-W3-T13** | Create Player service layer (Kysely)
  - Category: ultrabrain | Skills: effect, database | Est: 6-8h

- [x] **P1-W3-T14** | Create Player Stats & Progression services
  - Category: integration | Skills: effect, database | Est: 5-6h

- [x] **P1-W3-T15** | Implement Player REST API
  - Category: integration | Skills: effect | Est: 4-5h

### Wave 4: Static Data API (Week 2-3)

- [x] **P1-W4-T16** | Create Weapons & Attachments service
  - Category: integration | Skills: effect, database | Est: 5-6h
  - **PARALLEL with Wave 3 after T07**

- [x] **P1-W4-T17** | Create Maps service
  - Category: quick | Skills: effect, database | Est: 3-4h

- [x] **P1-W4-T18** | Implement Static Data REST API
  - Category: integration | Skills: effect | Est: 4-5h

---

## Phase 2: Core API Development

### Wave 5: Inventory & Loadouts (Week 3-4)

- [x] **P2-W5-T19** | Create Inventory service (Kysely)
  - Category: integration | Est: 6-8h

- [x] **P2-W5-T20** | Create Loadout service
  - Category: integration | Est: 6-8h

- [x] **P2-W5-T21** | Implement Inventory & Loadout REST API
  - Category: integration | Est: 5-6h

### Wave 6: Match History (Week 3-4) - PARALLEL

- [x] **P2-W6-T22** | Create Match service
  - Category: integration | Est: 6-8h

- [x] **P2-W6-T23** | Implement Match History REST API
  - Category: integration | Est: 4-5h

### Wave 7: Leaderboards (Week 4) - PARALLEL

- [x] **P2-W7-T24** | Create Leaderboard service
  - Category: integration | Est: 6-8h

- [x] **P2-W7-T25** | Implement Leaderboard REST API
  - Category: integration | Est: 3-4h

### Wave 8: Friends & Social (Week 4-5) - PARALLEL

- [x] **P2-W8-T26** | Create Friends service
  - Category: integration | Est: 6-8h

- [x] **P2-W8-T27** | Implement Friends REST API
  - Category: integration | Est: 4-5h

---

## Phase 3: Real-time & WebSocket

### Wave 9: WebSocket Foundation (Week 5)

- [x] **P3-W9-T28** | Setup Bun WebSocket server with Effect
  - Category: ultrabrain | Est: 8-10h
  - Status: **COMPLETED** ✅
  - Files: `apps/server/src/realtime/connection-registry.service.ts`, `heartbeat.service.ts`, `ws-auth.ts`, `ws-context.ts`, `index.ts`
  - WebSocket integrated into existing Bun.serve() with auth, heartbeat, connection tracking

- [x] **P3-W9-T29** | Implement Message Protocol (MessagePack)
  - Category: integration | Est: 6-8h
  - Status: **COMPLETED** ✅
  - Files: `apps/server/src/realtime/protocol/message-envelope.ts`, `message-codec.ts`, `message-router.ts`, `message-schemas.ts`, `index.ts`
  - MessagePack encoding/decoding, message routing, schema validation, unit tests

### Wave 10: Room System (Week 5-6)

- [x] **P3-W10-T30** | Create Room service with Redis state
  - Category: ultrabrain | Est: 10-12h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/room/domain/entities/room.entity.ts`
    - `apps/server/src/modules/room/domain/errors/room.errors.ts`
    - `apps/server/src/modules/room/domain/repositories/room.repository.ts`
    - `apps/server/src/modules/room/application/services/room.service.ts`
    - `apps/server/src/modules/room/infrastructure/repositories/room.repository.impl.ts`
  - Redis-backed room state with player management, status tracking

- [x] **P3-W10-T31** | Implement Room WebSocket handlers
  - Category: integration | Est: 6-8h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/room/presentation/websocket/bun-room.handlers.ts`
  - Handlers for create_room, join_room, leave_room, set_ready, kick_player
    - Handler registration in message router
    - Unit tests

### Wave 11: Matchmaking (Week 6) - PARALLEL

- [x] **P3-W11-T32** | Create Matchmaking service
  - Category: ultrabrain | Est: 8-10h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/matchmaking/domain/entities/matchmaking.entity.ts`
    - `apps/server/src/modules/matchmaking/domain/errors/matchmaking.errors.ts`
    - `apps/server/src/modules/matchmaking/domain/repositories/matchmaking.repository.ts`
    - `apps/server/src/modules/matchmaking/application/services/matchmaking.service.ts`
    - `apps/server/src/modules/matchmaking/infrastructure/repositories/matchmaking.repository.impl.ts`
  - Redis-backed matchmaking queue with skill-based matching

- [x] **P3-W11-T33** | Implement Matchmaking REST API
  - Category: integration | Est: 3-4h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/matchmaking/presentation/http/matchmaking.handlers.ts`
  - Endpoints: POST /matchmaking/queue, DELETE /matchmaking/queue, GET /matchmaking/status

---

## Phase 4: Game Logic API

### Wave 12: Achievements (Week 6-7) - PARALLEL

- [x] **P4-W12-T34** | Create Achievement service
  - Category: integration | Est: 6-8h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/achievement/domain/entities/achievement.entity.ts`
    - `apps/server/src/modules/achievement/domain/errors/achievement.errors.ts`
    - `apps/server/src/modules/achievement/domain/repositories/achievement.repository.ts`
    - `apps/server/src/modules/achievement/application/services/achievement.service.ts`
    - `apps/server/src/modules/achievement/infrastructure/repositories/achievement.repository.impl.ts`

- [x] **P4-W12-T35** | Implement Achievement REST API
  - Category: integration | Est: 2-3h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/achievement/presentation/http/achievement.handlers.ts`
  - Endpoints: GET /achievements, GET /achievements/player/:playerId, GET /achievements/progress/:playerId

### Wave 13: Telemetry & Admin (Week 7) - PARALLEL

- [x] **P4-W13-T36** | Create Telemetry service (TimescaleDB)
  - Category: ultrabrain | Est: 6-8h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/telemetry/domain/entities/telemetry.entity.ts`
    - `apps/server/src/modules/telemetry/domain/errors/telemetry.errors.ts`
    - `apps/server/src/modules/telemetry/domain/repositories/telemetry.repository.ts`
    - `apps/server/src/modules/telemetry/application/services/telemetry.service.ts`
    - `apps/server/src/modules/telemetry/infrastructure/repositories/telemetry.repository.impl.ts`
    - `apps/server/src/modules/telemetry/presentation/http/telemetry.handlers.ts`

- [x] **P4-W13-T37** | Implement Admin REST API
  - Category: integration | Est: 4-5h
  - Status: **COMPLETED** ✅
  - Files created:
    - `apps/server/src/modules/admin/presentation/http/admin.handlers.ts`

---

## Phase 5: Frontend Foundation (Later)

### Wave 14: Client Setup (Week 7-8)

- [ ] **P5-W14-T38** | Setup Vite + React
  - Category: visual-engineering | Est: 4-6h

- [ ] **P5-W14-T39** | Create UI component library
  - Category: visual-engineering | Est: 8-10h

- [ ] **P5-W14-T40** | Implement Authentication UI
  - Category: visual-engineering | Est: 6-8h

### Wave 15: Game Client (Week 8-10)

- [ ] **P5-W15-T41** | Three.js integration (React Three Fiber)
  - Category: ultrabrain | Est: 12-15h

- [ ] **P5-W15-T42** | WebSocket client implementation
  - Category: integration | Est: 6-8h

---

## Summary Statistics

| Metric        | Count | Completed |
| ------------- | ----- | --------- |
| Total Tasks   | 45    | 40 (89%)  |
| Phase 0 Tasks | 13    | 13 ✅     |
| Phase 1 Tasks | 8     | 8 ✅      |
| Phase 2 Tasks | 9     | 9 ✅      |
| Phase 3 Tasks | 6     | 6 ✅      |
| Phase 4 Tasks | 4     | 4 ✅      |
| Phase 5 Tasks | 6     | 0 ⏳      |

### Phase 4 Complete! ✅

- ✅ **P4-W12-T34**: Achievement Service - Full CRUD with progress tracking and unlock logic
- ✅ **P4-W12-T35**: Achievement REST API - Endpoints for achievements and player progress
- ✅ **P4-W13-T36**: Telemetry Service - TimescaleDB integration for time-series analytics
- ✅ **P4-W13-T37**: Admin REST API - Telemetry data access for administrators

---

## Phase 4 Implementation Notes

### Wave 12 Completed (P4-W12-T34 & T35)

**Achievement Module Files Created:**

```
apps/server/src/modules/achievement/
├── domain/
│   ├── entities/achievement.entity.ts          # Achievement, AchievementCriteria, PlayerAchievement types
│   ├── errors/achievement.errors.ts            # AchievementNotFoundError, AchievementAlreadyUnlockedError
│   └── repositories/achievement.repository.ts  # Repository interface
├── application/
│   └── services/achievement.service.ts         # Business logic with checkAndUnlockAchievements, updateProgress
├── infrastructure/
│   └── repositories/achievement.repository.impl.ts  # Kysely implementation
├── presentation/
│   └── http/
│       └── achievement.handlers.ts             # REST handlers
└── index.ts
```

**Key Features:**

1. **Achievement System**: Multi-criteria achievements with progress tracking (JSONB)
2. **Categories**: combat, social, progression, special, hidden
3. **Progress Tracking**: Check-and-unlock logic with flexible condition evaluation
4. **REST Endpoints**:
   - GET /achievements - List all achievements
   - GET /achievements/player/:playerId - Get player's unlocked achievements
   - GET /achievements/progress/:playerId - Get achievement progress

### Wave 13 Completed (P4-W13-T36 & T37)

**Telemetry Module Files Created:**

```
apps/server/src/modules/telemetry/
├── domain/
│   ├── entities/telemetry.entity.ts          # MatchEvent, PlayerTelemetry, ServerMetrics types
│   ├── errors/telemetry.errors.ts            # TelemetryError, MatchNotFoundError
│   └── repositories/telemetry.repository.ts  # Repository interface
├── application/
│   └── services/telemetry.service.ts         # Recording and aggregation logic
├── infrastructure/
│   └── repositories/telemetry.repository.impl.ts  # TimescaleDB implementation
├── presentation/
│   └── http/
│       └── telemetry.handlers.ts             # REST handlers
└── index.ts
```

**Admin Module Files Created:**

```
apps/server/src/modules/admin/
└── presentation/
    └── http/
        ├── admin.handlers.ts                   # Admin telemetry endpoints
        └── index.ts
```

**Key Features:**

1. **TimescaleDB Integration**: Time-series tables (match_events, player_telemetry, server_metrics)
2. **Data Recording**: recordMatchEvent, recordPlayerTelemetry, recordServerMetrics
3. **Aggregation Queries**: getPlayerStats for timeframe-based statistics
4. **REST Endpoints**:
   - GET /telemetry/player/:playerId - Player telemetry over time
   - GET /telemetry/match/:matchId - Match events
   - GET /telemetry/server/:serverId - Server metrics
   - GET /telemetry/stats/:playerId - Aggregated player statistics
5. **Admin Endpoints** (for privileged access):
   - GET /admin/telemetry/player/:playerId
   - GET /admin/telemetry/match/:matchId
   - GET /admin/telemetry/server/:serverId
   - GET /admin/telemetry/stats/:playerId

**Verification:**

- ✅ All new modules compile without errors
- ✅ Typecheck passes: `bun --cwd apps/server run typecheck`
- ✅ Clean Architecture pattern followed throughout
- ✅ Effect error handling with typed errors
- ✅ Kysely repository pattern with column arrays

---

### Phase 3 Complete! ✅

- ✅ **P3-W9-T28**: WebSocket Foundation - Bun WS server with auth, heartbeat, connection registry
- ✅ **P3-W9-T29**: Message Protocol - MessagePack codec, router, schemas, tests
- ✅ **P3-W10-T30**: Room Service - Redis-backed room state with player management
- ✅ **P3-W10-T31**: Room WS Handlers - WebSocket handlers for room operations
- ✅ **P3-W11-T32**: Matchmaking Service - Queue and skill-based matching
- ✅ **P3-W11-T33**: Matchmaking REST API - Queue endpoints

### Estimated Total Effort

- **Phase 0-4 (API + Database)**: ~200-240 hours (~12-14 weeks)
- **Phase 5 (Frontend)**: ~60-80 hours (~4-5 weeks)

---

## Quick Start Commands

### Moonrepo

```bash
# Setup moon in the project
moon setup

# Run task for all projects
moon run :build
moon run :lint
moon run :typecheck
moon run :test

# Run task for specific project
moon run server:dev
moon run database:migrate-up
moon run database:generate-types

# Run CI (affected tasks only)
moon ci

# Query affected projects
moon query affected
```

### golang-migrate

```bash
# Install
brew install golang-migrate

# Create migration
migrate create -ext sql -dir packages/database/migrations -seq create_users

# Apply migrations
migrate -database $DATABASE_URL -path packages/database/migrations up

# Rollback
migrate -database $DATABASE_URL -path packages/database/migrations down 1
```

### Kysely Type Generation

```bash
# Generate types from database
kysely-codegen --out-file packages/database/src/types.ts
```

### oxlint/oxfmt

```bash
# Lint
bun run lint

# Format
bun run format

# Check formatting
bun run format:check
```

### PostgreSQL 18 UUID v7

```sql
-- Create table with UUID v7 primary key
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 3 Implementation Notes

### Wave 9 Completed (P3-W9-T28 & T29)

**Files Created:**

```
apps/server/src/realtime/
├── connection-registry.service.ts   # Track active WS connections
├── heartbeat.service.ts             # Ping/pong and stale detection
├── ws-auth.ts                       # JWT extraction and validation
├── ws-context.ts                    # WebSocket context types
├── index.ts                         # Realtime module exports
└── protocol/
    ├── message-envelope.ts          # Message envelope types
    ├── message-codec.ts             # MessagePack encode/decode
    ├── message-router.ts            # Message dispatch/routing
    ├── message-schemas.ts           # Schema validation
    └── index.ts                     # Protocol exports

packages/shared/src/config/
└── websocket.config.ts              # WebSocket configuration

apps/server/tests/unit/realtime/
└── message-protocol.test.ts         # Protocol unit tests
```

**Key Features Implemented:**

1. **WebSocket Server Integration**: Bun's native WebSocket integrated into existing `Bun.serve()` alongside HTTP routes
2. **Authentication**: Bearer token validation on WebSocket upgrade at `/ws` endpoint
3. **Connection Management**: Connection registry mapping connectionId to player data and WebSocket instance
4. **Heartbeat**: Server sends ping every 30s, closes connection if no pong within 10s
5. **Message Protocol**: MessagePack binary encoding with typed envelope `{ type, seq?, ts, payload }`
6. **Message Router**: Map-based routing (no switch statements) with schema validation
7. **Error Handling**: Typed ProtocolError for decode failures, invalid envelopes, unknown message types

**Verification:**

- ✅ Typecheck passes: `bun --cwd apps/server run typecheck`
- ✅ Build passes: `bun run --cwd apps/server build`
- ✅ Tests pass: `bun --cwd apps/server test tests/unit/realtime/message-protocol.test.ts`

### Wave 10 Completed (P3-W10-T30 & T31)

**Room Module Files Created:**

```
apps/server/src/modules/room/
├── domain/
│   ├── entities/room.entity.ts          # Room and RoomPlayer types
│   ├── errors/room.errors.ts            # Room domain errors
│   └── repositories/room.repository.ts  # Repository interface
├── application/
│   └── services/room.service.ts         # Room business logic
├── infrastructure/
│   └── repositories/room.repository.impl.ts  # Redis implementation
├── presentation/
│   └── websocket/
│       └── bun-room.handlers.ts         # WS handlers
└── index.ts
```

**Key Features:**

1. **Room State**: Redis-backed with room:{id}, room:{id}:players, rooms:active keys
2. **Room Lifecycle**: waiting → starting → in_progress → finished
3. **Business Logic**: Host validation, ready checks, capacity limits, password protection
4. **WebSocket Handlers**: create_room, join_room, leave_room, set_ready, kick_player

### Wave 11 Completed (P3-W11-T32 & T33)

**Matchmaking Module Files Created:**

```
apps/server/src/modules/matchmaking/
├── domain/
│   ├── entities/matchmaking.entity.ts          # Ticket and Match types
│   ├── errors/matchmaking.errors.ts            # Domain errors
│   └── repositories/matchmaking.repository.ts  # Repository interface
├── application/
│   └── services/matchmaking.service.ts         # Matchmaking logic
├── infrastructure/
│   └── repositories/matchmaking.repository.impl.ts  # Redis implementation
├── presentation/
│   └── http/
│       └── matchmaking.handlers.ts             # REST handlers
└── index.ts
```

**Key Features:**

1. **Matchmaking Queue**: Redis sorted set with skill rating
2. **Ticket Management**: Create, cancel, status check
3. **Match Creation**: Skill-based matching with configurable player count
4. **REST API**: POST /matchmaking/queue, DELETE /matchmaking/queue, GET /matchmaking/status

**Verification:**

- ✅ All new modules compile without errors
- ✅ Typecheck passes: `bun --cwd apps/server run typecheck`
- ✅ Clean Architecture pattern followed throughout

---

## Key Changes from v1.0

| Old             | New                                   | Reason                               |
| --------------- | ------------------------------------- | ------------------------------------ |
| PostgreSQL 16   | PostgreSQL 18.2                       | UUID v7, better performance          |
| Prisma          | Kysely 0.28.x + golang-migrate 4.19.x | More control, SQL-first              |
| Turborepo       | Moonrepo                              | Better Bun support, task inheritance |
| ESLint/Prettier | oxlint 1.47.x/oxfmt 0.32.x            | 10-100x faster                       |
| React 18        | React 19                              | Latest features                      |
| Vite 5          | Vite 7                                | Latest features                      |

---

_TODO List Version: 2.4_  
_Generated from: EXECUTION_PLAN.md v2.3_  
_Last Updated: February 19, 2026 (Phase 4 Complete)_
