# Crossfire Web Game

> **Browser-Based Multiplayer FPS** - Inspired by Crossfire, built with modern web technologies

![License](https://img.shields.io/badge/license-MIT-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun-black)
![Framework](https://img.shields.io/badge/framework-Effect-7C3AED)

## 🎮 Overview

Crossfire Web is a **browser-based multiplayer FPS** that brings classic Crossfire gameplay to the web. Play directly in your browser with zero downloads.

### Key Features

- 🎯 **Multiple Game Modes**: Team Deathmatch, Free for All, Search & Destroy, Elimination
- 🧟 **Mutation Mode** (Phase 2): Survive against infected mutants or infect all humans
- 🎮 **Zombie Mode** (Phase 2): Co-op PVE against AI zombie hordes and bosses
- ⚡ **Low Latency**: Sub-100ms gameplay with Bun WebSocket + Effect
- 🌐 **No Downloads**: Play anywhere with any modern browser
- 🏆 **Competitive**: Leaderboards, rankings, and progression

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | [Bun](https://bun.sh) | Ultra-fast JS runtime with native WebSocket |
| **Framework** | [Effect](https://effect.website) | Functional programming, typed errors |
| **3D Engine** | [Three.js](https://threejs.org) | 3D rendering with WebGPU support |
| **Frontend** | React + TypeScript | UI components and state |
| **Database** | PostgreSQL + TimescaleDB | Persistent data + time-series analytics |
| **Cache** | Redis | Real-time state, sessions |
| **Protocol** | MessagePack over WebSocket | Binary serialization |

## 📁 Project Structure

```
crossfire/
├── apps/
│   ├── client/          # React + Three.js frontend
│   └── server/          # Bun + Effect backend
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── database/        # Prisma schema and migrations
├── docs/               # Documentation
│   ├── 01-product-requirements.md
│   ├── 02-game-features.md
│   ├── 03-technology-stack.md
│   ├── 04-system-architecture.md
│   ├── 05-database-design.md
│   ├── 06-api-network-protocol.md
│   ├── 07-deployment-infrastructure.md
│   └── 08-development-roadmap.md
└── README.md
```

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/harrytran998/crossfire
cd crossfire

# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Run database migrations
bun db:migrate

# Start development servers
bun dev
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements](./docs/01-product-requirements.md) | Product vision, user stories, success metrics |
| [Game Features](./docs/02-game-features.md) | PVP modes, Zombie mode, weapons, progression |
| [Technology Stack](./docs/03-technology-stack.md) | Bun + Effect + Bun WebSocket stack |
| [System Architecture](./docs/04-system-architecture.md) | Client/server architecture, game loop, networking |
| [Database Design](./docs/05-database-design.md) | PostgreSQL + TimescaleDB schemas |
| [API & Network Protocol](./docs/06-api-network-protocol.md) | Complete REST + WebSocket API reference |
| [Deployment](./docs/07-deployment-infrastructure.md) | Cloud infrastructure, Docker, Kubernetes |
| [Development Roadmap](./docs/08-development-roadmap.md) | 7-month phased implementation |
| [Security & Anti-Cheat](./docs/09-security.md) | Security architecture and anti-cheat design |

## 🎯 Game Modes

### Phase 1: PVP Modes

| Mode | Description | Players |
|------|-------------|---------|
| **Team Deathmatch** | Two teams compete for kill limit | 8v8 |
| **Free for All** | Every player for themselves | 16 players |
| **Search & Destroy** | Plant/defuse bomb objective | 5v5 |
| **Elimination** | No respawn team elimination | 5v5 |

### Phase 2: Zombie Modes

| Mode | Description | Players |
|------|-------------|---------|
| **Mutation Mode** | Survivors vs Infected mutants | 16 players |
| **Hero Mode** | Special heroes vs mutants | 16 players |
| **Zombie Mode (PVE)** | Co-op vs AI zombie hordes | 4-8 players |
| **Challenge Mode** | Boss battles and objectives | 4-8 players |

## 🔧 Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Node.js >= 20 (optional)
- PostgreSQL >= 16
- Redis >= 7

### Scripts

```bash
bun dev          # Start all services in development
bun build        # Build all packages
bun test         # Run tests
bun lint         # Lint code
bun typecheck    # Type check
```

## 📊 Architecture Highlights

### Real-Time Game Processing

- **Server Tick Rate**: 20-30 Hz authoritative server
- **Client Prediction**: Immediate local input response
- **State Sync**: Delta-compressed state updates at 20Hz
- **Time-Series Analytics**: TimescaleDB for kill/death events, match telemetry

### Database Strategy

| Data Type | Database | Purpose |
|-----------|----------|---------|
| Player profiles, inventory | PostgreSQL | Persistent relational data |
| Match history, stats | PostgreSQL | Historical records |
| Real-time telemetry | TimescaleDB | Time-series analytics |
| Game room state | Redis | In-memory real-time state |
| Sessions, matchmaking | Redis | Ephemeral state |

## 🗓️ Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 0-1** | Weeks 1-5 | Auth, backend, WebSocket foundation |
| **Phase 2** | Weeks 6-8 | Room system, matchmaking |
| **Phase 3** | Weeks 9-12 | Game engine, physics, networking |
| **Phase 4** | Weeks 13-16 | Combat system, weapons |
| **Phase 5** | Weeks 17-20 | Game modes, match flow |
| **Phase 6** | Weeks 21-24 | Social, progression, leaderboards |
| **Phase 7** | Weeks 25-28 | Polish, optimization, launch |

## 🤝 Contributing

Contributions welcome! Please read our documentation and follow conventional commits.

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

Built with ❤️ using [Bun](https://bun.sh) + [Effect](https://effect.website)
