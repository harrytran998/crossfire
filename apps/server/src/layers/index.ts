import { Layer } from 'effect'
import {
  ServerConfig,
  DatabaseConfig,
  RedisConfig,
  AuthConfig,
  LoggingConfig,
  WebSocketConfig,
} from '@crossfire/shared'

export const ConfigLayer = Layer.mergeAll(
  ServerConfig.Default,
  DatabaseConfig.Default,
  RedisConfig.Default,
  AuthConfig.Default,
  LoggingConfig.Default,
  WebSocketConfig.Default
)
