# Crossfire Web Game - Implementation TODO

> Auto-generated from EXECUTION_PLAN.md v2.1
> Track progress by updating status: pending → in_progress → completed

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL 18.2 (UUID v7) |
| Query Builder | Kysely 0.28.11 |
| Migrations | golang-migrate 4.19.x |
| Monorepo | Moonrepo |
| Linting | oxlint 1.47.0 |
| Formatting | oxfmt 0.32.0 |
| Runtime | Bun 1.3.9 |
| Framework | Effect 3.19.16 |

---

## Phase 0: Foundation & Infrastructure

### Wave 1: Project Setup (Parallel - Week 1)

- [ ] **P0-W1-T01** | Create monorepo structure (Moonrepo + Bun)
  - Category: devops | Skills: git-master, bun | Est: 2-3h
  - Files: package.json, .moon/workspace.yml, .moon/toolchains.yml, .moon/tasks/all.yml

- [ ] **P0-W1-T02** | Setup Docker Compose infrastructure
  - Category: devops | Skills: docker | Est: 3-4h
  - Services: PostgreSQL 18, TimescaleDB, Redis
  - **Key**: Use PostgreSQL 18 for UUID v7 support

- [ ] **P0-W1-T03** | Configure TypeScript with strict mode
  - Category: devops | Skills: bun | Est: 2h
  - Files: tsconfig.json (root + packages)

- [ ] **P0-W1-T04** | Setup oxlint and oxfmt (replaces ESLint/Prettier)
  - Category: quick | Skills: bun | Est: 2h
  - Files: oxlint.config.ts, .oxfmtrc.json, .husky/pre-commit
  - **Note**: 10-100x faster than ESLint/Prettier

- [ ] **P0-W1-T05** | Create environment config system (Effect Config)
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: packages/shared/src/config/*.ts

- [ ] **P0-W1-T06** | Setup GitHub Actions CI/CD
  - Category: devops | Skills: git-master | Est: 3h
  - Files: .github/workflows/ci.yml, pr.yml

### Wave 2: Database & Shared Package (Week 1-2)

- [ ] **P0-W2-T07** | Implement Kysely schema + SQL migrations
  - Category: ultrabrain | Skills: database | Est: 8-10h
  - Files: packages/database/migrations/*.sql, packages/database/src/types.ts
  - **Key**: Use uuidv7() for primary keys, kysely-codegen for types
  - **BLOCKS**: Most Phase 1+ tasks

- [ ] **P0-W2-T08** | Setup golang-migrate for migrations
  - Category: devops | Skills: database | Est: 2-3h
  - Files: packages/database/scripts/migrate.sh, seed.ts
  - **Install**: `brew install golang-migrate`
  - **DEPENDS ON**: P0-W2-T07

- [ ] **P0-W2-T09** | Create shared package (types & utilities)
  - Category: quick | Skills: bun | Est: 4-6h
  - Files: packages/shared/src/types/*.ts

- [ ] **P0-W2-T10** | Setup Effect platform in server
  - Category: ultrabrain | Skills: effect | Est: 4-5h
  - Files: apps/server/src/index.ts, services/, layers/

---

## Phase 1: Authentication & Core Backend

### Wave 3: Better Auth Integration (Week 2)

- [ ] **P1-W3-T11** | Integrate Better Auth with Effect + Kysely
  - Category: ultrabrain | Skills: effect, bun | Est: 6-8h
  - **DEPENDS ON**: P0-W2-T07, P0-W2-T10

- [ ] **P1-W3-T12** | Implement Auth REST API endpoints
  - Category: integration | Skills: effect | Est: 6-8h
  - Endpoints: POST /auth/register, login, logout, refresh

- [ ] **P1-W3-T13** | Create Player service layer (Kysely)
  - Category: ultrabrain | Skills: effect, database | Est: 6-8h

- [ ] **P1-W3-T14** | Create Player Stats & Progression services
  - Category: integration | Skills: effect, database | Est: 5-6h

- [ ] **P1-W3-T15** | Implement Player REST API
  - Category: integration | Skills: effect | Est: 4-5h

### Wave 4: Static Data API (Week 2-3)

- [ ] **P1-W4-T16** | Create Weapons & Attachments service
  - Category: integration | Skills: effect, database | Est: 5-6h
  - **PARALLEL with Wave 3 after T07**

- [ ] **P1-W4-T17** | Create Maps service
  - Category: quick | Skills: effect, database | Est: 3-4h

- [ ] **P1-W4-T18** | Implement Static Data REST API
  - Category: integration | Skills: effect | Est: 4-5h

---

## Phase 2: Core API Development

### Wave 5: Inventory & Loadouts (Week 3-4)

- [ ] **P2-W5-T19** | Create Inventory service (Kysely)
  - Category: integration | Est: 6-8h

- [ ] **P2-W5-T20** | Create Loadout service
  - Category: integration | Est: 6-8h

- [ ] **P2-W5-T21** | Implement Inventory & Loadout REST API
  - Category: integration | Est: 5-6h

### Wave 6: Match History (Week 3-4) - PARALLEL

- [ ] **P2-W6-T22** | Create Match service
  - Category: integration | Est: 6-8h

- [ ] **P2-W6-T23** | Implement Match History REST API
  - Category: integration | Est: 4-5h

### Wave 7: Leaderboards (Week 4) - PARALLEL

- [ ] **P2-W7-T24** | Create Leaderboard service
  - Category: integration | Est: 6-8h

- [ ] **P2-W7-T25** | Implement Leaderboard REST API
  - Category: integration | Est: 3-4h

### Wave 8: Friends & Social (Week 4-5) - PARALLEL

- [ ] **P2-W8-T26** | Create Friends service
  - Category: integration | Est: 6-8h

- [ ] **P2-W8-T27** | Implement Friends REST API
  - Category: integration | Est: 4-5h

---

## Phase 3: Real-time & WebSocket

### Wave 9: WebSocket Foundation (Week 5)

- [ ] **P3-W9-T28** | Setup Bun WebSocket server with Effect
  - Category: ultrabrain | Est: 8-10h

- [ ] **P3-W9-T29** | Implement Message Protocol (MessagePack)
  - Category: integration | Est: 6-8h

### Wave 10: Room System (Week 5-6)

- [ ] **P3-W10-T30** | Create Room service with Redis state
  - Category: ultrabrain | Est: 10-12h

- [ ] **P3-W10-T31** | Implement Room WebSocket handlers
  - Category: integration | Est: 6-8h

### Wave 11: Matchmaking (Week 6) - PARALLEL

- [ ] **P3-W11-T32** | Create Matchmaking service
  - Category: ultrabrain | Est: 8-10h

- [ ] **P3-W11-T33** | Implement Matchmaking REST API
  - Category: integration | Est: 3-4h

---

## Phase 4: Game Logic API

### Wave 12: Achievements (Week 6-7) - PARALLEL

- [ ] **P4-W12-T34** | Create Achievement service
  - Category: integration | Est: 6-8h

- [ ] **P4-W12-T35** | Implement Achievement REST API
  - Category: integration | Est: 2-3h

### Wave 13: Telemetry & Admin (Week 7) - PARALLEL

- [ ] **P4-W13-T36** | Create Telemetry service (TimescaleDB)
  - Category: ultrabrain | Est: 6-8h

- [ ] **P4-W13-T37** | Implement Admin REST API
  - Category: integration | Est: 4-5h

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

| Metric | Count |
|--------|-------|
| Total Tasks | 42 |
| Phase 0 Tasks | 10 |
| Phase 1 Tasks | 8 |
| Phase 2 Tasks | 9 |
| Phase 3 Tasks | 6 |
| Phase 4 Tasks | 4 |
| Phase 5 Tasks | 6 |

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

## Key Changes from v1.0

| Old | New | Reason |
|-----|-----|--------|
| PostgreSQL 16 | PostgreSQL 18.2 | UUID v7, better performance |
| Prisma | Kysely 0.28.x + golang-migrate 4.19.x | More control, SQL-first |
| Turborepo | Moonrepo | Better Bun support, task inheritance |
| ESLint/Prettier | oxlint 1.47.x/oxfmt 0.32.x | 10-100x faster |
| React 18 | React 19 | Latest features |
| Vite 5 | Vite 7 | Latest features |

---

*TODO List Version: 2.2*  
*Generated from: EXECUTION_PLAN.md v2.2*  
*Last Updated: February 2026*
