import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { TelemetryRepository as TelemetryRepositoryType } from '../../domain/repositories/telemetry.repository'
import type {
  MatchEvent,
  PlayerTelemetry,
  ServerMetrics,
  TelemetryTimeRange,
} from '../../domain/entities/telemetry.entity'

export const TelemetryRepository =
  Context.GenericTag<TelemetryRepositoryType>('TelemetryRepository')

export const TelemetryRepositoryLive = Layer.effect(
  TelemetryRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const recordMatchEvent = (event: MatchEvent) =>
      Effect.promise(async () => {
        await db
          .insertInto('match_events')
          .values({
            time: event.time,
            match_id: event.matchId,
            event_type: event.eventType,
            source_player_id: event.sourcePlayerId,
            target_player_id: event.targetPlayerId,
            weapon_id: event.weaponId,
            damage_amount: event.damageAmount,
            hit_zone: event.hitZone,
            position_x: event.positionX,
            position_y: event.positionY,
            position_z: event.positionZ,
            round_number: event.roundNumber,
            tick_number: event.tickNumber,
            metadata: JSON.stringify(event.metadata || {}),
          })
          .execute()
      }).pipe(Effect.orDie)

    const recordPlayerTelemetry = (data: PlayerTelemetry) =>
      Effect.promise(async () => {
        await db
          .insertInto('player_telemetry')
          .values({
            time: data.time,
            player_id: data.playerId,
            match_id: data.matchId,
            kills: data.kills,
            deaths: data.deaths,
            assists: data.assists,
            damage_dealt: data.damageDealt,
            damage_received: data.damageReceived,
            score: data.score,
            ping_ms: data.pingMs,
            fps_avg: data.fpsAvg,
            packet_loss_pct: data.packetLossPct,
          })
          .execute()
      }).pipe(Effect.orDie)

    const recordServerMetrics = (data: ServerMetrics) =>
      Effect.promise(async () => {
        await db
          .insertInto('server_metrics')
          .values({
            time: data.time,
            server_id: data.serverId,
            cpu_percent: data.cpuPercent,
            memory_mb: data.memoryMb,
            connections: data.connections,
            bytes_in: data.bytesIn,
            bytes_out: data.bytesOut,
            active_rooms: data.activeRooms,
            active_players: data.activePlayers,
            tick_rate_avg: data.tickRateAvg,
          })
          .execute()
      }).pipe(Effect.orDie)

    const getMatchEvents = (matchId: string) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('match_events')
          .where('match_id', '=', matchId)
          .orderBy('time', 'desc')
          .selectAll()
          .execute()

        return rows.map((row) => ({
          time: new Date(row.time),
          matchId: String(row.match_id),
          eventType: String(row.event_type),
          sourcePlayerId: row.source_player_id ? String(row.source_player_id) : undefined,
          targetPlayerId: row.target_player_id ? String(row.target_player_id) : undefined,
          weaponId: row.weapon_id ? String(row.weapon_id) : undefined,
          damageAmount: row.damage_amount || undefined,
          hitZone: row.hit_zone || undefined,
          positionX: row.position_x || undefined,
          positionY: row.position_y || undefined,
          positionZ: row.position_z || undefined,
          roundNumber: row.round_number || undefined,
          tickNumber: row.tick_number || undefined,
          metadata: JSON.parse(String(row.metadata || '{}')),
        }))
      }).pipe(Effect.orDie)

    const getPlayerTelemetry = (playerId: string, timeRange: TelemetryTimeRange) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('player_telemetry')
          .where('player_id', '=', playerId)
          .where('time', '>=', timeRange.start)
          .where('time', '<=', timeRange.end)
          .orderBy('time', 'desc')
          .selectAll()
          .execute()

        return rows.map((row) => ({
          time: new Date(row.time),
          playerId: String(row.player_id),
          matchId: String(row.match_id),
          kills: Number(row.kills),
          deaths: Number(row.deaths),
          assists: Number(row.assists),
          damageDealt: BigInt(row.damage_dealt || 0),
          damageReceived: BigInt(row.damage_received || 0),
          score: Number(row.score),
          pingMs: row.ping_ms ? Number(row.ping_ms) : undefined,
          fpsAvg: row.fps_avg ? Number(row.fps_avg) : undefined,
          packetLossPct: row.packet_loss_pct ? Number(row.packet_loss_pct) : undefined,
        }))
      }).pipe(Effect.orDie)

    const getServerMetrics = (serverId: string, timeRange: TelemetryTimeRange) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('server_metrics')
          .where('server_id', '=', serverId)
          .where('time', '>=', timeRange.start)
          .where('time', '<=', timeRange.end)
          .orderBy('time', 'desc')
          .selectAll()
          .execute()

        return rows.map((row) => ({
          time: new Date(row.time),
          serverId: String(row.server_id),
          cpuPercent: row.cpu_percent ? Number(row.cpu_percent) : undefined,
          memoryMb: row.memory_mb ? BigInt(row.memory_mb) : undefined,
          connections: row.connections ? Number(row.connections) : undefined,
          bytesIn: row.bytes_in ? BigInt(row.bytes_in) : undefined,
          bytesOut: row.bytes_out ? BigInt(row.bytes_out) : undefined,
          activeRooms: row.active_rooms ? Number(row.active_rooms) : undefined,
          activePlayers: row.active_players ? Number(row.active_players) : undefined,
          tickRateAvg: row.tick_rate_avg ? Number(row.tick_rate_avg) : undefined,
        }))
      }).pipe(Effect.orDie)

    const getPlayerStatsAggregation = (playerId: string, timeRange: TelemetryTimeRange) =>
      Effect.promise(async () => {
        const result = await db
          .selectFrom('player_telemetry')
          .where('player_id', '=', playerId)
          .where('time', '>=', timeRange.start)
          .where('time', '<=', timeRange.end)
          .select([
            db.fn.sum('kills').as('total_kills'),
            db.fn.sum('deaths').as('total_deaths'),
            db.fn.sum('assists').as('total_assists'),
            db.fn.sum('damage_dealt').as('total_damage_dealt'),
            db.fn.sum('damage_received').as('total_damage_received'),
            db.fn.avg('score').as('avg_score'),
            db.fn.count('match_id').as('matches_played'),
          ])
          .executeTakeFirst()

        return {
          playerId,
          totalKills: Number(result?.total_kills || 0),
          totalDeaths: Number(result?.total_deaths || 0),
          totalAssists: Number(result?.total_assists || 0),
          totalDamageDealt: BigInt(result?.total_damage_dealt || 0),
          totalDamageReceived: BigInt(result?.total_damage_received || 0),
          averageScore: Number(result?.avg_score || 0),
          matchesPlayed: Number(result?.matches_played || 0),
        }
      }).pipe(Effect.orDie)

    return TelemetryRepository.of({
      recordMatchEvent,
      recordPlayerTelemetry,
      recordServerMetrics,
      getMatchEvents,
      getPlayerTelemetry,
      getServerMetrics,
      getPlayerStatsAggregation,
    })
  })
)
