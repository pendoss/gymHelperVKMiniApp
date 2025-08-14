/**
 * Единый API сервис для всех запросов к backend
 * Заменяет все старые сторы и объединяет API логику
 */

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Base HTTP client
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`API Error [${config.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Auth API
class AuthAPI {
  constructor(private http: HttpClient) {}

  async login(credentials: {
    vkUserId: number;
    vkAccessToken: string;
    firstName: string;
    lastName: string;
    photo?: string;
  }) {
    const response: any = await this.http.post('/auth/login', credentials);
    
    if (response.tokens?.accessToken) {
      this.http.setAuthToken(response.tokens.accessToken);
    }
    
    return response;
  }

  async logout() {
    await this.http.post('/auth/logout');
    this.http.clearAuthToken();
  }

  async refreshToken(refreshToken: string) {
    const response: any = await this.http.post('/auth/refresh', { refreshToken });
    
    if (response.tokens?.accessToken) {
      this.http.setAuthToken(response.tokens.accessToken);
    }
    
    return response;
  }

  async getProfile() {
    return this.http.get('/auth/profile');
  }
}

// Exercises API
class ExercisesAPI {
  constructor(private http: HttpClient) {}

  async getAll(params?: {
    page?: number;
    limit?: number;
    muscleGroup?: string;
    difficulty?: string;
    equipment?: string;
    search?: string;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.http.get('/exercises', params);
  }

  async getById(id: string) {
    return this.http.get(`/exercises/${id}`);
  }

  async create(exerciseData: any) {
    return this.http.post('/exercises', exerciseData);
  }

  async update(id: string, updates: any) {
    return this.http.put(`/exercises/${id}`, updates);
  }

  async delete(id: string) {
    return this.http.delete(`/exercises/${id}`);
  }

  async getByMuscleGroup(muscleGroup: string) {
    return this.http.get(`/exercises/muscle-group/${muscleGroup}`);
  }

  async search(query: string) {
    return this.http.get('/exercises/search', { q: query });
  }
}

// Workouts API
class WorkoutsAPI {
  constructor(private http: HttpClient) {}

  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    createdBy?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.http.get('/workouts', params);
  }

  async getById(id: string) {
    return this.http.get(`/workouts/${id}`);
  }

  async create(workoutData: any) {
    return this.http.post('/workouts', workoutData);
  }

  async update(id: string, updates: any) {
    return this.http.put(`/workouts/${id}`, updates);
  }

  async delete(id: string) {
    return this.http.delete(`/workouts/${id}`);
  }

  async start(id: string) {
    return this.http.post(`/workouts/${id}/start`);
  }

  async complete(id: string) {
    return this.http.post(`/workouts/${id}/complete`);
  }

  async cancel(id: string) {
    return this.http.post(`/workouts/${id}/cancel`);
  }

  async addExercise(workoutId: string, exerciseData: any) {
    return this.http.post(`/workouts/${workoutId}/exercises`, exerciseData);
  }

  async updateExercise(workoutId: string, exerciseId: string, updates: any) {
    return this.http.put(`/workouts/${workoutId}/exercises/${exerciseId}`, updates);
  }

  async removeExercise(workoutId: string, exerciseId: string) {
    return this.http.delete(`/workouts/${workoutId}/exercises/${exerciseId}`);
  }

  async updateSet(workoutId: string, exerciseId: string, setId: string, updates: any) {
    return this.http.put(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`, updates);
  }
}

// Invitations API  
class InvitationsAPI {
  constructor(private http: HttpClient) {}

  async getSent(filters?: {
    status?: string[];
    workoutId?: string;
    inviteeId?: string;
  }) {
    return this.http.get('/invitations/sent', filters);
  }

  async getReceived(filters?: {
    status?: string[];
    workoutId?: string;
    inviterId?: string;
  }) {
    return this.http.get('/invitations/received', filters);
  }

  async create(data: {
    workoutId: string;
    inviteeIds: string[];
    message?: string;
    autoDeclineMinutes?: number;
  }) {
    return this.http.post('/invitations', data);
  }

  async respond(id: string, status: 'accepted' | 'declined') {
    return this.http.post(`/invitations/${id}/respond`, { status });
  }

  async cancel(id: string) {
    return this.http.delete(`/invitations/${id}`);
  }
}

// Users API (for friends, search etc)
class UsersAPI {
  constructor(private http: HttpClient) {}

  async search(query: string) {
    return this.http.get('/users/search', { q: query });
  }

  async getById(id: string) {
    return this.http.get(`/users/${id}`);
  }

  async getFriends() {
    return this.http.get('/users/friends');
  }

  async getStats(id?: string) {
    const endpoint = id ? `/users/${id}/stats` : '/users/me/stats';
    return this.http.get(endpoint);
  }

  async getLeaderboard(params?: {
    period?: 'week' | 'month' | 'all';
    limit?: number;
  }) {
    return this.http.get('/users/leaderboard', params);
  }
}

// Main API Service
export default class ApiService {
  private http: HttpClient;

  public auth: AuthAPI;
  public exercises: ExercisesAPI;
  public workouts: WorkoutsAPI;
  public invitations: InvitationsAPI;
  public users: UsersAPI;

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.http = new HttpClient(baseURL);
    
    this.auth = new AuthAPI(this.http);
    this.exercises = new ExercisesAPI(this.http);
    this.workouts = new WorkoutsAPI(this.http);
    this.invitations = new InvitationsAPI(this.http);
    this.users = new UsersAPI(this.http);
  }

  setAuthToken(token: string) {
    this.http.setAuthToken(token);
  }

  clearAuthToken() {
    this.http.clearAuthToken();
  }
}