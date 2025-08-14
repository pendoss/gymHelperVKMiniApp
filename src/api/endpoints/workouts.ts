import { httpClient } from '../../services/httpClient.js';
import type { 
  Workout, 
  WorkoutInvitation,
  APIResponse,
  PaginatedResponse 
} from '../../types/index.js';

/**
 * Workout API endpoints
 * Handles workout CRUD operations, invitations, and participant management
 */
export class WorkoutAPI {
  private static readonly BASE_PATH = '/workouts';

  /**
   * Get paginated list of workouts
   */
  static async getWorkouts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    participant?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<PaginatedResponse<Workout>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.participant) searchParams.set('participant', params.participant.toString());
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

    const query = searchParams.toString();
    const url = query ? `${this.BASE_PATH}?${query}` : this.BASE_PATH;
    
    return httpClient.get<PaginatedResponse<Workout>>(url);
  }

  /**
   * Get workout by ID
   */
  static async getWorkout(id: string): Promise<APIResponse<Workout>> {
    return httpClient.get<Workout>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Create new workout
   */
  static async createWorkout(data: Omit<Workout, 'id' | 'createdAt'>): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(this.BASE_PATH, data);
  }

  /**
   * Update existing workout
   */
  static async updateWorkout(
    id: string, 
    data: Partial<Omit<Workout, 'id' | 'createdAt'>>
  ): Promise<APIResponse<Workout>> {
    return httpClient.patch<Workout>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Delete workout
   */
  static async deleteWorkout(id: string): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Start workout
   */
  static async startWorkout(id: string): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(`${this.BASE_PATH}/${id}/start`);
  }

  /**
   * Complete workout
   */
  static async completeWorkout(
    id: string,
    data: {
      completedExercises: string[];
      duration: number;
      notes?: string;
    }
  ): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(`${this.BASE_PATH}/${id}/complete`, data);
  }

  /**
   * Pause workout
   */
  static async pauseWorkout(id: string): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(`${this.BASE_PATH}/${id}/pause`);
  }

  /**
   * Resume workout
   */
  static async resumeWorkout(id: string): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(`${this.BASE_PATH}/${id}/resume`);
  }

  /**
   * Get workout invitations (sent and received)
   */
  static async getInvitations(): Promise<APIResponse<WorkoutInvitation[]>> {
    return httpClient.get<WorkoutInvitation[]>(`${this.BASE_PATH}/invitations`);
  }

  /**
   * Send workout invitation
   */
  static async sendInvitation(
    workoutId: string,
    data: {
      userIds: number[];
      message?: string;
    }
  ): Promise<APIResponse<WorkoutInvitation[]>> {
    return httpClient.post<WorkoutInvitation[]>(
      `${this.BASE_PATH}/${workoutId}/invitations`, 
      data
    );
  }

  /**
   * Respond to workout invitation
   */
  static async respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<APIResponse<WorkoutInvitation>> {
    return httpClient.patch<WorkoutInvitation>(
      `${this.BASE_PATH}/invitations/${invitationId}`,
      { status: response }
    );
  }

  /**
   * Cancel workout invitation
   */
  static async cancelInvitation(invitationId: string): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/invitations/${invitationId}`);
  }

  /**
   * Add participant to workout
   */
  static async addParticipant(
    workoutId: string,
    userId: number
  ): Promise<APIResponse<Workout>> {
    return httpClient.post<Workout>(`${this.BASE_PATH}/${workoutId}/participants`, {
      userId
    });
  }

  /**
   * Remove participant from workout
   */
  static async removeParticipant(
    workoutId: string,
    userId: number
  ): Promise<APIResponse<Workout>> {
    return httpClient.delete<Workout>(`${this.BASE_PATH}/${workoutId}/participants/${userId}`);
  }

  /**
   * Get user's workout schedule
   */
  static async getSchedule(
    dateFrom: string,
    dateTo: string
  ): Promise<APIResponse<Workout[]>> {
    const params = new URLSearchParams({
      dateFrom,
      dateTo
    });
    
    return httpClient.get<Workout[]>(`${this.BASE_PATH}/schedule?${params.toString()}`);
  }

  /**
   * Get workout statistics
   */
  static async getStatistics(
    workoutId: string
  ): Promise<APIResponse<{
    duration: number;
    exercisesCompleted: number;
    totalSets: number;
    totalReps: number;
    totalWeight: number;
  }>> {
    return httpClient.get(`${this.BASE_PATH}/${workoutId}/statistics`);
  }

  /**
   * Get user's workout history
   */
  static async getHistory(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<PaginatedResponse<Workout>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

    const query = searchParams.toString();
    const url = query ? `${this.BASE_PATH}/history?${query}` : `${this.BASE_PATH}/history`;
    
    return httpClient.get<PaginatedResponse<Workout>>(url);
  }
}
