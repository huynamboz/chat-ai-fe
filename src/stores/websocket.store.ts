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

interface ProcessMessage {
  id: string;
  message: string;
  timestamp: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  currentReport: string | null;
  processMessages: ProcessMessage[];
  thinkingStartTime: number | null;
  thinkingTimeMap: Record<string, number>; // messageId -> thinkingTime in ms

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentReport: (report: string | null) => void;
  addProcessMessage: (message: string) => void;
  clearProcessMessages: () => void;
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
    processMessages: [],
    thinkingStartTime: null,
    thinkingTimeMap: {},

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

    addProcessMessage: (message) => {
      set((state) => {
        // Check if message already exists (avoid duplicates)
        const messageExists = state.processMessages.some(
          (msg) => msg.message === message,
        );
        if (messageExists) {
          return state;
        }

        const newMessage: ProcessMessage = {
          id: `process_${Date.now()}_${Math.random()}`,
          message,
          timestamp: Date.now(),
        };
        return {
          processMessages: [...state.processMessages, newMessage],
        };
      });
    },

    clearProcessMessages: () => {
      set({
        processMessages: [],
        currentReport: null,
        thinkingStartTime: null,
      });
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
        processMessages: [],
        thinkingStartTime: null,
        thinkingTimeMap: {},
      });
    },

    // Event handlers
    onServerAck: (data) => {
      console.log("Server acknowledgment:", data.status);
      // Clear previous process messages and set initial thinking state
      const thinkingMessage = "Thinking...";
      const startTime = Date.now();
      set({
        currentReport: thinkingMessage,
        processMessages: [
          {
            id: `process_${startTime}_${Math.random()}`,
            message: thinkingMessage,
            timestamp: startTime,
          },
        ],
        thinkingStartTime: startTime,
      });
    },

    onServerReport: (data) => {
      console.log("Server report:", data.report);
      set((state) => {
        // Check if message already exists before adding
        const messageExists = state.processMessages.some(
          (msg) => msg.message === data.report,
        );
        return {
          currentReport: data.report,
          processMessages: messageExists
            ? state.processMessages
            : [
                ...state.processMessages,
                {
                  id: `process_${Date.now()}_${Math.random()}`,
                  message: data.report,
                  timestamp: Date.now(),
                },
              ],
        };
      });
    },

    onReceiveAnswer: (data) => {
      console.log("Receive answer:", data.answer);
      console.log("Session ID:", data.chatSessionId);
      console.log("Messages:", data.messages);

      // Calculate thinking time and store it for the bot message
      const state = get();
      let thinkingTimeMap = { ...state.thinkingTimeMap };

      if (state.thinkingStartTime && data.messages) {
        const thinkingTime = Date.now() - state.thinkingStartTime;
        const botMessage = data.messages.find((m) => m.role === "bot");

        if (botMessage) {
          thinkingTimeMap[botMessage._id] = thinkingTime;
        }
      }

      // Clear report when answer is received
      set({
        currentReport: null,
        processMessages: [],
        thinkingStartTime: null,
        thinkingTimeMap,
      });
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

