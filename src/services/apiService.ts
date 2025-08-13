import axios, { AxiosInstance, AxiosResponse } from 'axios';
import bridge from '@vkontakte/vk-bridge';

// Интерфейсы для API запросов и ответов
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  user: any; // User interface from types
  access_token: string;
}

export interface LoginRequest {
  vk_user_id: number;
  vk_access_token: string;
  user_info: {
    first_name: string;
    last_name: string;
    photo_200?: string;
    city?: { title: string };
  };
}

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    // Базовый URL API - здесь будет адрес вашего backend
    const baseURL = import.meta.env.VITE_API_URL || 'https://your-backend-domain.com/api/v1';

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor для добавления токена аутентификации
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor для обработки ошибок
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Если токен недействителен, можно попробовать обновить его
        if (error.response?.status === 401) {
          this.accessToken = null;
          // Здесь можно добавить логику перенаправления на экран входа
          console.error('Unauthorized access - token expired or invalid');
        }
        return Promise.reject(error);
      }
    );
  }

  // Установка токена доступа
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // Получение токена доступа
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // === AUTHENTICATION ===

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/vk-login', loginData);
    
    // Сохраняем токен для последующих запросов
    this.setAccessToken(response.data.access_token);
    
    return response.data;
  }

  // === USERS ===

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put('/users/me', profileData);
    return response.data;
  }

  async getFriends(params?: {
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/users/friends', { params });
    return response.data;
  }

  // === EXERCISES ===

  async getExercises(params?: {
    page?: number;
    limit?: number;
    search?: string;
    muscleGroup?: string;
    equipment?: string;
    createdBy?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/exercises', { params });
    return response.data;
  }

  async getExerciseById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/exercises/${id}`);
    return response.data;
  }

  async createExercise(exerciseData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/exercises', exerciseData);
    return response.data;
  }

  async updateExercise(id: string, exerciseData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/exercises/${id}`, exerciseData);
    return response.data;
  }

  async deleteExercise(id: string): Promise<void> {
    await this.api.delete(`/exercises/${id}`);
  }

  async uploadExerciseMedia(id: string, file: File, type: 'image' | 'video'): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.api.post(`/exercises/${id}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // === WORKOUTS ===

  async getWorkouts(params?: {
    page?: number;
    limit?: number;
    status?: 'upcoming' | 'past' | 'templates';
    search?: string;
    date_from?: string;
    date_to?: string;
    gym?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/workouts', { params });
    return response.data;
  }

  async getWorkoutById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/workouts/${id}`);
    return response.data;
  }

  async createWorkout(workoutData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/workouts', workoutData);
    return response.data;
  }

  async updateWorkout(id: string, workoutData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/workouts/${id}`, workoutData);
    return response.data;
  }

  async deleteWorkout(id: string): Promise<void> {
    await this.api.delete(`/workouts/${id}`);
  }

  async completeWorkout(id: string, completionData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/workouts/${id}/complete`, completionData);
    return response.data;
  }

  async respondToWorkoutInvitation(
    workoutId: string, 
    userId: number, 
    status: 'accepted' | 'declined'
  ): Promise<ApiResponse<any>> {
    const response = await this.api.post(
      `/workouts/${workoutId}/participants/${userId}/respond`,
      { status }
    );
    return response.data;
  }

  // === CALENDAR ===

  async getCalendar(params?: {
    month?: string; // YYYY-MM
    year?: string;  // YYYY
  }): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/calendar', { params });
    return response.data;
  }

  // === STATISTICS ===

  async getUserStatistics(params?: {
    period?: 'week' | 'month' | 'year';
    year?: string;
    month?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.get('/statistics/me', { params });
    return response.data;
  }

  // === UTILITY METHODS ===

  // Инициализация VK аутентификации
  async initializeVKAuth(): Promise<AuthResponse | null> {
    try {
      // Получаем информацию о пользователе VK
      const userInfo = await bridge.send('VKWebAppGetUserInfo');
      
      // Получаем access token (в реальном приложении это будет через VK Bridge)
      const authData = await bridge.send('VKWebAppGetAuthToken', {
        app_id: parseInt(import.meta.env.VITE_VK_APP_ID || '0'),
        scope: 'friends'
      });

      const loginData: LoginRequest = {
        vk_user_id: userInfo.id,
        vk_access_token: authData.access_token,
        user_info: {
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          photo_200: userInfo.photo_200,
          city: userInfo.city,
        },
      };

      return await this.login(loginData);
    } catch (error) {
      console.error('VK authentication failed:', error);
      return null;
    }
  }

  // Обработка ошибок API
  handleApiError(error: any): string {
    if (error.response) {
      // Сервер ответил с кодом ошибки
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.error || 'Неверные данные запроса';
        case 401:
          return 'Необходима авторизация';
        case 403:
          return 'Доступ запрещен';
        case 404:
          return 'Ресурс не найден';
        case 422:
          return data.details 
            ? data.details.map((detail: any) => detail.message).join(', ')
            : 'Ошибка валидации данных';
        case 500:
          return 'Внутренняя ошибка сервера';
        default:
          return data.error || 'Произошла ошибка';
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      return 'Нет соединения с сервером';
    } else {
      // Ошибка при настройке запроса
      return 'Ошибка настройки запроса';
    }
  }

  // Форматирование даты для API
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // Форматирование времени для API
  formatTimeForAPI(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
  }
}

// Экспортируем singleton instance
export const apiService = new ApiService();

// Экспортируем класс для тестирования или создания дополнительных экземпляров
export default ApiService;
