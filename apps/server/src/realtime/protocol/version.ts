import { Context, Effect, Layer } from 'effect'
import { PROTOCOL_VERSION } from './message.types'

export interface VersionNegotiation {
  readonly getSupportedVersions: () => Effect.Effect<number[], never>
  readonly isVersionSupported: (version: number) => Effect.Effect<boolean, never>
  readonly negotiateVersion: (clientVersion: number) => Effect.Effect<number | null, never>
}

export const VersionNegotiation = Context.Tag<VersionNegotiation>()

const SUPPORTED_VERSIONS = [1]

export const VersionNegotiationLive = Layer.succeed(
  VersionNegotiation,
  {
    getSupportedVersions: () => Effect.succeed(SUPPORTED_VERSIONS),
    
    isVersionSupported: (version: number) => Effect.succeed(SUPPORTED_VERSIONS.includes(version)),
    
    negotiateVersion: (clientVersion: number) =>
      Effect.succeed(
        SUPPORTED_VERSIONS.includes(clientVersion) ? clientVersion : null
      )
  }
)

export { PROTOCOL_VERSION }
