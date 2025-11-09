/**
 * Chat Session Service
 * Handles all chat session-related API calls
 */

import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/api.config";
import type {
  GetChatSessionsResponse,
  UpdateChatSessionNameRequest,
  UpdateChatSessionNameResponse,
  SoftDeleteChatSessionResponse,
  DeleteChatSessionResponse,
  PaginationParams,
} from "@/types/api.types";

class ChatSessionService {
  /**
   * Get chat sessions by user with pagination
   */
  async getByUser(
    params?: PaginationParams
  ): Promise<GetChatSessionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const url = `${endpoints.chatSession.getByUser}?${queryParams.toString()}`;
    return apiClient.get<GetChatSessionsResponse>(url);
  }

  /**
   * Update chat session name
   */
  async updateName(
    id: string,
    data: UpdateChatSessionNameRequest
  ): Promise<UpdateChatSessionNameResponse> {
    return apiClient.patch<UpdateChatSessionNameResponse>(
      endpoints.chatSession.updateName(id),
      data
    );
  }

  /**
   * Soft delete chat session
   */
  async softDelete(id: string): Promise<SoftDeleteChatSessionResponse> {
    return apiClient.patch<SoftDeleteChatSessionResponse>(
      endpoints.chatSession.softDelete(id)
    );
  }

  /**
   * Delete chat session permanently
   */
  async delete(id: string): Promise<DeleteChatSessionResponse> {
    return apiClient.delete<DeleteChatSessionResponse>(
      endpoints.chatSession.delete(id)
    );
  }
}

// Export singleton instance
export const chatSessionService = new ChatSessionService();

