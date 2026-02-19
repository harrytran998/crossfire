import type { ServerWebSocket } from 'bun'

export interface WebSocketConnectionContext {
  readonly connectionId: string
  readonly playerId: string
}

export interface WebSocketConnectionEntry {
  readonly ws: ServerWebSocket<WebSocketConnectionContext>
  readonly playerId: string
  readonly connectedAt: Date
}

export interface RegisteredWebSocketConnection {
  readonly connectionId: string
  readonly ws: ServerWebSocket<WebSocketConnectionContext>
  readonly playerId: string
  readonly connectedAt: Date
}

export interface HeartbeatState {
  readonly awaitingPong: boolean
  readonly lastPingAtMs: number
}

export const HEARTBEAT_TIMEOUT_CLOSE_CODE = 4000
export const HEARTBEAT_TIMEOUT_CLOSE_REASON = 'Heartbeat timeout'
