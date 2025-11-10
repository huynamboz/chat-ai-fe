/**
 * WebSocket Store
 * Zustand store for managing WebSocket connection state and events
 */

import { create } from "zustand";
import { webSocketService } from "@/services/websocket.service";
import type {
  ServerAckResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  connect: (token?: string) => void;
  disconnect: () => void;

  // Event handlers
  onServerAck: (data: ServerAckResponse) => void;
  onReceiveAnswer: (data: ReceiveAnswerResponse) => void;
  onErrorMessage: (data: ErrorMessageResponse) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

// Initialize event listeners once
let eventListenersInitialized = false;

const initializeEventListeners = () => {
  if (eventListenersInitialized || typeof window === "undefined") return;

  window.addEventListener("websocket:connected", () => {
    useWebSocketStore.getState().onConnect();
  });

  window.addEventListener("websocket:disconnected", () => {
    useWebSocketStore.getState().onDisconnect();
  });

  window.addEventListener("websocket:error", (event: Event) => {
    const customEvent = event as CustomEvent;
    useWebSocketStore.getState().setError(
      customEvent.detail?.message || "Connection error"
    );
  });

  eventListenersInitialized = true;
};

export const useWebSocketStore = create<WebSocketState>((set, get) => {
  // Initialize event listeners on first store creation
  initializeEventListeners();

  return {
    // Initial state
    isConnected: false,
    isConnecting: false,
    error: null,

    // Actions
    setConnected: (connected) => {
      set({ isConnected: connected });
    },

    setConnecting: (connecting) => {
      set({ isConnecting: connecting });
    },

    setError: (error) => {
      set({ error });
    },

    connect: (token) => {
      const state = get();
      if (state.isConnected || state.isConnecting) {
        return;
      }

      set({ isConnecting: true, error: null });

      try {
        webSocketService.connect(token);
      } catch (error) {
        set({
          isConnecting: false,
          error: error instanceof Error ? error.message : "Failed to connect",
        });
      }
    },

    disconnect: () => {
      webSocketService.disconnect();
      set({ isConnected: false, isConnecting: false, error: null });
    },

    // Event handlers
    onServerAck: (data) => {
      console.log("Server acknowledgment:", data.status);
      // You can add loading state here
    },

    onReceiveAnswer: (data) => {
      console.log("Receive answer:", data.answer);
      console.log("Session ID:", data.chatSessionId);
      console.log("Messages:", data.messages);
      // Messages will be handled by chat store
    },

    onErrorMessage: (data) => {
      console.error("WebSocket error:", data.message);
      set({ error: data.message });
    },

    onConnect: () => {
      console.log("WebSocket connected");
      set({ isConnected: true, isConnecting: false, error: null });
    },

    onDisconnect: () => {
      console.log("WebSocket disconnected");
      set({ isConnected: false, isConnecting: false });
    },
  };
});

