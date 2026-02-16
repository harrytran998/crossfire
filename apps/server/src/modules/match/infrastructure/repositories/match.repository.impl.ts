import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { MatchRepository as MatchRepositoryType } from '../../domain/repositories/match.repository'
import type { MatchDetail, MatchParticipant, MatchSummary } from '../../domain/entities/match.entity'

export const MatchRepository = Context.GenericTag<MatchRepositoryType>('MatchRepository')

export const MatchRepositoryLive = Layer.effect(
  MatchRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const listByPlayerId: MatchRepositoryType['listByPlayerId'] = (playerId, page, pageSize) =>
      Effect.promise(async () => {
        const offset = (page - 1) * pageSize

        const totalRow = await db
          .selectFrom('match_participants')
          .where('player_id', '=', playerId)
          .select((eb) => eb.fn.count<string>('id').as('count'))
          .executeTakeFirstOrThrow()

        const rows = await db
          .selectFrom('match_participants')
          .innerJoin('matches', 'matches.id', 'match_participants.match_id')
          .innerJoin('maps', 'maps.id', 'matches.map_id')
          .where('match_participants.player_id', '=', playerId)
          .select([
            'matches.id as match_id',
            'matches.game_mode',
            'matches.map_id',
            'maps.name as map_name',
            'matches.started_at',
            'matches.completed_at',
            'matches.duration_seconds',
            'matches.winning_team',
            'match_participants.score',
            'match_participants.kills',
            'match_participants.deaths',
            'match_participants.assists',
            'match_participants.is_winner',
          ])
          .orderBy('matches.completed_at', 'desc')
          .limit(pageSize)
          .offset(offset)
          .execute()

        const items: MatchSummary[] = rows.map((row) => ({
          id: row.match_id as unknown as string,
          gameMode: row.game_mode as unknown as string,
          mapId: row.map_id,
          mapName: row.map_name as unknown as string,
          startedAt: row.started_at as unknown as Date,
          completedAt: row.completed_at as unknown as Date,
          durationSeconds: row.duration_seconds,
          winningTeam: row.winning_team,
          score: row.score,
          kills: row.kills,
          deaths: row.deaths,
          assists: row.assists,
          isWinner: row.is_winner,
        }))

        return {
          items,
          total: Number(totalRow.count),
          page,
          pageSize,
        }
      }).pipe(Effect.orDie)

    const getDetailByPlayerId: MatchRepositoryType['getDetailByPlayerId'] = (playerId, matchId) =>
      Effect.promise(async () => {
        const playerParticipant = await db
          .selectFrom('match_participants')
          .where('match_id', '=', matchId)
          .where('player_id', '=', playerId)
          .select(['id'])
          .executeTakeFirst()

        if (!playerParticipant) {
          return null
        }

        const match = await db
          .selectFrom('matches')
          .innerJoin('maps', 'maps.id', 'matches.map_id')
          .where('matches.id', '=', matchId)
          .select([
            'matches.id',
            'matches.game_mode',
            'matches.map_id',
            'maps.name as map_name',
            'matches.started_at',
            'matches.completed_at',
            'matches.duration_seconds',
            'matches.winning_team',
          ])
          .executeTakeFirst()

        if (!match) {
          return null
        }

        const participantsRows = await db
          .selectFrom('match_participants')
          .where('match_id', '=', matchId)
          .select([
            'player_id',
            'team',
            'score',
            'kills',
            'deaths',
            'assists',
            'headshots',
            'damage_dealt',
            'damage_received',
            'is_winner',
            'position',
            'xp_gained',
          ])
          .orderBy('score', 'desc')
          .execute()

        const participants: MatchParticipant[] = participantsRows.map((row) => ({
          playerId: row.player_id,
          team: row.team,
          score: row.score,
          kills: row.kills,
          deaths: row.deaths,
          assists: row.assists,
          headshots: row.headshots,
          damageDealt: row.damage_dealt as unknown as bigint,
          damageReceived: row.damage_received as unknown as bigint,
          isWinner: row.is_winner,
          position: row.position,
          xpGained: row.xp_gained,
        }))

        const detail: MatchDetail = {
          id: match.id as unknown as string,
          gameMode: match.game_mode as unknown as string,
          mapId: match.map_id,
          mapName: match.map_name as unknown as string,
          startedAt: match.started_at as unknown as Date,
          completedAt: match.completed_at as unknown as Date,
          durationSeconds: match.duration_seconds,
          winningTeam: match.winning_team,
          participants,
        }

        return detail
      }).pipe(Effect.orDie)

    return MatchRepository.of({
      listByPlayerId,
      getDetailByPlayerId,
    })
  })
)
