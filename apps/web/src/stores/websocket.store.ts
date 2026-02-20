import { create } from 'zustand'

interface WebSocketState {
  connected: boolean
  error: string | null
  messages: unknown[]
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  addMessage: (message: unknown) => void
  clearMessages: () => void
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  connected: false,
  error: null,
  messages: [],
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
}))
