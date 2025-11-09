/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/api.config";
import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  GetProfileResponse,
  UpdateUsernameRequest,
  UpdateUsernameResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  RestorePasswordRequest,
} from "@/types/api.types";

class UserService {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      endpoints.user.login,
      data
    );
    // Store token after successful login
    apiClient.setToken(response.token);
    return response;
  }

  /**
   * Sign up new user
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>(
      endpoints.user.signUp,
      data
    );
    // Store token after successful sign up
    apiClient.setToken(response.token);
    return response;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<GetProfileResponse> {
    return apiClient.get<GetProfileResponse>(endpoints.user.getProfile);
  }

  /**
   * Update username
   */
  async updateUsername(
    data: UpdateUsernameRequest
  ): Promise<UpdateUsernameResponse> {
    return apiClient.patch<UpdateUsernameResponse>(
      endpoints.user.updateUsername,
      data
    );
  }

  /**
   * Change password
   */
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    return apiClient.patch<ChangePasswordResponse>(
      endpoints.user.changePassword,
      data
    );
  }

  /**
   * Restore password (forgot password)
   */
  async restorePassword(data: RestorePasswordRequest): Promise<void> {
    await apiClient.post(endpoints.user.restorePassword, data);
  }

  /**
   * Logout user
   */
  logout(): void {
    apiClient.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }
}

// Export singleton instance
export const userService = new UserService();

