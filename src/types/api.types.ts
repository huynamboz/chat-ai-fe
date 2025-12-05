/**
 * API Types and Interfaces
 * Based on API Documentation
 */

// ==================== Common Types ====================

export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginationMetadata {
  currentPage: number;
  nextPage: number | null;
  prevPage: number | null;
  totalPages: number;
  totalItems: number;
  itemPerPage: number;
  itemsRemain: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ==================== User Types ====================

export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignUpResponse {
  user: User;
  token: string;
}

export interface GetProfileResponse {
  user: User;
}

export interface UpdateUsernameRequest {
  newUsername: string;
}

export interface UpdateUsernameResponse {
  user: User;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RestorePasswordRequest {
  email: string;
}

// ==================== Chat Session Types ====================

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetChatSessionsResponse {
  chatSessions: ChatSession[];
  metadata: PaginationMetadata;
}

export interface UpdateChatSessionNameRequest {
  newTitle: string;
}

export interface UpdateChatSessionNameResponse {
  chatSession: ChatSession;
}

export interface SoftDeleteChatSessionResponse {
  message: string;
}

export interface DeleteChatSessionResponse {
  message: string;
}

// ==================== Message Types ====================

export type MessageRole = "user" | "bot";

export interface ChatMessage {
  _id: string;
  chatSessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  chatMessages: ChatMessage[];
  metadata: PaginationMetadata;
}

// ==================== WebSocket Types ====================

export interface WebSocketAuth {
  token: string;
}

export interface AskQuestionRequest {
  question: string;
  chatSessionId?: string;
}

export interface ServerAckResponse {
  status: string;
}

export interface ServerReportResponse {
  report: string;
}

export interface ReceiveAnswerResponse {
  answer: string;
  chatSessionId: string;
  messages: ChatMessage[];
}

export interface ErrorMessageResponse {
  message: string;
}

// ==================== API Response Wrapper ====================

export type ApiResponse<T> = T;

export type ApiErrorResponse = ApiError;

