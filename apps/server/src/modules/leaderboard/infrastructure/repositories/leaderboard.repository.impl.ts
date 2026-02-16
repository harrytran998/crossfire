import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { LeaderboardRepository as LeaderboardRepositoryType } from '../../domain/repositories/leaderboard.repository'
import type { LeaderboardResult } from '../../domain/entities/leaderboard.entity'

export const LeaderboardRepository =
  Context.GenericTag<LeaderboardRepositoryType>('LeaderboardRepository')

export const LeaderboardRepositoryLive = Layer.effect(
  LeaderboardRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const getLeaderboard: LeaderboardRepositoryType['getLeaderboard'] = (
      playerId,
      filters,
      page,
      pageSize,
      includePlayerRank
    ) =>
      Effect.promise(async () => {
        const offset = (page - 1) * pageSize

        let definitionsQuery = db.selectFrom('leaderboards').where('is_active', '=', true)
        if (filters.metricKey) {
          definitionsQuery = definitionsQuery.where('metric_key', '=', filters.metricKey)
        }
        if (filters.period) {
          definitionsQuery = definitionsQuery.where('period_type', '=', filters.period)
        }
        if (filters.mode) {
          definitionsQuery = definitionsQuery.where('game_mode', '=', filters.mode)
        }

        const definitions = await definitionsQuery
          .select(['id', 'metric_key', 'period_type', 'game_mode'])
          .orderBy('created_at', 'desc')
          .execute()

        const results: LeaderboardResult[] = []

        for (const definition of definitions) {
          const entriesRows = await db
            .selectFrom('leaderboard_entries as le')
            .innerJoin('players as p', 'p.id', 'le.player_id')
            .where('le.leaderboard_id', '=', definition.id as string)
            .select([
              'le.rank as rank',
              'le.player_id as player_id',
              'p.display_name as display_name',
              'le.metric_value as metric_value',
              'le.matches_count as matches_count',
            ])
            .orderBy('le.period_end', 'desc')
            .orderBy('le.rank', 'asc')
            .limit(pageSize)
            .offset(offset)
            .execute()

          const entries = entriesRows.map((row) => ({
            rank: row.rank,
            playerId: row.player_id,
            displayName: row.display_name,
            value: row.metric_value as unknown as bigint,
            matchesCount: row.matches_count,
          }))

          let playerRank: { readonly rank: number; readonly value: bigint } | null = null
          if (includePlayerRank) {
            const playerRow = await db
              .selectFrom('leaderboard_entries')
              .where('leaderboard_id', '=', definition.id as string)
              .where('player_id', '=', playerId)
              .select(['rank', 'metric_value'])
              .orderBy('period_end', 'desc')
              .executeTakeFirst()

            playerRank = playerRow
              ? {
                  rank: playerRow.rank,
                  value: playerRow.metric_value as unknown as bigint,
                }
              : null
          }

          results.push({
            metricKey: definition.metric_key,
            period: definition.period_type,
            mode: definition.game_mode,
            entries,
            playerRank,
          })
        }

        return results
      }).pipe(Effect.orDie)

    return LeaderboardRepository.of({
      getLeaderboard,
    })
  })
)
