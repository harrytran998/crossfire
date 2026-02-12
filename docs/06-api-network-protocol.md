# API & Network Protocol Design

## Crossfire Web Game - Communication Protocols

---

## 1. Overview

This document defines the API and network protocols for the Crossfire web game:
- **REST API**: Authentication, user management, static data
- **WebSocket Protocol**: Real-time game communication
- **Message Formats**: Binary serialization with MessagePack

---

## 2. REST API

### 2.1 Base Configuration

```
Base URL: https://api.crossfire-game.com/v1
Content-Type: application/json
```

### 2.2 Authentication Endpoints

#### Register User
```http
POST /auth/register

Request:
{
  "username": "player123",
  "email": "player@example.com",
  "password": "securePassword123"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "player123",
      "email": "player@example.com",
      "createdAt": "2026-02-12T00:00:00Z"
    }
  }
}

Error (400):
{
  "success": false,
  "error": {
    "code": "USERNAME_TAKEN",
    "message": "Username is already taken"
  }
}
```

#### Login
```http
POST /auth/login

Request:
{
  "email": "player@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "username": "player123",
      "displayName": "Player One",
      "level": 15,
      "region": "ASIA"
    }
  }
}
```

#### Refresh Token
```http
POST /auth/refresh

Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true
}
```

### 2.3 Player Endpoints

#### Get Player Profile
```http
GET /players/me
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "Player One",
    "avatarUrl": "https://cdn.example.com/avatars/123.png",
    "level": 15,
    "xp": 25000,
    "stats": {
      "totalMatches": 150,
      "wins": 85,
      "kills": 1250,
      "deaths": 800,
      "kdRatio": 1.56
    }
  }
}
```

#### Update Player Profile
```http
PATCH /players/me
Authorization: Bearer {accessToken}

Request:
{
  "displayName": "New Name",
  "avatarUrl": "https://cdn.example.com/avatars/new.png"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "New Name",
    "avatarUrl": "https://cdn.example.com/avatars/new.png"
  }
}
```

#### Get Player Statistics
```http
GET /players/me/stats
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "overall": {
      "matches": 150,
      "wins": 85,
      "losses": 65,
      "winRate": 0.567,
      "kills": 1250,
      "deaths": 800,
      "assists": 450,
      "kdRatio": 1.56,
      "headshotPercent": 23.5,
      "playtimeHours": 45.5
    },
    "byMode": {
      "team_deathmatch": { "matches": 80, "wins": 50, ... },
      "search_destroy": { "matches": 40, "wins": 20, ... },
      "free_for_all": { "matches": 30, "wins": 15, ... }
    }
  }
}
```

### 2.4 Weapons & Loadouts

#### Get All Weapons
```http
GET /weapons
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "weapons": [
      {
        "id": "uuid",
        "key": "m4a1",
        "name": "M4A1",
        "type": "assault_rifle",
        "rarity": "common",
        "stats": {
          "damage": 30,
          "fireRate": 11.0,
          "accuracy": 0.85,
          "range": 50
        },
        "unlockLevel": 1,
        "owned": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 30
    }
  }
}
```

#### Get Player Loadouts
```http
GET /players/me/loadouts
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "loadouts": [
      {
        "id": "uuid",
        "name": "Assault",
        "slot": 1,
        "isDefault": true,
        "primary": { "id": "uuid", "weaponKey": "m4a1" },
        "secondary": { "id": "uuid", "weaponKey": "desert_eagle" },
        "melee": { "id": "uuid", "weaponKey": "knife" },
        "grenades": {
          "frag": 1,
          "flash": 1,
          "smoke": 0
        }
      }
    ]
  }
}
```

#### Update Loadout
```http
PUT /players/me/loadouts/{loadoutId}
Authorization: Bearer {accessToken}

Request:
{
  "name": "Sniper Setup",
  "primaryWeaponId": "uuid",
  "secondaryWeaponId": "uuid",
  "grenades": {
    "frag": 2,
    "flash": 0,
    "smoke": 1
  }
}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sniper Setup",
    ...
  }
}
```

### 2.5 Match History

#### Get Match History
```http
GET /players/me/matches?page=1&limit=20
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "uuid",
        "gameMode": "team_deathmatch",
        "map": "Desert Storm",
        "result": "win",
        "kills": 15,
        "deaths": 8,
        "assists": 5,
        "score": 1850,
        "duration": 540,
        "completedAt": "2026-02-12T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

### 2.6 Leaderboards

#### Get Leaderboard
```http
GET /leaderboards/{type}?period=weekly&mode=team_deathmatch

Response (200):
{
  "success": true,
  "data": {
    "type": "kills",
    "period": "weekly",
    "entries": [
      {
        "rank": 1,
        "playerId": "uuid",
        "displayName": "TopPlayer",
        "value": 1500,
        "matches": 45
      }
    ],
    "playerRank": {
      "rank": 156,
      "value": 250
    }
  }
}
```

---

## 3. WebSocket Protocol

### 3.1 Connection

```
WebSocket URL: wss://game.crossfire-game.com/ws
```

**Connection Headers:**
```
Authorization: Bearer {accessToken}
X-Client-Version: 1.0.0
```

### 3.2 Message Format

All WebSocket messages use **MessagePack** binary encoding for efficiency.

**Message Envelope:**
```typescript
interface Message {
  type: string;      // Message type identifier
  seq?: number;      // Sequence number (for ordering)
  ts: number;        // Timestamp (ms)
  payload: unknown;  // Message-specific data
}
```

### 3.3 Client → Server Messages

#### Join Lobby
```typescript
{
  type: "join_lobby",
  ts: 1707700000000,
  payload: {}
}
```

#### Create Room
```typescript
{
  type: "create_room",
  ts: 1707700000000,
  payload: {
    name: "My Room",
    configId: "uuid",
    mapId: "uuid",
    isPrivate: false,
    password?: string
  }
}
```

#### Join Room
```typescript
{
  type: "join_room",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    password?: string,
    loadoutId: "uuid"
  }
}
```

#### Leave Room
```typescript
{
  type: "leave_room",
  ts: 1707700000000,
  payload: {
    roomId: "uuid"
  }
}
```

#### Set Ready
```typescript
{
  type: "set_ready",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    ready: true
  }
}
```

#### Player Input (High Frequency - 60Hz)
```typescript
{
  type: "input",
  seq: 1234,
  ts: 1707700000000,
  payload: {
    tick: 5678,
    movement: { x: 0.5, y: 0 },      // Normalized -1 to 1
    look: { x: 45, y: -10 },          // Euler angles
    actions: ["jump", "shoot"],       // Current actions
    weaponSlot: 1
  }
}
```

#### Chat Message
```typescript
{
  type: "chat",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    channel: "team",  // 'global', 'team', 'all'
    message: "Hello!"
  }
}
```

### 3.4 Server → Client Messages

#### Welcome
```typescript
{
  type: "welcome",
  ts: 1707700000000,
  payload: {
    playerId: "uuid",
    serverTick: 12345,
    tickRate: 30,
    serverTime: 1707700000000
  }
}
```

#### Room Created
```typescript
{
  type: "room_created",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    roomCode: "ABC123",
    name: "My Room",
    config: { ... },
    map: { ... }
  }
}
```

#### Room List Update
```typescript
{
  type: "room_list",
  ts: 1707700000000,
  payload: {
    rooms: [
      {
        id: "uuid",
        name: "TDM Room",
        mode: "team_deathmatch",
        map: "Desert Storm",
        players: 8,
        maxPlayers: 16,
        status: "waiting"
      }
    ]
  }
}
```

#### Room State Update
```typescript
{
  type: "room_state",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    players: [
      {
        id: "uuid",
        displayName: "Player1",
        team: 1,
        isReady: true,
        isHost: true
      }
    ],
    status: "waiting"
  }
}
```

#### Player Joined Room
```typescript
{
  type: "player_joined",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    player: {
      id: "uuid",
      displayName: "NewPlayer",
      team: 2,
      isReady: false
    }
  }
}
```

#### Game Starting
```typescript
{
  type: "game_starting",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    countdown: 5,
    map: { ... },
    teams: {
      1: ["uuid1", "uuid2"],
      2: ["uuid3", "uuid4"]
    }
  }
}
```

#### Game State (High Frequency - 20-30Hz)
```typescript
{
  type: "game_state",
  seq: 5678,
  ts: 1707700000000,
  payload: {
    tick: 5680,
    lastProcessedInput: 1234,
    players: [
      {
        id: "uuid",
        pos: { x: 100.5, y: 0, z: -50.2 },
        rot: { x: 0, y: 0.7, z: 0, w: 0.7 },
        vel: { x: 0.5, y: 0, z: 0 },
        health: 100,
        weapon: 1,
        state: "running"  // 'idle', 'running', 'jumping', 'shooting', 'dead'
      }
    ],
    events: [
      {
        type: "hit",
        tick: 5679,
        attackerId: "uuid1",
        targetId: "uuid2",
        damage: 30,
        hitZone: "chest"
      }
    ]
  }
}
```

#### Player Death Event
```typescript
{
  type: "player_death",
  ts: 1707700000000,
  payload: {
    victimId: "uuid",
    killerId: "uuid",
    weaponKey: "m4a1",
    hitZone: "head",
    position: { x: 100, y: 0, z: -50 }
  }
}
```

#### Game Ended
```typescript
{
  type: "game_ended",
  ts: 1707700000000,
  payload: {
    roomId: "uuid",
    winningTeam: 1,
    mvpId: "uuid",
    duration: 540,
    results: [
      {
        playerId: "uuid",
        kills: 15,
        deaths: 8,
        assists: 5,
        score: 1850,
        xpGained: 250,
        isWinner: true
      }
    ]
  }
}
```

#### Error
```typescript
{
  type: "error",
  ts: 1707700000000,
  payload: {
    code: "ROOM_FULL",
    message: "Room is full",
    details: { roomId: "uuid" }
  }
}
```

---

## 4. Delta Compression

### 4.1 Delta State Encoding

For bandwidth efficiency, game state uses delta compression:

```typescript
interface DeltaState {
  tick: number;
  timestamp: number;
  
  // Only changed entities
  players?: DeltaPlayer[];
  projectiles?: DeltaProjectile[];
  
  // Removed entity IDs
  removed?: string[];
  
  // Last acknowledged input per player
  lastInput?: Record<string, number>;
}

interface DeltaPlayer {
  id: string;
  
  // Only include changed fields
  pos?: Vec3;
  rot?: Quaternion;
  vel?: Vec3;
  health?: number;
  state?: string;
  weapon?: number;
}
```

### 4.2 Client-Side State Reconstruction

```typescript
class StateReconciler {
  private lastState: Map<string, PlayerState> = new Map();
  
  applyDelta(delta: DeltaState): Map<string, PlayerState> {
    // Remove deleted entities
    for (const id of delta.removed || []) {
      this.lastState.delete(id);
    }
    
    // Apply delta updates
    for (const deltaPlayer of delta.players || []) {
      const existing = this.lastState.get(deltaPlayer.id);
      
      if (existing) {
        // Merge delta with existing
        this.lastState.set(deltaPlayer.id, {
          ...existing,
          pos: deltaPlayer.pos ?? existing.pos,
          rot: deltaPlayer.rot ?? existing.rot,
          vel: deltaPlayer.vel ?? existing.vel,
          health: deltaPlayer.health ?? existing.health,
          state: deltaPlayer.state ?? existing.state
        });
      } else {
        // New entity (full state expected)
        this.lastState.set(deltaPlayer.id, deltaPlayer as PlayerState);
      }
    }
    
    return this.lastState;
  }
}
```

---

## 5. Error Codes

### Authentication Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_TAKEN` | 400 | Email already registered |
| `USERNAME_TAKEN` | 400 | Username already taken |

### Game Errors
| Code | Description |
|------|-------------|
| `ROOM_NOT_FOUND` | Room does not exist |
| `ROOM_FULL` | Room has reached max players |
| `ROOM_STARTED` | Game already in progress |
| `NOT_ROOM_HOST` | Only host can perform action |
| `INVALID_PASSWORD` | Wrong room password |
| `PLAYER_BANNED` | Player is banned |
| `RATE_LIMITED` | Too many requests |

### WebSocket Errors
| Code | Description |
|------|-------------|
| `CONNECTION_FAILED` | Could not establish connection |
| `INVALID_MESSAGE` | Malformed message format |
| `UNAUTHORIZED` | Missing or invalid auth |
| `SERVER_ERROR` | Internal server error |

---

## 6. Rate Limiting

### REST API Limits
| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests/minute |
| `/auth/register` | 3 requests/hour |
| `/players/*` | 60 requests/minute |
| `/leaderboards/*` | 30 requests/minute |

### WebSocket Limits
| Action | Limit |
|--------|-------|
| `create_room` | 10/minute |
| `join_room` | 30/minute |
| `chat` | 30/minute |
| `input` | 120/second (handled by client) |

---

## 7. Bun WebSocket Implementation

### Server Setup with Effect

```typescript
import { Effect, Context, Layer, Config } from "effect"
import { serve } from "bun"

// WebSocket connection context
interface WebSocketConnection {
  readonly ws: ServerWebSocket
  readonly playerId: string
  readonly roomId?: string
}

const WebSocketConnection = Context.GenericTag<WebSocketConnection>("WebSocketConnection")

// Game message handler service
interface GameMessageHandler {
  readonly handle: (ws: ServerWebSocket, message: unknown) => Effect.Effect<void, Error>
}

const GameMessageHandler = Context.GenericTag<GameMessageHandler>("GameMessageHandler")

// Create WebSocket server
const createGameServer = Effect.gen(function* (_) {
  const config = yield* Config.all([
    Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
    Config.number("PORT").pipe(Config.withDefault(3000))
  ])
  
  const [host, port] = config
  const messageHandler = yield* GameMessageHandler
  
  const server = serve({
    hostname: host,
    port: port,
    
    fetch(req, server) {
      const success = server.upgrade(req)
      return success ? undefined : new Response("Upgrade required", { status: 426 })
    },
    
    websocket: {
      open(ws) {
        console.log("Client connected")
      },
      
      async message(ws, message) {
        const data = JSON.parse(message.toString())
        await Effect.runPromise(messageHandler.handle(ws, data))
      },
      
      close(ws) {
        console.log("Client disconnected")
      }
    }
  })
  
  console.log(`Game server running on ws://${host}:${port}`)
  return server
})

// Run server
const program = createGameServer.pipe(
  Effect.provide(GameMessageHandlerLive)
)

Effect.runPromise(program)
```

---

*Document Version: 1.0*
*Last Updated: February 2026*
