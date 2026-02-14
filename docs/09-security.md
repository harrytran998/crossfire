# Security & Anti-Cheat Design

## Crossfire Web Game - Comprehensive Security Architecture

---

## 1. Security Philosophy

### 1.1 Core Principles

- **Never Trust the Client**: All game state is authoritative on the server
- **Defense in Depth**: Multiple layers of security
- **Fail Secure**: Default to secure state on errors
- **Zero Trust Architecture**: Verify everything, trust nothing

### 1.2 Threat Model

- Aimbots and wallhacks
- Speed hacks and teleportation
- Damage manipulation
- Wall glitching and map exploits
- Packet manipulation
- Account theft and impersonation
- DDoS attacks
- Data breaches

---

## 2. Server-Authoritative Architecture

### 2.1 Game State Authority

All critical game state lives on the server:

- Player positions, rotations, velocities
- Health, ammunition, weapon states
- Hit detection and damage calculation
- Match state and scoring
- Item pickups and objectives

### 2.2 Client as Renderer

The client is purely a presentation layer:

- Receives state updates from server
- Applies client-side prediction (visual only)
- Submits input to server
- Cannot modify authoritative state

### 2.3 Input Validation Pipeline

```
Client Input → Rate Limit → Format Check → Range Check → Game Logic → State Update
```

---

## 3. Anti-Cheat Measures

### 3.1 Movement Validation

**Position Verification:**

```typescript
interface MovementValidation {
  // Server tracks expected position
  expectedPosition: Vector3;
  lastValidPosition: Vector3;
  maxSpeed: number;
  acceleration: number;

  validateMove(currentPos: Vector3, inputPos: Vector3, deltaTime: number): boolean {
    const distance = Vector3.distance(currentPos, inputPos);
    const maxDistance = this.maxSpeed * deltaTime * 1.1; // 10% tolerance

    if (distance > maxDistance) {
      // Potential speed hack
      return false;
    }
    return true;
  }
}
```

**Movement Constraints:**

- Maximum movement speed enforced server-side
- Acceleration limits prevent instant direction changes
- No-clip detection (moving through walls)
- Vertical position bounds checking
- Gravity validation

### 3.2 Aim & Combat Validation

**Aimbot Detection:**

```typescript
interface AimAnalysis {
  // Track aim patterns
  aimHistory: AimSnapshot[];

  detectAimbot(): CheatProbability {
    const metrics = {
      // Consistent micro-adjustments
      microAdjustmentFrequency: this.calculateMicroAdjustments(),

      // Inhuman reaction time (< 100ms consistently)
      reactionTimeConsistency: this.analyzeReactionTimes(),

      // Perfect crosshair placement
      crosshairAccuracy: this.measureCrosshairAccuracy(),

      // Snap-to-target behavior
      snapDetection: this.detectSnapPatterns(),

      // Headshot percentage anomaly
      headshotRate: this.calculateHeadshotRate()
    };

    return this.evaluateCheatProbability(metrics);
  }
}
```

**Combat Validation:**

- Line-of-sight verification (no shooting through walls)
- Rate of fire enforcement (server-side weapon timing)
- Damage calculation server-side only
- Hitbox verification on server
- Ammo consumption validation

### 3.3 Combat Math Verification

**Damage Calculation (Server-Side Only):**

```typescript
interface DamageCalculator {
  calculateDamage(
    attacker: Player,
    victim: Player,
    weapon: Weapon,
    hitZone: HitZone,
    distance: number
  ): number {
    // All calculation on server
    let damage = weapon.baseDamage;

    // Distance falloff
    damage *= this.calculateDistanceFalloff(distance, weapon.rangeFalloff);

    // Hit zone multiplier
    damage *= this.getHitZoneMultiplier(hitZone);

    // Armor reduction
    damage *= this.calculateArmorReduction(victim.armor);

    // Apply variance (spread, RNG)
    damage *= 0.9 + Math.random() * 0.2;

    return Math.floor(damage);
  }
}
```

### 3.4 Rate Limiting

**Input Rate Limits:**
| Input Type | Max Rate | Burst Limit |
|------------|----------|-------------|
| Movement | 60 Hz | 120/second |
| Shooting | Weapon fire rate | 2x weapon rate |
| Item Use | 5/second | 10/burst |
| Chat | 5/second | 30/minute |
| Room Actions | 10/second | 30/minute |

**API Rate Limits:**
| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 5 | 1 minute |
| Room create | 10 | 1 minute |
| Match join | 30 | 1 minute |
| General API | 100 | 1 minute |

### 3.5 Impossible Action Detection

```typescript
interface ImpossibleActionDetector {
  detectImpossibleActions(action: GameAction, player: Player): DetectionResult {
    const checks = [
      this.checkWeaponAvailability(action, player),
      this.checkAmmoAvailable(action, player),
      this.checkCooldownReady(action, player),
      this.checkPositionValid(action, player),
      this.checkLineOfSight(action, player),
      this.checkAbilityUnlocked(action, player),
      this.checkResourceAvailable(action, player)
    ];

    return this.evaluateDetections(checks);
  }
}
```

---

## 4. Network Security

### 4.1 WebSocket Security

**Connection Validation:**

```typescript
interface WebSocketSecurity {
  // Validate connection upgrade
  validateConnection(request: Request): boolean {
    // Check origin header
    if (!this.isValidOrigin(request.headers.get('origin'))) {
      return false;
    }

    // Validate JWT token
    const token = this.extractToken(request);
    if (!this.verifyToken(token)) {
      return false;
    }

    // Check IP reputation
    if (this.isBlacklistedIP(request.ip)) {
      return false;
    }

    return true;
  }
}
```

**Message Validation:**

```typescript
interface MessageValidator {
  validateMessage(message: unknown): ValidationResult {
    // Schema validation
    const parseResult = GameMessageSchema.safeParse(message);
    if (!parseResult.success) {
      return { valid: false, reason: 'Invalid schema' };
    }

    // Size limit
    if (JSON.stringify(message).length > MAX_MESSAGE_SIZE) {
      return { valid: false, reason: 'Message too large' };
    }

    // Sequence validation (prevent replay)
    if (!this.validateSequence(message.seq)) {
      return { valid: false, reason: 'Invalid sequence' };
    }

    // Timestamp validation (prevent replay)
    if (!this.validateTimestamp(message.ts)) {
      return { valid: false, reason: 'Invalid timestamp' };
    }

    return { valid: true };
  }
}
```

### 4.2 Encryption & Signing

**Message Integrity:**

- All WebSocket messages signed with HMAC-SHA256
- Timestamp in every message (prevent replay)
- Sequence numbers for ordering
- Session-specific signing keys

**Sensitive Data:**

- TLS 1.3 for all connections
- Password hashing with Argon2id
- JWT tokens with short expiry
- Refresh token rotation

### 4.3 DDoS Protection

**Layer 7 Protection:**

- Cloudflare/proxy termination
- Rate limiting per IP
- Connection throttling
- Challenge-response for suspicious traffic
- Geo-blocking capabilities

**Game Server Protection:**

- Connection pooling limits
- Graceful degradation
- Circuit breakers
- Auto-scaling policies

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│  Auth API   │────►│  Database   │
│             │     │             │     │             │
│ 1. Login    │     │ 2. Verify   │     │ 3. Check    │
│    Request  │     │    Password │     │    Creds    │
│             │◄────│             │◄────│             │
│ 4. Receive  │     │ 5. Generate │     │             │
│    Tokens   │     │    JWT      │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 5.2 Token Security

**Access Token:**

- Lifetime: 15 minutes
- Contains: user_id, roles, permissions
- Stored: Memory only (not localStorage)

**Refresh Token:**

- Lifetime: 7 days
- Single use (rotated on each refresh)
- Stored: HttpOnly cookie with SameSite=Strict
- Revocable server-side

### 5.3 Session Management

```typescript
interface SessionSecurity {
  // Session validation
  validateSession(sessionId: string): Effect.Effect<Session, SessionError>;

  // Concurrent session limit
  maxConcurrentSessions: number = 3;

  // Session activity tracking
  trackActivity(sessionId: string, activity: Activity): void;

  // Anomaly detection
  detectSessionAnomaly(session: Session): boolean {
    // Multiple IPs
    // Impossible travel
    // Unusual activity patterns
  }
}
```

### 5.4 Role-Based Access Control

| Role        | Permissions                            |
| ----------- | -------------------------------------- |
| Player      | Play matches, view own data            |
| Moderator   | Kick players, mute chat, view reports  |
| Admin       | Ban players, manage content, view logs |
| Super Admin | Full system access                     |

---

## 6. Data Protection

### 6.1 Data Classification

| Classification | Examples            | Protection                 |
| -------------- | ------------------- | -------------------------- |
| Public         | Player names, stats | None                       |
| Internal       | Match history, logs | Access control             |
| Confidential   | Email, IP addresses | Encryption at rest         |
| Restricted     | Passwords, tokens   | Hashing only, no retrieval |

### 6.2 Data Encryption

**At Rest:**

- PostgreSQL: Transparent Data Encryption (TDE)
- Backups: AES-256 encryption
- Sensitive fields: Application-level encryption

**In Transit:**

- TLS 1.3 minimum
- Certificate pinning (mobile)
- HSTS headers

### 6.3 Data Retention

| Data Type     | Retention  | Disposal    |
| ------------- | ---------- | ----------- |
| Auth tokens   | 7 days     | Auto-delete |
| Match data    | 1 year     | Anonymize   |
| Chat logs     | 30 days    | Delete      |
| Player stats  | Indefinite | N/A         |
| Security logs | 90 days    | Archive     |

---

## 7. Cheat Detection System

### 7.1 Behavioral Analysis

**Statistical Anomaly Detection:**

```typescript
interface PlayerStatistics {
  // Rolling statistics
  averageAccuracy: number;
  averageHeadshotRate: number;
  averageKDRatio: number;
  averageReactionTime: number;

  // Anomaly detection
  detectAnomaly(currentStats: Stats): AnomalyScore {
    const zScores = {
      accuracy: this.zScore(currentStats.accuracy, this.averageAccuracy),
      headshotRate: this.zScore(currentStats.headshotRate, this.averageHeadshotRate),
      kdRatio: this.zScore(currentStats.kdRatio, this.averageKDRatio),
      reactionTime: this.zScore(currentStats.reactionTime, this.averageReactionTime)
    };

    // Flag if multiple metrics are anomalous
    const anomalies = Object.values(zScores).filter(z => Math.abs(z) > 3).length;

    return {
      score: anomalies / Object.keys(zScores).length,
      flagged: anomalies >= 2
    };
  }
}
```

### 7.2 Pattern Detection

**Cheat Signatures:**
| Pattern | Detection Method | Action |
|---------|------------------|--------|
| Aimbot | Micro-adjustment frequency | Flag for review |
| Wallhack | Pre-aiming enemies out of sight | Flag for review |
| Speed hack | Position delta analysis | Immediate kick |
| Damage hack | Server-side calculation | Impossible |
| ESP | Tracking unseen enemies | Statistical analysis |

### 7.3 Replay Analysis

**Post-Match Analysis:**

- Store all player inputs during match
- Server-side replay reconstruction
- Anomaly detection on replay
- Flag suspicious matches for review
- Machine learning model analysis

### 7.4 Machine Learning Detection

```typescript
interface CheatDetectionML {
  model: TensorFlowModel;

  async analyzePlayerBehavior(playerId: string): Promise<DetectionResult> {
    const features = await this.extractFeatures(playerId);

    // Features:
    // - Aim pattern vectors
    // - Movement patterns
    // - Combat statistics
    // - Time-based patterns

    const prediction = await this.model.predict(features);

    return {
      cheatProbability: prediction.cheat,
      confidence: prediction.confidence,
      indicators: prediction.indicators
    };
  }
}
```

---

## 8. Reporting & Moderation

### 8.1 Player Reporting System

```typescript
interface Report {
  reporterId: string
  reportedPlayerId: string
  category: 'cheating' | 'toxic' | 'griefing' | 'bug_abuse'
  matchId?: string
  timestamp: Date
  evidence?: string // Screenshot/video link
  description: string
}
```

### 8.2 Automated Actions

| Confidence Level | Action       | Duration     |
| ---------------- | ------------ | ------------ |
| 90%+             | Auto-ban     | 7 days       |
| 70-90%           | Shadow ban   | Until review |
| 50-70%           | Flag + limit | Ongoing      |
| <50%             | Log only     | N/A          |

### 8.3 Moderation Workflow

```
Report → Auto-Analysis → Queue → Moderator Review → Action → Appeal Process
```

---

## 9. Code Security

### 9.1 Secure Development Practices

**Code Review:**

- All changes require review
- Security-focused review for sensitive code
- Automated static analysis
- Dependency vulnerability scanning

**Type Safety:**

- TypeScript strict mode
- Effect Schema for runtime validation
- No `any` types in security-critical code
- Exhaustive type checking

### 9.2 Dependency Security

```bash
# Automated scanning
bun audit --audit-level=high

# Dependabot for automated updates
# Snyk for vulnerability monitoring
```

### 9.3 Secrets Management

| Secret Type          | Storage               | Rotation |
| -------------------- | --------------------- | -------- |
| API Keys             | Environment variables | 90 days  |
| Database credentials | Vault (HashiCorp)     | 30 days  |
| JWT secret           | Environment variables | 7 days   |
| Encryption keys      | HSM / Cloud KMS       | 365 days |

---

## 10. Monitoring & Incident Response

### 10.1 Security Logging

**Logged Events:**

- Authentication attempts (success/failure)
- Authorization failures
- Input validation failures
- Rate limit triggers
- Cheat detection flags
- Administrative actions
- System access

**Log Format:**

```typescript
interface SecurityLog {
  timestamp: Date
  eventType: SecurityEvent
  actor: { type: 'player' | 'admin' | 'system'; id: string }
  resource: string
  action: string
  result: 'success' | 'failure' | 'blocked'
  metadata: Record<string, unknown>
  ip: string
  userAgent: string
}
```

### 10.2 Real-Time Alerts

| Alert Type      | Threshold        | Response               |
| --------------- | ---------------- | ---------------------- |
| Failed logins   | 10/IP/minute     | Rate limit + alert     |
| Cheat detection | High confidence  | Auto-action + alert    |
| DDoS pattern    | Traffic spike    | Enable protection      |
| Data breach     | Anomalous access | Lockdown + investigate |

### 10.3 Incident Response Plan

1. **Detection**: Automated monitoring + player reports
2. **Triage**: Severity assessment
3. **Containment**: Limit damage spread
4. **Eradication**: Remove threat
5. **Recovery**: Restore services
6. **Post-Mortem**: Learn and improve

---

## 11. Security Testing

### 11.1 Testing Types

| Type                | Frequency    | Scope               |
| ------------------- | ------------ | ------------------- |
| SAST                | Every commit | Code analysis       |
| DAST                | Weekly       | Running application |
| Penetration testing | Quarterly    | Full system         |
| Bug bounty          | Ongoing      | Public program      |

### 11.2 Security Test Cases

- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF tokens validated
- [ ] Authentication bypass attempts fail
- [ ] Authorization boundaries enforced
- [ ] Rate limiting works correctly
- [ ] Input validation catches malicious data
- [ ] Encryption implemented correctly
- [ ] Session management secure
- [ ] Cheat detection triggers correctly

---

## 12. Compliance & Privacy

### 12.1 Data Privacy

- GDPR compliance for EU players
- CCPA compliance for California players
- Privacy policy and terms of service
- Data subject access requests
- Right to deletion

### 12.2 Player Rights

- Access personal data
- Correct inaccurate data
- Delete account and data
- Export data
- Opt-out of marketing

---

## 13. Security Checklist

### Pre-Launch

- [ ] All input validation in place
- [ ] Authentication tested
- [ ] Authorization verified
- [ ] Encryption enabled
- [ ] Rate limiting configured
- [ ] Monitoring active
- [ ] Incident response plan ready
- [ ] Security testing complete
- [ ] Team trained on security

### Ongoing

- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Log review
- [ ] Threat model updates
- [ ] Security training

---

_Document Version: 1.0_
_Last Updated: February 2026_
