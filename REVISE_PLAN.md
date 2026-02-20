# Crossfire Server - Revision Plan v1.0

> Comprehensive code quality, performance optimization, and API verification roadmap

---

## 1. Executive Summary

### Current Status
- **Total Modules**: 13 implemented
- **Registered Routes**: 9 modules (auth, player, static-data, inventory, loadout, match, leaderboard, friends)
- **Missing Route Registration**: 4 modules (achievement, matchmaking, telemetry, admin)
- **Critical Issues**: 5 (route registration, N+1 queries, missing caching)
- **Performance Issues**: 8 bottlenecks identified

### Quick Start - Verify All Services

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Wait for PostgreSQL to be ready
sleep 10

# 3. Run migrations
migrate -database $DATABASE_URL -path packages/database/migrations up

# 4. Start server
bun run --cwd apps/server dev

# 5. Run health check
curl http://localhost:3000/health
```

---

## 2. Critical Issues (Fix Immediately)

### C01: Missing Route Registrations

**Problem**: 4 modules have handlers implemented but routes not registered in main router.

| Module | Handler File | Status | Route Prefix |
|--------|-------------|--------|--------------|
| Achievement | `achievement.handlers.ts` | ⚠️ Not registered | `/api/achievements` |
| Matchmaking | `matchmaking.handlers.ts` | ⚠️ Not registered | `/api/matchmaking` |
| Telemetry | `telemetry.handlers.ts` | ⚠️ Not registered | `/api/telemetry` |
| Admin | `admin.handlers.ts` | ⚠️ Not registered | `/api/admin` |

**Root Cause**: These modules use Effect.Effect handler pattern instead of RouteDefinition arrays.

**Fix Required**:

```typescript
// apps/server/src/modules/achievement/presentation/http/achievement.handlers.ts
// Add RouteDefinition exports:

export const achievementRoutes: readonly RouteDefinition[] = [
  { method: 'GET', path: '/api/achievements', handler: getAllAchievementsHandler },
  { method: 'GET', path: '/api/achievements/player/:playerId', handler: getPlayerAchievementsHandler },
  { method: 'GET', path: '/api/achievements/progress/:playerId', handler: getAchievementProgressHandler },
]
```

Then register in `apps/server/src/index.ts`:

```typescript
import { achievementRoutes } from './modules/achievement'
import { matchmakingRoutes } from './modules/matchmaking'
import { telemetryRoutes } from './modules/telemetry'
import { adminRoutes } from './modules/admin'

// Add to router:
router.addMany(achievementRoutes)
router.addMany(matchmakingRoutes)
router.addMany(telemetryRoutes)
router.addMany(adminRoutes)
```

---

## 3. Code Quality Improvements

### 3.1 Missing Configuration Files

| File | Status | Priority |
|------|--------|----------|
| `oxlint.config.ts` | ❌ Missing | High |
| `.oxfmtrc.json` | ❌ Missing | High |
| `.vscode/settings.json` | ❌ Missing | Medium |
| `.husky/pre-commit` | ❌ Missing | Medium |

**Create oxlint.config.ts**:

```typescript
import { defineConfig } from 'oxlint'

export default defineConfig({
  rules: {
    // Type-aware rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    
    // Performance
    'no-console': 'warn',
    'no-debugger': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
  ignore: ['dist/', 'node_modules/', '*.generated.ts'],
})
```

**Create .oxfmtrc.json**:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 3.2 Add Pre-commit Hooks

```bash
# Install
bun add -D husky lint-staged

# Initialize
bunx husky init

# Create .husky/pre-commit
echo 'bunx lint-staged' > .husky/pre-commit

# Create lint-staged.config.mjs
export default {
  '*.{ts,tsx}': ['oxlint --fix', 'oxfmt --write'],
}
```

### 3.3 TypeScript Strictness Audit

Current: Good baseline with strict mode

**Improvements Needed**:

1. **Add noUncheckedIndexedAccess**: Catch potential undefined access
2. **Add exactOptionalPropertyTypes**: Prevent accidental undefined assignments
3. **Enable isolatedModules**: Ensure each file can be transpiled independently

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true
  }
}
```

---

## 4. Performance Optimizations

### 4.1 Database N+1 Query Issues

**Critical Files**:

| File | Issue | Impact |
|------|-------|--------|
| `leaderboard.repository.impl.ts` | `getLeaderboard()` - separate queries for definitions, periods, ranks | O(n) queries per request |
| `match.repository.impl.ts` | Match details + participants fetched separately | 2 queries per match |

**Fix Leaderboard N+1**:

```typescript
// Current (N+1):
const definitions = await db.selectFrom('leaderboards').selectAll().execute()
for (const def of definitions) {
  const period = await db.selectFrom('leaderboard_periods').where('definition_id', '=', def.id)...
  const ranks = await db.selectFrom('leaderboard_entries').where('period_id', '=', period.id)...
}

// Optimized (Single Query):
const results = await db
  .selectFrom('leaderboards as l')
  .innerJoin('leaderboard_periods as p', 'p.definition_id', 'l.id')
  .leftJoin('leaderboard_entries as e', 'e.period_id', 'p.id')
  .where('p.status', '=', 'active')
  .select([
    'l.id as def_id',
    'l.name',
    'p.id as period_id',
    'p.start_date',
    'p.end_date',
    'e.player_id',
    'e.rank',
    'e.value',
  ])
  .execute()

// Group by definition in memory
const grouped = Map.groupBy(results, r => r.def_id)
```

### 4.2 Missing Caching Layers

**Static Data Caching**:

```typescript
// apps/server/src/modules/static-data/infrastructure/repositories/static-data.repository.impl.ts

import { CacheService } from '../../../../services/cache.service'

export class StaticDataRepositoryLive implements StaticDataRepository {
  private readonly cacheTtl = 3600 // 1 hour
  
  async getAllWeapons(): Promise<Weapon[]> {
    const cached = await this.cache.get<Weapon[]>('static:weapons')
    if (cached) return cached
    
    const weapons = await this.db.selectFrom('weapons').selectAll().execute()
    await this.cache.set('static:weapons', weapons, this.cacheTtl)
    return weapons
  }
}
```

**Leaderboard Caching**:

```typescript
// Cache leaderboard results for 5 minutes
const CACHE_TTL_LEADERBOARD = 300

async getLeaderboard(metric: string, period: string): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard:${metric}:${period}`
  const cached = await this.cache.get(cacheKey)
  if (cached) return cached
  
  const results = await this.computeLeaderboard(metric, period)
  await this.cache.set(cacheKey, results, CACHE_TTL_LEADERBOARD)
  return results
}
```

### 4.3 Hardcoded Values to Configure

| File | Hardcoded Value | Should Be Config |
|------|----------------|------------------|
| `room.repository.impl.ts` | `DEFAULT_ROOM_TTL = 3600` | `ROOM_TTL_SECONDS` |
| `room.repository.impl.ts` | `concurrency: 5` | `ROOM_MAX_CONCURRENCY` |
| `matchmaking.repository.impl.ts` | `DEFAULT_TTL = 3600` | `MATCHMAKING_TTL_SECONDS` |
| `matchmaking.repository.impl.ts` | `concurrency: 5` | `MATCHMAKING_MAX_CONCURRENCY` |
| `leaderboard.repository.impl.ts` | `MAX_LEADERBOARD_DEFINITIONS_PER_REQUEST = 5` | `LEADERBOARD_MAX_DEFINITIONS` |

**Add to .env.example**:

```bash
# Performance Tuning
ROOM_TTL_SECONDS=3600
ROOM_MAX_CONCURRENCY=5
MATCHMAKING_TTL_SECONDS=3600
MATCHMAKING_MAX_CONCURRENCY=5
LEADERBOARD_MAX_DEFINITIONS=5
CACHE_TTL_STATIC_DATA=3600
CACHE_TTL_LEADERBOARD=300
```

### 4.4 Redis Connection Optimization

Current: Basic IORedis connection

**Improvements**:

```typescript
// apps/server/src/services/redis.service.ts

import Redis from 'ioredis'
import { Effect, Layer } from 'effect'

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD,
  
  // Connection pooling
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Performance tuning
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  
  // Circuit breaker pattern
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
}

// Add circuit breaker
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime ?? 0) > 30000) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
}
```

---

## 5. API Verification with CURL

### 5.1 Prerequisites

```bash
# Set environment variables
export API_BASE="http://localhost:3000"

# Create test user and get token (save for subsequent requests)
TOKEN=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}' \
  | jq -r '.token')
```

### 5.2 Health & Info Routes

```bash
# Health check
curl -s "$API_BASE/health" | jq
# Expected: "OK"

# API info
curl -s "$API_BASE/api" | jq
# Expected: { name, version, status }
```

### 5.3 Auth Routes

```bash
# Register
curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","username":"testuser2","password":"password123"}' \
  | jq

# Login
curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq '.token'

# Get session (requires token)
curl -s "$API_BASE/api/auth/session" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Refresh token
curl -s -X POST "$API_BASE/api/auth/refresh" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Logout
curl -s -X POST "$API_BASE/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.4 Player Routes

```bash
# Create profile
curl -s -X POST "$API_BASE/api/players/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"TestPlayer","region":"NA"}' \
  | jq

# Get profile
curl -s "$API_BASE/api/players/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Update profile
curl -s -X PATCH "$API_BASE/api/players/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"I love this game!"}' \
  | jq

# Get stats
curl -s "$API_BASE/api/players/me/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Get progression
curl -s "$API_BASE/api/players/me/progression" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.5 Static Data Routes

```bash
# Get all weapons
curl -s "$API_BASE/api/static/weapons" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Get weapon attachments
curl -s "$API_BASE/api/static/weapons/ak47/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Get all maps
curl -s "$API_BASE/api/static/maps" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.6 Inventory Routes

```bash
# List inventory
curl -s "$API_BASE/api/inventory" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Acquire item
curl -s -X POST "$API_BASE/api/inventory/acquire" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemType":"weapon","itemId":"weapon-uuid"}' \
  | jq
```

### 5.7 Loadout Routes

```bash
# List loadouts
curl -s "$API_BASE/api/loadouts" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Create loadout
curl -s -X POST "$API_BASE/api/loadouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Loadout","primaryWeaponId":"weapon-uuid","secondaryWeaponId":"weapon-uuid"}' \
  | jq

# Update loadout (replace :loadoutId with actual ID)
curl -s -X PUT "$API_BASE/api/loadouts/:loadoutId" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Loadout"}' \
  | jq

# Delete loadout
curl -s -X DELETE "$API_BASE/api/loadouts/:loadoutId" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.8 Match Routes

```bash
# List match history
curl -s "$API_BASE/api/matches" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Get match details (replace :matchId with actual ID)
curl -s "$API_BASE/api/matches/:matchId" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.9 Leaderboard Routes

```bash
# Get leaderboard
curl -s "$API_BASE/api/leaderboards" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"metric":"kills","period":"weekly"}' \
  | jq
```

### 5.10 Friends Routes

```bash
# Send friend request
curl -s -X POST "$API_BASE/api/friends/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"target-player-uuid"}' \
  | jq

# List pending requests
curl -s "$API_BASE/api/friends/requests" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Accept request
curl -s -X POST "$API_BASE/api/friends/requests/:friendshipId/accept" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Decline request
curl -s -X POST "$API_BASE/api/friends/requests/:friendshipId/decline" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# List friends
curl -s "$API_BASE/api/friends" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Remove friend
curl -s -X DELETE "$API_BASE/api/friends/:friendPlayerId" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

### 5.11 Routes to Implement (Currently Missing)

```bash
# Achievement Routes (TODO)
curl -s "$API_BASE/api/achievements" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/api/achievements/player/:playerId" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/api/achievements/progress/:playerId" -H "Authorization: Bearer $TOKEN"

# Matchmaking Routes (TODO)
curl -s -X POST "$API_BASE/api/matchmaking/queue" -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE "$API_BASE/api/matchmaking/queue" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/api/matchmaking/status" -H "Authorization: Bearer $TOKEN"

# Telemetry Routes (TODO - Admin Only)
curl -s "$API_BASE/api/telemetry/player/:playerId" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/api/telemetry/match/:matchId" -H "Authorization: Bearer $TOKEN"

# Admin Routes (TODO - Admin Only)
curl -s "$API_BASE/api/admin/telemetry/stats/:playerId" -H "Authorization: Bearer $TOKEN"
```

---

## 6. Docker Setup Instructions

### 6.1 Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with secure secrets
nano .env

# Required minimum changes:
# AUTH_SECRET=your-32-char-minimum-secret-key-here
# JWT_SECRET=your-32-char-minimum-jwt-secret-here
```

### 6.2 Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# Verify Redis is healthy
docker-compose exec redis redis-cli ping

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 6.3 Database Migrations

```bash
# Install golang-migrate (if not already installed)
brew install golang-migrate

# Set database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crossfire"

# Run migrations
migrate -database $DATABASE_URL -path packages/database/migrations up

# Verify migration status
migrate -database $DATABASE_URL -path packages/database/migrations version

# Rollback (if needed)
migrate -database $DATABASE_URL -path packages/database/migrations down 1
```

### 6.4 Development Workflow

```bash
# Terminal 1: Start server
bun run --cwd apps/server dev

# Terminal 2: Run type checking
bun run --cwd apps/server typecheck

# Terminal 3: Run linter
bun run lint

# Terminal 4: Run tests
bun run --cwd apps/server test
```

### 6.5 Troubleshooting

**PostgreSQL Connection Refused**:
```bash
# Check if container is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres | tail -50
```

**Migration Failed**:
```bash
# Force migration version
migrate -database $DATABASE_URL -path packages/database/migrations force <version>

# Start fresh (WARNING: Destroys data)
docker-compose down -v
docker-compose up -d
migrate -database $DATABASE_URL -path packages/database/migrations up
```

**Redis Connection Issues**:
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Flush all data (WARNING: Destroys sessions)
redis-cli -h localhost -p 6379 FLUSHALL
```

---

## 7. Implementation Priority

### Phase 1: Critical Fixes (Week 1)

| Task | Priority | Est. Time |
|------|----------|-----------|
| C01: Register missing routes | P0 | 4h |
| P01: Fix leaderboard N+1 query | P0 | 3h |
| P02: Create oxlint/oxfmt configs | P0 | 2h |
| P03: Add static data caching | P1 | 3h |

### Phase 2: Performance (Week 1-2)

| Task | Priority | Est. Time |
|------|----------|-----------|
| P04: Add leaderboard caching | P1 | 3h |
| P05: Configure Redis connection pooling | P1 | 2h |
| P06: Externalize hardcoded values | P1 | 2h |
| P07: Add circuit breaker patterns | P2 | 3h |

### Phase 3: Quality of Life (Week 2)

| Task | Priority | Est. Time |
|------|----------|-----------|
| Q01: Add pre-commit hooks | P2 | 2h |
| Q02: Add VS Code settings | P3 | 1h |
| Q03: Enable stricter TS options | P2 | 2h |
| Q04: Add test coverage reporting | P2 | 3h |

---

## 8. Success Metrics

### Before vs After

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Registered Routes | 9 modules | 13 modules | `curl $API_BASE/api` |
| Leaderboard Query Time | O(n) queries | 1 query | Database logs |
| Static Data Response | ~50ms | <10ms | Cached responses |
| Code Lint Errors | Unknown | 0 | `bun run lint` |
| Test Coverage | Unknown | >80% | Coverage report |
| API Response Time (p95) | Unknown | <250ms | Load testing |

### Verification Checklist

- [ ] All 13 API modules respond to CURL requests
- [ ] `bun run lint` passes with 0 errors
- [ ] `bun run typecheck` passes with 0 errors
- [ ] All tests pass
- [ ] Docker-compose starts all services successfully
- [ ] Database migrations run without errors
- [ ] Health endpoint returns "OK"
- [ ] All API routes return expected responses

---

**Plan Version**: 1.0  
**Created**: February 20, 2026  
**Last Updated**: February 20, 2026  
**Next Review**: After Phase 1 completion
