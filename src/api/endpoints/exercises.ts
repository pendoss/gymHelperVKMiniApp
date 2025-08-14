import { httpClient } from '../../services/httpClient.js';
import type { 
  Exercise, 
  APIResponse,
  PaginatedResponse 
} from '../../types/index.js';

/**
 * Exercise API endpoints
 * Handles exercise CRUD operations, search, and media management
 */
export class ExerciseAPI {
  private static readonly BASE_PATH = '/exercises';

  /**
   * Get paginated list of exercises with optional filters
   */
  static async getExercises(params?: {
    page?: number;
    limit?: number;
    search?: string;
    muscleGroup?: string[];
    equipment?: string[];
    createdBy?: number;
  }): Promise<APIResponse<PaginatedResponse<Exercise>>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.muscleGroup?.length) {
      params.muscleGroup.forEach(group => searchParams.append('muscleGroup', group));
    }
    if (params?.equipment?.length) {
      params.equipment.forEach(eq => searchParams.append('equipment', eq));
    }
    if (params?.createdBy) searchParams.set('createdBy', params.createdBy.toString());

    const query = searchParams.toString();
    const url = query ? `${this.BASE_PATH}?${query}` : this.BASE_PATH;
    
    return httpClient.get<PaginatedResponse<Exercise>>(url);
  }

  /**
   * Get exercise by ID
   */
  static async getExercise(id: string): Promise<APIResponse<Exercise>> {
    return httpClient.get<Exercise>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Create new exercise
   */
  static async createExercise(data: Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>): Promise<APIResponse<Exercise>> {
    return httpClient.post<Exercise>(this.BASE_PATH, data);
  }

  /**
   * Update existing exercise
   */
  static async updateExercise(
    id: string, 
    data: Partial<Omit<Exercise, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<APIResponse<Exercise>> {
    return httpClient.patch<Exercise>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Delete exercise
   */
  static async deleteExercise(id: string): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Upload exercise media (image or video)
   */
  static async uploadMedia(
    exerciseId: string,
    file: File,
    type: 'image' | 'video'
  ): Promise<APIResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return httpClient.post<{ url: string }>(
      `${this.BASE_PATH}/${exerciseId}/media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Delete exercise media
   */
  static async deleteMedia(
    exerciseId: string,
    type: 'image' | 'video'
  ): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${exerciseId}/media/${type}`);
  }

  /**
   * Search exercises by text
   */
  static async searchExercises(
    query: string,
    filters?: {
      muscleGroup?: string[];
      equipment?: string[];
      limit?: number;
    }
  ): Promise<APIResponse<Exercise[]>> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    
    if (filters?.muscleGroup?.length) {
      filters.muscleGroup.forEach(group => searchParams.append('muscleGroup', group));
    }
    if (filters?.equipment?.length) {
      filters.equipment.forEach(eq => searchParams.append('equipment', eq));
    }
    if (filters?.limit) {
      searchParams.set('limit', filters.limit.toString());
    }

    return httpClient.get<Exercise[]>(`${this.BASE_PATH}/search?${searchParams.toString()}`);
  }

  /**
   * Get exercises by muscle group
   */
  static async getExercisesByMuscleGroup(muscleGroup: string): Promise<APIResponse<Exercise[]>> {
    return httpClient.get<Exercise[]>(`${this.BASE_PATH}/muscle-group/${encodeURIComponent(muscleGroup)}`);
  }

  /**
   * Get popular/featured exercises
   */
  static async getPopularExercises(limit = 10): Promise<APIResponse<Exercise[]>> {
    return httpClient.get<Exercise[]>(`${this.BASE_PATH}/popular?limit=${limit}`);
  }

  /**
   * Get user's favorite exercises
   */
  static async getFavoriteExercises(): Promise<APIResponse<Exercise[]>> {
    return httpClient.get<Exercise[]>(`${this.BASE_PATH}/favorites`);
  }

  /**
   * Add exercise to favorites
   */
  static async addToFavorites(exerciseId: string): Promise<APIResponse<void>> {
    return httpClient.post<void>(`${this.BASE_PATH}/${exerciseId}/favorite`);
  }

  /**
   * Remove exercise from favorites
   */
  static async removeFromFavorites(exerciseId: string): Promise<APIResponse<void>> {
    return httpClient.delete<void>(`${this.BASE_PATH}/${exerciseId}/favorite`);
  }
}
