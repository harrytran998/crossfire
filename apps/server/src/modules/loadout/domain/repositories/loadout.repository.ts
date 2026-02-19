import type { Effect } from 'effect'
import type {
  CreateLoadoutInput,
  PlayerLoadout,
  UpdateLoadoutInput,
} from '../entities/loadout.entity'
import type { LoadoutNotFoundError, LoadoutSlotTakenError } from '../errors/loadout.errors'

export interface LoadoutRepository {
  readonly listByPlayerId: (playerId: string) => Effect.Effect<readonly PlayerLoadout[]>
  readonly findById: (loadoutId: string) => Effect.Effect<PlayerLoadout | null>
  readonly create: (
    input: CreateLoadoutInput
  ) => Effect.Effect<PlayerLoadout, LoadoutSlotTakenError>
  readonly update: (
    loadoutId: string,
    input: UpdateLoadoutInput
  ) => Effect.Effect<PlayerLoadout, LoadoutNotFoundError | LoadoutSlotTakenError>
  readonly remove: (loadoutId: string) => Effect.Effect<void, LoadoutNotFoundError>
}
