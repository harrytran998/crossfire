# Game Features Specification

## Crossfire Web Game - Detailed Game Mechanics

---

## 1. Overview

This document specifies all game features, mechanics, weapons, and modes for the Crossfire web game. The initial release focuses on **PVP modes**, with **Zombie/Mutation mode** planned for Phase 2.

---

## 2. Game Modes

### 2.1 PVP Modes (Phase 1)

#### 2.1.1 Team Deathmatch (TDM)

| Property | Description |
|----------|-------------|
| **Objective** | Two teams compete to reach the kill limit first |
| **Teams** | Black List vs Global Risk |
| **Players** | 4v4 to 8v8 (configurable) |
| **Win Condition** | First team to reach target kills (40/60/100) or highest kills when time expires |
| **Time Limit** | 5, 10, or 15 minutes |
| **Respawn** | Yes, 3-5 second respawn delay |
| **Friendly Fire** | Configurable (on/off) |

**Gameplay Flow:**
1. Players spawn at team bases
2. Eliminate enemy players to score points
3. Respawn after death
4. First team to reach kill limit wins

#### 2.1.2 Search & Destroy (S&D)

| Property | Description |
|----------|-------------|
| **Objective** | Attackers plant bomb, Defenders prevent/diffuse |
| **Teams** | Black List (Attackers) vs Global Risk (Defenders) |
| **Players** | 5v5 (standard competitive) |
| **Win Condition** | Bomb detonation (Attackers win) OR Bomb defused/Attackers eliminated (Defenders win) |
| **Rounds** | Best of 10 or 12 rounds |
| **Time Limit** | 2:30 per round |
| **Respawn** | No (per round) |

**Gameplay Flow:**
1. Round starts, Attackers have bomb
2. Attackers attempt to plant bomb at Site A or B
3. Defenders try to eliminate Attackers or defuse planted bomb
4. Round ends when objective completed or team eliminated
5. Teams swap sides at half-time

#### 2.1.3 Free for All (FFA)

| Property | Description |
|----------|-------------|
| **Objective** | Every player for themselves, score highest kills |
| **Players** | 8-16 players |
| **Win Condition** | First player to reach kill limit or highest kills at time end |
| **Time Limit** | 5 or 10 minutes |
| **Respawn** | Yes, instant respawn at random spawn point |
| **Friendly Fire** | N/A |

**Gameplay Flow:**
1. All players spawn at random locations
2. Hunt and eliminate any other player
3. Each kill adds to personal score
4. Top 3 players shown on leaderboard

#### 2.1.4 Elimination Mode

| Property | Description |
|----------|-------------|
| **Objective** | Eliminate entire enemy team |
| **Teams** | Black List vs Global Risk |
| **Players** | 4v4 to 6v6 |
| **Win Condition** | Eliminate all enemy players |
| **Rounds** | Best of 10 rounds |
| **Time Limit** | 2:00 per round |
| **Respawn** | No (per round) |

**Gameplay Flow:**
1. Round starts
2. Teams fight to eliminate all enemies
3. Last team standing wins round
4. First team to win majority of rounds wins match

### 2.2 Zombie/Mutation Mode (Phase 2)

#### 2.2.1 Mutation Mode Overview

| Property | Description |
|----------|-------------|
| **Objective** | Survivors survive the round OR Mutants infect all humans |
| **Players** | 8-16 players |
| **Win Condition (Humans)** | Survive timer (2:30) or kill all mutants |
| **Win Condition (Mutants)** | Infect all humans before time expires |
| **Respawn** | Dead mutants stay dead, infected humans respawn as mutants |

**Gameplay Flow:**
1. Round starts with all players as soldiers
2. **20-second preparation time** - find defensive positions, no weapons fire
3. **1-2 random players transform into "Mutant Zero"** (Host mutants with bonus HP)
4. Mutants attempt to infect humans by attacking (melee only)
5. **Infected humans become mutants** after 3-second transformation
6. Supply crates drop periodically with special weapons
7. **Hero transformation** - when 2-3 humans remain, they become Heroes with powerful weapons
8. Round ends when all humans infected (Mutants win) or time expires/survivors remain (Humans win)

#### 2.2.2 Mutant Classes

| Class | HP | Speed | Special Ability | Unlock |
|-------|-----|-------|-----------------|--------|
| **Dread (Normal)** | 2000 | Fast | Basic mutant, available to all | Default |
| **Slug** | 3000 | Slow | Extended reach (tentacle attack) | Level 10 |
| **Maiden** | 2500 | Fast | Invisibility (3 sec) + High Jump | Level 20 |
| **Smoke** | 2000 | Fast | Smoke screen (obscures vision) | Level 30 |
| **Assassin** | 2200 | Very Fast | Repulse grenades (knockback humans) | Level 40 |
| **Enchantress** | 1800 | Fast | Heal nearby mutants, speed boost | Level 50 |
| **Terminator** | 5000 | Slow | Ranged energy attack, very high HP | Premium/Special |

**Mutant Evolution System:**
- Each infection earns evolution points
- Evolution increases HP by 200 per level
- Maximum 5 evolution levels per round
- Higher evolution = larger mutant hitbox

#### 2.2.3 Human Abilities & Items

| Item | Effect | Source |
|------|--------|--------|
| **Mutation Spike** | Barrier that repels mutants (5 sec) | Supply crate |
| **Mutation Grenade** | Explosion damages/knockback mutants | Supply crate |
| **Mutation Jacket** | +1000 HP for humans | Supply crate |
| **Medic Grenade** | Heals nearby humans | Supply crate |
| **Hero Transformation** | Powerful weapon + 2000 HP | Auto (2-3 survivors) |

**Supply Crate System:**
- Crates drop at 30-second intervals
- Contains 1-2 random items
- Marked on minimap for all humans
- Competition for crates adds tactical element

#### 2.2.4 Zombie Mode (PVE)

| Property | Description |
|----------|-------------|
| **Objective** | Survive waves and complete objectives |
| **Players** | 4-8 players (cooperative) |
| **Win Condition** | Complete all waves + defeat final boss |
| **Respawn** | Limited revives (3 per team per wave) |

**Gameplay Flow:**
1. Team spawns at map start point
2. **Waves of AI zombies** attack progressively
3. Each wave increases zombie count and types
4. **Mini-boss** appears every 3rd wave
5. **Final boss battle** at wave 10
6. **Supply drops** between waves
7. **Scoring system** rates performance: SS, S+, A, B, C

**Zombie Types (AI):**

| Type | HP | Speed | Behavior |
|------|-----|-------|----------|
| **Shambler** | 100 | Slow | Basic, walks toward players |
| **Runner** | 80 | Fast | Sprints at players |
| **Crawler** | 150 | Medium | Low profile, harder to hit |
| **Spitter** | 60 | Slow | Ranged acid attack |
| **Tank** | 1000 | Slow | High HP, charge attack |
| **Boss** | 10000 | Variable | Unique abilities per boss |

**Scoring System:**
| Grade | Requirements |
|-------|--------------|
| **SS** | 0 deaths, 95%+ accuracy, fast clear |
| **S+** | 1-2 deaths, 85%+ accuracy |
| **A** | 3-4 deaths, good performance |
| **B** | 5+ deaths, completed mission |
| **C** | Multiple revives used |

#### 2.2.5 Mutation Mode Maps

| Map | Setting | Features |
|-----|---------|----------|
| **Port** | Cargo ship | Multiple levels, containers |
| **Zombie Lab** | Underground facility | Narrow corridors, ambush points |
| **Lost City** | Abandoned city | Open areas, building interiors |
| **Prison** | Abandoned prison | Cell blocks, guard towers |

#### 2.2.6 Zombie Mode Maps

| Map | Waves | Boss | Difficulty |
|-----|-------|------|------------|
| **Dead End** | 10 | Abomination | Normal |
| **The Maze** | 12 | Hydra | Hard |
| **Red Zone** | 15 | Overlord | Expert |

---

## 3. Weapons System

### 3.1 Weapon Categories

#### Primary Weapons

**Assault Rifles**
| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| M4A1 | 30 | High | High | 30 | Balanced, all-purpose |
| AK-47 | 36 | Medium | Medium | 30 | High damage, more recoil |
| SG552 | 32 | High | High | 30 | Scope available |
| AUG A1 | 32 | High | High | 30 | Scope available |
| SCAR-L | 31 | High | High | 30 | Low recoil |

**Submachine Guns (SMG)**
| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| MP5 | 25 | Very High | High | 30 | Low recoil, close range |
| P90 | 22 | Very High | Medium | 50 | Large magazine |
| UZI | 24 | Very High | Low | 32 | High mobility |
| MP7 | 23 | Very High | High | 40 | Good accuracy |

**Sniper Rifles**
| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| AWM | 115 | Very Low | Very High | 5 | One-shot kill, bolt-action |
| M82 | 95 | Low | Very High | 10 | Semi-auto, high damage |
| SVD | 70 | Medium | High | 10 | Semi-auto, fast |
| M24 | 95 | Low | Very High | 5 | Bolt-action |

**Shotguns**
| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| SPAS-12 | 80/pellet | Low | Low | 8 | Pump-action |
| XM1014 | 60/pellet | Medium | Low | 7 | Semi-auto |
| AA-12 | 45/pellet | High | Low | 20 | Full auto |

**Machine Guns**
| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| M249 | 32 | High | Low | 100 | Suppressive fire |
| RPK | 34 | High | Medium | 75 | Good for defense |

#### Secondary Weapons (Pistols)

| Weapon | Damage | Fire Rate | Accuracy | Magazine | Special |
|--------|--------|-----------|----------|----------|---------|
| Desert Eagle | 55 | Low | High | 7 | High damage |
| USP | 30 | Medium | High | 12 | Suppressed option |
| Glock 18 | 25 | High | Medium | 20 | Full auto option |
| M9 | 28 | Medium | High | 15 | Balanced |
| Anaconda | 60 | Very Low | Very High | 6 | Revolver, high damage |

#### Melee Weapons

| Weapon | Damage | Range | Speed | Special |
|--------|--------|-------|-------|---------|
| Combat Knife | 50 | Short | Fast | Quick attack |
| Machete | 65 | Medium | Medium | Higher damage |
| Katana | 80 | Medium | Medium | Two-hit kill |
| Axe | 90 | Short | Slow | One-hit kill potential |

#### Grenades

| Type | Effect | Damage | Radius | Count |
|------|--------|--------|--------|-------|
| Frag Grenade | Explosion | 100 max | 5m | 1-2 |
| Flashbang | Blind | N/A | 8m | 1-2 |
| Smoke Grenade | Smoke screen | N/A | 6m | 1 |
| HE Grenade | High explosive | 120 max | 6m | 1 |

### 3.2 Weapon Mechanics

**Recoil System:**
- Each weapon has unique recoil pattern
- Continuous fire increases spread
- Crouching reduces recoil by 20%
- Moving increases spread by 30%

**Damage Calculation:**
```
Final Damage = Base Damage × Hit Zone Multiplier × Distance Falloff × Armor Reduction
```

**Hit Zone Multipliers:**
| Body Part | Multiplier |
|-----------|------------|
| Head | 2.5x - 4.0x (weapon dependent) |
| Chest | 1.0x |
| Stomach | 0.9x |
| Arms | 0.7x |
| Legs | 0.6x |

**Armor System:**
- Helmets reduce headshot damage by 20-30%
- Body armor reduces torso damage by 25%
- Armor degrades with damage taken

---

## 4. Player Mechanics

### 4.1 Movement

| Action | Speed | Description |
|--------|-------|-------------|
| Walking | 250 units/s | Normal movement |
| Running | 250 units/s | Default (same as walking) |
| Sprinting | 350 units/s | Faster but cannot shoot |
| Crouching | 150 units/s | Reduced recoil, quieter |
| Jumping | - | 50 unit vertical |
| Prone | 100 units/s | Lowest profile, best accuracy |

**Movement Mechanics:**
- Strafe speed: 80% of forward speed
- Backward speed: 70% of forward speed
- Jump stamina: Limited consecutive jumps
- Fall damage: After 300 unit fall

### 4.2 Combat Mechanics

**Aiming:**
- Hip fire: Less accurate, faster
- Aim Down Sights (ADS): More accurate, slower
- Crosshair spread indicates accuracy

**Shooting:**
- Fire modes: Single, Burst, Full Auto (weapon dependent)
- Reload time: 1.5-3.5 seconds (weapon dependent)
- Magazine system (not shell-by-shell except shotguns)

**Health System:**
- Maximum HP: 100
- No natural health regeneration
- Health pickups available on certain modes
- Death at 0 HP

### 4.3 Audio System

**Sound Categories:**
| Sound Type | Range | Importance |
|------------|-------|------------|
| Footsteps | 15-20m | High |
| Gunfire | 50-100m | Very High |
| Reloading | 10m | Medium |
| Grenade bounce | 15m | High |
| Voice commands | 30m | Low |

---

## 5. Maps

### 5.1 Initial Maps (Phase 1)

#### Map 1: Desert Storm (TDM, FFA)
- **Setting**: Middle Eastern desert town
- **Size**: Medium (supports 8-12 players)
- **Layout**: Mixed indoor/outdoor, multiple levels
- **Features**: Sniping positions, close quarters areas

#### Map 2: Black Widow (S&D, Elimination)
- **Setting**: Industrial warehouse complex
- **Size**: Small-Medium (supports 5v5 competitive)
- **Layout**: Two bomb sites, interconnected pathways
- **Features**: Multiple routes, tactical gameplay

#### Map 3: Eagle Eye (TDM, S&D)
- **Setting**: Snow-covered mountain base
- **Size**: Large (supports 10-16 players)
- **Layout**: Open areas with building cover
- **Features**: Long sight lines, vehicle cover

#### Map 4: Factory (All modes)
- **Setting**: Abandoned factory
- **Size**: Medium (supports 8-12 players)
- **Layout**: Multi-level interior, outdoor perimeter
- **Features**: Close quarters combat, verticality

### 5.2 Map Elements

**Spawn Points:**
- Team spawns (TDM, S&D, Elimination)
- Random spawns (FFA)
- Dynamic spawn adjustment based on enemy positions

**Interactive Elements:**
- Destructible doors (select maps)
- Opening/closing doors
- Ladders and climbable surfaces
- Explodable barrels (environmental hazard)

---

## 6. Room/Lobby System

### 6.1 Room Configuration

| Setting | Options |
|---------|---------|
| Room Name | Custom text (4-20 characters) |
| Password | Optional (for private rooms) |
| Game Mode | TDM, FFA, S&D, Elimination |
| Map | Select from available maps |
| Max Players | 8, 10, 12, 16 |
| Kill Limit | 40, 60, 100 (TDM/FFA) |
| Round Limit | 6, 10, 12 (S&D/Elimination) |
| Time Limit | 5, 10, 15 minutes |
| Friendly Fire | On/Off |
| Auto-balance | On/Off |
| Spectator Slots | 0-4 |

### 6.2 Room States

1. **Waiting**: Room is open for players to join
2. **Ready Check**: All players must ready up
3. **Loading**: Map and assets loading
4. **In Progress**: Match is active
5. **Round End**: Between rounds (S&D, Elimination)
6. **Match End**: Final results displayed

### 6.3 Player States in Room

- **Spectator**: Watching the match
- **Team Black List**: On attacking/first team
- **Team Global Risk**: On defending/second team
- **Unassigned**: In room, not on team
- **Ready**: Confirmed ready to start

---

## 7. Progression System

### 7.1 Player Ranks

| Rank | Title | XP Required |
|------|-------|-------------|
| 1 | Recruit | 0 |
| 2-5 | Private | 500 - 2,000 |
| 6-10 | Corporal | 3,000 - 10,000 |
| 11-20 | Sergeant | 15,000 - 50,000 |
| 21-35 | Lieutenant | 60,000 - 150,000 |
| 36-50 | Captain | 175,000 - 350,000 |
| 51-70 | Major | 400,000 - 700,000 |
| 71+ | General | 800,000+ |

### 7.2 XP Rewards

| Action | XP Gained |
|--------|-----------|
| Match completion | 50-100 base |
| Kill | 10 |
| Headshot kill | 15 |
| Assist | 5 |
| Objective (plant/defuse) | 25 |
| Round win | 15 |
| Match win | 50 bonus |
| First win of day | 200 bonus |

### 7.3 Unlockables

**Weapon Unlocks (by rank):**
- Ranks 1-5: Basic assault rifles, SMGs, pistols
- Ranks 6-15: Advanced assault rifles, shotguns
- Ranks 16-30: Sniper rifles, machine guns
- Ranks 31+: Special weapons

**Achievement-based Unlocks:**
- 100 headshots: Achievement badge
- Win 100 matches: Title unlock
- Kill 1000 enemies: Weapon skin

---

## 8. User Interface

### 8.1 HUD Elements

```
┌─────────────────────────────────────────────────────────┐
│ [Map Name]                        [Kill Feed]           │
│                                                         │
│     ┌─────────────────────────────────────────┐         │
│     │                                         │         │
│     │           GAME VIEW                     │         │
│     │                                         │         │
│     │              [Crosshair]                │         │
│     │                                         │         │
│     │                                         │         │
│     └─────────────────────────────────────────┘         │
│                                                         │
│ [Weapon] [Ammo: 30/90]  [HP: 100]  [Killstreak: 5]      │
│ [Score: Team1 45 - 32 Team2]  [Time: 3:45]              │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Scoreboard

| Column | Description |
|--------|-------------|
| Player Name | Display name with rank icon |
| Score | Total points earned |
| Kills | Number of kills |
| Deaths | Number of deaths |
| Assists | Number of assists |
| Ping | Network latency |
| Status | Alive/Dead/Spectating |

### 8.3 Kill Feed

- Real-time display of kills
- Shows: Killer → Victim (Weapon Icon)
- Special indicators for headshots, assists
- Recent 5 events displayed

---

## 9. Anti-Cheat Measures

### 9.1 Server-Side Validation

- All player inputs validated on server
- Impossible movement detection
- Rate-of-fire enforcement
- Damage validation (no damage through walls without penetration)

### 9.2 Anomaly Detection

- Inhuman reaction time detection
- Unusual accuracy patterns
- Movement speed violations
- Input frequency analysis

### 9.3 Client-Side Protection

- Code obfuscation
- Memory protection measures
- Input validation before server submission

---

*Document Version: 1.0*
*Last Updated: February 2026*
