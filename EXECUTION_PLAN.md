# Crossfire Web Game - Execution Plan v2.3

> API + Database first, with early real-time risk reduction for server-authoritative FPS gameplay.

---

## 1. Executive Summary

- **Project**: Crossfire browser-based multiplayer FPS
- **Approach**: Backend/API-first, but **real-time core starts in parallel from Week 4**
- **Team Size**: 2-3 developers
- **Calendar Estimate**: **12-14 weeks remaining** (Phases 1-5)
- **Critical Path Estimate**: **10-11 weeks**

### Current Progress (as of February 15, 2026)

- **Delivery Progress**: `18/42` tasks implemented (Phase 0 + Phase 1 delivered)
- **Gate-Verified Progress**: `16/42` tasks fully verified against architecture quality gates
- **Phase 0 Status**: Implemented, with **3 corrective actions still pending** (`C01-C03`)

---

## 2. Big-Picture Solution Architecture

### 2.1 System Context

```text
Browser Client (React + Three.js + Zustand)
  ├─ REST (auth/profile/static/inventory)
  └─ WebSocket + MessagePack (room/match/gameplay)

Bun + Effect Backend
  ├─ API Modules (auth, player, inventory, loadout, social, leaderboard)
  ├─ Real-time Modules (room, matchmaking, match, game-state)
  ├─ Domain Event Bus (typed events)
  └─ Outbox/Event Dispatcher (idempotent delivery)

Data Layer
  ├─ PostgreSQL 18.x (system of record)
  ├─ Redis 8.x (ephemeral real-time state + queues)
  └─ TimescaleDB extension (telemetry hypertables)
```

### 2.2 Architecture Principles

- **Clean Architecture**: Domain -> Application -> Infrastructure -> Presentation
- **Server Authoritative**: server validates movement/combat/match outcomes
- **Event-Driven Integration**: domain events via outbox and idempotent consumers
- **Type Safety First**: strict TypeScript, typed Effect errors, no `any`
- **Observability by Default**: logs, metrics, health probes, traceable request/game IDs

### 2.3 Real-Time Engineering Constraints

- **Simulation tick**: 30 Hz authoritative game loop
- **State broadcast**: 20 Hz delta updates
- **Input buffer window**: 100-150 ms
- **Latency target**: p95 < 120 ms end-to-end input-to-ack
- **Server budget**: match update frame < 16 ms p95

---

## 3. Architecture Gaps Found and Corrective Actions

These actions are mandatory before Phase 1 is marked complete.

### C01 - UUIDv7 Consistency

- **Problem**: Plan requires UUIDv7, migrations still default to `gen_random_uuid()`.
- **Action**:
  1. Add migration to introduce UUIDv7 defaults for target tables.
  2. Confirm `uuidv7()` support in runtime DB image.
  3. Update codegen/types and seed scripts.
- **Owner**: Backend + Database
- **ETA**: 0.5 day

### C02 - Timescale Bootstrap Consistency

- **Problem**: Plan references `docker/postgres/init/02-timescaledb.sql`, file is absent.
- **Action**:
  1. Either create `02-timescaledb.sql` or remove reference and keep single source in `01-extensions.sql`.
  2. Convert telemetry tables to hypertables with explicit migration.
- **Owner**: Backend + DevOps
- **ETA**: 0.5 day

### C03 - Event Delivery Contract

- **Problem**: Event-driven architecture is stated but no operational contract.
- **Action**:
  1. Add outbox table + dispatcher.
  2. Add consumer idempotency key strategy.
  3. Define retry/backoff and dead-letter policy.
- **Owner**: Backend
- **ETA**: 1 day

---

## 4. Updated Delivery Model

### 4.1 Phase Map (Calendar)

| Phase | Focus                             | Duration                           | Calendar Window                  | Exit Gate                                    |
| ----- | --------------------------------- | ---------------------------------- | -------------------------------- | -------------------------------------------- |
| 0     | Foundation & infra hardening      | 1 week (already delivered + fixes) | Week 1-2 (done), fixes in Week 3 | C01-C03 complete                             |
| 1     | Auth + Player + Static Data APIs  | 2-3 weeks                          | Week 3-5                         | secure auth + profile APIs + tests           |
| 2     | Core economy APIs                 | 2-3 weeks                          | Week 5-7                         | inventory/loadout/match-history stable       |
| 3     | Real-time platform                | 3 weeks                            | Week 4-8 (overlap)               | WS protocol + room + matchmaking load-tested |
| 4     | Game logic services               | 2 weeks                            | Week 8-9                         | achievements + telemetry + admin controls    |
| 5     | Frontend foundation + integration | 3 weeks                            | Week 10-12                       | playable vertical slice                      |

### 4.2 Why This Model

- Keeps API-first direction.
- Starts real-time work earlier to reduce late-stage architecture risk.
- Aligns better with FPS dependency reality (simulation/networking cannot be a late add-on).

---

## 5. Detailed Task Plan (42 Base Tasks + 3 Phase-Gate Fixes)

## Phase 0 - Foundation & Infrastructure (10/10 delivered, with corrective gate)

### Wave 1 (Delivered)

- [x] `P0-W1-T01` Monorepo structure (Moonrepo + Bun workspaces)
- [x] `P0-W1-T02` Docker infrastructure (PostgreSQL 18 + Redis 8 + Timescale extension)
- [x] `P0-W1-T03` TypeScript strict configuration
- [x] `P0-W1-T04` Code quality tooling (oxlint + oxfmt)
- [x] `P0-W1-T05` Effect configuration system
- [x] `P0-W1-T06` CI/CD baseline

### Wave 2 (Delivered)

- [x] `P0-W2-T07` Kysely schema + migrations
- [x] `P0-W2-T08` golang-migrate workflow
- [x] `P0-W2-T09` Shared package (types/utilities/constants)
- [x] `P0-W2-T10` Effect platform bootstrap

### Phase 0 Gate Fixes (must be done before Phase 1 sign-off)

- [ ] `P0-GATE-C01` UUIDv7 migration consistency (see C01)
- [ ] `P0-GATE-C02` Timescale bootstrap + hypertable consistency (see C02)
- [ ] `P0-GATE-C03` Outbox/event delivery contract (see C03)

---

## Phase 1 - Authentication & Core Backend (8 tasks)

### Phase 1 Completion Checklist

- [x] `P1-W3-T11` Better Auth integration with Effect + Kysely
- [x] `P1-W3-T12` Auth REST endpoints
- [x] `P1-W3-T13` Player application service
- [x] `P1-W3-T14` Player stats + progression service
- [x] `P1-W3-T15` Player REST endpoints
- [x] `P1-W4-T16` Weapons + attachments service
- [x] `P1-W4-T17` Maps service
- [x] `P1-W4-T18` Static data REST endpoints

| Task ID     | Scope                                        | Depends On    | Est. | Acceptance Criteria                                          |
| ----------- | -------------------------------------------- | ------------- | ---- | ------------------------------------------------------------ |
| `P1-W3-T11` | Better Auth integration with Effect + Kysely | T07, T10, C01 | 1.5d | register/login/refresh/logout flows pass integration tests   |
| `P1-W3-T12` | Auth REST endpoints                          | T11           | 1.5d | `/api/auth/*` endpoints validated with schema + typed errors |
| `P1-W3-T13` | Player application service                   | T07, T11      | 1.5d | profile create/read/update with domain validation            |
| `P1-W3-T14` | Player stats + progression service           | T13           | 1d   | stats/progression reads+writes and level-up logic tested     |
| `P1-W3-T15` | Player REST endpoints                        | T13, T14      | 1d   | `/api/players/me`, `/api/players/me/stats` stable            |
| `P1-W4-T16` | Weapons + attachments service                | T07           | 1d   | static weapon catalog and attachment queries                 |
| `P1-W4-T17` | Maps service                                 | T07           | 0.5d | active map catalog API-ready                                 |
| `P1-W4-T18` | Static data REST endpoints                   | T16, T17      | 1d   | `/api/weapons`, `/api/maps` documented + tested              |

**Phase 1 Exit Gate**

- [x] Auth security/flow tests pass (invalid token, revoked token, session refresh/logout paths).
- [x] Player read endpoints validated via local e2e + curl smoke tests.
- [x] Unit + e2e + curl suites added for auth/player/static data workflows.

**Phase 1 Status**: ✅ Complete (auth + player + static data services and APIs implemented with unit/e2e/curl coverage)

---

## Phase 2 - Core API Development (9 tasks)

| Task ID     | Scope                               | Depends On | Est. | Acceptance Criteria                                   |
| ----------- | ----------------------------------- | ---------- | ---- | ----------------------------------------------------- |
| `P2-W5-T19` | Inventory service                   | T13, T16   | 1.5d | ownership, acquisition, and validation rules enforced |
| `P2-W5-T20` | Loadout service                     | T19        | 1.5d | slot rules and weapon compatibility validation        |
| `P2-W5-T21` | Inventory + loadout REST API        | T19, T20   | 1d   | CRUD + validation error contracts complete            |
| `P2-W6-T22` | Match service (history and summary) | T13        | 1.5d | match result persistence + query pagination           |
| `P2-W6-T23` | Match history REST API              | T22        | 1d   | `/api/matches`, `/api/matches/:id` stable             |
| `P2-W7-T24` | Leaderboard service                 | T22        | 1.5d | ranking computation and seasonal partitioning         |
| `P2-W7-T25` | Leaderboard REST API                | T24        | 0.5d | global + mode-specific endpoints                      |
| `P2-W8-T26` | Friends service                     | T13        | 1.5d | friend request/accept/remove with blocking checks     |
| `P2-W8-T27` | Friends REST API                    | T26        | 1d   | social endpoints and permission checks complete       |

**Phase 2 Exit Gate**

- Transactional integrity for inventory/loadout updates.
- Match/leaderboard queries indexed and benchmarked.
- API backward compatibility documented.

---

## Phase 3 - Real-time & WebSocket (6 tasks, starts in Week 4)

| Task ID      | Scope                                       | Depends On | Est. | Acceptance Criteria                                       |
| ------------ | ------------------------------------------- | ---------- | ---- | --------------------------------------------------------- |
| `P3-W9-T28`  | Bun WebSocket gateway with Effect           | T10, C03   | 2d   | authenticated WS sessions, heartbeat, backpressure policy |
| `P3-W9-T29`  | Message protocol (MessagePack + versioning) | T28        | 1.5d | protocol schema v1 + compatibility tests                  |
| `P3-W10-T30` | Room service (Redis-backed state)           | T28, T29   | 2d   | create/join/leave/ready/start with ownership rules        |
| `P3-W10-T31` | Room WS handlers                            | T30        | 1.5d | stable room event routing and broadcast fan-out           |
| `P3-W11-T32` | Matchmaking service                         | T30        | 2d   | queue + match assignment with timeout/cancel support      |
| `P3-W11-T33` | Matchmaking REST API                        | T32        | 0.5d | enqueue/dequeue/status endpoints                          |

**Phase 3 Exit Gate**

- Soak test: >=1,000 concurrent WS sessions in dev perf env.
- Room lifecycle recovery on disconnect/reconnect verified.
- Protocol contract tests pass for malformed/outdated messages.

---

## Phase 4 - Game Logic API (4 tasks)

| Task ID      | Scope                                     | Depends On    | Est. | Acceptance Criteria                             |
| ------------ | ----------------------------------------- | ------------- | ---- | ----------------------------------------------- |
| `P4-W12-T34` | Achievement service                       | T22, T24      | 1.5d | rule engine for unlock progression              |
| `P4-W12-T35` | Achievement REST API                      | T34           | 0.5d | unlock/progress read endpoints                  |
| `P4-W13-T36` | Telemetry service (Timescale hypertables) | C02, T28, T22 | 2d   | ingest pipeline with retention and aggregations |
| `P4-W13-T37` | Admin REST API                            | T36, T24      | 1d   | metrics, moderation, and audit-safe actions     |

**Phase 4 Exit Gate**

- Telemetry ingestion p95 < 100 ms.
- Data retention jobs tested.
- Admin endpoints protected with RBAC and audit logs.

---

## Phase 5 - Frontend Foundation (5 tasks)

| Task ID      | Scope                                         | Depends On         | Est. | Acceptance Criteria                          |
| ------------ | --------------------------------------------- | ------------------ | ---- | -------------------------------------------- |
| `P5-W14-T38` | Vite + React app hardening                    | T01                | 1d   | app shell, routing, env wiring complete      |
| `P5-W14-T39` | UI component system                           | T38                | 2d   | reusable HUD/menu/form primitives            |
| `P5-W14-T40` | Authentication UI                             | T12, T38           | 1.5d | register/login/session refresh UX functional |
| `P5-W15-T41` | Three.js integration                          | T38                | 2.5d | render loop + scene bootstrap + controls     |
| `P5-W15-T42` | WebSocket client + vertical slice integration | T29, T31, T40, T41 | 2.5d | auth -> lobby -> room playable end-to-end    |

**Phase 5 Exit Gate**

- User can authenticate, enter lobby, join room, and receive live room updates.
- Frontend smoke tests green on Chrome + Firefox.
- No P0/P1 defects in vertical slice.

---

## 6. Critical Path (Updated)

```text
T01 -> T07 -> C01 -> T11 -> T12 -> T28 -> T29 -> T30 -> T31 -> T42
```

- **Critical Path Duration**: ~10-11 weeks
- **Full Scope Duration**: ~12-14 weeks

---

## 7. Dependency Graph (Condensed)

```text
Foundation: T01..T10
Gate fixes: C01, C02, C03

Auth track:
C01 -> T11 -> T12 -> T13 -> T14 -> T15

Economy/API track:
T13 -> T19 -> T20 -> T21
T13 -> T22 -> T23 -> T24 -> T25
T13 -> T26 -> T27

Realtime track:
C03 -> T28 -> T29 -> T30 -> T31 -> T32 -> T33

Telemetry/Admin:
C02 -> T36 -> T37

Frontend track:
T38 -> T39 -> T40
T41 + (T29,T31,T40) -> T42
```

---

## 8. Quality Gates and Definition of Done

A task is done only when all are true:

- Implementation merged with conventional commits.
- Typecheck, lint, format, tests all pass in CI.
- Error handling uses typed Effect errors.
- API contracts validated (schema tests).
- Observability added (structured logs + key metrics).
- Documentation updated for public contracts.

Phase-level mandatory gates:

- **Coverage**: >=80% for business logic in touched modules.
- **Performance**:
  - REST read endpoints p95 < 250 ms.
  - WS broadcast loop stable under defined load.
- **Security**:
  - auth/session flows validated with negative tests.
  - admin/moderation actions are RBAC-protected and auditable.

---

## 9. Primary Risks and Mitigations

| Risk                                    | Impact | Mitigation                                            |
| --------------------------------------- | ------ | ----------------------------------------------------- |
| Late discovery of real-time bottlenecks | High   | Start Phase 3 in Week 4, run soak tests early         |
| Event delivery duplication/loss         | High   | Outbox + idempotency + DLQ policy (C03)               |
| UUID strategy drift across services     | Medium | Complete C01 before Phase 1 sign-off                  |
| Telemetry schema growth cost            | Medium | Timescale hypertables + retention + rollups           |
| API/frontend contract drift             | Medium | typed shared contracts + contract tests per milestone |

---

## 10. Milestone Checklist

- [ ] `M1` Foundation Gate Closed (C01-C03 done)
- [ ] `M2` Auth + Player APIs Production-Ready
- [ ] `M3` Core Economy APIs Stable
- [ ] `M4` Realtime Room + Matchmaking Stable
- [ ] `M5` Telemetry + Admin Operational
- [ ] `M6` Frontend Vertical Slice Playable

---

_Plan Version: 2.3_  
_Updated: February 15, 2026_  
_Previous Version: 2.2_  
_Remaining Duration Estimate: 12-14 weeks_
