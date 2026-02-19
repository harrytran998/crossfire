import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { LeaderboardRepository as LeaderboardRepositoryType } from '../../domain/repositories/leaderboard.repository'
import type { LeaderboardResult } from '../../domain/entities/leaderboard.entity'

export const LeaderboardRepository =
  Context.GenericTag<LeaderboardRepositoryType>('LeaderboardRepository')

const MAX_LEADERBOARD_DEFINITIONS_PER_REQUEST = 5

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
          .limit(MAX_LEADERBOARD_DEFINITIONS_PER_REQUEST)
          .execute()

        if (definitions.length === 0) {
          return []
        }

        const definitionIds = definitions.map((definition) => definition.id as string)

        const latestPeriodRows = await db
          .selectFrom('leaderboard_entries')
          .select(['leaderboard_id'])
          .select((eb) => eb.fn.max('period_end').as('latest_period_end'))
          .where('leaderboard_id', 'in', definitionIds)
          .groupBy('leaderboard_id')
          .execute()

        if (latestPeriodRows.length === 0) {
          return definitions.map((definition) => ({
            metricKey: definition.metric_key,
            period: definition.period_type,
            mode: definition.game_mode,
            entries: [],
            playerRank: null,
          }))
        }

        const latestPeriodMap = new Map<string, Date>()
        for (const row of latestPeriodRows) {
          if (row.latest_period_end) {
            latestPeriodMap.set(
              row.leaderboard_id as string,
              row.latest_period_end as unknown as Date
            )
          }
        }

        const latestPeriodFilters = [...latestPeriodMap.entries()].map(
          ([leaderboardId, periodEnd]) => ({
            leaderboardId,
            periodEnd,
          })
        )

        const entriesRows =
          latestPeriodFilters.length === 0
            ? []
            : await db
                .selectFrom('leaderboard_entries as le')
                .innerJoin('players as p', 'p.id', 'le.player_id')
                .select([
                  'le.leaderboard_id as leaderboard_id',
                  'le.rank as rank',
                  'le.player_id as player_id',
                  'p.display_name as display_name',
                  'le.metric_value as metric_value',
                  'le.matches_count as matches_count',
                ])
                .where((eb) =>
                  eb.or(
                    latestPeriodFilters.map((filter) =>
                      eb.and([
                        eb('le.leaderboard_id', '=', filter.leaderboardId),
                        eb('le.period_end', '=', filter.periodEnd),
                      ])
                    )
                  )
                )
                .orderBy('le.rank', 'asc')
                .execute()

        const playerRankRows =
          includePlayerRank && latestPeriodFilters.length > 0
            ? await db
                .selectFrom('leaderboard_entries as le')
                .select([
                  'le.leaderboard_id as leaderboard_id',
                  'le.rank as rank',
                  'le.metric_value as metric_value',
                ])
                .where('le.player_id', '=', playerId)
                .where((eb) =>
                  eb.or(
                    latestPeriodFilters.map((filter) =>
                      eb.and([
                        eb('le.leaderboard_id', '=', filter.leaderboardId),
                        eb('le.period_end', '=', filter.periodEnd),
                      ])
                    )
                  )
                )
                .execute()
            : []

        const entriesByLeaderboardId = new Map<
          string,
          Array<{
            readonly rank: number
            readonly playerId: string
            readonly displayName: string
            readonly value: bigint
            readonly matchesCount: number
          }>
        >()

        for (const row of entriesRows) {
          const leaderboardId = row.leaderboard_id as string
          const group = entriesByLeaderboardId.get(leaderboardId) ?? []
          group.push({
            rank: row.rank,
            playerId: row.player_id,
            displayName: row.display_name,
            value: row.metric_value as unknown as bigint,
            matchesCount: row.matches_count,
          })
          entriesByLeaderboardId.set(leaderboardId, group)
        }

        const playerRankMap = new Map<
          string,
          {
            readonly rank: number
            readonly value: bigint
          }
        >()

        for (const row of playerRankRows) {
          playerRankMap.set(row.leaderboard_id as string, {
            rank: row.rank,
            value: row.metric_value as unknown as bigint,
          })
        }

        const results: LeaderboardResult[] = definitions.map((definition) => {
          const leaderboardId = definition.id as string
          const allEntries = entriesByLeaderboardId.get(leaderboardId) ?? []
          const entries = allEntries.slice(offset, offset + pageSize)

          return {
            metricKey: definition.metric_key,
            period: definition.period_type,
            mode: definition.game_mode,
            entries,
            playerRank: playerRankMap.get(leaderboardId) ?? null,
          }
        })

        return results
      }).pipe(Effect.orDie)

    return LeaderboardRepository.of({
      getLeaderboard,
    })
  })
)
