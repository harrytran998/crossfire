import { Layer } from 'effect'
import {
  ServerConfig,
  DatabaseConfig,
  RedisConfig,
  AuthConfig,
  LoggingConfig,
} from '@crossfire/shared'

export const ConfigLayer = Layer.mergeAll(
  ServerConfig.Live,
  DatabaseConfig.Live,
  RedisConfig.Live,
  AuthConfig.Live,
  LoggingConfig.Live
)
