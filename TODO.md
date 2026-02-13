# Crossfire Web Game - Implementation TODO

> Auto-generated from EXECUTION_PLAN.md
> Track progress by updating status: pending → in_progress → completed

---

## Phase 0: Foundation & Infrastructure

### Wave 1: Project Setup (Parallel - Week 1)

- [ ] **P0-W1-T01** | Create monorepo structure (Turborepo + pnpm)
  - Category: devops | Skills: git-master, bun | Est: 2-3h
  - Files: package.json, turbo.json, pnpm-workspace.yaml, .gitignore

- [ ] **P0-W1-T02** | Setup Docker Compose infrastructure
  - Category: devops | Skills: docker | Est: 3-4h
  - Files: docker-compose.yml, docker-compose.dev.yml, .env.example
  - Services: PostgreSQL 16, TimescaleDB, Redis

- [ ] **P0-W1-T03** | Configure TypeScript with strict mode
  - Category: devops | Skills: bun | Est: 2h
  - Files: tsconfig.json (root + packages), path aliases

- [ ] **P0-W1-T04** | Setup ESLint, Prettier, lint-staged
  - Category: quick | Skills: bun | Est: 2h
  - Files: .eslintrc.js, .prettierrc, .husky/pre-commit

- [ ] **P0-W1-T05** | Create environment config system (Effect Config)
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: packages/shared/src/config/*.ts, .env.example

- [ ] **P0-W1-T06** | Setup GitHub Actions CI/CD
  - Category: devops | Skills: git-master | Est: 3h
  - Files: .github/workflows/ci.yml, .github/workflows/pr.yml

### Wave 2: Database & Shared Package (Week 1-2)

- [ ] **P0-W2-T07** | Implement Prisma schema from database design
  - Category: ultrabrain | Skills: database | Est: 8-10h
  - Files: packages/database/prisma/schema.prisma
  - Tables: users, players, weapons, maps, rooms, matches, leaderboards, achievements + TimescaleDB
  - **BLOCKS**: Most Phase 1+ tasks

- [ ] **P0-W2-T08** | Setup database migrations and seeding
  - Category: devops | Skills: database | Est: 2-3h
  - Files: packages/database/migrations/, scripts/seed.ts
  - **DEPENDS ON**: P0-W2-T07

- [ ] **P0-W2-T09** | Create shared package (types & utilities)
  - Category: quick | Skills: bun | Est: 4-6h
  - Files: packages/shared/src/types/*.ts, packages/shared/src/utils/*.ts

- [ ] **P0-W2-T10** | Setup Effect platform in server
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: apps/server/src/index.ts, services/, layers/, errors/

---

## Phase 1: Authentication & Core Backend

### Wave 3: Better Auth Integration (Week 2)

- [ ] **P1-W3-T11** | Integrate Better Auth with Effect
  - Category: ultrabrain | Skills: effect, bun | Est: 6-8h
  - Files: apps/server/src/auth/*.ts
  - Features: Email/password, JWT tokens, bcrypt hashing
  - **DEPENDS ON**: P0-W2-T07, P0-W2-T10

- [ ] **P1-W3-T12** | Implement Auth REST API endpoints
  - Category: integration | Skills: effect | Est: 6-8h
  - Endpoints: POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/refresh
  - **DEPENDS ON**: P1-W3-T11

- [ ] **P1-W3-T13** | Create Player service layer
  - Category: ultrabrain | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/PlayerService.ts, repositories/PlayerRepository.ts
  - **DEPENDS ON**: P0-W2-T07, P1-W3-T11

- [ ] **P1-W3-T14** | Create Player Stats & Progression services
  - Category: integration | Skills: effect, database | Est: 5-6h
  - Files: apps/server/src/services/PlayerStatsService.ts, ProgressionService.ts
  - **DEPENDS ON**: P1-W3-T13

- [ ] **P1-W3-T15** | Implement Player REST API
  - Category: integration | Skills: effect | Est: 4-5h
  - Endpoints: GET /players/me, PATCH /players/me, GET /players/me/stats
  - **DEPENDS ON**: P1-W3-T13, P1-W3-T14

### Wave 4: Static Data API (Week 2-3)

- [ ] **P1-W4-T16** | Create Weapons & Attachments service
  - Category: integration | Skills: effect, database | Est: 5-6h
  - Files: apps/server/src/services/WeaponService.ts
  - **PARALLEL with Wave 3 after T07**

- [ ] **P1-W4-T17** | Create Maps service
  - Category: quick | Skills: effect, database | Est: 3-4h
  - Files: apps/server/src/services/MapService.ts
  - **PARALLEL with Wave 3 after T07**

- [ ] **P1-W4-T18** | Implement Static Data REST API
  - Category: integration | Skills: effect | Est: 4-5h
  - Endpoints: GET /weapons, GET /weapons/:id, GET /maps, GET /maps/:id
  - **DEPENDS ON**: P1-W4-T16, P1-W4-T17

---

## Phase 2: Core API Development

### Wave 5: Inventory & Loadouts (Week 3-4)

- [ ] **P2-W5-T19** | Create Inventory service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/InventoryService.ts
  - **DEPENDS ON**: P1-W3-T13, P1-W4-T16

- [ ] **P2-W5-T20** | Create Loadout service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/LoadoutService.ts
  - **DEPENDS ON**: P2-W5-T19

- [ ] **P2-W5-T21** | Implement Inventory & Loadout REST API
  - Category: integration | Skills: effect | Est: 5-6h
  - Endpoints: GET /players/me/inventory, GET/POST/PUT/DELETE /players/me/loadouts
  - **DEPENDS ON**: P2-W5-T19, P2-W5-T20

### Wave 6: Match History (Week 3-4) - PARALLEL

- [ ] **P2-W6-T22** | Create Match service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/MatchService.ts
  - **PARALLEL with Wave 5**

- [ ] **P2-W6-T23** | Implement Match History REST API
  - Category: integration | Skills: effect | Est: 4-5h
  - Endpoints: GET /players/me/matches, GET /matches/:id
  - **DEPENDS ON**: P2-W6-T22

### Wave 7: Leaderboards (Week 4) - PARALLEL

- [ ] **P2-W7-T24** | Create Leaderboard service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/LeaderboardService.ts
  - **PARALLEL with Waves 5-6**

- [ ] **P2-W7-T25** | Implement Leaderboard REST API
  - Category: integration | Skills: effect | Est: 3-4h
  - Endpoints: GET /leaderboards/:type, GET /leaderboards/:type/rank
  - **DEPENDS ON**: P2-W7-T24

### Wave 8: Friends & Social (Week 4-5) - PARALLEL

- [ ] **P2-W8-T26** | Create Friends service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/FriendService.ts
  - **PARALLEL with Waves 5-7**

- [ ] **P2-W8-T27** | Implement Friends REST API
  - Category: integration | Skills: effect | Est: 4-5h
  - Endpoints: GET /friends, POST /friends/requests, PUT /friends/requests/:id
  - **DEPENDS ON**: P2-W8-T26

---

## Phase 3: Real-time & WebSocket

### Wave 9: WebSocket Foundation (Week 5)

- [ ] **P3-W9-T28** | Setup Bun WebSocket server with Effect
  - Category: ultrabrain | Skills: effect, bun | Est: 8-10h
  - Files: apps/server/src/websocket/*.ts
  - Features: Connection handling, JWT auth, heartbeat
  - **DEPENDS ON**: P0-W2-T10, P1-W3-T11

- [ ] **P3-W9-T29** | Implement Message Protocol (MessagePack + Effect Schema)
  - Category: integration | Skills: effect | Est: 6-8h
  - Files: packages/shared/src/protocol/*.ts
  - **DEPENDS ON**: P3-W9-T28

### Wave 10: Room System (Week 5-6)

- [ ] **P3-W10-T30** | Create Room service with Redis state
  - Category: ultrabrain | Skills: effect, database | Est: 10-12h
  - Files: apps/server/src/services/RoomService.ts, models/Room.ts
  - **DEPENDS ON**: P1-W4-T17, P3-W9-T28

- [ ] **P3-W10-T31** | Implement Room WebSocket handlers
  - Category: integration | Skills: effect | Est: 6-8h
  - Files: apps/server/src/handlers/room.handler.ts, broadcast/room.broadcast.ts
  - **DEPENDS ON**: P3-W10-T30, P3-W9-T29

### Wave 11: Matchmaking (Week 6) - PARALLEL

- [ ] **P3-W11-T32** | Create Matchmaking service
  - Category: ultrabrain | Skills: effect, database | Est: 8-10h
  - Files: apps/server/src/services/MatchmakingService.ts
  - **PARALLEL with Wave 10**

- [ ] **P3-W11-T33** | Implement Matchmaking REST API
  - Category: integration | Skills: effect | Est: 3-4h
  - Endpoints: POST/DELETE /matchmaking/queue, GET /matchmaking/status
  - **DEPENDS ON**: P3-W11-T32

---

## Phase 4: Game Logic API

### Wave 12: Achievements (Week 6-7) - PARALLEL

- [ ] **P4-W12-T34** | Create Achievement service
  - Category: integration | Skills: effect, database | Est: 6-8h
  - Files: apps/server/src/services/AchievementService.ts
  - **PARALLEL**

- [ ] **P4-W12-T35** | Implement Achievement REST API
  - Category: integration | Skills: effect | Est: 2-3h
  - Endpoints: GET /achievements, GET /players/me/achievements
  - **DEPENDS ON**: P4-W12-T34

### Wave 13: Telemetry & Admin (Week 7) - PARALLEL

- [ ] **P4-W13-T36** | Create Telemetry service (TimescaleDB)
  - Category: ultrabrain | Skills: database | Est: 6-8h
  - Files: apps/server/src/services/TelemetryService.ts
  - **PARALLEL**

- [ ] **P4-W13-T37** | Implement Admin REST API
  - Category: integration | Skills: effect | Est: 4-5h
  - Endpoints: GET /admin/players, PUT /admin/players/:id/ban, GET /admin/metrics
  - **PARALLEL**

---

## Phase 5: Frontend Foundation (Later)

### Wave 14: Client Setup (Week 7-8)

- [ ] **P5-W14-T38** | Setup Vite + React
  - Category: visual-engineering | Skills: bun | Est: 4-6h

- [ ] **P5-W14-T39** | Create UI component library
  - Category: visual-engineering | Skills: bun | Est: 8-10h

- [ ] **P5-W14-T40** | Implement Authentication UI
  - Category: visual-engineering | Skills: bun | Est: 6-8h

### Wave 15: Game Client (Week 8-10)

- [ ] **P5-W15-T41** | Three.js integration (React Three Fiber)
  - Category: ultrabrain | Skills: visual-engineering | Est: 12-15h

- [ ] **P5-W15-T42** | WebSocket client implementation
  - Category: integration | Skills: bun | Est: 6-8h

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Tasks | 42 |
| Phase 0 Tasks | 10 |
| Phase 1 Tasks | 8 |
| Phase 2 Tasks | 8 |
| Phase 3 Tasks | 6 |
| Phase 4 Tasks | 4 |
| Phase 5 Tasks | 6 |

### Priority Breakdown
- P0 (Critical): 18 tasks
- P1 (High): 12 tasks  
- P2 (Medium): 4 tasks

### Category Breakdown
- ultrabrain: 10 tasks
- integration: 24 tasks
- devops: 6 tasks
- quick: 6 tasks
- visual-engineering: 8 tasks

### Estimated Total Effort
- **Phase 0-4 (API + Database)**: ~200-240 hours (~12-14 weeks)
- **Phase 5 (Frontend)**: ~60-80 hours (~4-5 weeks)
- **Total Project**: ~260-320 hours (~16-19 weeks with 2 developers)

---

## Quick Start Guide

### Immediate Next Steps (Week 1)

1. **Assign Team Members**
   - Backend Developer: T01-T10, T11-T27, T28-T37
   - Frontend Developer: T38-T42 (starts Week 7+)

2. **Start Parallel Tasks (Day 1)**
   - Developer A: T01 (Monorepo) + T02 (Docker) + T05 (Config)
   - Developer B: T03 (TypeScript) + T04 (Linting) + T06 (CI/CD)

3. **Week 1 End Goal**
   - Docker Compose running (PostgreSQL + Redis)
   - TypeScript building
   - Prisma schema designed
   - CI/CD pipeline passing

### Critical Path Tasks (Must Complete in Order)

```
T07 (Prisma Schema) 
  → T11 (Better Auth)
    → T13 (Player Service)
      → T19 (Inventory)
        → T28 (WebSocket)
          → T30 (Rooms)
            → T42 (Game Client)
```

**Critical Path Duration**: ~8-9 weeks minimum

---

## Task Status Key

- `pending` - Not started
- `in_progress` - Currently being worked on
- `completed` - Done and tested
- `blocked` - Waiting on dependency

## Skills Reference

- `git-master` - Version control, branching, PRs
- `librarian` - Documentation, research
- `playwright` - Testing, browser automation
- `database` - PostgreSQL, Prisma, SQL, TimescaleDB
- `effect` - Effect framework, functional programming
- `bun` - Bun runtime, TypeScript
- `docker` - Containerization, Docker Compose

---

*TODO List Version: 1.0*  
*Generated from: EXECUTION_PLAN.md*  
*Last Updated: February 13, 2026*
