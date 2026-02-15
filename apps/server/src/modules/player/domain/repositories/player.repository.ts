import type { Effect } from 'effect'
import type {
  Player,
  PlayerStats,
  PlayerProgression,
  CreatePlayerInput,
  UpdatePlayerInput,
} from '../entities/player.entity'
import type { PlayerNotFoundError, PlayerAlreadyExistsError } from '../errors/player.errors'

export interface PlayerRepository {
  readonly findByUserId: (userId: string) => Effect.Effect<Player | null>
  readonly findById: (playerId: string) => Effect.Effect<Player | null>
  readonly create: (input: CreatePlayerInput) => Effect.Effect<Player, PlayerAlreadyExistsError>
  readonly update: (
    playerId: string,
    input: UpdatePlayerInput
  ) => Effect.Effect<Player, PlayerNotFoundError>
  readonly getStats: (playerId: string) => Effect.Effect<PlayerStats | null>
  readonly getProgression: (playerId: string) => Effect.Effect<PlayerProgression | null>
  readonly createStats: (playerId: string) => Effect.Effect<PlayerStats>
  readonly createProgression: (playerId: string) => Effect.Effect<PlayerProgression>
}
