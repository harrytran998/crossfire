# Development Roadmap

## Crossfire Web Game - Implementation Phases

---

## 1. Overview

This document outlines the phased development plan for the Crossfire web game, from initial setup to full production release.

**Total Estimated Timeline**: 4-6 months
**Team Size**: 2-4 developers

---

## 2. Phase 0: Foundation (Week 1-2)

### Goals

- Project setup and tooling
- Development environment
- Basic infrastructure

### Tasks

#### Week 1: Project Setup

| Task                      | Description               | Assignee | Status |
| ------------------------- | ------------------------- | -------- | ------ |
| Initialize monorepo       | Turborepo/pnpm workspaces | Backend  | ✅     |
| Setup TypeScript          | Shared types, strict mode | All      | ✅     |
| Configure ESLint/Prettier | Code quality tools        | All      | ✅     |
| Setup Bun runtime         | Server runtime            | Backend  | ✅     |
| Initialize Effect         | Functional framework      | Backend  | ⬜     |
| Create shared package     | Types, utilities          | All      | ⬜     |

#### Week 2: Development Environment

| Task                 | Description             | Assignee | Status |
| -------------------- | ----------------------- | -------- | ------ |
| Docker Compose setup | Postgres, Redis, server | Backend  | ⬜     |
| Prisma schema        | Initial database schema | Backend  | ⬜     |
| Redis connection     | Cache layer setup       | Backend  | ⬜     |
| Vite + React setup   | Frontend scaffold       | Frontend | ⬜     |
| Three.js integration | Basic 3D scene          | Frontend | ⬜     |
| GitHub Actions       | CI/CD pipeline          | DevOps   | ⬜     |

### Deliverables

- [ ] Working development environment
- [ ] Database schema deployed locally
- [ ] Basic project structure

---

## 3. Phase 1: Authentication & Core Backend (Week 3-5)

### Goals

- User authentication system
- Player profile management
- Basic REST API

### Tasks

#### Week 3: Authentication

| Task              | Description              | Priority |
| ----------------- | ------------------------ | -------- |
| User registration | Email/password signup    | P0       |
| Password hashing  | bcrypt implementation    | P0       |
| JWT token system  | Access + refresh tokens  | P0       |
| Login/logout      | Session management       | P0       |
| Effect services   | Auth service with Effect | P0       |
| Rate limiting     | Prevent abuse            | P1       |

#### Week 4: Player System

| Task                | Description          | Priority |
| ------------------- | -------------------- | -------- |
| Player profile      | Display name, avatar | P0       |
| Player statistics   | Stats model          | P0       |
| XP/Level system     | Basic progression    | P1       |
| Database migrations | Prisma migrations    | P0       |

#### Week 5: API Development

| Task               | Description           | Priority |
| ------------------ | --------------------- | -------- |
| REST API structure | Effect HTTP server    | P0       |
| Player endpoints   | GET/PATCH /players/me | P0       |
| Error handling     | Effect error types    | P0       |
| API documentation  | OpenAPI spec          | P1       |
| Integration tests  | Vitest tests          | P1       |

### Deliverables

- [ ] Working authentication system
- [ ] Player CRUD operations
- [ ] Tested REST API

---

## 4. Phase 2: WebSocket & Room System (Week 6-8)

### Goals

- Real-time communication
- Room/lobby management
- Matchmaking basics

### Tasks

#### Week 6: WebSocket Foundation

| Task                 | Description               | Priority |
| -------------------- | ------------------------- | -------- |
| Bun WebSocket server | Native WS implementation  | P0       |
| Connection handling  | Connect/disconnect events | P0       |
| Message protocol     | MessagePack encoding      | P0       |
| Heartbeat system     | Connection keepalive      | P0       |
| Authentication       | WS token validation       | P0       |

#### Week 7: Room System

| Task          | Description                | Priority |
| ------------- | -------------------------- | -------- |
| Room creation | Create game room           | P0       |
| Room joining  | Join with/without password | P0       |
| Room state    | Player list, ready status  | P0       |
| Room leaving  | Graceful disconnect        | P0       |
| Room cleanup  | Empty room removal         | P1       |

#### Week 8: Room Features

| Task            | Description             | Priority |
| --------------- | ----------------------- | -------- |
| Team assignment | Team 1 / Team 2         | P0       |
| Ready system    | All players ready check | P0       |
| Host controls   | Kick, settings change   | P1       |
| Chat system     | Basic text chat         | P1       |
| Room list       | Browse available rooms  | P0       |

### Deliverables

- [ ] Working WebSocket server
- [ ] Functional room system
- [ ] Basic matchmaking

---

## 5. Phase 3: Game Engine Core (Week 9-12)

### Goals

- 3D rendering pipeline
- Player movement
- Physics integration

### Tasks

#### Week 9: Three.js Setup

| Task         | Description          | Priority |
| ------------ | -------------------- | -------- |
| Scene setup  | Camera, lighting     | P0       |
| Player model | Basic character mesh | P0       |
| Map loading  | GLTF model loading   | P0       |
| First map    | Simple test map      | P0       |

#### Week 10: Player Controller

| Task          | Description       | Priority |
| ------------- | ----------------- | -------- |
| WASD movement | Basic movement    | P0       |
| Mouse look    | Camera rotation   | P0       |
| Jump/crouch   | Vertical movement | P0       |
| Sprint        | Speed modifier    | P1       |
| Pointer lock  | Mouse capture     | P0       |

#### Week 11: Physics Integration

| Task                | Description          | Priority |
| ------------------- | -------------------- | -------- |
| Rapier.js setup     | Physics engine       | P0       |
| Collision detection | Basic collisions     | P0       |
| Ground detection    | Standing on surfaces | P0       |
| Gravity             | Realistic falling    | P0       |

#### Week 12: Network Synchronization

| Task                  | Description              | Priority |
| --------------------- | ------------------------ | -------- |
| State serialization   | Player state             | P0       |
| Client prediction     | Immediate local movement | P0       |
| Server reconciliation | State correction         | P0       |
| Entity interpolation  | Smooth remote players    | P0       |
| Tick system           | Fixed update rate        | P0       |

### Deliverables

- [ ] Working 3D player controller
- [ ] Networked movement
- [ ] Basic map

---

## 6. Phase 4: Combat System (Week 13-16)

### Goals

- Weapon system
- Shooting mechanics
- Hit detection

### Tasks

#### Week 13: Weapon System

| Task             | Description       | Priority |
| ---------------- | ----------------- | -------- |
| Weapon data      | Database schema   | P0       |
| Weapon models    | 3D meshes         | P1       |
| Weapon switching | Quick switch      | P0       |
| Weapon stats     | Damage, fire rate | P0       |

#### Week 14: Shooting

| Task               | Description           | Priority |
| ------------------ | --------------------- | -------- |
| Raycasting         | Hit detection         | P0       |
| Fire rate limiting | Per-weapon rate       | P0       |
| Ammo system        | Magazine, reload      | P0       |
| Recoil             | Visual recoil pattern | P1       |

#### Week 15: Damage System

| Task               | Description           | Priority |
| ------------------ | --------------------- | -------- |
| Hit zones          | Head, body, limbs     | P0       |
| Damage calculation | Multipliers, armor    | P0       |
| Death/respawn      | Player death handling | P0       |
| Kill feed          | Kill notifications    | P1       |

#### Week 16: Network Combat

| Task                 | Description              | Priority |
| -------------------- | ------------------------ | -------- |
| Server-authoritative | Server validates hits    | P0       |
| Lag compensation     | Backwards reconciliation | P0       |
| Hit confirmation     | Visual/audio feedback    | P0       |
| Anti-cheat basics    | Impossible values check  | P1       |

### Deliverables

- [ ] Working weapon system
- [ ] Server-validated combat
- [ ] Kill/death system

---

## 7. Phase 5: Game Modes (Week 17-20)

### Goals

- Team Deathmatch
- Free for All
- Match end handling

### Tasks

#### Week 17: TDM

| Task              | Description         | Priority |
| ----------------- | ------------------- | -------- |
| Team spawn points | Separate spawns     | P0       |
| Team scoring      | Kill count per team | P0       |
| Win conditions    | Score/time limit    | P0       |
| Team balance      | Auto-balance option | P1       |

#### Week 18: FFA

| Task                | Description    | Priority |
| ------------------- | -------------- | -------- |
| Free spawn          | Random spawns  | P0       |
| Individual scoring  | Personal kills | P0       |
| Leaderboard display | Top players    | P0       |

#### Week 19: Match Flow

| Task           | Description        | Priority |
| -------------- | ------------------ | -------- |
| Match start    | Countdown, spawn   | P0       |
| Match end      | Results screen     | P0       |
| XP calculation | Post-match rewards | P0       |
| Stats update   | Database updates   | P0       |

#### Week 20: Polish

| Task           | Description         | Priority |
| -------------- | ------------------- | -------- |
| UI/HUD         | Health, ammo, score | P0       |
| Sound effects  | Gunfire, footsteps  | P1       |
| Visual effects | Muzzle flash, hits  | P1       |
| Match history  | Store results       | P0       |

### Deliverables

- [ ] Playable TDM mode
- [ ] Playable FFA mode
- [ ] Complete match lifecycle

---

## 8. Phase 6: Social & Progression (Week 21-24)

### Goals

- Friend system
- Leaderboards
- Achievements
- Loadout system

### Tasks

#### Week 21: Social Features

| Task           | Description        | Priority |
| -------------- | ------------------ | -------- |
| Friend list    | Add/remove friends | P1       |
| Friend status  | Online/offline     | P1       |
| Invite to room | Direct invites     | P1       |

#### Week 22: Leaderboards

| Task                    | Description      | Priority |
| ----------------------- | ---------------- | -------- |
| Leaderboard calculation | Background job   | P1       |
| Leaderboard display     | Top players      | P1       |
| Player rank             | Personal ranking | P1       |

#### Week 23: Achievements

| Task                | Description   | Priority |
| ------------------- | ------------- | -------- |
| Achievement system  | Unlock logic  | P2       |
| Achievement display | Badges/titles | P2       |
| Achievement rewards | XP bonuses    | P2       |

#### Week 24: Loadouts

| Task              | Description         | Priority |
| ----------------- | ------------------- | -------- |
| Loadout system    | Multiple loadouts   | P1       |
| Weapon unlocks    | Level-based         | P1       |
| Loadout selection | Pre-match selection | P1       |

### Deliverables

- [ ] Friend system
- [ ] Working leaderboards
- [ ] Basic progression

---

## 9. Phase 7: Polish & Launch (Week 25-28)

### Goals

- Performance optimization
- Bug fixes
- Production deployment

### Tasks

#### Week 25: Optimization

| Task                   | Description       | Priority |
| ---------------------- | ----------------- | -------- |
| Bundle size            | Code splitting    | P0       |
| Network optimization   | Delta compression | P0       |
| Rendering optimization | LOD, culling      | P0       |
| Memory optimization    | Leak prevention   | P0       |

#### Week 26: Testing

| Task              | Description        | Priority |
| ----------------- | ------------------ | -------- |
| Load testing      | Simulate players   | P0       |
| Integration tests | E2E scenarios      | P0       |
| Bug fixing        | Critical bugs      | P0       |
| Security audit    | Vulnerability scan | P0       |

#### Week 27: Deployment

| Task             | Description          | Priority |
| ---------------- | -------------------- | -------- |
| Production setup | Cloud infrastructure | P0       |
| Domain/DNS       | Custom domain        | P0       |
| SSL certificates | HTTPS/WSS            | P0       |
| Monitoring setup | Alerts, dashboards   | P0       |

#### Week 28: Launch

| Task                | Description    | Priority |
| ------------------- | -------------- | -------- |
| Soft launch         | Limited access | P0       |
| Feedback collection | User feedback  | P0       |
| Hotfix capability   | Quick patches  | P0       |
| Documentation       | Player guides  | P1       |

### Deliverables

- [ ] Production-ready game
- [ ] Monitoring and alerts
- [ ] Launch ready

---

## 10. Post-Launch (Phase 8+)

### Future Features

#### Zombie/Mutation Mode (Month 5-6)

- Infection mechanics
- Zombie AI
- Boss fights
- Special abilities

#### Additional Modes

- Search & Destroy
- Elimination
- Ranked matches

#### Advanced Features

- Spectator mode
- Replay system
- Custom games
- Tournaments

---

## 11. Milestones Summary

| Phase                   | Duration | Key Deliverable  |
| ----------------------- | -------- | ---------------- |
| 0. Foundation           | 2 weeks  | Project setup    |
| 1. Auth & Backend       | 3 weeks  | User system      |
| 2. WebSocket & Rooms    | 3 weeks  | Real-time lobby  |
| 3. Game Engine          | 4 weeks  | 3D movement      |
| 4. Combat               | 4 weeks  | Weapon system    |
| 5. Game Modes           | 4 weeks  | TDM/FFA playable |
| 6. Social & Progression | 4 weeks  | Full features    |
| 7. Polish & Launch      | 4 weeks  | Production ready |

**Total**: 28 weeks (~7 months)

---

## 12. Resource Requirements

### Minimum Team

| Role                 | Count | Focus                      |
| -------------------- | ----- | -------------------------- |
| Full-stack Developer | 2     | Backend + Frontend         |
| DevOps               | 0.5   | Infrastructure (part-time) |

### Ideal Team

| Role               | Count | Focus             |
| ------------------ | ----- | ----------------- |
| Backend Developer  | 1     | Bun/Effect server |
| Frontend Developer | 1     | React/Three.js    |
| Game Developer     | 1     | Physics, gameplay |
| DevOps             | 1     | Infrastructure    |

### Tools & Services

| Category      | Tool           | Cost      |
| ------------- | -------------- | --------- |
| Code          | GitHub         | Free      |
| CI/CD         | GitHub Actions | Free tier |
| Hosting (MVP) | Railway/Render | ~$50/mo   |
| Database      | Supabase       | Free tier |
| Monitoring    | Grafana Cloud  | Free tier |

---

_Document Version: 1.0_
_Last Updated: February 2026_
