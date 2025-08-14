import { httpClient } from '../../services/httpClient.js';
import type { 
  User, 
  APIResponse,
  PaginatedResponse 
} from '../../types/index.js';

/**
 * Users API endpoints
 * Handles user management, friends, and social features
 */
export class UsersAPI {
  private static readonly BASE_PATH = '/users';

  /**
   * Get user profile by ID
   */
  static async getUser(userId: number): Promise<APIResponse<User>> {
    return httpClient.get<User>(`${this.BASE_PATH}/${userId}`);
  }

  /**
   * Search users by name or other criteria
   */
  static async searchUsers(params: {
    query?: string;
    city?: string;
    level?: string;
    page?: number;
    limit?: number;
  }): Promise<APIResponse<PaginatedResponse<User>>> {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.set('q', params.query);
    if (params.city) searchParams.set('city', params.city);
    if (params.level) searchParams.set('level', params.level);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    return httpClient.get<PaginatedResponse<User>>(`${this.BASE_PATH}/search?${searchParams.toString()}`);
  }

  /**
   * Get user's friends list
   */
  static async getFriends(userId?: number): Promise<APIResponse<User[]>> {
    const path = userId ? `${this.BASE_PATH}/${userId}/friends` : `${this.BASE_PATH}/friends`;
    return httpClient.get<User[]>(path);
  }

  /**
   * Get VK friends who use the app
   */
  static async getVKFriends(): Promise<APIResponse<User[]>> {
    return httpClient.get<User[]>(`${this.BASE_PATH}/vk-friends`);
  }

  /**
   * Send friend request
   */
  static async sendFriendRequest(userId: number): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/${userId}/friend-request`);
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(userId: number): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/${userId}/accept-friend`);
  }

  /**
   * Decline friend request
   */
  static async declineFriendRequest(userId: number): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/${userId}/decline-friend`);
  }

  /**
   * Remove friend
   */
  static async removeFriend(userId: number): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${userId}/friend`);
  }

  /**
   * Get pending friend requests
   */
  static async getPendingRequests(): Promise<APIResponse<{
    sent: User[];
    received: User[];
  }>> {
    return httpClient.get(`${this.BASE_PATH}/friend-requests`);
  }

  /**
   * Block user
   */
  static async blockUser(userId: number): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/${userId}/block`);
  }

  /**
   * Unblock user
   */
  static async unblockUser(userId: number): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${userId}/block`);
  }

  /**
   * Get blocked users list
   */
  static async getBlockedUsers(): Promise<APIResponse<User[]>> {
    return httpClient.get<User[]>(`${this.BASE_PATH}/blocked`);
  }

  /**
   * Get user's workout statistics
   */
  static async getUserStats(userId?: number): Promise<APIResponse<{
    totalWorkouts: number;
    totalExercises: number;
    currentStreak: number;
    longestStreak: number;
    totalDuration: number;
    level: string;
    achievements: string[];
    weeklyStats: {
      week: string;
      workouts: number;
      duration: number;
    }[];
  }>> {
    const path = userId ? `${this.BASE_PATH}/${userId}/stats` : `${this.BASE_PATH}/stats`;
    return httpClient.get(path);
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(params?: {
    period?: 'week' | 'month' | 'year' | 'all';
    metric?: 'workouts' | 'duration' | 'exercises';
    limit?: number;
  }): Promise<APIResponse<Array<{
    user: User;
    value: number;
    rank: number;
  }>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.period) searchParams.set('period', params.period);
    if (params?.metric) searchParams.set('metric', params.metric);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `${this.BASE_PATH}/leaderboard?${query}` : `${this.BASE_PATH}/leaderboard`;
    
    return httpClient.get(url);
  }

  /**
   * Update user profile settings
   */
  static async updateSettings(settings: {
    notifications?: {
      workoutInvitations?: boolean;
      friendRequests?: boolean;
      achievements?: boolean;
      reminders?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'friends' | 'private';
      workoutVisibility?: 'public' | 'friends' | 'private';
      statsVisibility?: 'public' | 'friends' | 'private';
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
      timezone?: string;
    };
  }): Promise<APIResponse<User>> {
    return httpClient.patch<User>(`${this.BASE_PATH}/settings`, settings);
  }

  /**
   * Get user's activity feed
   */
  static async getActivityFeed(params?: {
    page?: number;
    limit?: number;
    type?: 'workouts' | 'achievements' | 'friends' | 'all';
  }): Promise<APIResponse<PaginatedResponse<{
    id: string;
    type: 'workout_completed' | 'achievement_unlocked' | 'friend_added' | 'level_up';
    user: User;
    data: any;
    createdAt: Date;
  }>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    const url = query ? `${this.BASE_PATH}/activity?${query}` : `${this.BASE_PATH}/activity`;
    
    return httpClient.get(url);
  }
}
