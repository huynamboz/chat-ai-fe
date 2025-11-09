/**
 * Message Service
 * Handles all message-related API calls
 */

import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/api.config";
import type {
  GetMessagesResponse,
  PaginationParams,
} from "@/types/api.types";

class MessageService {
  /**
   * Get messages by chat session with pagination
   */
  async getBySession(
    sessionId: string,
    params?: PaginationParams
  ): Promise<GetMessagesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const url = `${endpoints.message.getBySession(sessionId)}?${queryParams.toString()}`;
    return apiClient.get<GetMessagesResponse>(url);
  }
}

// Export singleton instance
export const messageService = new MessageService();

