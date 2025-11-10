/**
 * Chat Store
 * Zustand store for managing chat sessions and messages
 */

import type { ChatSession, ChatMessage } from "@/types/api.types";

import { create } from "zustand";

interface ChatState {
  // Chat Sessions
  chatSessions: ChatSession[];
  selectedChatSessionId: string | null;

  // Messages by session ID
  messages: Record<string, ChatMessage[]>;

  // Actions
  setChatSessions: (sessions: ChatSession[]) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteChatSession: (id: string) => void;
  selectChatSession: (id: string | null) => void;

  // Messages
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  addMessages: (sessionId: string, messages: ChatMessage[]) => void;
  clearMessages: (sessionId: string) => void;

  // Getters
  getSelectedSession: () => ChatSession | null;
  getMessagesBySession: (sessionId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chatSessions: [],
  selectedChatSessionId: null,
  messages: {},

  // Chat Sessions actions
  setChatSessions: (sessions) => {
    set({ chatSessions: sessions });
  },

  addChatSession: (session) => {
    set((state) => ({
      chatSessions: [session, ...state.chatSessions],
      messages: {
        ...state.messages,
        [session._id]: [],
      },
    }));
  },

  updateChatSession: (id, updates) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session._id === id ? { ...session, ...updates } : session,
      ),
    }));
  },

  deleteChatSession: (id) => {
    set((state) => {
      const { [id]: _deleted, ...remainingMessages } = state.messages;

      return {
        chatSessions: state.chatSessions.filter(
          (session) => session._id !== id,
        ),
        messages: remainingMessages,
        selectedChatSessionId:
          state.selectedChatSessionId === id
            ? null
            : state.selectedChatSessionId,
      };
    });
  },

  selectChatSession: (id) => {
    set({ selectedChatSessionId: id });
  },

  // Messages actions
  setMessages: (sessionId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: messages,
      },
    }));
  },

  addMessage: (sessionId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    }));
  },

  addMessages: (sessionId, newMessages) => {
    set((state) => {
      const existingMessages = state.messages[sessionId] || [];
      const existingIds = new Set(existingMessages.map((m) => m._id));
      
      // Filter out duplicate messages by _id
      const uniqueNewMessages = newMessages.filter(
        (m) => !existingIds.has(m._id)
      );

      // Remove temporary messages that match new messages by content and role
      // This handles the case where we added a temp message optimistically
      const filteredExisting = existingMessages.filter((existing) => {
        // Keep messages that are not temporary (don't start with "temp_")
        if (!existing._id.startsWith("temp_")) {
          return true;
        }
        
        // Remove temporary messages if we have a new message with same content and role
        const hasMatchingNewMessage = uniqueNewMessages.some(
          (newMsg) =>
            newMsg.role === existing.role &&
            newMsg.content === existing.content &&
            newMsg.chatSessionId === existing.chatSessionId
        );
        
        return !hasMatchingNewMessage;
      });

      return {
        messages: {
          ...state.messages,
          [sessionId]: [...filteredExisting, ...uniqueNewMessages],
        },
      };
    });
  },

  clearMessages: (sessionId) => {
    set((state) => {
      const { [sessionId]: _cleared, ...remainingMessages } = state.messages;

      return {
        messages: remainingMessages,
      };
    });
  },

  // Getters
  getSelectedSession: () => {
    const state = get();

    if (!state.selectedChatSessionId) return null;

    return (
      state.chatSessions.find(
        (session) => session._id === state.selectedChatSessionId,
      ) || null
    );
  },

  getMessagesBySession: (sessionId) => {
    const state = get();

    return state.messages[sessionId] || [];
  },
}));
