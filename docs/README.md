# Crossfire Web Game - Project Documentation

## Overview

This project aims to build a **browser-based multiplayer FPS game** inspired by Crossfire, where players can join rooms and play together in real-time. The initial focus is on **PVP modes**, with **Zombie/Mutation mode** planned for future implementation.

## Documentation Index

| Document | Description | Status |
|----------|-------------|--------|
| [Product Requirements (PRD)](./01-product-requirements.md) | Product vision, goals, user stories, and success metrics | ✅ Ready |
| [Game Features Specification](./02-game-features.md) | Detailed game modes, weapons, mechanics | ✅ Ready |
| [Technology Stack](./03-technology-stack.md) | Frontend, Backend, Database, Cloud technology decisions | ✅ Ready |
| [System Architecture](./04-system-architecture.md) | High-level architecture, components, data flow | ✅ Ready |
| [Database Design](./05-database-design.md) | PostgreSQL schema design, ERD, indexing | ✅ Ready |
| [API & Network Protocol](./06-api-network-protocol.md) | WebSocket protocols, REST APIs, message formats | ✅ Ready |
| [Deployment & Infrastructure](./07-deployment-infrastructure.md) | Cloud deployment, scaling, monitoring | ✅ Ready |
| [Development Roadmap](./08-development-roadmap.md) | Phased implementation plan, milestones | ✅ Ready |

## Quick Start

### Project Goals

1. **Accessible**: Play directly in browser - no downloads required
2. **Real-time**: Low-latency multiplayer gameplay (<100ms)
3. **Scalable**: Support 100+ concurrent game rooms
4. **Engaging**: Classic FPS mechanics with modern web technologies

### Target Users

- Casual gamers looking for quick browser-based FPS matches
- Friends wanting to play together without installing software
- Competitive players seeking ranked matches

### Core Features (Phase 1 - PVP)

- Player authentication and profiles
- Room creation and matchmaking
- Multiple PVP game modes (TDM, FFA, S&D)
- Real-time gameplay with authoritative server
- Weapon system and inventory
- Leaderboards and player statistics

### Future Features (Phase 2 - Zombie Mode)

- Mutation/Zombie survival mode
- AI-controlled zombie hordes
- Boss battles
- Cooperative gameplay (PVE)

## Technical Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript + Three.js + Rapier.js |
| **Backend** | Bun + Bun WebSocket + Effect |
| **Database** | PostgreSQL (persistent) + Redis (real-time state) |
| **Cloud** | Docker + Kubernetes + CDN |
| **Communication** | WebSocket (game) + REST (API) |

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd crossfire

# Install dependencies (when available)
npm install

# Start development servers
npm run dev
```

## Contributing

Documentation and code contributions are welcome. Please refer to individual documentation files for detailed specifications.

---

*Last Updated: February 2026*
