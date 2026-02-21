import { Context, Effect, Layer } from 'effect'
import { GameConfig } from '@crossfire/shared'
import { DatabaseService } from '../../../../services/database.service'
import { RedisService } from '../../../../services/redis.service'
import type { LeaderboardRepository as LeaderboardRepositoryType } from '../../domain/repositories/leaderboard.repository'
import type { LeaderboardResult } from '../../domain/entities/leaderboard.entity'

export const LeaderboardRepository =
  Context.GenericTag<LeaderboardRepositoryType>('LeaderboardRepository')

const CACHE_KEY_PREFIX = 'leaderboard:'

const buildCacheKey = (
  playerId: string,
  filters: {
    metricKey?: string | undefined
    period?: string | undefined
    mode?: string | undefined
  },
  page: number,
  pageSize: number,
  includePlayerRank: boolean
): string => {
  const filterStr =
    [filters.metricKey, filters.period, filters.mode].filter(Boolean).join(':') || 'all'
  return `${CACHE_KEY_PREFIX}${playerId}:${filterStr}:${page}:${pageSize}:${includePlayerRank}`
}

export const LeaderboardRepositoryLive = Layer.effect(
  LeaderboardRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const redis = yield* RedisService
    const gameConfig = yield* GameConfig

    const getLeaderboard: LeaderboardRepositoryType['getLeaderboard'] = (
      playerId,
      filters,
      page,
      pageSize,
      includePlayerRank
    ) =>
      Effect.gen(function* () {
        const cacheKey = buildCacheKey(playerId, filters, page, pageSize, includePlayerRank)

        const cached = yield* Effect.option(redis.get(cacheKey).pipe(Effect.orDie))
        if (cached._tag === 'Some' && cached.value) {
          return JSON.parse(cached.value)
        }

        const result = yield* Effect.promise(async () => {
          const offset = (page - 1) * pageSize

          const definitions = await db
            .selectFrom('leaderboards')
            .where('is_active', '=', true)
            .$if(Boolean(filters.metricKey), (qb) =>
              qb.where('metric_key', '=', filters.metricKey!)
            )
            .$if(Boolean(filters.period), (qb) => qb.where('period_type', '=', filters.period!))
            .$if(Boolean(filters.mode), (qb) => qb.where('game_mode', '=', filters.mode!))
            .select(['id', 'metric_key', 'period_type', 'game_mode'])
            .orderBy('created_at', 'desc')
            .limit(gameConfig.leaderboardMaxDefinitions)
            .execute()

          if (definitions.length === 0) {
            return []
          }

          const definitionIds = definitions.map((d) => d.id as string)

          const latestEntriesSubquery = db
            .selectFrom('leaderboard_entries')
            .select(['leaderboard_id', 'period_end'])
            .distinctOn('leaderboard_id')
            .where('leaderboard_id', 'in', definitionIds)
            .orderBy('leaderboard_id', 'asc')
            .orderBy('period_end', 'desc')
            .as('latest_entries')

          const entriesRows = await db
            .selectFrom('leaderboard_entries as le')
            .innerJoin(latestEntriesSubquery, (join) =>
              join
                .onRef('latest_entries.leaderboard_id', '=', 'le.leaderboard_id')
                .onRef('latest_entries.period_end', '=', 'le.period_end')
            )
            .innerJoin('players as p', 'p.id', 'le.player_id')
            .select([
              'le.leaderboard_id as leaderboard_id',
              'le.rank as rank',
              'le.player_id as player_id',
              'p.display_name as display_name',
              'le.metric_value as metric_value',
              'le.matches_count as matches_count',
            ])
            .orderBy('le.leaderboard_id', 'asc')
            .orderBy('le.rank', 'asc')
            .execute()

          const playerRankRows = includePlayerRank
            ? await db
                .selectFrom('leaderboard_entries as le')
                .innerJoin(latestEntriesSubquery, (join) =>
                  join
                    .onRef('latest_entries.leaderboard_id', '=', 'le.leaderboard_id')
                    .onRef('latest_entries.period_end', '=', 'le.period_end')
                )
                .select([
                  'le.leaderboard_id as leaderboard_id',
                  'le.rank as rank',
                  'le.metric_value as metric_value',
                ])
                .where('le.player_id', '=', playerId)
                .execute()
            : []

          type Entry = {
            readonly rank: number
            readonly playerId: string
            readonly displayName: string
            readonly value: bigint
            readonly matchesCount: number
          }

          const entriesByLeaderboardId = new Map<string, Entry[]>()

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

          type PlayerRank = {
            readonly rank: number
            readonly value: bigint
          }

          const playerRankMap = new Map<string, PlayerRank>()

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

        yield* redis
          .set(cacheKey, JSON.stringify(result), gameConfig.leaderboardCacheTtlSeconds)
          .pipe(Effect.orDie)

        return result
      })

    return LeaderboardRepository.of({
      getLeaderboard,
    })
  })
)
