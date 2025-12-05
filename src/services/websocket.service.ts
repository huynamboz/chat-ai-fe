/**
 * WebSocket Service
 * Handles WebSocket connection and events for real-time chat
 * Based on API Documentation
 */

import { io, Socket } from "socket.io-client";
import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import type {
  WebSocketAuth,
  AskQuestionRequest,
  ServerAckResponse,
  ServerReportResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

type EventCallback<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private pendingCallbacks: {
    serverAck?: EventCallback<ServerAckResponse>[];
    serverReport?: EventCallback<ServerReportResponse>[];
    receiveAnswer?: EventCallback<ReceiveAnswerResponse>[];
    errorMessage?: EventCallback<ErrorMessageResponse>[];
    disconnect?: (() => void)[];
    connect?: (() => void)[];
  } = {};

  /**
   * Connect to WebSocket server
   * Authentication: JWT token in handshake auth
   */
  connect(token?: string): void {
    // Prevent multiple connections
    if (this.socket?.connected) {
      console.warn("WebSocket already connected");
      return;
    }
    
    // If socket exists but not connected, disconnect first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Get token from parameter or API client
    const authToken = token || apiClient.getToken();
    if (!authToken) {
      throw new Error("No authentication token available");
    }

    this.token = authToken;

    const auth: WebSocketAuth = { token: authToken };

    this.socket = io(apiConfig.wsURL, {
      auth,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
    this.registerPendingCallbacks();
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      // Dispatch event for store to listen
      window.dispatchEvent(new CustomEvent("websocket:connected"));
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      // Dispatch event for store to listen
      window.dispatchEvent(new CustomEvent("websocket:disconnected"));
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      // Dispatch event for store to listen
      window.dispatchEvent(
        new CustomEvent("websocket:error", {
          detail: { message: error.message },
        })
      );
    });
  }

  /**
   * Register pending callbacks that were queued before socket initialization
   */
  private registerPendingCallbacks(): void {
    if (!this.socket) return;

    // Register server-ack callbacks
    if (this.pendingCallbacks.serverAck) {
      this.pendingCallbacks.serverAck.forEach((callback) => {
        this.socket!.on("server-ack", callback);
      });
      this.pendingCallbacks.serverAck = [];
    }

    // Register server-report callbacks
    if (this.pendingCallbacks.serverReport) {
      this.pendingCallbacks.serverReport.forEach((callback) => {
        this.socket!.on("server-report", callback);
      });
      this.pendingCallbacks.serverReport = [];
    }

    // Register receive-answer callbacks
    if (this.pendingCallbacks.receiveAnswer) {
      this.pendingCallbacks.receiveAnswer.forEach((callback) => {
        this.socket!.on("receive-answer", callback);
      });
      this.pendingCallbacks.receiveAnswer = [];
    }

    // Register error-message callbacks
    if (this.pendingCallbacks.errorMessage) {
      this.pendingCallbacks.errorMessage.forEach((callback) => {
        this.socket!.on("error-message", callback);
      });
      this.pendingCallbacks.errorMessage = [];
    }

    // Register disconnect callbacks
    if (this.pendingCallbacks.disconnect) {
      this.pendingCallbacks.disconnect.forEach((callback) => {
        this.socket!.on("disconnect", callback);
      });
      this.pendingCallbacks.disconnect = [];
    }

    // Register connect callbacks
    if (this.pendingCallbacks.connect) {
      this.pendingCallbacks.connect.forEach((callback) => {
        this.socket!.on("connect", callback);
      });
      this.pendingCallbacks.connect = [];
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    // Clear pending callbacks
    this.pendingCallbacks = {};
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Ask question to AI chatbot
   * Event: ask-question
   * Payload: { question: string, chatSessionId?: string }
   */
  askQuestion(data: AskQuestionRequest): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }
    this.socket.emit("ask-question", data);
  }

  /**
   * Listen to server acknowledgment
   * Event: server-ack
   * Payload: { status: string }
   */
  onServerAck(callback: EventCallback<ServerAckResponse>): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.serverAck) {
        this.pendingCallbacks.serverAck = [];
      }
      this.pendingCallbacks.serverAck.push(callback);
      return;
    }
    this.socket.on("server-ack", callback);
  }

  /**
   * Remove server acknowledgment listener
   */
  offServerAck(callback?: EventCallback<ServerAckResponse>): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("server-ack", callback);
    } else {
      this.socket.off("server-ack");
    }
  }

  /**
   * Listen to server report event
   * Event: server-report
   * Payload: { report: string }
   */
  onServerReport(callback: EventCallback<ServerReportResponse>): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.serverReport) {
        this.pendingCallbacks.serverReport = [];
      }
      this.pendingCallbacks.serverReport.push(callback);
      return;
    }
    this.socket.on("server-report", callback);
  }

  /**
   * Remove server report listener
   */
  offServerReport(callback?: EventCallback<ServerReportResponse>): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("server-report", callback);
    } else {
      this.socket.off("server-report");
    }
  }

  /**
   * Listen to receive answer event
   * Event: receive-answer
   * Payload: { answer: string, chatSessionId: string, messages: ChatMessage[] }
   */
  onReceiveAnswer(callback: EventCallback<ReceiveAnswerResponse>): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.receiveAnswer) {
        this.pendingCallbacks.receiveAnswer = [];
      }
      this.pendingCallbacks.receiveAnswer.push(callback);
      return;
    }
    this.socket.on("receive-answer", callback);
  }

  /**
   * Remove receive answer listener
   */
  offReceiveAnswer(callback?: EventCallback<ReceiveAnswerResponse>): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("receive-answer", callback);
    } else {
      this.socket.off("receive-answer");
    }
  }

  /**
   * Listen to error message event
   * Event: error-message
   * Payload: { message: string }
   */
  onErrorMessage(callback: EventCallback<ErrorMessageResponse>): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.errorMessage) {
        this.pendingCallbacks.errorMessage = [];
      }
      this.pendingCallbacks.errorMessage.push(callback);
      return;
    }
    this.socket.on("error-message", callback);
  }

  /**
   * Remove error message listener
   */
  offErrorMessage(callback?: EventCallback<ErrorMessageResponse>): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("error-message", callback);
    } else {
      this.socket.off("error-message");
    }
  }

  /**
   * Listen to disconnect event
   */
  onDisconnect(callback: () => void): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.disconnect) {
        this.pendingCallbacks.disconnect = [];
      }
      this.pendingCallbacks.disconnect.push(callback);
      return;
    }
    this.socket.on("disconnect", callback);
  }

  /**
   * Remove disconnect listener
   */
  offDisconnect(callback?: () => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("disconnect", callback);
    } else {
      this.socket.off("disconnect");
    }
  }

  /**
   * Listen to connect event
   */
  onConnect(callback: () => void): void {
    if (!this.socket) {
      // Queue callback to be registered when socket is initialized
      if (!this.pendingCallbacks.connect) {
        this.pendingCallbacks.connect = [];
      }
      this.pendingCallbacks.connect.push(callback);
      return;
    }
    this.socket.on("connect", callback);
  }

  /**
   * Remove connect listener
   */
  offConnect(callback?: () => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("connect", callback);
    } else {
      this.socket.off("connect");
    }
  }

  /**
   * Remove all listeners for a specific event
   */
  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (!this.socket) return;
    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
