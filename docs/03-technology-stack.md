# Technology Stack Document

## Crossfire Web Game - Technology Decisions

---

## 1. Executive Summary

This document outlines the recommended technology stack for building a browser-based multiplayer FPS game. The stack is chosen based on:

- **Performance**: Sub-100ms latency, 60 FPS gameplay
- **Scalability**: Support 1000+ concurrent players
- **Developer Experience**: TypeScript-first, rapid iteration
- **Production Readiness**: Battle-tested in similar games

---

## 2. Frontend Stack

### 2.1 Core Technologies

| Layer                 | Technology        | Version | Purpose                         |
| --------------------- | ----------------- | ------- | ------------------------------- |
| **Language**          | TypeScript        | 5.9.x   | Type safety, better DX          |
| **Framework**         | React             | 19.x    | UI components, state management |
| **3D Engine**         | Three.js          | 0.182.x | 3D rendering, WebGPU support    |
| **React Integration** | React Three Fiber | 9.x     | Declarative 3D in React         |
| **Physics**           | Rapier.js         | 0.19.x  | WebAssembly physics engine      |
| **Audio**             | Howler.js         | 2.2.x   | Cross-browser audio             |
| **Build Tool**        | Vite              | 7.x     | Fast HMR, ES modules            |
| **State Management**  | Zustand           | 5.x     | Lightweight state store         |

### 2.2 Why Three.js over Babylon.js?

| Factor            | Three.js          | Babylon.js      |
| ----------------- | ----------------- | --------------- |
| Bundle Size       | ~170 KB gzipped   | ~1.4 MB gzipped |
| Weekly Downloads  | 5M+               | 15K+            |
| Community Size    | Largest           | Medium          |
| React Integration | React Three Fiber | Limited         |
| WebGPU Support    | ✅ (0.182+)       | ✅              |
| Learning Curve    | Medium            | Higher          |

**Decision**: Three.js chosen for smaller bundle size, React Three Fiber integration, and larger community support.

### 2.3 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   React UI   │───→│   Zustand    │───→│  Three.js    │   │
│  │  (Menus/HUD) │    │   (State)    │    │  (Renderer)  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                    │           │
│         │                   │                    │           │
│         ▼                   ▼                    ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │    Howler    │    │   Rapier     │    │   WebGL/     │   │
│  │   (Audio)    │    │  (Physics)   │    │   WebGPU     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 WebGPU vs WebGL2

**Recommendation**: WebGPU-first with WebGL2 fallback

| Feature         | WebGPU                 | WebGL2              |
| --------------- | ---------------------- | ------------------- |
| Performance     | 2-3x faster            | Baseline            |
| Browser Support | Chrome 113+, Edge 113+ | All modern browsers |
| Compute Shaders | ✅ Native support      | ❌ Not available    |
| Multi-threading | ✅ Better support      | Limited             |

**Implementation**:

```typescript
// Automatic detection and fallback
import { WebGPURenderer, WebGLRenderer } from 'three'

const renderer = (await WebGPURenderer.isAvailable())
  ? new WebGPURenderer({ antialias: true })
  : new WebGLRenderer({ antialias: true })
```

---

## 3. Backend Stack

### 3.1 Core Technologies

| Layer                    | Technology    | Version  | Purpose                                |
| ------------------------ | ------------- | -------- | -------------------------------------- |
| **Language**             | TypeScript    | 5.9.x    | Shared types with frontend             |
| **Runtime**              | Bun           | 1.3.x    | Ultra-fast server runtime              |
| **Functional Framework** | Effect        | 3.19.x   | Functional programming, error handling |
| **WebSocket**            | Bun WebSocket | Built-in | Native high-performance WebSocket      |
| **Validation**           | Effect Schema | 3.x      | Type-safe validation                   |
| **Database Client**      | Kysely        | 0.28.x   | Type-safe SQL query builder            |

### 3.2 Why Bun?

Bun is a modern JavaScript runtime designed for speed and simplicity:

| Feature              | Bun               | Node.js                |
| -------------------- | ----------------- | ---------------------- |
| **Startup Time**     | ~4x faster        | Baseline               |
| **HTTP Performance** | Higher throughput | Standard               |
| **WebSocket**        | Native built-in   | Requires library       |
| **TypeScript**       | Native support    | Requires transpilation |
| **Package Manager**  | Built-in, fast    | npm/yarn/pnpm          |
| **Test Runner**      | Built-in          | Requires Jest/Vitest   |

**Why Bun for Game Servers:**

- **Native WebSocket**: No external dependencies, maximum performance
- **Low Latency**: Critical for real-time multiplayer games
- **Built-in SQLite**: Useful for local development and caching
- **Hot Reload**: Faster development iteration

### 3.3 Why Effect?

Effect is a functional programming framework for TypeScript that provides:

| Feature                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| **Typed Errors**         | Compile-time error handling, no uncaught exceptions |
| **Dependency Injection** | Built-in service layer pattern                      |
| **Concurrency**          | Fibers for lightweight concurrency                  |
| **Resource Management**  | Safe acquisition and release                        |
| **Configuration**        | Declarative config with validation                  |
| **Observability**        | Built-in logging, tracing, metrics                  |

```typescript
// Effect-style game server example
import { Effect, Context, Config, Layer } from 'effect'

// Define a service interface
interface GameRoomService {
  readonly createRoom: (config: RoomConfig) => Effect.Effect<Room, RoomError>
  readonly joinRoom: (roomId: string, playerId: string) => Effect.Effect<void, RoomError>
  readonly broadcast: (roomId: string, message: GameMessage) => Effect.Effect<void>
}

// Create a service tag
const GameRoomService = Context.GenericTag<GameRoomService>('GameRoomService')

// Define errors as tagged classes
class RoomError extends Data.TaggedError('RoomError')<{
  readonly reason: 'not_found' | 'full' | 'invalid'
  readonly message: string
}> {}

// Implement the service
const GameRoomServiceLive = Layer.effect(
  GameRoomService,
  Effect.gen(function* (_) {
    const redis = yield* RedisService
    const config = yield* Config.nested(Config.integer('MAX_PLAYERS'), 'ROOM')

    const rooms = new Map<string, Room>()

    return GameRoomService.of({
      createRoom: (roomConfig) =>
        Effect.gen(function* (_) {
          const roomId = yield* generateRoomId
          const room: Room = {
            id: roomId,
            config: roomConfig,
            players: new Map(),
            status: 'waiting',
          }
          rooms.set(roomId, room)
          yield* redis.set(`room:${roomId}`, JSON.stringify(room))
          return room
        }),

      joinRoom: (roomId, playerId) =>
        Effect.gen(function* (_) {
          const room = rooms.get(roomId)
          if (!room) {
            return yield* Effect.fail(
              new RoomError({
                reason: 'not_found',
                message: `Room ${roomId} not found`,
              })
            )
          }
          if (room.players.size >= config) {
            return yield* Effect.fail(
              new RoomError({
                reason: 'full',
                message: 'Room is full',
              })
            )
          }
          room.players.set(playerId, { id: playerId, ready: false })
        }),

      broadcast: (roomId, message) =>
        Effect.gen(function* (_) {
          const room = rooms.get(roomId)
          if (!room) return

          for (const ws of room.connections.values()) {
            ws.send(JSON.stringify(message))
          }
        }),
    })
  })
)
```

### 3.4 Bun WebSocket Server

```typescript
import { Effect, Layer } from 'effect'
import { serve } from 'bun'

// Effect-based WebSocket server
const createWebSocketServer = Effect.gen(function* (_) {
  const gameService = yield* GameRoomService
  const config = yield* Config.all([Config.string('HOST'), Config.number('PORT')])

  const [host, port] = config

  const server = serve({
    hostname: host,
    port: port,

    fetch(req, server) {
      // Upgrade to WebSocket
      const success = server.upgrade(req)
      if (success) return undefined

      // Handle HTTP requests
      return new Response('WebSocket Server', { status: 200 })
    },

    websocket: {
      open(ws) {
        console.log('Client connected')
      },

      message(ws, message) {
        // Parse and handle message
        const data = JSON.parse(message.toString())
        Effect.runPromise(gameService.handleMessage(ws, data))
      },

      close(ws) {
        Effect.runPromise(gameService.handleDisconnect(ws))
      },
    },
  })

  console.log(`Game server running on ws://${host}:${port}`)
  return server
})

// Run the server with dependencies
const program = createWebSocketServer.pipe(
  Effect.provide(GameRoomServiceLive),
  Effect.provide(RedisServiceLive),
  Effect.provide(ConfigProvider.fromEnv())
)

Effect.runPromise(program)
```

### 3.5 Effect Bun Platform Architecture

The backend follows the **Effect Bun Platform** pattern for high-performance, type-safe service composition:

- **HttpLayerRouter Pattern**: Using `@effect/platform` to define composable HTTP routes and middleware.
- **RPC Server over WebSocket**: Real-time game commands handled via high-performance RPC over binary WebSocket streams.
- **Layer Composition**: Services (Database, Redis, Game Logic) are composed using `Layer` for clean dependency injection.
- **DevTools Integration**: Utilizing `@effect/experimental/DevTools` for real-time tracing, metrics, and fiber inspection during development.

### 3.6 WebSocket Performance Comparison

| Library            | Performance | Latency  | Features                      |
| ------------------ | ----------- | -------- | ----------------------------- |
| **Bun WebSocket**  | Very High   | Lowest   | Native, zero dependencies     |
| **uWebSockets.js** | Very High   | Very Low | High-performance, C++ binding |
| **ws**             | High        | Low      | Standard WebSocket            |

**Recommendation**: Use **Bun WebSocket** for best performance and developer experience. Bun's native WebSocket implementation is the fastest available for TypeScript.

### 3.6 Effect Configuration Example

```typescript
import { Effect, Config, Layer } from 'effect'

// Define typed configuration
interface ServerConfig {
  readonly host: string
  readonly port: number
  readonly maxRooms: number
  readonly tickRate: number
  readonly apiSecret: Config.Redacted
}

// Create configuration layer
const ServerConfig = Config.all([
  Config.string('HOST').pipe(Config.withDefault('localhost')),
  Config.number('PORT').pipe(Config.withDefault(3000)),
  Config.integer('MAX_ROOMS').pipe(Config.withDefault(100)),
  Config.integer('TICK_RATE').pipe(Config.withDefault(30)),
  Config.redacted('API_SECRET'),
]).pipe(
  Config.map(([host, port, maxRooms, tickRate, apiSecret]) => ({
    host,
    port,
    maxRooms,
    tickRate,
    apiSecret,
  }))
)

// Use in program
const program = Effect.gen(function* (_) {
  const config = yield* ServerConfig
  console.log(`Server starting on ${config.host}:${config.port}`)
  console.log(`Max rooms: ${config.maxRooms}, Tick rate: ${config.tickRate}Hz`)
})
```

---

## 4. Database Stack

### 4.1 Core Technologies

| Layer               | Technology     | Version | Purpose                      |
| ------------------- | -------------- | ------- | ---------------------------- |
| **Primary DB**      | PostgreSQL     | 18.2    | Persistent data with UUID v7 |
| **Time-Series**     | TimescaleDB    | 2.25.x  | Match telemetry, analytics   |
| **Cache/Session**   | Redis          | 8.x     | Real-time state, caching     |
| **Query Builder**   | Kysely         | 0.28.x  | Type-safe SQL queries        |
| **Migrations**      | golang-migrate | 4.19.x  | CLI-based schema migrations  |
| **Type Generation** | kysely-codegen | 0.19.x  | Generate types from schema   |

### 4.2 PostgreSQL 18 Features

PostgreSQL 18 introduces several features beneficial for gaming:

| Feature               | Description              | Gaming Use Case                        |
| --------------------- | ------------------------ | -------------------------------------- |
| **UUID v7**           | Time-ordered UUIDs       | Primary keys that sort chronologically |
| **Async I/O**         | io_uring support         | 2-3x faster sequential scans           |
| **Improved btree**    | Better index performance | Faster player/match lookups            |
| **Generated columns** | Virtual computed columns | Derived stats without triggers         |

**UUID v7 Example:**

```sql
-- Time-ordered UUID (sorts chronologically, unlike UUID v4)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UUID v7 is sortable by time
SELECT * FROM players ORDER BY id;  -- Returns in insertion order
```

### 4.3 Why Kysely over Prisma?

| Factor              | Kysely                         | Prisma       |
| ------------------- | ------------------------------ | ------------ |
| **Query Control**   | Full SQL control               | Abstracted   |
| **Performance**     | Raw SQL speed                  | ORM overhead |
| **Bundle Size**     | ~50KB                          | ~2MB         |
| **Complex Queries** | Native SQL                     | Limited      |
| **Type Safety**     | Generated from DB              | Schema-first |
| **Migrations**      | External tool (golang-migrate) | Built-in     |

**Decision**: Kysely chosen for:

- Full SQL control for complex game queries
- Better performance for high-throughput gaming workloads
- Smaller bundle size
- Native PostgreSQL 18 feature support

### 4.4 Kysely Setup Example

```typescript
// packages/database/src/client.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      max: 10, // Connection pool size
    }),
  }),
})

// Type-safe query example
const player = await db
  .selectFrom('players')
  .select(['id', 'username', 'stats'])
  .where('id', '=', playerId)
  .executeTakeFirst()
```

### 4.5 golang-migrate Workflow

```bash
# Install (macOS)
brew install golang-migrate

# Create migration
migrate create -ext sql -dir migrations -seq create_players_table

# Apply migrations
migrate -database $DATABASE_URL -path migrations up

# Rollback
migrate -database $DATABASE_URL -path migrations down 1

# Generate Kysely types from database
kysely-codegen --out-file src/types.ts
```

### 4.6 PostgreSQL vs Alternatives

| Database          | Pros                         | Cons                         | Verdict          |
| ----------------- | ---------------------------- | ---------------------------- | ---------------- |
| **PostgreSQL 18** | ACID, JSONB, UUID v7, mature | Vertical scaling primary     | ✅ Recommended   |
| MongoDB           | Flexible schema              | No joins, consistency issues | ❌ Not for games |
| MySQL             | Popular                      | Limited JSON support         | ⚠️ Alternative   |

### 4.3 Redis Usage

```
┌─────────────────────────────────────────────────────────────┐
│                    REDIS DATA STRUCTURES                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Session Store   │  │  Room State     │  │  Matchmaking│  │
│  │ (Hash)          │  │  (Hash)         │  │  (ZSet)     │  │
│  │                 │  │                 │  │             │  │
│  │ session:{id}    │  │ room:{roomId}   │  │ queue:tdm   │  │
│  │ - userId        │  │ - players[]     │  │ - player1   │  │
│  │ - playerId      │  │ - status        │  │ - player2   │  │
│  │ - expiresAt     │  │ - gameState     │  │ - ...       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Player Online   │  │  Leaderboard    │  │  Rate Limit │  │
│  │ (Set)           │  │  (Sorted Set)   │  │  (Token)    │  │
│  │                 │  │                 │  │             │  │
│  │ online:players  │  │ lb:kills:weekly │  │ ratelimit   │  │
│  │ - player1       │  │ - p1: 1500      │  │ - {ip}:count│  │
│  │ - player2       │  │ - p2: 1200      │  │             │  │
│  │ - ...           │  │ - ...           │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Real-Time Communication

### 5.1 Network Architecture

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ 1. Input (movement, shoot)    │
     │──────────────────────────────►│
     │                               │
     │                               │ Validate
     │                               │ Process
     │                               │ Update State
     │                               │
     │ 2. State Update (position,    │
     │    other players, events)     │
     │◄──────────────────────────────│
     │                               │
     │ Client Prediction:            │
     │ - Apply input immediately     │
     │ - Store input history         │
     │                               │
     │ Server Reconciliation:        │
     │ - Compare with server state   │
     │ - Snap if mismatch            │
     │                               │
```

### 5.2 Tick Rate & Update Frequency

| System              | Frequency | Purpose                     |
| ------------------- | --------- | --------------------------- |
| **Server Tick**     | 20-30 Hz  | Game state simulation       |
| **Client Update**   | 60 Hz     | Render loop                 |
| **State Broadcast** | 20 Hz     | Position updates to clients |
| **Input Send**      | 60 Hz     | Client input to server      |

### 5.3 Lag Compensation Techniques

**Client-Side Prediction**:

- Apply player input immediately locally
- Don't wait for server confirmation
- Store input sequence for reconciliation

**Server Reconciliation**:

- Server processes inputs authoritatively
- Sends back processed state with input sequence
- Client compares and snaps if mismatch

**Entity Interpolation**:

- Remote players interpolated between snapshots
- 50-100ms delay buffer for smooth movement
- Never extrapolate (causes jitter)

```typescript
// Client-side prediction example
class PlayerController {
  private inputBuffer: InputSnapshot[] = []
  private lastProcessedSeq = 0

  processInput(input: Input) {
    // 1. Apply locally immediately
    this.applyInput(input)

    // 2. Store for reconciliation
    this.inputBuffer.push({
      seq: this.inputSeq++,
      input,
      timestamp: Date.now(),
    })

    // 3. Send to server
    this.socket.emit('input', input)
  }

  onServerState(state: ServerState) {
    // 4. Reconcile with server
    if (state.lastProcessedSeq > this.lastProcessedSeq) {
      // Remove confirmed inputs
      this.inputBuffer = this.inputBuffer.filter((i) => i.seq > state.lastProcessedSeq)

      // Check for mismatch
      if (this.position.distanceTo(state.position) > 0.1) {
        // Snap to server position
        this.position = state.position

        // Re-apply unconfirmed inputs
        this.inputBuffer.forEach((i) => this.applyInput(i.input))
      }
    }
  }
}
```

---

## 6. Cloud Infrastructure

### 6.1 Recommended Stack

| Layer             | Technology                | Purpose                          |
| ----------------- | ------------------------- | -------------------------------- |
| **Compute**       | Kubernetes (GKE/EKS)      | Game server orchestration        |
| **Game Servers**  | Agones                    | Dedicated game server management |
| **Static Assets** | Cloud CDN                 | 3D models, textures, audio       |
| **Database**      | Cloud SQL (PostgreSQL)    | Managed PostgreSQL               |
| **Cache**         | Cloud Memorystore (Redis) | Managed Redis                    |
| **Load Balancer** | Cloud Load Balancing      | Traffic distribution             |

### 6.2 Alternative: Simplified Stack

For smaller scale or MVP:

| Layer        | Technology              | Purpose                       |
| ------------ | ----------------------- | ----------------------------- |
| **Compute**  | Docker + Railway/Render | Simple deployment             |
| **Database** | Supabase                | PostgreSQL + Auth + Real-time |
| **Cache**    | Upstash                 | Serverless Redis              |
| **CDN**      | Cloudflare              | Static assets                 |

### 6.3 Infrastructure Diagram

```
                           ┌─────────────────┐
                           │   Cloud CDN     │
                           │ (Static Assets) │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  Load Balancer  │
                           │   (HTTPS/WSS)   │
                           └────────┬────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
     │   API Server    │   │   API Server    │   │   API Server    │
     │   (Effect Bun)  │   │   (Effect Bun)  │   │   (Effect Bun)  │
     └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
     │  Game Server    │   │  Game Server    │   │  Game Server    │
     │  (Agones Pod)   │   │  (Agones Pod)   │   │  (Agones Pod)   │
     │   Room 1-10     │   │   Room 11-20    │   │   Room 21-30    │
     └─────────────────┘   └─────────────────┘   └─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
     │   PostgreSQL    │   │     Redis       │   │   Monitoring    │
     │   (Cloud SQL)   │   │ (Memorystore)   │   │   (Prometheus)  │
     └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 7. Development Tools

### 7.1 Monorepo Management

| Tool     | Purpose              | Notes                                               |
| -------- | -------------------- | --------------------------------------------------- |
| Moonrepo | Monorepo task runner | Full Bun support, task inheritance, affected builds |

#### Why Moonrepo over Turborepo?

| Factor                   | Moonrepo           | Turborepo          |
| ------------------------ | ------------------ | ------------------ |
| **Bun Support**          | Tier 1 (native)    | Tier 3 (limited)   |
| **Task Inheritance**     | Full support       | Limited            |
| **Toolchain Management** | Built-in           | External           |
| **Project Globs**        | Flexible           | Fixed patterns     |
| **Remote Caching**       | Built-in           | Requires Vercel    |
| **Language Server**      | Built-in           | None               |
| **Affected Builds**      | Built-in query     | Via CLI            |
| **Config Format**        | YAML (per-project) | JSON (single file) |

**Moonrepo Configuration:**

```yaml
# .moon/workspace.yml
projects:
  - 'apps/*'
  - 'packages/*'

# .moon/toolchains.yml
bun:
  version: '1.3.9'
  syncProjectWorkspaceDependencies: true

typescript:
  version: '5.9.3'
  syncProjectReferences: true
```

**Moonrepo Commands:**

```bash
# Run task for all projects
moon run :build
moon run :lint
moon run :test

# Run task for specific project
moon run server:dev
moon run database:migrate-up

# CI mode (affected tasks only)
moon ci

# Query affected projects
moon query affected
```

### 7.2 Code Quality

| Tool        | Purpose           | Notes                                  |
| ----------- | ----------------- | -------------------------------------- |
| oxlint      | Linting           | Rust-based, 10-100x faster than ESLint |
| oxfmt       | Code formatting   | Rust-based, Prettier-compatible        |
| Husky       | Git hooks         | Pre-commit hooks                       |
| lint-staged | Pre-commit checks | Run oxlint on staged files             |

### 7.3 Why oxlint/oxfmt over ESLint/Prettier?

| Factor            | oxlint/oxfmt      | ESLint/Prettier |
| ----------------- | ----------------- | --------------- |
| **Speed**         | 10-100x faster    | Baseline        |
| **Language**      | Rust              | JavaScript      |
| **ESLint Rules**  | 600+ compatible   | All             |
| **Config Format** | JSON/TypeScript   | JavaScript/JSON |
| **IDE Support**   | VS Code extension | Full ecosystem  |

**Oxlint Configuration:**

```typescript
// oxlint.config.ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  plugins: ['typescript', 'react', 'import', 'unicorn'],
  rules: {
    'no-unused-vars': 'error',
    'typescript/no-explicit-any': 'warn',
  },
})
```

**package.json Scripts:**

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt",
    "format:check": "oxfmt --check"
  }
}
```

### 7.4 Testing

| Tool       | Purpose            |
| ---------- | ------------------ |
| Vitest     | Unit testing       |
| Playwright | E2E testing        |
| Bun Test   | Native test runner |

### 7.5 CI/CD

| Tool           | Purpose           |
| -------------- | ----------------- |
| GitHub Actions | CI/CD pipeline    |
| Docker         | Containerization  |
| Docker Compose | Local development |

---

## 8. Package.json Overview

### Frontend (client/package.json)

```json
{
  "name": "@crossfire/web-client",
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "three": "^0.182.0",
    "@react-three/fiber": "^9.5.0",
    "@react-three/drei": "^10.7.0",
    "@dimforge/rapier3d-compat": "^0.19.0",
    "howler": "^2.2.4",
    "zustand": "^5.0.11",
    "effect": "^3.19.16",
    "@effect/platform": "^0.94.4"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^7.3.1",
    "@types/react": "^19.2.14",
    "@types/three": "^0.182.0"
  }
}
```

### Backend (server/package.json)

```json
{
  "name": "@crossfire/web-server",
  "dependencies": {
    "effect": "^3.19.16",
    "@effect/platform": "^0.94.4",
    "@effect/platform-bun": "^0.87.1",
    "@effect/experimental": "^0.58.0",
    "kysely": "^0.28.11",
    "pg": "^8.18.0",
    "ioredis": "^5.9.3",
    "msgpackr": "^1.11.8",
    "better-auth": "^1.4.18"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "kysely-codegen": "^0.19.0",
    "oxlint": "^1.47.0",
    "oxfmt": "^0.32.0",
    "@types/bun": "^1.3.9",
    "@types/pg": "^8.16.0"
  }
}
```

---

## 9. Technology Decision Matrix

| Requirement   | Option A        | Option B       | Decision                                 |
| ------------- | --------------- | -------------- | ---------------------------------------- |
| 3D Rendering  | Three.js        | Babylon.js     | Three.js (smaller bundle, R3F)           |
| UI Framework  | React           | Vue/Svelte     | React (ecosystem, R3F)                   |
| Backend       | Effect Bun      | Express        | Effect Bun (functional, typed errors)    |
| Database      | PostgreSQL 18.2 | MongoDB        | PostgreSQL 18.2 (ACID, UUID v7)          |
| Query Builder | Kysely          | Prisma         | Kysely (control, performance)            |
| Migrations    | golang-migrate  | Prisma Migrate | golang-migrate (CLI, SQL-first)          |
| Monorepo      | Moonrepo        | Turborepo      | Moonrepo (Bun support, task inheritance) |
| WebSocket     | Bun WebSocket   | uWS            | Bun WebSocket (native, high perf)        |
| Linting       | oxlint          | ESLint         | oxlint (10-100x faster)                  |
| Formatting    | oxfmt           | Prettier       | oxfmt (Rust-based, fast)                 |
| Cache         | Redis 8.x       | Memcached      | Redis (data structures)                  |
| Deployment    | K8s + Agones    | Docker Compose | K8s for scale, Docker for MVP            |

---

_Document Version: 2.2_  
_Last Updated: February 2026_  
_Changes: Updated all dependency versions to latest (React 19.x, Three.js 0.182, Vite 7.x, PostgreSQL 18.2, Redis 8.x, etc.)_
