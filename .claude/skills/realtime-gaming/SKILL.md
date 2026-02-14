---
name: Realtime Gaming
description: WebSocket, state synchronization, and lag compensation for realtime games
---

## Overview

Building realtime games requires coordinating state across multiple clients and server, handling network latency gracefully, and implementing compensation techniques to maintain responsive gameplay despite lag.

## Key Concepts

### State Synchronization

Keep game state consistent between server and clients through:

- Initial state snapshot on connect
- Delta updates (only changed properties)
- Reconciliation when divergence occurs

### Lag Compensation

Techniques to mask latency:

- **Client-side prediction**: Anticipate action results locally
- **Server reconciliation**: Validate and correct predictions
- **Interpolation**: Smooth movement between known positions
- **Extrapolation**: Predict future positions based on velocity

### Network Efficiency

- Minimize data sent per frame
- Use fixed timestep for deterministic updates
- Compress state deltas
- Implement interest/visibility culling

## Code Examples

### WebSocket Server Setup

```typescript
import Bun from 'bun'

interface Player {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  timestamp: number
}

interface GameState {
  players: Map<string, Player>
  lastUpdate: number
}

const gameState: GameState = {
  players: new Map(),
  lastUpdate: Date.now(),
}

const connections = new Map<string, WebSocket>()

serve({
  port: 8080,
  websocket: {
    open(ws) {
      const playerId = crypto.randomUUID()
      connections.set(playerId, ws)

      gameState.players.set(playerId, {
        id: playerId,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        timestamp: Date.now(),
      })

      // Send initial state
      ws.send(
        JSON.stringify({
          type: 'INIT',
          playerId,
          state: serializeGameState(),
        })
      )

      // Broadcast to others
      broadcastExcept(
        {
          type: 'PLAYER_JOINED',
          player: gameState.players.get(playerId),
        },
        playerId
      )
    },

    message(ws, message) {
      const data = JSON.parse(message.toString())
      const playerId = Array.from(connections.entries()).find(([_, wsRef]) => wsRef === ws)?.[0]

      if (!playerId) return

      handlePlayerInput(playerId, data)
    },

    close(ws) {
      const playerId = Array.from(connections.entries()).find(([_, wsRef]) => wsRef === ws)?.[0]

      if (playerId) {
        gameState.players.delete(playerId)
        connections.delete(playerId)

        broadcastExcept(
          {
            type: 'PLAYER_LEFT',
            playerId,
          },
          playerId
        )
      }
    },
  },
})

function handlePlayerInput(playerId: string, input: any) {
  const player = gameState.players.get(playerId)
  if (!player) return

  // Update velocity from input
  player.vx = input.dx * 5 // Scale for speed
  player.vy = input.dy * 5
  player.timestamp = input.clientTimestamp

  // Broadcast movement
  broadcast({
    type: 'PLAYER_MOVED',
    playerId,
    x: player.x,
    y: player.y,
    vx: player.vx,
    vy: player.vy,
    timestamp: player.timestamp,
  })
}

function broadcast(data: any) {
  const message = JSON.stringify(data)
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

function broadcastExcept(data: any, exceptId: string) {
  const message = JSON.stringify(data)
  connections.forEach((ws, id) => {
    if (id !== exceptId && ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

function serializeGameState() {
  const players: any[] = []
  gameState.players.forEach((player) => {
    players.push({
      id: player.id,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
    })
  })
  return { players }
}
```

### Client-Side Prediction

```typescript
interface LocalPlayer {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  inputSequence: number
}

interface PendingInput {
  sequence: number
  dx: number
  dy: number
  processedByServer: boolean
}

class LocalGameState {
  private localPlayer: LocalPlayer
  private remotePlayer: LocalPlayer
  private pendingInputs: PendingInput[] = []
  private lastServerTimestamp: number = 0
  private inputSequence: number = 0

  constructor(playerId: string, initialX: number, initialY: number) {
    this.localPlayer = { id: playerId, x: initialX, y: initialY, vx: 0, vy: 0, inputSequence: 0 }
    this.remotePlayer = { id: playerId, x: initialX, y: initialY, vx: 0, vy: 0, inputSequence: 0 }
  }

  // Local update with prediction
  updateLocalPlayer(dx: number, dy: number): void {
    const input: PendingInput = {
      sequence: this.inputSequence++,
      dx,
      dy,
      processedByServer: false,
    }

    this.pendingInputs.push(input)

    // Predict locally
    this.localPlayer.vx = dx * 5
    this.localPlayer.vy = dy * 5
  }

  // Update based on server state
  reconcileWithServer(serverState: any): void {
    const { x, y, vx, vy, timestamp } = serverState

    // Store server state
    this.remotePlayer.x = x
    this.remotePlayer.y = y
    this.remotePlayer.vx = vx
    this.remotePlayer.vy = vy
    this.lastServerTimestamp = timestamp

    // Re-apply pending inputs
    this.replayInputs()
  }

  private replayInputs(): void {
    let predictedX = this.remotePlayer.x
    let predictedY = this.remotePlayer.y

    for (const input of this.pendingInputs) {
      if (!input.processedByServer) {
        predictedX += input.dx * 5
        predictedY += input.dy * 5
      }
    }

    this.localPlayer.x = predictedX
    this.localPlayer.y = predictedY
  }

  getDisplayPosition(): { x: number; y: number } {
    return { x: this.localPlayer.x, y: this.localPlayer.y }
  }
}
```

### Interpolation

```typescript
class RemotePlayer {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  lastUpdateTime: number
  targetX: number
  targetY: number
  targetVx: number
  targetVy: number

  constructor(id: string, x: number, y: number) {
    this.id = id
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.lastUpdateTime = Date.now()
    this.targetX = x
    this.targetY = y
    this.targetVx = 0
    this.targetVy = 0
  }

  updateFromServer(x: number, y: number, vx: number, vy: number): void {
    this.targetX = x
    this.targetY = y
    this.targetVx = vx
    this.targetVy = vy
    this.lastUpdateTime = Date.now()
  }

  interpolate(deltaTime: number): void {
    const INTERPOLATION_SPEED = 0.1 // Adjust for smoothness

    // Linear interpolation toward target
    this.x += (this.targetX - this.x) * INTERPOLATION_SPEED
    this.y += (this.targetY - this.y) * INTERPOLATION_SPEED
    this.vx += (this.targetVx - this.vx) * INTERPOLATION_SPEED
    this.vy += (this.targetVy - this.vy) * INTERPOLATION_SPEED
  }

  getDisplayPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }
}
```

### Lag Compensation - Server-Side

```typescript
interface GameAction {
  playerId: string
  type: string
  clientTimestamp: number
  data: any
}

class LagCompensator {
  private latencyMap: Map<string, number> = new Map()
  private pingInterval = 100 // ms

  // Estimate player latency
  estimateLatency(playerId: string, rtt: number): void {
    this.latencyMap.set(playerId, rtt / 2) // One-way
  }

  // Rewind to client's perceived time
  rewindGameState(playerId: string, gameState: any, clientTimestamp: number): any {
    const latency = this.latencyMap.get(playerId) || 0
    const rewindAmount = Date.now() - clientTimestamp - latency

    // Reconstruct state from rewindAmount ms ago
    return this.reconstructState(gameState, rewindAmount)
  }

  private reconstructState(state: any, rewindMs: number): any {
    // Rewind physics by calculating where entities would have been
    // This is simplified - real implementation would need full state history
    return { ...state }
  }

  // Validate action and apply hit detection with compensation
  validateAction(action: GameAction, gameState: any): boolean {
    const latency = this.latencyMap.get(action.playerId) || 0
    const actionAge = Date.now() - action.clientTimestamp
    const timeSinceActionOnServer = actionAge - latency

    // Action is valid if received within reasonable time
    return timeSinceActionOnServer < 500 // 500ms tolerance
  }
}
```

### Frame Update Loop

```typescript
class GameLoop {
  private lastFrameTime: number = Date.now()
  private frameTime: number = 1000 / 60 // 60 FPS target
  private running: boolean = true

  constructor(
    private gameState: any,
    private localPlayer: LocalGameState,
    private remotePlayers: Map<string, RemotePlayer>,
    private ws: WebSocket
  ) {}

  start(): void {
    const update = () => {
      const now = Date.now()
      const deltaTime = Math.min(now - this.lastFrameTime, 50) // Cap at 50ms
      this.lastFrameTime = now

      // Update local prediction
      this.updateLocalState(deltaTime)

      // Interpolate remote players
      this.remotePlayers.forEach((player) => {
        player.interpolate(deltaTime)
      })

      // Render
      this.render()

      if (this.running) {
        requestAnimationFrame(update)
      }
    }

    update()
  }

  private updateLocalState(deltaTime: number): void {
    const position = this.localPlayer.getDisplayPosition()
    // Physics update, collision detection, etc.
  }

  private render(): void {
    // Render game state
  }

  handleInput(dx: number, dy: number): void {
    this.localPlayer.updateLocalPlayer(dx, dy)

    // Send to server
    this.ws.send(
      JSON.stringify({
        type: 'INPUT',
        dx,
        dy,
        clientTimestamp: Date.now(),
      })
    )
  }
}
```

### Message Types & Protocol

```typescript
// Server -> Client
type ServerMessage =
  | {
      type: 'INIT'
      playerId: string
      state: GameState
    }
  | {
      type: 'STATE_UPDATE'
      players: PlayerState[]
      timestamp: number
    }
  | {
      type: 'PLAYER_JOINED'
      player: PlayerState
    }
  | {
      type: 'PLAYER_LEFT'
      playerId: string
    }
  | {
      type: 'ACTION_RESOLVED'
      sequence: number
      accepted: boolean
    }

// Client -> Server
type ClientMessage =
  | {
      type: 'INPUT'
      dx: number
      dy: number
      clientTimestamp: number
      sequence: number
    }
  | {
      type: 'PING'
      timestamp: number
    }
```

## Best Practices

### 1. State Management

- Use server as source of truth
- Implement client prediction for responsiveness
- Reconcile regularly to prevent divergence

### 2. Network Efficiency

- Send deltas, not full state
- Compress state updates
- Batch updates when possible
- Implement culling/relevance zones

### 3. Latency Handling

- Always compensate for known latency
- Smooth interpolation for remote players
- Validate actions with lag consideration
- Reset on significant desync

### 4. Security

- Validate all inputs server-side
- Don't trust client predictions for damage/scoring
- Use server timestamp for action ordering
- Implement anti-cheat measures

### 5. Performance

- Use fixed timestep for physics
- Implement object pooling
- Minimize memory allocations in game loop
- Profile and optimize hot paths

## Common Patterns

### Snapshot-based State Sync

```typescript
class GameSnapshot {
  timestamp: number
  players: PlayerSnapshot[]
  static takeSnapshot(gameState: any): GameSnapshot {
    return {
      timestamp: Date.now(),
      players: gameState.players.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
      })),
    }
  }
}
```

### Delta Compression

```typescript
class DeltaCompressor {
  private lastSnapshot: any

  compress(current: any): any {
    const delta: any = {}
    for (const key in current) {
      if (current[key] !== this.lastSnapshot?.[key]) {
        delta[key] = current[key]
      }
    }
    this.lastSnapshot = current
    return delta
  }
}
```

### Interest Management

```typescript
class InterestManager {
  getRelevantPlayers(myPosition: any, allPlayers: any[], radius: number): any[] {
    return allPlayers.filter((player) => {
      const distance = Math.hypot(player.x - myPosition.x, player.y - myPosition.y)
      return distance < radius
    })
  }
}
```
