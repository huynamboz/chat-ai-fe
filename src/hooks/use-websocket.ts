/**
 * useWebSocket Hook
 * Manages WebSocket connection lifecycle using Zustand store
 */

import type {
  ServerAckResponse,
  ServerReportResponse,
  ReceiveAnswerResponse,
  ErrorMessageResponse,
} from "@/types/api.types";

import { useEffect, useRef } from "react";

import { useAuth } from "@/contexts/auth.context";
import { webSocketService } from "@/services/websocket.service";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useChatStore } from "@/stores/chat.store";

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const {
    isConnected,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    onServerAck: storeOnServerAck,
    onServerReport: storeOnServerReport,
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
    webSocketService.removeAllListeners("server-report");
    webSocketService.removeAllListeners("receive-answer");
    webSocketService.removeAllListeners("error-message");
    webSocketService.removeAllListeners("disconnect");
    webSocketService.removeAllListeners("connect");

    // Listen to server acknowledgment
    webSocketService.onServerAck((data: ServerAckResponse) => {
      storeOnServerAck(data);
    });

    // Listen to server report
    webSocketService.onServerReport((data: ServerReportResponse) => {
      storeOnServerReport(data);
    });

    // Listen to receive answer
    webSocketService.onReceiveAnswer((data: ReceiveAnswerResponse) => {
      storeOnReceiveAnswer(data);

      // Update chat store with new messages
      if (data.messages && data.messages.length > 0) {
        // Check if session exists, if not create it
        const state = useChatStore.getState();
        const sessionExists = state.chatSessions.some(
          (s) => s._id === data.chatSessionId,
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

        // Separate user and bot messages
        const userMessage = data.messages.find((m) => m.role === "user");
        const botMessage = data.messages.find((m) => m.role === "bot");

        // Replace temporary user message with real one from server
        if (userMessage) {
          const existingMessages = state.messages[data.chatSessionId] || [];
          const hasTempUserMessage = existingMessages.some(
            (m) => m._id.startsWith("temp_user_") && m.role === "user",
          );

          if (hasTempUserMessage) {
            // Remove temporary user message and add real one
            const filteredMessages = existingMessages.filter(
              (m) => !(m._id.startsWith("temp_user_") && m.role === "user"),
            );

            useChatStore.setState({
              messages: {
                ...state.messages,
                [data.chatSessionId]: [...filteredMessages, userMessage],
              },
            });
          } else {
            // No temp message, just add the real user message if it doesn't exist
            const userMessageExists = existingMessages.some(
              (m) => m._id === userMessage._id,
            );

            if (!userMessageExists) {
              useChatStore
                .getState()
                .addMessage(data.chatSessionId, userMessage);
            }
          }
        }

        // Add only bot message (the reply)
        if (botMessage) {
          const currentState = useChatStore.getState();
          const existingMessages =
            currentState.messages[data.chatSessionId] || [];
          const botMessageExists = existingMessages.some(
            (m) => m._id === botMessage._id,
          );

          if (!botMessageExists) {
            currentState.addMessage(data.chatSessionId, botMessage);
          }
        }
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
    storeOnServerReport,
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
