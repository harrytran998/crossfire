# Phase 3 - Real-time & WebSocket Implementation Plan

> Status: IN PROGRESS | Started: February 21, 2026
> Based on EXECUTION_PLAN.md Phase 3 (Week 4-8)

---

## Phase 3 Overview

**Duration**: 3 weeks (Week 4-8)  
**Total Tasks**: 6  
**Exit Gate**: WS protocol + room + matchmaking load-tested

### Phase 3 Exit Gate Criteria
- [ ] Soak test: >=1,000 concurrent WS sessions in dev perf env
- [ ] Room lifecycle recovery on disconnect/reconnect verified
- [ ] Protocol contract tests pass for malformed/outdated messages

---

## Task Progress

### P3-W9-T28: Bun WebSocket Gateway with Effect
**Status**: ✅ COMPLETE  
**Duration**: 2 days  
**Depends On**: T10 (Effect platform), C03 (Event delivery contract)

#### Acceptance Criteria
- [ ] Authenticated WS sessions established
- [ ] Heartbeat mechanism implemented
- [ ] Backpressure policy defined and enforced

#### Subtasks

**Step 1: WebSocket Infrastructure Setup**
- [ ] Install @effect/ws or bun-native WebSocket dependencies
- [ ] Create `apps/server/src/realtime/` directory structure:
  ```
  realtime/
  ├── gateway/
  │   ├── websocket.gateway.ts
  │   ├── connection.manager.ts
  │   └── session.store.ts
  ├── protocol/
  │   ├── message.types.ts
  │   └── envelope.ts
  └── application/
      └── connection.service.ts
  ```

**Step 2: Session Management**
- [ ] Implement connection manager (track active connections)
- [ ] Create session store backed by Redis
- [ ] Add session authentication middleware
- [ ] Handle JWT token validation on WS upgrade

**Step 3: Heartbeat & Connection Health**
- [ ] Implement ping/pong heartbeat (30s interval)
- [ ] Add connection timeout detection (60s without pong)
- [ ] Handle graceful disconnect with cleanup

**Step 4: Backpressure Policy**
- [ ] Implement message buffer per connection
- [ ] Add rate limiting (max 100 messages/sec per client)
- [ ] Define behavior on buffer overflow (drop oldest/drop newest)
- [ ] Add backpressure metrics/logging

**Step 5: Error Handling**
- [ ] Define typed errors for WS failures
- [ ] Implement error recovery strategies
- [ ] Add structured error messages to clients

**Step 6: Testing**
- [ ] Write unit tests for connection manager
- [ ] Write integration tests for WS upgrade
- [ ] Load test with 1,000 concurrent connections

---

### P3-W9-T29: Message Protocol (MessagePack + Versioning)
**Status**: 🔄 IN PROGRESS  
**Duration**: 1.5 days  
**Depends On**: T28 (WebSocket gateway)

#### Acceptance Criteria
- [ ] Protocol schema v1 defined
- [ ] MessagePack encoding/decoding working
- [ ] Compatibility tests for version negotiation

#### Subtasks

**Step 1: Message Schema Design**
- [ ] Define message envelope structure
- [ ] Define message types enum (AUTH, PING, ROOM_CREATE, etc.)

**Step 2: MessagePack Integration**
- [ ] Install @msgpack/msgpack
- [ ] Implement encode/decode functions with Effect

**Step 3: Version Negotiation**
- [ ] Implement version handshake on connection
- [ ] Add backward compatibility layer

**Step 4: Protocol Validation**
- [ ] Implement runtime schema validation
- [ ] Add malformed message handling

---

### P3-W10-T30: Room Service (Redis-backed State)
**Status**: ⏳ PENDING  
**Duration**: 2 days  
**Depends On**: T28 (WebSocket gateway), T29 (Message protocol)

#### Acceptance Criteria
- [ ] Room create/join/leave/start operations working
- [ ] Room state stored in Redis
- [ ] Ownership rules enforced

#### Subtasks

**Step 1: Domain Model**
- [ ] Define Room entity
- [ ] Define Room events

**Step 2: Room Repository (Redis)**
- [ ] Implement RoomRepository interface
- [ ] Add Redis key structure

**Step 3: Room Application Service**
- [ ] Implement room lifecycle operations
- [ ] Add room validation rules

**Step 4: Integration with Gateway**
- [ ] Hook room service into WebSocket gateway
- [ ] Broadcast room updates to connected players

---

### P3-W10-T31: Room WebSocket Handlers
**Status**: ⏳ PENDING  
**Duration**: 1.5 days  
**Depends On**: T30 (Room service)

#### Acceptance Criteria
- [ ] Room event routing stable
- [ ] Broadcast fan-out working efficiently
- [ ] All room operations accessible via WS

#### Subtasks

**Step 1: Handler Registry**
- [ ] Create message handler registry

**Step 2: Room Message Handlers**
- [ ] ROOM_CREATE, ROOM_JOIN, ROOM_LEAVE
- [ ] ROOM_READY, ROOM_START, ROOM_KICK
- [ ] ROOM_SETTINGS, ROOM_LIST

**Step 3: Broadcast Mechanism**
- [ ] Implement room broadcast
- [ ] Add targeted message support

**Step 4: Testing**
- [ ] Unit tests for each handler
- [ ] Integration tests for room workflows

---

### P3-W11-T32: Matchmaking Service
**Status**: ⏳ PENDING  
**Duration**: 2 days  
**Depends On**: T30 (Room service)

#### Acceptance Criteria
- [ ] Queue system with skill-based matching
- [ ] Match assignment with timeout handling
- [ ] Cancel queue functionality

#### Subtasks

**Step 1: Matchmaking Domain Model**
- [ ] Define QueueEntry interface
- [ ] Define MatchmakingStrategy

**Step 2: Queue Management (Redis)**
- [ ] Implement queue repository
- [ ] Add Redis data structures

**Step 3: Matchmaking Algorithm**
- [ ] Implement skill-based matching
- [ ] Handle party/team matching

**Step 4: Match Assignment**
- [ ] Create match room when players found
- [ ] Notify matched players via WS

**Step 5: Timeout & Cancel**
- [ ] Implement queue timeout
- [ ] Allow players to cancel queue

---

### P3-W11-T33: Matchmaking REST API
**Status**: ⏳ PENDING  
**Duration**: 0.5 days  
**Depends On**: T32 (Matchmaking service)

#### Acceptance Criteria
- [ ] Queue/dequeue/status endpoints working
- [ ] Proper error handling and validation

#### Subtasks

**Step 1: Endpoints**
- [ ] POST /api/matchmaking/queue
- [ ] DELETE /api/matchmaking/queue
- [ ] GET /api/matchmaking/status
- [ ] GET /api/matchmaking/health

**Step 2: Validation**
- [ ] Validate game mode exists
- [ ] Check player not already in room/match

**Step 3: Error Handling**
- [ ] Return 400 for invalid game mode
- [ ] Return 409 if already in queue

---

## File Structure

```
apps/server/src/realtime/
├── gateway/
│   ├── websocket.gateway.ts
│   ├── connection.manager.ts
│   └── session.store.ts
├── protocol/
│   ├── message.types.ts
│   └── envelope.ts
├── application/
│   ├── connection.service.ts
│   ├── room.service.ts
│   └── matchmaking.service.ts
├── handlers/
│   ├── room.handlers.ts
│   └── matchmaking.handlers.ts
├── domain/
│   ├── room.ts
│   ├── room.repository.ts
│   ├── matchmaking.ts
│   └── matchmaking.repository.ts
└── infrastructure/
    ├── redis-room.repository.ts
    └── redis-matchmaking.repository.ts
```

---

## Dependencies

```bash
bun add @msgpack/msgpack
```

---

## Next Steps

1. Start T28: Create WebSocket gateway infrastructure
2. Implement connection manager with Redis
3. Add authentication middleware
4. Test basic connectivity
