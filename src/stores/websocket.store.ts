/**
 * WebSocket Store
 * Zustand store for managing WebSocket connection state and events
 */

import { create } from "zustand";
import { webSocketService } from "@/services/websocket.service";
import type {
  ServerAckResponse,
  ServerReportResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  currentReport: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentReport: (report: string | null) => void;
  connect: (token?: string) => void;
  disconnect: () => void;

  // Event handlers
  onServerAck: (data: ServerAckResponse) => void;
  onServerReport: (data: ServerReportResponse) => void;
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
    currentReport: null,

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

    setCurrentReport: (report) => {
      set({ currentReport: report });
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
      set({
        isConnected: false,
        isConnecting: false,
        error: null,
        currentReport: null,
      });
    },

    // Event handlers
    onServerAck: (data) => {
      console.log("Server acknowledgment:", data.status);
      // Set initial thinking state
      set({ currentReport: "Thinking..." });
    },

    onServerReport: (data) => {
      console.log("Server report:", data.report);
      set({ currentReport: data.report });
    },

    onReceiveAnswer: (data) => {
      console.log("Receive answer:", data.answer);
      console.log("Session ID:", data.chatSessionId);
      console.log("Messages:", data.messages);
      // Clear report when answer is received
      set({ currentReport: null });
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

