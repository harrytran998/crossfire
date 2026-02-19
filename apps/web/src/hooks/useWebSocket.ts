import { useEffect, useRef, useCallback } from 'react'
import { useWebSocketStore } from '../stores/websocket.store'

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const { setConnected, setError, addMessage } = useWebSocketStore()

  const connect = useCallback((token: string) => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    
    ws.current = new WebSocket(wsUrl, ['crossfire-protocol'])
    
    ws.current.onopen = () => {
      setConnected(true)
      setError(null)
      
      ws.current?.send(JSON.stringify({
        type: 'auth',
        token,
      }))
    }
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        addMessage(message)
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }
    
    ws.current.onerror = (error) => {
      setError('WebSocket error occurred')
      console.error('WebSocket error:', error)
    }
    
    ws.current.onclose = () => {
      setConnected(false)
    }
  }, [setConnected, setError, addMessage])

  const disconnect = useCallback(() => {
    ws.current?.close()
    ws.current = null
    setConnected(false)
  }, [setConnected])

  const send = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, send }
}
