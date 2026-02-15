# Crossfire - Master Project Documentation

## Project Overview

**Crossfire** is a browser-based multiplayer first-person shooter (FPS) game built with modern web technologies. It enables real-time player interaction, physics simulation, and competitive gameplay entirely in the browser.

**Type**: Real-time multiplayer web game  
**Platform**: Browser (Chrome, Firefox, Safari, Edge)  
**Genre**: FPS

---

## Tech Stack

### Core Technologies

- **TypeScript 5.9** - Strongly-typed language for game and backend logic
- **Bun 1.3** - Fast runtime and package manager
- **Effect 3.19** - Functional programming and error handling
- **Kysely** - Type-safe SQL query builder
- **PostgreSQL 18.2** - Persistent data storage
- **Monorepo** - Moonrepo for workspace management

### Frontend

- **Canvas/WebGL** - Game rendering
- **WebSocket** - Real-time multiplayer communication
- **React/Vue** - UI framework (if applicable)

### Backend

- **Node.js** - Server runtime
- **Express/Hono** - HTTP framework
- **WebSocket** - Real-time events

---

## Architecture

### Clean Architecture Principles

- **Separation of Concerns**: Game logic, rendering, networking, state management
- **Dependency Injection**: Effect-based DI for testability
- **Domain-Driven Design**: Game entities as core domain

### Module Structure

```
/packages
  /game-engine        # Core game simulation & physics
  /client             # Frontend multiplayer client
  /server             # Backend game server
  /shared             # Shared types, constants, utilities
  /database           # Schema, migrations, queries (Kysely)
```

### Key Architectural Patterns

- **State Machine**: Player states (alive, dead, respawning)
- **Event Sourcing**: Game events logged for replay/audit
- **Pub/Sub**: Player movement, score updates via WebSocket
- **Repository Pattern**: Database abstractions via Kysely

---

## Available Agents

The Claude ecosystem provides specialized agents for different task types:

- **explore** - Deep codebase investigation, pattern discovery
- **librarian** - Documentation and knowledge base queries
- **oracle** - Architecture decisions, design patterns
- **hephaestus** - Build system and configuration
- **metis** - Performance analysis and optimization
- **momus** - Code quality and linting

---

## Available Commands

Quick access commands for common development tasks:

- **/init-deep** - Initialize hierarchical AGENTS.md knowledge base
- **/ralph-loop** - Self-referential development loop (continuous improvement)
- **/ulw-loop** - Ultrawork loop (extended focused work)
- **/cancel-ralph** - Cancel active Ralph Loop
- **/refactor** - Intelligent refactoring with LSP, AST-grep, architecture analysis
- **/start-work** - Start Sisyphus work session from Prometheus plan
- **/stop-continuation** - Stop all continuation mechanisms
- **/handoff** - Create detailed context summary for new session

---

## Available Skills

Specialized knowledge and step-by-step guidance for complex tasks:

- **/playwright** - Browser automation, verification, testing, screenshots
- **/frontend-ui-ux** - UI/UX design and implementation
- **/git-master** - Advanced git operations (rebase, squash, blame, bisect)
- **/dev-browser** - Web automation, form filling, data extraction

---

## Quick Start Guide

### Prerequisites

- Bun 1.3+
- Node.js 20+
- PostgreSQL 18.2+
- Git

### Installation

```bash
# Clone repository
git clone <repo-url> crossfire
cd crossfire

# Install dependencies with Bun
bun install

# Setup database
bun run db:setup
```

### Development Workflow

```bash
# Start development server
bun run dev

# Run tests with coverage
bun run test:cov

# Build for production
bun run build

# Lint code
bun run lint

# Format code
bun run format
```

### Local Testing

```bash
# Run game locally on http://localhost:3000
bun run dev:client

# Run server on http://localhost:3001
bun run dev:server

# Watch mode for TypeScript
bun run watch
```

---

## Development Workflow

### 1. Feature Development

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature in appropriate package
3. Write tests (target 80% coverage)
4. Run linting: `bun run lint`
5. Commit with conventional message: `git commit -m "feat: add feature name"`

### 2. Code Review Checklist

- [ ] Tests pass and coverage >= 80%
- [ ] Linting passes (oxlint, biome)
- [ ] TypeScript strict mode compliant
- [ ] No `any` types used
- [ ] Effect errors properly handled
- [ ] UUIDs use v7 format
- [ ] Git history is clean
- [ ] Documentation updated

### 3. Deployment

1. Create pull request with clear description
2. Ensure CI/CD passes
3. Merge to main with squash/rebase
4. Tag release: `git tag v0.1.0`
5. Build and deploy: `bun run build && bun run deploy`

---

## Critical Rules

### Code Quality

- ❌ **NO `any` types** - Always specify types explicitly
- ✅ **Use `unknown`** - If type is truly unknown
- ✅ **Effect errors** - Must be properly handled with `.pipe(Effect.catchAll(...))`
- ✅ **UUID v7** - All entities use UUID v7 for sortable IDs

### Linting & Formatting

- **Linter**: oxlint (enforced)
- **Formatter**: biome
- **TypeScript**: Strict mode enabled
- **No unused variables**: Enforced by tsconfig.json

### Testing

- **Minimum Coverage**: 80%
- **Test Framework**: Vitest
- **Test Location**: `src/**/__tests__/**/*.test.ts`
- **Naming**: `*.test.ts` for unit tests, `*.e2e.ts` for integration

### Git Workflow

- **Convention**: Conventional Commits (feat:, fix:, refactor:, test:, docs:, chore:)
- **Branch Naming**: `feature/*`, `bugfix/*`, `hotfix/*`, `release/*`
- **Commit Messages**: Descriptive, focusing on "why" not "what"
- **History**: Squash before merge to main; rebase to keep linear history

---

## Database

### Schema Management

- **Tool**: Kysely + PostgreSQL migrations
- **Location**: `/packages/database/migrations`
- **Create Migration**: `bun run db:migrate:create --name migration_name`
- **Run Migrations**: `bun run db:migrate:run`

### Entity Types

- **Player** - User account and profile data
- **Game Session** - Active game instance
- **Player State** - Position, health, inventory per session
- **Events** - All game events (shot, death, spawn, etc.)

---

## Testing Requirements

### Coverage Targets

- **Overall**: 80% minimum
- **Game Logic**: 90%
- **Server API**: 85%
- **Database Layer**: 80%

### Test Types

1. **Unit Tests** - Isolated business logic
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user workflows

### Running Tests

```bash
# Run all tests
bun run test

# Run with coverage report
bun run test:cov

# Watch mode
bun run test:watch

# Specific package
bun run test --filter=game-engine
```

---

## Common Development Tasks

### Adding a New Game Feature

1. Define types in `/packages/shared/types`
2. Implement logic in `/packages/game-engine`
3. Add tests for new logic
4. Update server endpoints if needed
5. Update client UI if needed
6. Commit with `feat: add feature name`

### Fixing a Bug

1. Create branch: `git checkout -b bugfix/issue-number`
2. Write test that reproduces bug
3. Fix bug in source code
4. Verify test passes
5. Commit with `fix: describe bug fix`

### Refactoring Code

1. Ensure all tests pass before starting
2. Use `/refactor` command for intelligent refactoring
3. Run tests after each change
4. Commit with `refactor: describe refactoring`

### Database Schema Changes

1. Create migration: `bun run db:migrate:create --name new_table`
2. Write migration SQL in migration file
3. Run migration: `bun run db:migrate:run`
4. Update Kysely types
5. Update queries if needed
6. Commit migration with `chore: add migration_name`

---

## Performance Considerations

### Game Loop

- Target 60 FPS for smooth gameplay
- Use delta time for frame-independent physics
- Optimize collision detection with spatial partitioning

### Network

- Minimize WebSocket message size
- Use message batching for updates
- Implement client-side prediction for responsive controls

### Database

- Add indexes on frequently queried columns
- Use connection pooling
- Archive old game sessions periodically

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules .bun
bun install
bun run build
```

### Tests Failing

```bash
# Run with verbose output
bun run test -- --reporter=verbose

# Run specific test file
bun run test -- packages/game-engine/src/__tests__/physics.test.ts
```

### Database Issues

```bash
# Reset database to clean state
bun run db:reset

# Check migrations status
bun run db:migrate:status
```

### TypeScript Errors

```bash
# Rebuild type definitions
bun run build:types

# Check for unused types
bun run check:types
```

---

## Resources

- **Game Engine Docs**: See `/packages/game-engine/README.md`
- **API Docs**: See `/packages/server/README.md`
- **Deployment Guide**: See `/docs/DEPLOYMENT.md`
- **Architecture Decision Records**: See `/docs/adr/`

---

**Last Updated**: 2025-02-14  
**Status**: Active Development
