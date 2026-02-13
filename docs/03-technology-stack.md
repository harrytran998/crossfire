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

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | TypeScript | 5.x | Type safety, better DX |
| **Framework** | React | 18.x | UI components, state management |
| **3D Engine** | Three.js | r171+ | 3D rendering, WebGPU support |
| **React Integration** | React Three Fiber | 8.x | Declarative 3D in React |
| **Physics** | Rapier.js | 0.12+ | WebAssembly physics engine |
| **Audio** | Howler.js | 2.x | Cross-browser audio |
| **Build Tool** | Vite | 5.x | Fast HMR, ES modules |
| **State Management** | Zustand | 4.x | Lightweight state store |

### 2.2 Why Three.js over Babylon.js?

| Factor | Three.js | Babylon.js |
|--------|----------|------------|
| Bundle Size | ~168 KB gzipped | ~1.4 MB gzipped |
| Weekly Downloads | 4.2M | 13K |
| Community Size | Largest | Medium |
| React Integration | React Three Fiber | Limited |
| WebGPU Support | ✅ (r171+) | ✅ |
| Learning Curve | Medium | Higher |

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

| Feature | WebGPU | WebGL2 |
|---------|--------|--------|
| Performance | 2-3x faster | Baseline |
| Browser Support | Chrome 113+, Edge 113+ | All modern browsers |
| Compute Shaders | ✅ Native support | ❌ Not available |
| Multi-threading | ✅ Better support | Limited |

**Implementation**:
```typescript
// Automatic detection and fallback
import { WebGPURenderer, WebGLRenderer } from 'three';

const renderer = await WebGPURenderer.isAvailable() 
  ? new WebGPURenderer({ antialias: true })
  : new WebGLRenderer({ antialias: true });
```

---

## 3. Backend Stack

### 3.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | TypeScript | 5.x | Shared types with frontend |
| **Runtime** | Bun | 1.x | Ultra-fast server runtime |
| **Functional Framework** | Effect | 3.x | Functional programming, error handling |
| **WebSocket** | Bun WebSocket | Built-in | Native high-performance WebSocket |
| **Validation** | Effect Schema | 3.x | Type-safe validation |
| **Database Client** | Prisma | 5.x | Type-safe database queries |

### 3.2 Why Bun?

Bun is a modern JavaScript runtime designed for speed and simplicity:

| Feature | Bun | Node.js |
|---------|-----|---------|
| **Startup Time** | ~4x faster | Baseline |
| **HTTP Performance** | Higher throughput | Standard |
| **WebSocket** | Native built-in | Requires library |
| **TypeScript** | Native support | Requires transpilation |
| **Package Manager** | Built-in, fast | npm/yarn/pnpm |
| **Test Runner** | Built-in | Requires Jest/Vitest |

**Why Bun for Game Servers:**
- **Native WebSocket**: No external dependencies, maximum performance
- **Low Latency**: Critical for real-time multiplayer games
- **Built-in SQLite**: Useful for local development and caching
- **Hot Reload**: Faster development iteration

### 3.3 Why Effect?

Effect is a functional programming framework for TypeScript that provides:

| Feature | Description |
|---------|-------------|
| **Typed Errors** | Compile-time error handling, no uncaught exceptions |
| **Dependency Injection** | Built-in service layer pattern |
| **Concurrency** | Fibers for lightweight concurrency |
| **Resource Management** | Safe acquisition and release |
| **Configuration** | Declarative config with validation |
| **Observability** | Built-in logging, tracing, metrics |

```typescript
// Effect-style game server example
import { Effect, Context, Config, Layer } from "effect"

// Define a service interface
interface GameRoomService {
  readonly createRoom: (config: RoomConfig) => Effect.Effect<Room, RoomError>
  readonly joinRoom: (roomId: string, playerId: string) => Effect.Effect<void, RoomError>
  readonly broadcast: (roomId: string, message: GameMessage) => Effect.Effect<void>
}

// Create a service tag
const GameRoomService = Context.GenericTag<GameRoomService>("GameRoomService")

// Define errors as tagged classes
class RoomError extends Data.TaggedError("RoomError")<{
  readonly reason: "not_found" | "full" | "invalid"
  readonly message: string
}> {}

// Implement the service
const GameRoomServiceLive = Layer.effect(
  GameRoomService,
  Effect.gen(function* (_) {
    const redis = yield* RedisService
    const config = yield* Config.nested(Config.integer("MAX_PLAYERS"), "ROOM")
    
    const rooms = new Map<string, Room>()
    
    return GameRoomService.of({
      createRoom: (roomConfig) => Effect.gen(function* (_) {
        const roomId = yield* generateRoomId
        const room: Room = {
          id: roomId,
          config: roomConfig,
          players: new Map(),
          status: "waiting"
        }
        rooms.set(roomId, room)
        yield* redis.set(`room:${roomId}`, JSON.stringify(room))
        return room
      }),
      
      joinRoom: (roomId, playerId) => Effect.gen(function* (_) {
        const room = rooms.get(roomId)
        if (!room) {
          return yield* Effect.fail(new RoomError({ 
            reason: "not_found", 
            message: `Room ${roomId} not found` 
          }))
        }
        if (room.players.size >= config) {
          return yield* Effect.fail(new RoomError({ 
            reason: "full", 
            message: "Room is full" 
          }))
        }
        room.players.set(playerId, { id: playerId, ready: false })
      }),
      
      broadcast: (roomId, message) => Effect.gen(function* (_) {
        const room = rooms.get(roomId)
        if (!room) return
        
        for (const ws of room.connections.values()) {
          ws.send(JSON.stringify(message))
        }
      })
    })
  })
)
```

### 3.4 Bun WebSocket Server

```typescript
import { Effect, Layer } from "effect"
import { serve } from "bun"

// Effect-based WebSocket server
const createWebSocketServer = Effect.gen(function* (_) {
  const gameService = yield* GameRoomService
  const config = yield* Config.all([
    Config.string("HOST"),
    Config.number("PORT")
  ])
  
  const [host, port] = config
  
  const server = serve({
    hostname: host,
    port: port,
    
    fetch(req, server) {
      // Upgrade to WebSocket
      const success = server.upgrade(req)
      if (success) return undefined
      
      // Handle HTTP requests
      return new Response("WebSocket Server", { status: 200 })
    },
    
    websocket: {
      open(ws) {
        console.log("Client connected")
      },
      
      message(ws, message) {
        // Parse and handle message
        const data = JSON.parse(message.toString())
        Effect.runPromise(
          gameService.handleMessage(ws, data)
        )
      },
      
      close(ws) {
        Effect.runPromise(
          gameService.handleDisconnect(ws)
        )
      }
    }
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

| Library | Performance | Latency | Features |
|---------|-------------|---------|----------|
| **Bun WebSocket** | Very High | Lowest | Native, zero dependencies |
| **uWebSockets.js** | Very High | Very Low | High-performance, C++ binding |
| **ws** | High | Low | Standard WebSocket |

**Recommendation**: Use **Bun WebSocket** for best performance and developer experience. Bun's native WebSocket implementation is the fastest available for TypeScript.

### 3.6 Effect Configuration Example

```typescript
import { Effect, Config, Layer } from "effect"

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
  Config.string("HOST").pipe(Config.withDefault("localhost")),
  Config.number("PORT").pipe(Config.withDefault(3000)),
  Config.integer("MAX_ROOMS").pipe(Config.withDefault(100)),
  Config.integer("TICK_RATE").pipe(Config.withDefault(30)),
  Config.redacted("API_SECRET")
]).pipe(
  Config.map(([host, port, maxRooms, tickRate, apiSecret]) => ({
    host,
    port,
    maxRooms,
    tickRate,
    apiSecret
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

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Primary DB** | PostgreSQL | 16.x | Persistent data |
| **Cache/Session** | Redis | 7.x | Real-time state, caching |
| **ORM** | Prisma | 5.x | Type-safe queries |
| **Migrations** | Prisma Migrate | 5.x | Schema migrations |

### 4.2 PostgreSQL vs Alternatives

| Database | Pros | Cons | Verdict |
|----------|------|------|---------|
| **PostgreSQL** | ACID, JSONB, mature | Vertical scaling primary | ✅ Recommended |
| MongoDB | Flexible schema | No joins, consistency issues | ❌ Not for games |
| MySQL | Popular | Limited JSON support | ⚠️ Alternative |

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

| System | Frequency | Purpose |
|--------|-----------|---------|
| **Server Tick** | 20-30 Hz | Game state simulation |
| **Client Update** | 60 Hz | Render loop |
| **State Broadcast** | 20 Hz | Position updates to clients |
| **Input Send** | 60 Hz | Client input to server |

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
  private inputBuffer: InputSnapshot[] = [];
  private lastProcessedSeq = 0;

  processInput(input: Input) {
    // 1. Apply locally immediately
    this.applyInput(input);
    
    // 2. Store for reconciliation
    this.inputBuffer.push({
      seq: this.inputSeq++,
      input,
      timestamp: Date.now()
    });
    
    // 3. Send to server
    this.socket.emit('input', input);
  }

  onServerState(state: ServerState) {
    // 4. Reconcile with server
    if (state.lastProcessedSeq > this.lastProcessedSeq) {
      // Remove confirmed inputs
      this.inputBuffer = this.inputBuffer.filter(
        i => i.seq > state.lastProcessedSeq
      );
      
      // Check for mismatch
      if (this.position.distanceTo(state.position) > 0.1) {
        // Snap to server position
        this.position = state.position;
        
        // Re-apply unconfirmed inputs
        this.inputBuffer.forEach(i => this.applyInput(i.input));
      }
    }
  }
}
```

---

## 6. Cloud Infrastructure

### 6.1 Recommended Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Compute** | Kubernetes (GKE/EKS) | Game server orchestration |
| **Game Servers** | Agones | Dedicated game server management |
| **Static Assets** | Cloud CDN | 3D models, textures, audio |
| **Database** | Cloud SQL (PostgreSQL) | Managed PostgreSQL |
| **Cache** | Cloud Memorystore (Redis) | Managed Redis |
| **Load Balancer** | Cloud Load Balancing | Traffic distribution |

### 6.2 Alternative: Simplified Stack

For smaller scale or MVP:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Compute** | Docker + Railway/Render | Simple deployment |
| **Database** | Supabase | PostgreSQL + Auth + Real-time |
| **Cache** | Upstash | Serverless Redis |
| **CDN** | Cloudflare | Static assets |

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

### 7.1 Code Quality

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Pre-commit checks |

### 7.2 Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| Bun Test | Native test runner |

### 7.3 CI/CD

| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD pipeline |
| Docker | Containerization |
| Docker Compose | Local development |

---

## 8. Package.json Overview

### Frontend (client/package.json)

```json
{
  "name": "crossfire-web-client",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.171.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "rapier3d-compat": "^0.12.0",
    "howler": "^2.2.4",
    "zustand": "^4.4.0",
    "effect": "^3.x",
    "@effect/platform": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/three": "^0.171.0"
  }
}
```

### Backend (server/package.json)

```json
{
  "name": "crossfire-web-server",
  "dependencies": {
    "effect": "^3.x",
    "@effect/platform": "^0.x",
    "@effect/platform-bun": "^0.x",
    "@effect/experimental": "^0.x",
    "@effect/sql": "^0.x",
    "@effect/sql-prisma": "^0.x",
    "@prisma/client": "^5.8.0",
    "ioredis": "^5.3.0",
    "msgpackr": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "prisma": "^5.8.0",
    "@types/bun": "latest"
  }
}
```

---

## 9. Technology Decision Matrix

| Requirement | Option A | Option B | Decision |
|-------------|----------|----------|----------|
| 3D Rendering | Three.js | Babylon.js | Three.js (smaller bundle, R3F) |
| UI Framework | React | Vue/Svelte | React (ecosystem, R3F) |
| Backend | Effect Bun | Express | Effect Bun (functional, typed errors) |
| Database | PostgreSQL | MongoDB | PostgreSQL (ACID, relations) |
| WebSocket | Bun WebSocket | uWS | Bun WebSocket (native, high perf) |
| ORM | Prisma | TypeORM | Prisma (DX, migrations) |
| Cache | Redis | Memcached | Redis (data structures) |
| Deployment | K8s + Agones | Docker Compose | K8s for scale, Docker for MVP |

---

*Document Version: 1.0*
*Last Updated: February 2026*
