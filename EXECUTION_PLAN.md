# Crossfire Web Game - Detailed Execution Plan

> **API + Database First** implementation strategy with Bun + Effect + Better Auth + PostgreSQL

---

## Executive Summary

This execution plan provides a step-by-step roadmap for building the Crossfire Web Game, starting with **Database + API** as requested. The plan is organized into phases and waves to maximize parallel execution where possible.

**Total Estimated Time**: 12-14 weeks (Phase 1 only)  
**Team Size**: 2-3 developers  
**Primary Focus**: Backend API infrastructure before Frontend

---

## Phase Overview

| Phase | Focus | Duration | Parallel Tasks |
|-------|-------|----------|----------------|
| **Phase 0** | Foundation & Infrastructure | 1-2 weeks | 6 parallel tasks |
| **Phase 1** | Database & Authentication | 2-3 weeks | 5 parallel tasks |
| **Phase 2** | Core API Development | 3-4 weeks | 6 parallel tasks |
| **Phase 3** | Real-time & WebSocket | 2-3 weeks | 4 parallel tasks |
| **Phase 4** | Game Logic API | 2 weeks | 3 parallel tasks |
| **Phase 5** | Frontend Foundation (Later) | 3-4 weeks | 4 parallel tasks |

---

## Legend

### Categories
- `ultrabrain`: High cognitive load, architectural decisions
- `quick`: Simple implementation, < 2 hours
- `visual-engineering`: UI/frontend work
- `integration`: Connecting multiple systems
- `testing`: Test writing and validation
- `devops`: Infrastructure and deployment

### Skills Required
- `git-master`: Version control, branching strategy
- `librarian`: Documentation, research
- `playwright`: Testing, browser automation
- `database`: PostgreSQL, Prisma, schema design
- `effect`: Effect framework expertise
- `bun`: Bun runtime and ecosystem
- `docker`: Containerization

### Task Status Dependencies
- `BLOCKS`: This task must complete before dependent tasks start
- `DEPENDS`: This task requires prerequisites
- `PARALLEL`: Can run simultaneously with other tasks in same wave

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
  Initialize Turborepo monorepo with pnpm workspaces structure.
  Create package directories following project conventions.

Files to Create:
  - package.json (root)
  - turbo.json
  - pnpm-workspace.yaml
  - .gitignore
  - README.md (project setup)
  - apps/server/package.json
  - apps/web/package.json (placeholder)
  - packages/shared/package.json
  - packages/database/package.json

Acceptance Criteria:
  - [ ] pnpm install works
  - [ ] turbo run build works
  - [ ] All packages have correct dependencies
  - [ ] Git repository initialized with proper .gitignore
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
  Setup Docker Compose with PostgreSQL 16, TimescaleDB extension,
  Redis, and development tooling.

Files to Create:
  - docker-compose.yml
  - docker-compose.dev.yml
  - .env.example
  - docker/postgres/init/01-extensions.sql
  - docker/postgres/init/02-timescaledb.sql
  - docker/redis/redis.conf

Acceptance Criteria:
  - [ ] docker-compose up starts all services
  - [ ] PostgreSQL accessible on port 5432
  - [ ] Redis accessible on port 6379
  - [ ] TimescaleDB extension enabled
  - [ ] Persistent volumes configured
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
  Set up shared tsconfig inheritance pattern.

Files to Create:
  - tsconfig.json (root)
  - packages/tsconfig/base.json
  - packages/tsconfig/node.json
  - packages/tsconfig/browser.json
  - apps/server/tsconfig.json
  - packages/shared/tsconfig.json
  - packages/database/tsconfig.json

Acceptance Criteria:
  - [ ] Strict mode enabled (strict: true)
  - [ ] All packages extend base config
  - [ ] Type checking passes
  - [ ] Path aliases configured (@crossfire/*)
```

### T04: Code Quality Tooling
```yaml
Task ID: P0-W1-T04
Category: quick
Skills: bun
Dependencies: None
Duration: 2 hours
Priority: P0

Description: |
  Setup ESLint, Prettier, and lint-staged for consistent code quality.

Files to Create:
  - .eslintrc.js
  - .prettierrc
  - .lintstagedrc
  - .husky/pre-commit
  - eslint-config-custom/package.json
  - eslint-config-custom/index.js

Acceptance Criteria:
  - [ ] ESLint runs without errors
  - [ ] Prettier formats on save
  - [ ] Pre-commit hooks work
  - [ ] TypeScript-specific rules enabled
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
  Support multiple environments (dev, test, prod).

Files to Create:
  - packages/shared/src/config/index.ts
  - packages/shared/src/config/server.config.ts
  - packages/shared/src/config/database.config.ts
  - packages/shared/src/config/redis.config.ts
  - packages/shared/src/config/auth.config.ts
  - .env.example (comprehensive)

Acceptance Criteria:
  - [ ] All config values typed
  - [ ] Validation with Effect Schema
  - [ ] Sensible defaults for dev
  - [ ] Secrets properly redacted
  - [ ] Config errors are descriptive
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
  Setup GitHub Actions for CI/CD with lint, typecheck, and test jobs.

Files to Create:
  - .github/workflows/ci.yml
  - .github/workflows/pr.yml
  - .github/PULL_REQUEST_TEMPLATE.md

Acceptance Criteria:
  - [ ] CI runs on every PR
  - [ ] Lint job passes
  - [ ] Typecheck job passes
  - [ ] Test job runs (placeholder)
  - [ ] Status checks required for merge
```

---

## Wave 2: Database & Shared Package (Week 1-2)

**Dependencies**: Wave 1 must complete first

### T07: Prisma Schema Implementation
```yaml
Task ID: P0-W2-T07
Category: ultrabrain
Skills: database
Dependencies: P0-W1-T01, P0-W1-T02
Duration: 8-10 hours
Priority: P0

Description: |
  Convert SQL schema from docs/05-database-design.md into Prisma schema.
  Include all tables, indexes, enums, and relations.

Files to Create/Modify:
  - packages/database/prisma/schema.prisma
  - packages/database/src/index.ts
  - packages/database/src/client.ts
  - packages/database/src/types.ts

Database Tables to Implement:
  - users, sessions (Better Auth compatible)
  - players, player_stats, player_progression
  - weapons, weapon_attachments, maps
  - player_inventory, player_loadouts
  - game_rooms, room_participants, room_configs
  - matches, match_participants, match_weapon_usage
  - friendships, leaderboards, leaderboard_entries
  - achievements, achievement_criteria, player_achievements
  - levels, xp_history
  - match_events, player_telemetry, server_metrics (TimescaleDB)

Acceptance Criteria:
  - [ ] All tables defined in Prisma schema
  - [ ] Proper relations and foreign keys
  - [ ] Indexes created for performance
  - [ ] Enums defined for type safety
  - [ ] TimescaleDB hypertables configured
  - [ ] Initial seed data for weapons, maps, achievements
```

### T08: Database Migration System
```yaml
Task ID: P0-W2-T08
Category: devops
Skills: database
Dependencies: P0-W2-T07
Duration: 2-3 hours
Priority: P0

Description: |
  Setup Prisma migration workflow and initial migration.

Files to Create:
  - packages/database/prisma/migrations/
  - packages/database/scripts/migrate.sh
  - packages/database/scripts/seed.ts
  - packages/database/scripts/reset.sh

Acceptance Criteria:
  - [ ] Initial migration created
  - [ ] Migration applies successfully
  - [ ] Seed script populates reference data
  - [ ] Reset script for dev environment
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
  Create shared package with common types, utilities, and constants.

Files to Create:
  - packages/shared/src/types/index.ts
  - packages/shared/src/types/auth.types.ts
  - packages/shared/src/types/player.types.ts
  - packages/shared/src/types/game.types.ts
  - packages/shared/src/types/websocket.types.ts
  - packages/shared/src/utils/index.ts
  - packages/shared/src/utils/validation.ts
  - packages/shared/src/constants/index.ts
  - packages/shared/src/constants/game.ts

Acceptance Criteria:
  - [ ] All shared types exported
  - [ ] Type guards implemented
  - [ ] Utility functions tested
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
  Setup basic service layer pattern.

Files to Create:
  - apps/server/src/index.ts
  - apps/server/src/services/index.ts
  - apps/server/src/services/BaseService.ts
  - apps/server/src/layers/index.ts
  - apps/server/src/errors/index.ts

Acceptance Criteria:
  - [ ] Effect program runs
  - [ ] Bun serve integration works
  - [ ] Service layer pattern established
  - [ ] Error types defined
  - [ ] Layer composition works
```

---

# PHASE 1: Authentication & Core Backend

**Duration**: 2-3 weeks  
**Goal**: User authentication, player profiles, and basic API  
**Parallel Opportunities**: 5 tasks can run simultaneously

---

## Wave 3: Better Auth Integration (Week 2)

### T11: Better Auth Setup
```yaml
Task ID: P1-W3-T11
Category: ultrabrain
Skills: effect, bun
Dependencies: P0-W2-T07, P0-W2-T10
Duration: 6-8 hours
Priority: P0

Description: |
  Integrate Better Auth with PostgreSQL and Effect framework.
  Setup email/password authentication with JWT tokens.

Files to Create:
  - apps/server/src/auth/better-auth.ts
  - apps/server/src/auth/effect-adapter.ts
  - apps/server/src/auth/middleware.ts
  - apps/server/src/auth/types.ts
  - apps/server/src/auth/errors.ts

Acceptance Criteria:
  - [ ] Better Auth initialized with Prisma adapter
  - [ ] Email/password registration works
  - [ ] Login returns access + refresh tokens
  - [ ] JWT validation middleware
  - [ ] Password hashing with bcrypt
  - [ ] Rate limiting on auth endpoints
```

### T12: Auth REST API Endpoints
```yaml
Task ID: P1-W3-T12
Category: integration
Skills: effect
Dependencies: P1-W3-T11
Duration: 6-8 hours
Priority: P0

Description: |
  Implement authentication REST API endpoints using Effect HTTP server.

Files to Create:
  - apps/server/src/routes/auth.routes.ts
  - apps/server/src/controllers/auth.controller.ts
  - apps/server/src/validators/auth.validator.ts
  - apps/server/src/http/router.ts
  - apps/server/src/http/server.ts

API Endpoints to Implement:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  POST /api/v1/auth/logout
  POST /api/v1/auth/refresh
  GET  /api/v1/auth/me

Acceptance Criteria:
  - [ ] All endpoints return proper JSON responses
  - [ ] Input validation with Effect Schema
  - [ ] Error responses follow API spec
  - [ ] Rate limiting implemented
  - [ ] Swagger/OpenAPI documentation
```

### T13: Player Service Layer
```yaml
Task ID: P1-W3-T13
Category: ultrabrain
Skills: effect, database
Dependencies: P0-W2-T07, P1-W3-T11
Duration: 6-8 hours
Priority: P0

Description: |
  Create Player service with Effect for profile management.

Files to Create:
  - apps/server/src/services/PlayerService.ts
  - apps/server/src/repositories/PlayerRepository.ts
  - apps/server/src/dto/player.dto.ts
  - apps/server/src/errors/player.errors.ts

Service Methods:
  - createPlayer(userId: string, data: CreatePlayerDTO)
  - getPlayerById(playerId: string)
  - getPlayerByUserId(userId: string)
  - updatePlayer(playerId: string, data: UpdatePlayerDTO)
  - deletePlayer(playerId: string)

Acceptance Criteria:
  - [ ] All CRUD operations implemented
  - [ ] Proper error handling
  - [ ] Database transactions
  - [ ] Input validation
  - [ ] Unit tests
```

### T14: Player Stats & Progression Service
```yaml
Task ID: P1-W3-T14
Category: integration
Skills: effect, database
Dependencies: P1-W3-T13
Duration: 5-6 hours
Priority: P0

Description: |
  Create services for player statistics and progression system.

Files to Create:
  - apps/server/src/services/PlayerStatsService.ts
  - apps/server/src/services/ProgressionService.ts
  - apps/server/src/repositories/PlayerStatsRepository.ts
  - apps/server/src/repositories/ProgressionRepository.ts

Acceptance Criteria:
  - [ ] Player stats initialized on player creation
  - [ ] Progression initialized with level 1
  - [ ] XP calculation logic
  - [ ] Level up detection
  - [ ] Stats update methods
```

### T15: Player REST API Endpoints
```yaml
Task ID: P1-W3-T15
Category: integration
Skills: effect
Dependencies: P1-W3-T13, P1-W3-T14
Duration: 4-5 hours
Priority: P0

Description: |
  Implement player profile and stats REST API endpoints.

API Endpoints to Implement:
  GET    /api/v1/players/me
  PATCH  /api/v1/players/me
  GET    /api/v1/players/me/stats
  GET    /api/v1/players/:id
  GET    /api/v1/players/:id/stats

Acceptance Criteria:
  - [ ] All endpoints protected with auth
  - [ ] Proper serialization
  - [ ] Pagination for lists
  - [ ] Error handling
```

---

## Wave 4: Static Data API (Week 2-3)

**Can run PARALLEL with Wave 3 after T07 is complete**

### T16: Weapons & Attachments Service
```yaml
Task ID: P1-W4-T16
Category: integration
Skills: effect, database
Dependencies: P0-W2-T07
Duration: 5-6 hours
Priority: P0

Description: |
  Create services for weapons catalog and attachments.

Files to Create:
  - apps/server/src/services/WeaponService.ts
  - apps/server/src/repositories/WeaponRepository.ts
  - apps/server/src/dto/weapon.dto.ts

Acceptance Criteria:
  - [ ] List all weapons with filtering
  - [ ] Get weapon by ID
  - [ ] List attachments for weapon
  - [ ] Weapon stats calculation
  - [ ] Unlock level checking
```

### T17: Maps Service
```yaml
Task ID: P1-W4-T17
Category: quick
Skills: effect, database
Dependencies: P0-W2-T07
Duration: 3-4 hours
Priority: P0

Description: |
  Create service for game maps catalog.

Files to Create:
  - apps/server/src/services/MapService.ts
  - apps/server/src/repositories/MapRepository.ts

Acceptance Criteria:
  - [ ] List all active maps
  - [ ] Get map by ID
  - [ ] Filter by game mode support
  - [ ] Return map configuration
```

### T18: Static Data REST API
```yaml
Task ID: P1-W4-T18
Category: integration
Skills: effect
Dependencies: P1-W4-T16, P1-W4-T17
Duration: 4-5 hours
Priority: P0

Description: |
  Implement REST API for static game data.

API Endpoints to Implement:
  GET /api/v1/weapons
  GET /api/v1/weapons/:id
  GET /api/v1/weapons/:id/attachments
  GET /api/v1/attachments
  GET /api/v1/maps
  GET /api/v1/maps/:id

Acceptance Criteria:
  - [ ] All endpoints public (no auth required)
  - [ ] Caching headers set
  - [ ] Proper filtering and pagination
  - [ ] Response DTOs defined
```

---

# PHASE 2: Core API Development

**Duration**: 3-4 weeks  
**Goal**: Inventory, loadouts, match history, leaderboards, friends  
**Parallel Opportunities**: 6 tasks can run simultaneously

---

## Wave 5: Inventory & Loadouts (Week 3-4)

### T19: Inventory Service
```yaml
Task ID: P2-W5-T19
Category: integration
Skills: effect, database
Dependencies: P1-W3-T13, P1-W4-T16
Duration: 6-8 hours
Priority: P0

Description: |
  Create service for player weapon inventory management.

Files to Create:
  - apps/server/src/services/InventoryService.ts
  - apps/server/src/repositories/InventoryRepository.ts
  - apps/server/src/dto/inventory.dto.ts

Service Methods:
  - getPlayerInventory(playerId: string)
  - addWeaponToInventory(playerId: string, weaponId: string)
  - removeWeaponFromInventory(playerId: string, inventoryId: string)
  - checkWeaponOwnership(playerId: string, weaponId: string)

Acceptance Criteria:
  - [ ] List player-owned weapons
  - [ ] Weapon ownership validation
  - [ ] Add default weapons on player creation
  - [ ] Rental/expiration logic
```

### T20: Loadout Service
```yaml
Task ID: P2-W5-T20
Category: integration
Skills: effect, database
Dependencies: P2-W5-T19
Duration: 6-8 hours
Priority: P0

Description: |
  Create service for player loadout management.

Files to Create:
  - apps/server/src/services/LoadoutService.ts
  - apps/server/src/repositories/LoadoutRepository.ts
  - apps/server/src/dto/loadout.dto.ts

Service Methods:
  - getPlayerLoadouts(playerId: string)
  - createLoadout(playerId: string, data: CreateLoadoutDTO)
  - updateLoadout(loadoutId: string, data: UpdateLoadoutDTO)
  - deleteLoadout(loadoutId: string)
  - setDefaultLoadout(playerId: string, loadoutId: string)
  - validateLoadout(data: LoadoutDTO): ValidationError[]

Acceptance Criteria:
  - [ ] CRUD operations for loadouts
  - [ ] Validate weapon ownership
  - [ ] Attachment compatibility check
  - [ ] Max loadouts limit enforcement
  - [ ] Default loadout handling
```

### T21: Inventory & Loadout REST API
```yaml
Task ID: P2-W5-T21
Category: integration
Skills: effect
Dependencies: P2-W5-T19, P2-W5-T20
Duration: 5-6 hours
Priority: P0

Description: |
  Implement REST API for inventory and loadouts.

API Endpoints to Implement:
  GET    /api/v1/players/me/inventory
  GET    /api/v1/players/me/loadouts
  POST   /api/v1/players/me/loadouts
  GET    /api/v1/players/me/loadouts/:id
  PUT    /api/v1/players/me/loadouts/:id
  DELETE /api/v1/players/me/loadouts/:id
  POST   /api/v1/players/me/loadouts/:id/default

Acceptance Criteria:
  - [ ] All endpoints protected
  - [ ] Validation errors returned
  - [ ] Ownership checks enforced
  - [ ] Swagger docs updated
```

---

## Wave 6: Match History & Stats (Week 3-4)

**Can run PARALLEL with Wave 5**

### T22: Match Service
```yaml
Task ID: P2-W6-T22
Category: integration
Skills: effect, database
Dependencies: P1-W3-T13
Duration: 6-8 hours
Priority: P0

Description: |
  Create service for match history and results.

Files to Create:
  - apps/server/src/services/MatchService.ts
  - apps/server/src/repositories/MatchRepository.ts
  - apps/server/src/dto/match.dto.ts

Service Methods:
  - getPlayerMatches(playerId: string, options: PaginationOptions)
  - getMatchById(matchId: string)
  - getMatchDetails(matchId: string)
  - createMatch(data: CreateMatchDTO)
  - endMatch(matchId: string, results: MatchResultsDTO)
  - getMatchStatistics(matchId: string)

Acceptance Criteria:
  - [ ] List player match history with pagination
  - [ ] Get detailed match information
  - [ ] Filter by game mode, date
  - [ ] Match results calculation
  - [ ] Weapon usage statistics
```

### T23: Match History REST API
```yaml
Task ID: P2-W6-T23
Category: integration
Skills: effect
Dependencies: P2-W6-T22
Duration: 4-5 hours
Priority: P0

Description: |
  Implement REST API for match history.

API Endpoints to Implement:
  GET /api/v1/players/me/matches
  GET /api/v1/players/me/matches/:id
  GET /api/v1/matches/:id
  GET /api/v1/matches/:id/participants

Query Parameters:
  - page, limit
  - mode
  - from, to (date range)
  - result (win, loss)

Acceptance Criteria:
  - [ ] Pagination works correctly
  - [ ] Date filtering implemented
  - [ ] Mode filtering works
  - [ ] Proper response structure
```

---

## Wave 7: Leaderboards (Week 4)

**Can run PARALLEL with Waves 5-6**

### T24: Leaderboard Service
```yaml
Task ID: P2-W7-T24
Category: integration
Skills: effect, database
Dependencies: P1-W3-T14
Duration: 6-8 hours
Priority: P1

Description: |
  Create service for leaderboard management and queries.

Files to Create:
  - apps/server/src/services/LeaderboardService.ts
  - apps/server/src/repositories/LeaderboardRepository.ts
  - apps/server/src/jobs/leaderboard.processor.ts

Service Methods:
  - getLeaderboard(type: string, period: string, mode?: string)
  - getPlayerRank(playerId: string, type: string)
  - getNearbyRanks(playerId: string, type: string, range: number)
  - updateLeaderboard(type: string, period: string)

Acceptance Criteria:
  - [ ] Query top N players for leaderboard
  - [ ] Get player's current rank
  - [ ] Get nearby competitors
  - [ ] Support multiple periods (daily, weekly, monthly, all_time)
  - [ ] Support game mode filtering
  - [ ] Background job for updates
```

### T25: Leaderboard REST API
```yaml
Task ID: P2-W7-T25
Category: integration
Skills: effect
Dependencies: P2-W7-T24
Duration: 3-4 hours
Priority: P1

Description: |
  Implement REST API for leaderboards.

API Endpoints to Implement:
  GET /api/v1/leaderboards/:type
  GET /api/v1/leaderboards/:type/rank
  GET /api/v1/players/me/leaderboards

Query Parameters:
  - period (daily, weekly, monthly, all_time)
  - mode (game mode)
  - limit (default: 100)

Acceptance Criteria:
  - [ ] List leaderboard entries
  - [ ] Get player's rank
  - [ ] Caching implemented (Redis)
  - [ ] Public endpoints (no auth required for viewing)
```

---

## Wave 8: Friends & Social (Week 4-5)

**Can run PARALLEL with Waves 5-7**

### T26: Friends Service
```yaml
Task ID: P2-W8-T26
Category: integration
Skills: effect, database
Dependencies: P1-W3-T13
Duration: 6-8 hours
Priority: P1

Description: |
  Create service for friend management and social features.

Files to Create:
  - apps/server/src/services/FriendService.ts
  - apps/server/src/repositories/FriendRepository.ts
  - apps/server/src/dto/friend.dto.ts

Service Methods:
  - getFriends(playerId: string)
  - getFriendRequests(playerId: string)
  - sendFriendRequest(fromPlayerId: string, toPlayerId: string)
  - acceptFriendRequest(requestId: string)
  - declineFriendRequest(requestId: string)
  - removeFriend(playerId: string, friendId: string)
  - blockPlayer(playerId: string, blockedId: string)
  - getOnlineFriends(playerId: string)

Acceptance Criteria:
  - [ ] Send/receive friend requests
  - [ ] Accept/decline requests
  - [ ] Remove friends
  - [ ] Block players
  - [ ] List online friends (Redis integration)
  - [ ] Duplicate request prevention
```

### T27: Friends REST API
```yaml
Task ID: P2-W8-T27
Category: integration
Skills: effect
Dependencies: P2-W8-T26
Duration: 4-5 hours
Priority: P1

Description: |
  Implement REST API for friends system.

API Endpoints to Implement:
  GET    /api/v1/friends
  GET    /api/v1/friends/requests
  POST   /api/v1/friends/requests
  PUT    /api/v1/friends/requests/:id
  DELETE /api/v1/friends/:id
  GET    /api/v1/friends/online

Acceptance Criteria:
  - [ ] All friend operations work
  - [ ] Request status tracking
  - [ ] Online status via Redis
  - [ ] Proper error messages
```

---

# PHASE 3: Real-time & WebSocket

**Duration**: 2-3 weeks  
**Goal**: WebSocket server, room management, real-time communication  
**Parallel Opportunities**: 4 tasks can run simultaneously

---

## Wave 9: WebSocket Foundation (Week 5)

### T28: Bun WebSocket Server Setup
```yaml
Task ID: P3-W9-T28
Category: ultrabrain
Skills: effect, bun
Dependencies: P0-W2-T10, P1-W3-T11
Duration: 8-10 hours
Priority: P0

Description: |
  Setup Bun WebSocket server with Effect integration.
  Implement connection handling and authentication.

Files to Create:
  - apps/server/src/websocket/server.ts
  - apps/server/src/websocket/connection.ts
  - apps/server/src/websocket/auth.ts
  - apps/server/src/websocket/types.ts
  - apps/server/src/websocket/errors.ts

Features:
  - Connection upgrade handling
  - JWT authentication on connect
  - Connection state management
  - Heartbeat/ping-pong
  - Message serialization (MessagePack)

Acceptance Criteria:
  - [ ] WebSocket server starts on configured port
  - [ ] Connection upgrade works
  - [ ] JWT validation on connection
  - [ ] Player session linked to connection
  - [ ] Heartbeat prevents timeout
  - [ ] Graceful disconnection handling
```

### T29: Message Protocol Implementation
```yaml
Task ID: P3-W9-T29
Category: integration
Skills: effect
Dependencies: P3-W9-T28
Duration: 6-8 hours
Priority: P0

Description: |
  Implement WebSocket message protocol with Effect Schema validation.

Files to Create:
  - packages/shared/src/protocol/messages.ts
  - packages/shared/src/protocol/codec.ts
  - apps/server/src/websocket/protocol.ts
  - apps/server/src/websocket/validator.ts

Message Types to Define:
  Client → Server:
    - join_lobby
    - create_room
    - join_room
    - leave_room
    - set_ready
    - chat_message
    - player_input (game)
  
  Server → Client:
    - welcome
    - room_created
    - room_list
    - room_state
    - player_joined
    - player_left
    - game_starting
    - game_state
    - player_death
    - game_ended
    - error

Acceptance Criteria:
  - [ ] All message types defined
  - [ ] Effect Schema validation
  - [ ] MessagePack encoding/decoding
  - [ ] Sequence number tracking
  - [ ] Timestamp validation
  - [ ] Rate limiting per message type
```

---

## Wave 10: Room System (Week 5-6)

### T30: Room Service
```yaml
Task ID: P3-W10-T30
Category: ultrabrain
Skills: effect, database
Dependencies: P1-W4-T17, P3-W9-T28
Duration: 10-12 hours
Priority: P0

Description: |
  Create room management service with real-time state.

Files to Create:
  - apps/server/src/services/RoomService.ts
  - apps/server/src/repositories/RoomRepository.ts
  - apps/server/src/models/Room.ts
  - apps/server/src/models/RoomParticipant.ts

Service Methods:
  - createRoom(hostId: string, config: RoomConfigDTO)
  - joinRoom(roomId: string, playerId: string, password?: string)
  - leaveRoom(roomId: string, playerId: string)
  - kickPlayer(roomId: string, hostId: string, targetId: string)
  - setPlayerReady(roomId: string, playerId: string, ready: boolean)
  - changeTeam(roomId: string, playerId: string, team: number)
  - startGame(roomId: string, hostId: string)
  - getRoomList(filters: RoomFilters)
  - getRoomState(roomId: string)

State Management:
  - Redis for active room state
  - PostgreSQL for room records
  - Real-time updates via WebSocket

Acceptance Criteria:
  - [ ] Create room with configuration
  - [ ] Join/leave room
  - [ ] Password protection
  - [ ] Host controls (kick, start)
  - [ ] Team assignment
  - [ ] Ready system
  - [ ] Room list with filters
  - [ ] State synchronization
```

### T31: Room WebSocket Handlers
```yaml
Task ID: P3-W10-T31
Category: integration
Skills: effect
Dependencies: P3-W10-T30, P3-W9-T29
Duration: 6-8 hours
Priority: P0

Description: |
  Implement WebSocket message handlers for room operations.

Files to Create:
  - apps/server/src/handlers/room.handler.ts
  - apps/server/src/handlers/lobby.handler.ts
  - apps/server/src/broadcast/room.broadcast.ts

Message Handlers:
  - handleCreateRoom
  - handleJoinRoom
  - handleLeaveRoom
  - handleSetReady
  - handleChangeTeam
  - handleStartGame
  - handleKickPlayer

Broadcasts:
  - roomStateUpdate
  - playerJoined
  - playerLeft
  - playerReadyChanged
  - gameStarting

Acceptance Criteria:
  - [ ] All room messages handled
  - [ ] Proper error responses
  - [ ] Real-time state updates to all participants
  - [ ] Host privileges enforced
  - [ ] Validation on all inputs
```

---

## Wave 11: Matchmaking (Week 6)

**Can run PARALLEL with Wave 10**

### T32: Matchmaking Service
```yaml
Task ID: P3-W11-T32
Category: ultrabrain
Skills: effect, database
Dependencies: P3-W10-T30
Duration: 8-10 hours
Priority: P1

Description: |
  Create matchmaking queue system with Redis.

Files to Create:
  - apps/server/src/services/MatchmakingService.ts
  - apps/server/src/queues/matchmaking.queue.ts
  - apps/server/src/matchmaker/matchmaker.ts

Features:
  - Join queue for specific modes
  - Skill-based matching (ELO/level)
  - Region preference
  - Party/squad support
  - Queue timeout handling

Acceptance Criteria:
  - [ ] Join matchmaking queue
  - [ ] Leave queue
  - [ ] Match found notification
  - [ ] Auto-create room on match
  - [ ] ELO-based matching logic
  - [ ] Queue status updates
```

### T33: Matchmaking REST API
```yaml
Task ID: P3-W11-T33
Category: integration
Skills: effect
Dependencies: P3-W11-T32
Duration: 3-4 hours
Priority: P1

Description: |
  Implement REST API for matchmaking.

API Endpoints to Implement:
  POST   /api/v1/matchmaking/queue
  DELETE /api/v1/matchmaking/queue
  GET    /api/v1/matchmaking/status
  POST   /api/v1/matchmaking/quick

Acceptance Criteria:
  - [ ] Join queue endpoint
  - [ ] Leave queue endpoint
  - [ ] Get queue status
  - [ ] Quick match endpoint
```

---

# PHASE 4: Game Logic API

**Duration**: 2 weeks  
**Goal**: Achievements, game telemetry, admin APIs  
**Parallel Opportunities**: 3 tasks can run simultaneously

---

## Wave 12: Achievements & Rewards (Week 6-7)

### T34: Achievement Service
```yaml
Task ID: P4-W12-T34
Category: integration
Skills: effect, database
Dependencies: P0-W2-T07
Duration: 6-8 hours
Priority: P2

Description: |
  Create achievement tracking and unlock system.

Files to Create:
  - apps/server/src/services/AchievementService.ts
  - apps/server/src/services/AchievementUnlocker.ts
  - apps/server/src/repositories/AchievementRepository.ts

Service Methods:
  - getAllAchievements()
  - getPlayerAchievements(playerId: string)
  - checkAchievementCriteria(playerId: string, event: GameEvent)
  - unlockAchievement(playerId: string, achievementId: string)
  - getAchievementProgress(playerId: string)

Acceptance Criteria:
  - [ ] List all achievements
  - [ ] Track player achievements
  - [ ] Criteria checking
  - [ ] Progress tracking
  - [ ] XP rewards on unlock
```

### T35: Achievement REST API
```yaml
Task ID: P4-W12-T35
Category: integration
Skills: effect
Dependencies: P4-W12-T34
Duration: 2-3 hours
Priority: P2

Description: |
  Implement REST API for achievements.

API Endpoints to Implement:
  GET /api/v1/achievements
  GET /api/v1/players/me/achievements
  GET /api/v1/players/me/achievements/progress

Acceptance Criteria:
  - [ ] List achievements
  - [ ] Get player achievements
  - [ ] Progress endpoint
```

---

## Wave 13: Telemetry & Events (Week 7)

**Can run PARALLEL with Wave 12**

### T36: Telemetry Service (TimescaleDB)
```yaml
Task ID: P4-W13-T36
Category: ultrabrain
Skills: database
Dependencies: P0-W2-T08
Duration: 6-8 hours
Priority: P1

Description: |
  Create time-series data ingestion for game telemetry.

Files to Create:
  - apps/server/src/services/TelemetryService.ts
  - apps/server/src/repositories/TelemetryRepository.ts
  - apps/server/src/ingesters/match.events.ts

Data Types:
  - match_events (kills, deaths, damage)
  - player_telemetry (stats per interval)
  - server_metrics (performance data)

Acceptance Criteria:
  - [ ] Ingest match events
  - [ ] Store player telemetry
  - [ ] Server metrics collection
  - [ ] Batch insert for performance
  - [ ] Retention policies
```

### T37: Admin API
```yaml
Task ID: P4-W13-T37
Category: integration
Skills: effect
Dependencies: P1-W3-T11
Duration: 4-5 hours
Priority: P2

Description: |
  Implement admin-only REST API endpoints.

Files to Create:
  - apps/server/src/middleware/admin.middleware.ts
  - apps/server/src/routes/admin.routes.ts
  - apps/server/src/controllers/admin.controller.ts

API Endpoints to Implement:
  GET    /api/v1/admin/players
  GET    /api/v1/admin/players/:id
  PUT    /api/v1/admin/players/:id/ban
  GET    /api/v1/admin/reports
  GET    /api/v1/admin/metrics

Acceptance Criteria:
  - [ ] Admin authentication
  - [ ] List all players
  - [ ] Ban/unban players
  - [ ] View reports
  - [ ] Server metrics
```

---

# PHASE 5: Frontend Foundation (Later)

**Duration**: 3-4 weeks (High Level)  
**Goal**: React + Three.js client, UI components  

---

## Wave 14: Client Setup (Week 7-8)

### T38: Vite + React Setup
```yaml
Task ID: P5-W14-T38
Category: visual-engineering
Skills: bun
Dependencies: P0-W1-T01
Duration: 4-6 hours
Priority: P1

Description: |
  Setup Vite React application with TypeScript.

Files to Create:
  - apps/web/package.json
  - apps/web/vite.config.ts
  - apps/web/tsconfig.json
  - apps/web/index.html
  - apps/web/src/main.tsx
  - apps/web/src/App.tsx

Acceptance Criteria:
  - [ ] Vite dev server runs
  - [ ] Hot reload works
  - [ ] TypeScript compilation
  - [ ] Build succeeds
```

### T39: UI Component Library
```yaml
Task ID: P5-W14-T39
Category: visual-engineering
Skills: bun
Dependencies: P5-W14-T38
Duration: 8-10 hours
Priority: P1

Description: |
  Create base UI components for game interface.

Files to Create:
  - apps/web/src/components/ui/Button.tsx
  - apps/web/src/components/ui/Input.tsx
  - apps/web/src/components/ui/Modal.tsx
  - apps/web/src/components/ui/Card.tsx
  - apps/web/src/components/ui/Loader.tsx

Acceptance Criteria:
  - [ ] Button component with variants
  - [ ] Input with validation
  - [ ] Modal/dialog component
  - [ ] Card container
  - [ ] Loading states
```

### T40: Authentication UI
```yaml
Task ID: P5-W14-T40
Category: visual-engineering
Skills: bun
Dependencies: P5-W14-T39, P1-W3-T12
Duration: 6-8 hours
Priority: P1

Description: |
  Implement login and registration UI.

Files to Create:
  - apps/web/src/pages/Login.tsx
  - apps/web/src/pages/Register.tsx
  - apps/web/src/hooks/useAuth.ts
  - apps/web/src/stores/auth.store.ts
  - apps/web/src/api/auth.api.ts

Acceptance Criteria:
  - [ ] Login form with validation
  - [ ] Registration form
  - [ ] Auth state management
  - [ ] API integration
  - [ ] Error handling
```

---

## Wave 15: Game Client (Week 8-10)

### T41: Three.js Integration
```yaml
Task ID: P5-W15-T41
Category: ultrabrain
Skills: visual-engineering
Dependencies: P5-W14-T38
Duration: 12-15 hours
Priority: P0

Description: |
  Setup Three.js with React Three Fiber for 3D rendering.

Files to Create:
  - apps/web/src/game/GameCanvas.tsx
  - apps/web/src/game/GameScene.tsx
  - apps/web/src/game/CameraController.tsx
  - apps/web/src/game/Lighting.tsx

Acceptance Criteria:
  - [ ] Three.js renders to canvas
  - [ ] Camera controls
  - [ ] Basic lighting
  - [ ] Performance optimized
```

### T42: WebSocket Client
```yaml
Task ID: P5-W15-T42
Category: integration
Skills: bun
Dependencies: P3-W9-T28, P5-W14-T40
Duration: 6-8 hours
Priority: P0

Description: |
  Implement WebSocket client for real-time communication.

Files to Create:
  - apps/web/src/websocket/client.ts
  - apps/web/src/websocket/handlers.ts
  - apps/web/src/hooks/useWebSocket.ts
  - apps/web/src/stores/game.store.ts

Acceptance Criteria:
  - [ ] Connect to server
  - [ ] Reconnection logic
  - [ ] Message handling
  - [ ] State synchronization
```

---

# Dependency Graph

```
Phase 0 (Foundation)
├── Wave 1 (All PARALLEL)
│   ├── T01 (Monorepo) ──┐
│   ├── T02 (Docker) ────┤
│   ├── T03 (TypeScript)─┤
│   ├── T04 (Linting) ───┤
│   ├── T05 (Config) ────┤
│   └── T06 (CI/CD) ─────┘
│
└── Wave 2
    ├── T07 (Prisma Schema) ─┬── T08 (Migrations)
    ├── T09 (Shared Package)─┤
    └── T10 (Effect Setup) ──┘

Phase 1 (Auth & Core)
├── Wave 3
│   ├── T11 (Better Auth) ──┬── T12 (Auth API)
│   ├── T13 (Player Svc) ───┴── T14 (Stats Svc) ─── T15 (Player API)
│
└── Wave 4 (PARALLEL with Wave 3 after T07)
    ├── T16 (Weapons Svc) ──┐
    ├── T17 (Maps Svc) ─────┴── T18 (Static API)

Phase 2 (Core API)
├── Wave 5
│   ├── T19 (Inventory) ──┬── T20 (Loadouts) ─── T21 (Inv/Loadout API)
│
├── Wave 6 (PARALLEL)
│   └── T22 (Match Svc) ─── T23 (Match API)
│
├── Wave 7 (PARALLEL)
│   └── T24 (Leaderboard) ─── T25 (Leaderboard API)
│
└── Wave 8 (PARALLEL)
    └── T26 (Friends Svc) ─── T27 (Friends API)

Phase 3 (Real-time)
├── Wave 9
│   ├── T28 (WS Server) ─── T29 (Protocol)
│
├── Wave 10
│   └── T30 (Room Svc) ─── T31 (Room Handlers)
│
└── Wave 11 (PARALLEL)
    └── T32 (Matchmaking) ─── T33 (Matchmaking API)

Phase 4 (Game Logic)
├── Wave 12 (PARALLEL)
│   └── T34 (Achievements) ─── T35 (Achievement API)
│
└── Wave 13 (PARALLEL)
    ├── T36 (Telemetry)
    └── T37 (Admin API)

Phase 5 (Frontend)
└── High-level tasks T38-T42
```

---

# Parallel Execution Opportunities

## Maximum Parallelism by Phase

| Phase | Max Parallel Tasks | Recommended Team Size |
|-------|-------------------|----------------------|
| Phase 0 | 6 tasks | 2-3 developers |
| Phase 1 | 5 tasks | 2 developers |
| Phase 2 | 6 tasks | 2-3 developers |
| Phase 3 | 4 tasks | 2 developers |
| Phase 4 | 3 tasks | 1-2 developers |
| Phase 5 | 4 tasks | 1-2 developers |

## Critical Path

The minimum sequential path through the project:

```
T01 → T07 → T11 → T13 → T19 → T28 → T30 → T42
      ↓     ↓     ↓     ↓     ↓     ↓
     (DB) (Auth)(Player)(Inv) (WS) (Room)(Client)
```

**Critical Path Duration**: ~8-9 weeks  
**With Full Parallelism**: ~12-14 weeks (complete)

---

# Resource Requirements

## Developer Skills Matrix

| Task Category | Required Skills | Suggested Experience |
|---------------|----------------|---------------------|
| Database (T07-T08) | PostgreSQL, Prisma, SQL | 3+ years |
| Effect Framework | Effect, Functional Programming | 2+ years |
| Bun/Node.js | TypeScript, Server architecture | 3+ years |
| WebSocket Real-time | WebSocket, Redis, Event-driven | 2+ years |
| Frontend/React | React, TypeScript, State management | 2+ years |
| DevOps | Docker, CI/CD, Git | 2+ years |

## Recommended Team

### Option 1: Small Team (2 developers)
- **Developer 1**: Backend focus (Effect, database, WebSocket)
  - Handles: T01-T06, T07-T08, T10-T12, T22-T27, T28-T33, T36-T37
- **Developer 2**: Full-stack focus
  - Handles: T13-T21, T28-T31, T34-T35, T38-T42

### Option 2: Optimal Team (3 developers)
- **Backend Developer**: Database, services, API
  - T07-T08, T13-T14, T16-T27, T34-T37
- **Real-time Developer**: WebSocket, rooms, matchmaking
  - T28-T33, T10, T30-T31
- **Frontend Developer**: React, Three.js, UI
  - T38-T42, T11-T12 (auth integration)

---

# Risk Mitigation

## High-Risk Tasks

| Task ID | Risk | Mitigation |
|---------|------|------------|
| T11 | Better Auth integration complexity | Start early, prototype first |
| T28 | WebSocket performance | Load testing early |
| T30 | Room state synchronization | Redis expertise required |
| T41 | Three.js integration | Prototype rendering first |

## Technical Debt Prevention

1. **Schema Migrations**: Always use Prisma migrations, never manual SQL
2. **Testing**: Unit tests for all services (minimum 70% coverage)
3. **Documentation**: OpenAPI spec for all REST endpoints
4. **Monitoring**: Add logging and metrics from day one
5. **Type Safety**: Strict TypeScript, no `any` types

---

# Acceptance Criteria Summary

## Phase Completion Gates

### Phase 0 Complete When:
- [ ] All infrastructure running (Docker Compose)
- [ ] Database schema created and migrated
- [ ] Shared packages published
- [ ] CI/CD pipeline passing

### Phase 1 Complete When:
- [ ] User registration/login works
- [ ] Player profiles created automatically
- [ ] Static data API returns weapons/maps
- [ ] Auth middleware protects endpoints

### Phase 2 Complete When:
- [ ] Full inventory/loadout system
- [ ] Match history tracking
- [ ] Leaderboards updating
- [ ] Friends system working

### Phase 3 Complete When:
- [ ] WebSocket server handling 100+ connections
- [ ] Rooms created and managed
- [ ] Real-time state synchronization
- [ ] Matchmaking queue working

### Phase 4 Complete When:
- [ ] Achievements unlocking
- [ ] Telemetry data flowing
- [ ] Admin API functional
- [ ] All REST endpoints documented

### Phase 5 Complete When:
- [ ] Client connects and authenticates
- [ ] Lobby and room UI functional
- [ ] Basic 3D rendering
- [ ] Game can be played end-to-end

---

# Next Steps

## Immediate Actions (Week 1)

1. **Start Phase 0, Wave 1** - All tasks are independent and can run in parallel
2. **Prioritize T07 (Prisma Schema)** - Blocks most Phase 1+ tasks
3. **Setup Development Environment** - Ensure Docker Compose works for all team members
4. **Establish Git Workflow** - Branch protection, PR templates, commit conventions

## Suggested Task Assignment

If starting with 2 developers:

**Developer A (Backend Lead)**:
- T01, T02, T05, T07, T08, T10
- Then: T11, T13, T14, T22-T27

**Developer B (Full-stack)**:
- T03, T04, T06, T09
- Then: T12, T15-T21, T28-T31

## Questions for Stakeholders

1. **Social Login Priority**: Should we implement Google/GitHub OAuth in Phase 1 or later?
2. **Payment System**: Is in-game shop/purchases required for MVP?
3. **Anti-cheat**: What level of server-authoritative validation is MVP vs future?
4. **Deployment**: Should we setup staging environment during Phase 0?

---

*Plan Version: 1.0*  
*Created: February 13, 2026*  
*Estimated Duration: 12-14 weeks for Phase 1-4 (API + Database)*
