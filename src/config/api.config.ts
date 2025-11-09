/**
 * API Configuration
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || "http://localhost:3000";

export const apiConfig = {
  baseURL: API_BASE_URL,
  wsURL: WS_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
} as const;

export const endpoints = {
  // User endpoints
  user: {
    login: "/users/login",
    signUp: "/users/sign-up",
    getProfile: "/users/get-profile",
    updateUsername: "/users/username",
    changePassword: "/users/password",
    restorePassword: "/users/restore-pass",
  },
  // Chat Session endpoints
  chatSession: {
    getByUser: "/chat-sessions/get-by-user",
    updateName: (id: string) => `/chat-sessions/${id}/name`,
    softDelete: (id: string) => `/chat-sessions/${id}/soft-delete`,
    delete: (id: string) => `/chat-sessions/${id}`,
  },
  // Message endpoints
  message: {
    getBySession: (id: string) => `/messages/session/${id}/get-messages`,
  },
} as const;

