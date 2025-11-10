/**
 * useConversations Hook
 * Loads and manages conversations from API
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth.context";
import { chatSessionService } from "@/services/chat-session.service";
import { messageService } from "@/services/message.service";
import { useChatStore } from "@/stores/chat.store";

export function useConversations() {
  const { isAuthenticated } = useAuth();
  const { setChatSessions, setMessages } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load chat sessions
      const sessionsResponse = await chatSessionService.getByUser({
        page: 1,
        limit: 100, // Load all conversations
      });

      // API returns { chatSessions: [...], metadata: {...} }
      if (sessionsResponse && sessionsResponse.chatSessions) {
        const sessions = sessionsResponse.chatSessions || [];
        setChatSessions(sessions);

        // Optionally load messages for the first few sessions
        // For now, we'll load messages on-demand when user selects a session
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load conversations"
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setChatSessions]);

  const loadMessagesForSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return;

    try {
      const messagesResponse = await messageService.getBySession(sessionId, {
        page: 1,
        limit: 100, // Load all messages for a session
      });

      // API returns { chatMessages: [...], metadata: {...} }
      if (messagesResponse && messagesResponse.chatMessages) {
        const messages = messagesResponse.chatMessages || [];
        setMessages(sessionId, messages);
      }
    } catch (err) {
      console.error(`Failed to load messages for session ${sessionId}:`, err);
    }
  }, [isAuthenticated, setMessages]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  return {
    isLoading,
    error,
    loadConversations,
    loadMessagesForSession,
  };
}

