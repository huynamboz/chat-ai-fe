/**
 * API Client Base Class
 * Handles HTTP requests with authentication and error handling
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { apiConfig } from "@/config/api.config";
import type { ApiError } from "@/types/api.types";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: apiConfig.headers,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = this.token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError<ApiError>) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError<ApiError>): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        error: error.response.data?.error || "An error occurred",
        code: error.response.data?.code,
      };

      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - Clear token and redirect to login
          this.clearToken();
          break;
        case 403:
          // Forbidden
          break;
        case 404:
          // Not Found
          break;
        case 500:
          // Internal Server Error
          break;
        default:
          break;
      }

      return Promise.reject(apiError);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        error: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      } as ApiError);
    } else {
      // Something else happened
      return Promise.reject({
        error: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      } as ApiError);
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      // Store token in localStorage for persistence
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (!this.token) {
      // Try to get from localStorage
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem("auth_token");
    // Dispatch event to notify auth context
    window.dispatchEvent(new CustomEvent("auth:token-cleared"));
  }

  /**
   * Initialize token from localStorage
   */
  initializeToken(): void {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      this.token = storedToken;
    }
  }

  /**
   * GET request
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Initialize token from localStorage on module load
apiClient.initializeToken();

