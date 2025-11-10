/**
 * useWebSocket Hook
 * Manages WebSocket connection lifecycle using Zustand store
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useChatStore } from "@/stores/chat.store";
import type {
  ServerAckResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const {
    isConnected,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    onServerAck: storeOnServerAck,
    onReceiveAnswer: storeOnReceiveAnswer,
    onErrorMessage: storeOnErrorMessage,
    onConnect: storeOnConnect,
    onDisconnect: storeOnDisconnect,
  } = useWebSocketStore();
  const { addMessages, addChatSession } = useChatStore();
  const listenersSetupRef = useRef(false);

  // Setup event listeners once
  useEffect(() => {
    if (listenersSetupRef.current) return;

    // Remove existing listeners first to avoid duplicates
    webSocketService.removeAllListeners("server-ack");
    webSocketService.removeAllListeners("receive-answer");
    webSocketService.removeAllListeners("error-message");
    webSocketService.removeAllListeners("disconnect");
    webSocketService.removeAllListeners("connect");

    // Listen to server acknowledgment
    webSocketService.onServerAck((data: ServerAckResponse) => {
      storeOnServerAck(data);
    });

    // Listen to receive answer
    webSocketService.onReceiveAnswer((data: ReceiveAnswerResponse) => {
      storeOnReceiveAnswer(data);

      // Update chat store with new messages
      if (data.messages && data.messages.length > 0) {
        // Check if session exists, if not create it
        const state = useChatStore.getState();
        const sessionExists = state.chatSessions.some(
          (s) => s._id === data.chatSessionId
        );

        if (!sessionExists && data.chatSessionId) {
          // Create new session
          const firstUserMessage = data.messages.find((m) => m.role === "user");
          const title =
            firstUserMessage?.content.substring(0, 50) || "New Chat";

          addChatSession({
            _id: data.chatSessionId,
            userId: "",
            title,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Add messages to store (addMessages already handles duplicates)
        addMessages(data.chatSessionId, data.messages);
      }
    });

    // Listen to error message
    webSocketService.onErrorMessage((data: ErrorMessageResponse) => {
      storeOnErrorMessage(data);
    });

    // Listen to disconnect
    webSocketService.onDisconnect(() => {
      storeOnDisconnect();
    });

    // Listen to connect
    webSocketService.onConnect(() => {
      storeOnConnect();
    });

    listenersSetupRef.current = true;
  }, [
    storeOnServerAck,
    storeOnReceiveAnswer,
    storeOnErrorMessage,
    storeOnConnect,
    storeOnDisconnect,
    addMessages,
    addChatSession,
  ]);

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (!isAuthenticated) {
      if (isConnected) {
        disconnectWebSocket();
      }
      return;
    }

    if (!isConnected) {
      connectWebSocket();
    }
  }, [isAuthenticated, isConnected, connectWebSocket, disconnectWebSocket]);

  return {
    isConnected,
    askQuestion: (question: string, chatSessionId?: string) => {
      if (!isConnected) {
        throw new Error("WebSocket is not connected");
      }
      webSocketService.askQuestion({
        question,
        chatSessionId,
      });
    },
  };
}

