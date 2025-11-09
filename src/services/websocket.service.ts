/**
 * WebSocket Service
 * Handles WebSocket connection and events for real-time chat
 */

import { io, Socket } from "socket.io-client";
import { apiConfig } from "@/config/api.config";
import type {
  WebSocketAuth,
  AskQuestionRequest,
  ServerAckResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

type EventCallback<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.warn("WebSocket already connected");
      return;
    }

    this.token = token;

    const auth: WebSocketAuth = { token };

    this.socket = io(apiConfig.wsURL, {
      auth,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });
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
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Ask question to AI chatbot
   */
  askQuestion(data: AskQuestionRequest): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket is not connected");
    }
    this.socket.emit("ask-question", data);
  }

  /**
   * Listen to server acknowledgment
   */
  onServerAck(callback: EventCallback<ServerAckResponse>): void {
    if (!this.socket) {
      throw new Error("WebSocket is not initialized");
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
   * Listen to receive answer event
   */
  onReceiveAnswer(callback: EventCallback<ReceiveAnswerResponse>): void {
    if (!this.socket) {
      throw new Error("WebSocket is not initialized");
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
   */
  onErrorMessage(callback: EventCallback<ErrorMessageResponse>): void {
    if (!this.socket) {
      throw new Error("WebSocket is not initialized");
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
      throw new Error("WebSocket is not initialized");
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
      throw new Error("WebSocket is not initialized");
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

