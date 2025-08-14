import { httpClient } from '../../services/httpClient.js';
import { VK_API_VERSION } from '../../config/api.js';
import type { 
  VKUserInfo, 
  User,
  AuthTokens,
  APIResponse 
} from '../../types/index.js';

/**
 * Authentication API endpoints
 * Handles VK authentication, token management, and user session
 */
export class AuthAPI {
  private static readonly BASE_PATH = '/auth';

  /**
   * Authenticate user with VK access token
   */
  static async authenticateWithVK(
    vkAccessToken: string,
    vkUserId: number
  ): Promise<APIResponse<AuthTokens>> {
    return httpClient.post<AuthTokens>(`${this.BASE_PATH}/vk`, {
      vk_access_token: vkAccessToken,
      vk_user_id: vkUserId,
      api_version: VK_API_VERSION
    });
  }

  /**
   * Refresh authentication tokens
   */
  static async refreshTokens(refreshToken: string): Promise<APIResponse<AuthTokens>> {
    return httpClient.post<AuthTokens>(`${this.BASE_PATH}/refresh`, {
      refresh_token: refreshToken
    });
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<APIResponse<User>> {
    return httpClient.get<User>(`${this.BASE_PATH}/me`);
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: Partial<User>): Promise<APIResponse<User>> {
    return httpClient.patch<User>(`${this.BASE_PATH}/profile`, data);
  }

  /**
   * Logout user (invalidate tokens)
   */
  static async logout(): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/logout`);
  }

  /**
   * Verify VK token is still valid
   */
  static async verifyVKToken(vkAccessToken: string): Promise<APIResponse<VKUserInfo>> {
    return httpClient.post<VKUserInfo>(`${this.BASE_PATH}/verify-vk`, {
      vk_access_token: vkAccessToken
    });
  }

  /**
   * Register device for push notifications
   */
  static async registerDevice(
    deviceToken: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/devices`, {
      device_token: deviceToken,
      platform
    });
  }

  /**
   * Unregister device from push notifications
   */
  static async unregisterDevice(deviceToken: string): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/devices/${deviceToken}`);
  }
}
