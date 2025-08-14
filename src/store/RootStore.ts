import { makeAutoObservable, runInAction } from 'mobx';
import ApiService from '../api/ApiService';

export interface WorkoutParticipantCompat {
  userId: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    photo_200: string;
    level: string;
    firstLogin: boolean;
  };
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
}

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  vkId: number;
  firstName: string;
  lastName: string;
  photo?: string;
  city?: string;
  isActive: boolean;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  firstLogin: boolean;
  gym: string;
  isOnline: boolean;
  
}

export interface Friend extends User {
  status: 'training' | 'resting';
  lastWorkout?: Date;
  nextWorkout?: Date;
  workoutsThisWeek: Workout[];
}

export interface WorkoutParticipant extends User {
    status: 'accepted'| 'pending' | 'declined'
}

export interface Exercise extends BaseEntity {
  videoFile: string | undefined;
  minWeight: any;
  maxWeight: any;
  name: string;
  description?: string;
  muscleGroup: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  imageUrl?: string;
  videoUrl?: string;
  restTime?: number;
  defaultSets?: ExerciseSet[];
  isPublic: boolean;
  createdBy: string;
  recommendations: string[];
  steps: string[];
}

export interface ExerciseSet {
  id: number;
  reps: number;
  weight?: number;
  distance?: number;
  duration?: number;
  restTime?: number;
}

export interface WorkoutExercise {
  id: number;
  exerciseId: number;
  exercise: Exercise;
  sets: ExerciseSet[];
  order: number;
  notes?: string;
  completed: boolean;
}

export interface Workout extends BaseEntity {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  duration?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  exercises: WorkoutExercise[];
  createdBy: string;
  participants: WorkoutParticipant[];
  location?: string;
  actualDuration?: number;
  completedAt?: string;
}

export interface WorkoutInvitation extends BaseEntity {
  workoutId: string;
  inviterId: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'auto_declined' | 'expired';
  message?: string;
  respondedAt?: string;
  autoDeclineAt?: number;
  notificationSent: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
}

// Filters
export interface ExerciseFilters {
  muscleGroup?: string;
  difficulty?: string;
  equipment?: string;
  search?: string;
  isPublic?: boolean;
  createdBy?: string;
}

export interface WorkoutFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  createdBy?: string;
}

export interface InvitationFilters {
  status?: string[];
  workoutId?: string;
  inviterId?: string;
  inviteeId?: string;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class RootStore {
  // Auth State
  user: User | null = null;
  currentUser: User | null = null;
  token: AuthTokens | null = null;
  isAuthenticated = false;
  authLoading = false;
  authError: string | null = null;
  selectedDate: Date =  new Date();
  // Exercises State
  exercises: Exercise[] = [];
  currentExercise: Exercise | null = null;
  exerciseFilters: ExerciseFilters = {};
  exercisePagination: Pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };
  exerciseLoading = false;
  exerciseError: string | null = null;

  // Workouts State
  workouts: Workout[] = [];
  currentWorkout: Workout | null = null;
  activeWorkout: Workout | null = null;
  workoutFilters: WorkoutFilters = {};
  workoutPagination: Pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };
  workoutLoading = false;
  workoutError: string | null = null;

  // Friends State
  friends: Friend[] = [];
  friendsLoading = false;
  friendsError: string | null = null;

  // Workout Timer
  workoutTimer = {
    startTime: null as Date | null,
    elapsedTime: 0,
    isRunning: false
  };

  // Invitations State
  invitations: WorkoutInvitation[] = [];
  sentInvitations: WorkoutInvitation[] = [];
  receivedInvitations: WorkoutInvitation[] = [];
  invitationFilters: InvitationFilters = {};
  invitationLoading = false;
  invitationError: string | null = null;

  // Pending Exercise for Workout Creation
  pendingExerciseForWorkout: {
    exercise: Exercise | null;
    sets: ExerciseSet[];
  } = {
    exercise: null,
    sets: []
  };

  // General Loading States
  isLoading = false;
  error: string | null = null;

  // Cache для оптимизации
  private exerciseCache = new Map<number, Exercise>();
  private workoutCache = new Map<number, Workout>();

  // Timer references
  private timerInterval: number | null = null;
  private invitationTimers = new Map<number, number>();

  constructor(
    private apiService: ApiService
  ) {
    makeAutoObservable(this);
    this.initializeStore();
  }

  // Initialization
  private async initializeStore() {
    await this.loadUserFromStorage();
    await this.loadActiveWorkout();
  }

  setSelectedDate = (date: Date) => {
    this.selectedDate = date;
  };
  // ================ AUTH METHODS ================

  async login(vkUserData: any): Promise<boolean> {
    this.authLoading = true;
    this.authError = null;

    try {
      const response = await this.apiService.auth.login({
        vkUserId: vkUserData.id,
        vkAccessToken: vkUserData.access_token,
        firstName: vkUserData.first_name,
        lastName: vkUserData.last_name,
        photo: vkUserData.photo_200
      });

      runInAction(() => {
        this.token = response.tokens;
        this.user = response.user;
        this.isAuthenticated = true;
        this.authLoading = false;
      });

      this.saveUserToStorage();
      return true;
    } catch (error) {
      runInAction(() => {
        this.authError = error instanceof Error ? error.message : 'Ошибка входа';
        this.authLoading = false;
      });
      return false;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await this.apiService.auth.logout();
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      runInAction(() => {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.authError = null;
      });
      this.clearUserFromStorage();
    }
  }

  async refreshToken(): Promise<boolean> {
    if (!this.token?.refreshToken) return false;

    try {
      const response = await this.apiService.auth.refreshToken(this.token.refreshToken);
      
      runInAction(() => {
        this.token = response.tokens;
      });

      this.saveUserToStorage();
      return true;
    } catch (error) {
      await this.logout();
      return false;
    }
  }

  // ================ EXERCISE METHODS ================

  async loadExercises(filters: ExerciseFilters = {}) {
    this.exerciseLoading = true;
    this.exerciseError = null;

    try {
      const response = await this.apiService.exercises.getAll({
        ...filters,
        page: this.exercisePagination.page,
        limit: this.exercisePagination.limit
      }) as any;

      runInAction(() => {
        this.exercises = response.items || response;
        this.exercisePagination = response.pagination || this.exercisePagination;
        this.exerciseFilters = filters;
        this.exerciseLoading = false;
      });

      // Update cache
      const items = response.items || response;
      if (Array.isArray(items)) {
        items.forEach((exercise: Exercise) => {
          this.exerciseCache.set(exercise.id, exercise);
        });
      }
    } catch (error) {
      runInAction(() => {
        this.exerciseError = error instanceof Error ? error.message : 'Ошибка загрузки упражнений';
        this.exerciseLoading = false;
      });
    }
  }

  async getExercise(id: number): Promise<Exercise | null> {
    // Check cache first
    if (this.exerciseCache.has(id)) {
      const exercise = this.exerciseCache.get(id)!;
      runInAction(() => {
        this.currentExercise = exercise;
      });
      return exercise;
    }

    try {
      const exercise = await this.apiService.exercises.getById(id.toString()) as Exercise;
      
      runInAction(() => {
        this.currentExercise = exercise;
      });

      this.exerciseCache.set(id, exercise);
      return exercise;
    } catch (error) {
      this.exerciseError = error instanceof Error ? error.message : 'Ошибка загрузки упражнения';
      return null;
    }
  }

  async createExercise(exerciseData: Partial<Exercise>): Promise<Exercise | null> {
    try {
      const exercise = await this.apiService.exercises.create(exerciseData) as Exercise;
      
      runInAction(() => {
        this.exercises.unshift(exercise);
        this.currentExercise = exercise;
      });

      this.exerciseCache.set(exercise.id, exercise);
      return exercise;
    } catch (error) {
      this.exerciseError = error instanceof Error ? error.message : 'Ошибка создания упражнения';
      return null;
    }
  }

  async updateExercise(id: number, updates: Partial<Exercise>): Promise<boolean> {
    try {
      const exercise = await this.apiService.exercises.update(id.toString(), updates) as Exercise;
      
      runInAction(() => {
        const index = this.exercises.findIndex(e => e.id === id);
        if (index !== -1) {
          this.exercises[index] = exercise;
        }
        if (this.currentExercise?.id === id) {
          this.currentExercise = exercise;
        }
      });

      this.exerciseCache.set(id, exercise);
      return true;
    } catch (error) {
      this.exerciseError = error instanceof Error ? error.message : 'Ошибка обновления упражнения';
      return false;
    }
  }

  async deleteExercise(id: number): Promise<boolean> {
    try {
      await this.apiService.exercises.delete(id.toString());
      
      runInAction(() => {
        this.exercises = this.exercises.filter(e => e.id !== id);
        if (this.currentExercise?.id === id) {
          this.currentExercise = null;
        }
      });

      this.exerciseCache.delete(id);
      return true;
    } catch (error) {
      this.exerciseError = error instanceof Error ? error.message : 'Ошибка удаления упражнения';
      return false;
    }
  }

  // ================ WORKOUT METHODS ================

  async loadWorkouts(filters: WorkoutFilters = {}) {
    this.workoutLoading = true;
    this.workoutError = null;

    try {
      const response = await this.apiService.workouts.getAll({
        ...filters,
        page: this.workoutPagination.page,
        limit: this.workoutPagination.limit
      }) as any;

      runInAction(() => {
        this.workouts = response.items || response;
        this.workoutPagination = response.pagination || this.workoutPagination;
        this.workoutFilters = filters;
        this.workoutLoading = false;
      });

      // Update cache
      const items = response.items || response;
      if (Array.isArray(items)) {
        items.forEach((workout: Workout) => {
          this.workoutCache.set(workout.id, workout);
        });
      }
    } catch (error) {
      runInAction(() => {
        this.workoutError = error instanceof Error ? error.message : 'Ошибка загрузки тренировок';
        this.workoutLoading = false;
      });
    }
  }

async getWorkout(id: number): Promise<Workout | null> {
    if (this.workoutCache.has(id)) {
        const workout = this.workoutCache.get(id)!;
        // Проверяем, принадлежит ли тренировка текущему пользователю
        if (workout.createdBy === this.user?.vkId.toString()) {
            runInAction(() => {
                this.currentWorkout = workout;
            });
            return workout;
        }
    }

    try {
        const workout = await this.apiService.workouts.getById(id.toString()) as Workout;
        
        // Проверяем, принадлежит ли тренировка текущему пользователю
        if (workout.createdBy !== this.user?.vkId.toString()) {
            this.workoutError = 'Доступ к тренировке запрещен';
            return null;
        }
        
        runInAction(() => {
            this.currentWorkout = workout;
        });

        this.workoutCache.set(id, workout);
        return workout;
    } catch (error) {
        this.workoutError = error instanceof Error ? error.message : 'Ошибка загрузки тренировки';
        return null;
    }
}

async getUserWorkouts(): Promise<Workout[]> {
    if (!this.user) {
        this.workoutError = 'Пользователь не авторизован';
        return [];
    }

    return this.loadWorkouts({ createdBy: this.user.vkId.toString() }).then(() => {
        return this.workouts.filter(workout => workout.createdBy === this.user?.vkId.toString());
    });
}

  async createWorkout(workoutData: Partial<Workout>): Promise<Workout | null> {
    try {
      const workout = await this.apiService.workouts.create(workoutData) as Workout;
      
      runInAction(() => {
        this.workouts.unshift(workout);
        this.currentWorkout = workout;
      });

      this.workoutCache.set(workout.id, workout);
      return workout;
    } catch (error) {
      this.workoutError = error instanceof Error ? error.message : 'Ошибка создания тренировки';
      return null;
    }
  }

  async updateWorkout(id: number, updates: Partial<Workout>): Promise<boolean> {
    try {
      const workout = await this.apiService.workouts.update(id.toString(), updates) as Workout;
      
      runInAction(() => {
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
          this.workouts[index] = workout;
        }
        if (this.currentWorkout?.id === id) {
          this.currentWorkout = workout;
        }
        if (this.activeWorkout?.id === id) {
          this.activeWorkout = workout;
        }
      });

      this.workoutCache.set(id, workout);
      return true;
    } catch (error) {
      this.workoutError = error instanceof Error ? error.message : 'Ошибка обновления тренировки';
      return false;
    }
  }

  async deleteWorkout(id: number): Promise<boolean> {
    try {
      await this.apiService.workouts.delete(id.toString());
      
      runInAction(() => {
        this.workouts = this.workouts.filter(w => w.id !== id);
        if (this.currentWorkout?.id === id) {
          this.currentWorkout = null;
        }
        if (this.activeWorkout?.id === id) {
          this.activeWorkout = null;
        }
      });

      this.workoutCache.delete(id);
      return true;
    } catch (error) {
      this.workoutError = error instanceof Error ? error.message : 'Ошибка удаления тренировки';
      return false;
    }
  }

  // Добавляем метод для совместимости с существующим кодом
  addUserWorkout(workoutData: any) {
    const workout = {
      ...workoutData,
      id: Date.now()
    };
    
    runInAction(() => {
      this.workouts.unshift(workout);
    });
    
    return workout;
  }

  async startWorkout(id: number): Promise<boolean> {
    try {
      const workout = await this.apiService.workouts.start(id.toString()) as Workout;
      
      runInAction(() => {
        this.activeWorkout = workout;
        this.workoutTimer.startTime = new Date();
        this.workoutTimer.isRunning = true;
        this.workoutTimer.elapsedTime = 0;
      });

      this.startTimer();
      this.saveActiveWorkout();
      return true;
    } catch (error) {
      this.workoutError = error instanceof Error ? error.message : 'Ошибка начала тренировки';
      return false;
    }
  }

  async completeWorkout(id: number): Promise<boolean> {
    try {
      const workout = await this.apiService.workouts.complete(id.toString()) as Workout;
      
      runInAction(() => {
        this.activeWorkout = null;
        this.workoutTimer.isRunning = false;
        
        // Update in workouts list
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
          this.workouts[index] = workout;
        }
      });

      this.stopTimer();
      this.clearActiveWorkout();
      return true;
    } catch (error) {
      this.workoutError = error instanceof Error ? error.message : 'Ошибка завершения тренировки';
      return false;
    }
  }

  // ================ INVITATION METHODS ================

  async loadInvitations(filters: InvitationFilters = {}) {
    this.invitationLoading = true;
    this.invitationError = null;

    try {
      const [sent, received] = await Promise.all([
        this.apiService.invitations.getSent(filters) as Promise<WorkoutInvitation[]>,
        this.apiService.invitations.getReceived(filters) as Promise<WorkoutInvitation[]>
      ]);

      runInAction(() => {
        this.sentInvitations = sent;
        this.receivedInvitations = received;
        this.invitations = [...sent, ...received];
        this.invitationFilters = filters;
        this.invitationLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.invitationError = error instanceof Error ? error.message : 'Ошибка загрузки приглашений';
        this.invitationLoading = false;
      });
    }
  }

  async createInvitation(workoutId: number, inviteeIds: string[], message?: string): Promise<boolean> {
    try {
      const invitations = await this.apiService.invitations.create({
        workoutId: workoutId.toString(),
        inviteeIds,
        message
      }) as WorkoutInvitation[];

      runInAction(() => {
        this.sentInvitations.push(...invitations);
        this.invitations.push(...invitations);
      });

      return true;
    } catch (error) {
      this.invitationError = error instanceof Error ? error.message : 'Ошибка создания приглашения';
      return false;
    }
  }

  async respondToInvitation(id: number, status: 'accepted' | 'declined'): Promise<boolean> {
    try {
      const invitation = await this.apiService.invitations.respond(id.toString(), status) as WorkoutInvitation;
      
      runInAction(() => {
        const index = this.receivedInvitations.findIndex(inv => inv.id === id);
        if (index !== -1) {
          this.receivedInvitations[index] = invitation;
        }
        
        const allIndex = this.invitations.findIndex(inv => inv.id === id);
        if (allIndex !== -1) {
          this.invitations[allIndex] = invitation;
        }
      });

      return true;
    } catch (error) {
      this.invitationError = error instanceof Error ? error.message : 'Ошибка ответа на приглашение';
      return false;
    }
  }

  /**
   * Принять приглашение на тренировку
   */
  async acceptInvitation(id: number): Promise<boolean> {
    return this.respondToInvitation(id, 'accepted');
  }

  /**
   * Отклонить приглашение на тренировку
   */
  async declineInvitation(id: number): Promise<boolean> {
    // TODO: Можно добавить поддержку причины отклонения если нужно
    return this.respondToInvitation(id, 'declined');
  }

  /**
   * Отменить отправленное приглашение
   */
  async cancelInvitation(id: number): Promise<boolean> {
    try {
      await this.apiService.invitations.cancel(id.toString());
      
      runInAction(() => {
        // Удаляем из отправленных приглашений
        this.sentInvitations = this.sentInvitations.filter(inv => inv.id !== id);
        // Удаляем из общего списка
        this.invitations = this.invitations.filter(inv => inv.id !== id);
      });

      return true;
    } catch (error) {
      this.invitationError = error instanceof Error ? error.message : 'Ошибка отмены приглашения';
      return false;
    }
  }

  /**
   * Получить список полученных приглашений с фильтрацией по статусу
   */
  get pendingReceivedInvitations(): WorkoutInvitation[] {
    return this.receivedInvitations.filter(inv => inv.status === 'pending');
  }

  /**
   * Получить список отправленных приглашений с фильтрацией по статусу
   */
  get pendingSentInvitations(): WorkoutInvitation[] {
    return this.sentInvitations.filter(inv => inv.status === 'pending');
  }

  // ================ FRIENDS METHODS ================

  /**
   * Загрузить список друзей пользователя
   */
  async loadFriends(): Promise<void> {
    if (!this.user) return;

    this.friendsLoading = true;
    this.friendsError = null;

    try {
      // Пока используем моковые данные, потом можно заменить на API call
      const mockFriends: Friend[] = [
        {
          id: 1,
          vkId: 12345,
          firstName: 'Иван',
          lastName: 'Петров',
          photo: 'https://via.placeholder.com/100',
          city: 'Москва',
          isActive: true,
          level: 'intermediate',
          firstLogin: false,
          gym: 'Fitness Club',
          isOnline: true,
          status: 'training',
          lastWorkout: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
          nextWorkout: new Date(Date.now() + 24 * 60 * 60 * 1000), // завтра
          workoutsThisWeek: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          vkId: 67890,
          firstName: 'Мария',
          lastName: 'Сидорова',
          photo: 'https://via.placeholder.com/100',
          city: 'Санкт-Петербург',
          isActive: true,
          level: 'beginner',
          firstLogin: false,
          gym: 'Sport Life',
          isOnline: false,
          status: 'resting',
          lastWorkout: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // неделю назад
          nextWorkout: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // через 3 дня
          workoutsThisWeek: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Для каждого друга загружаем данные о тренировках
      for (const friend of mockFriends) {
        const workoutData = await this.getFriendWorkoutData(friend.vkId);
        friend.lastWorkout = workoutData.lastWorkout;
        friend.nextWorkout = workoutData.nextWorkout;
        friend.workoutsThisWeek = workoutData.workoutsThisWeek;
      }

      runInAction(() => {
        this.friends = mockFriends;
        this.friendsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.friendsError = error instanceof Error ? error.message : 'Ошибка загрузки друзей';
        this.friendsLoading = false;
      });
    }
  }

  /**
   * Получить друга по ID
   */
  getFriend(vkId: number): Friend | null {
    return this.friends.find(f => f.vkId === vkId) || null;
  }

  /**
   * Обновить статус друга
   */
  updateFriendStatus(vkId: number, status: 'training' | 'resting'): void {
    runInAction(() => {
      const friend = this.friends.find(f => f.vkId === vkId);
      if (friend) {
        friend.status = status;
      }
    });
  }

  // ================ PENDING EXERCISE METHODS ================

  /**
   * Установить упражнение для добавления в тренировку
   */
  setPendingExerciseForWorkout(exercise: Exercise, sets: ExerciseSet[]): void {
    runInAction(() => {
      this.pendingExerciseForWorkout = {
        exercise,
        sets
      };
    });
  }

  /**
   * Очистить упражнение для добавления в тренировку
   */
  clearPendingExerciseForWorkout(): void {
    runInAction(() => {
      this.pendingExerciseForWorkout = {
        exercise: null,
        sets: []
      };
    });
  }

  /**
   * Получить упражнение для добавления в тренировку
   */
  getPendingExerciseForWorkout(): { exercise: Exercise | null; sets: ExerciseSet[] } {
    return this.pendingExerciseForWorkout;
  }

  // ================ WORKOUT TIMER METHODS ================

  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = window.setInterval(() => {
      if (this.workoutTimer.isRunning && this.workoutTimer.startTime) {
        runInAction(() => {
          this.workoutTimer.elapsedTime = Math.floor(
            (Date.now() - this.workoutTimer.startTime!.getTime()) / 1000
          );
        });
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ================ PAGINATION METHODS ================

  setExercisePage(page: number) {
    this.exercisePagination.page = page;
    this.loadExercises(this.exerciseFilters);
  }

  setWorkoutPage(page: number) {
    this.workoutPagination.page = page;
    this.loadWorkouts(this.workoutFilters);
  }

  // ================ FILTER METHODS ================

  setExerciseFilters(filters: ExerciseFilters) {
    this.exerciseFilters = filters;
    this.exercisePagination.page = 1;
    this.loadExercises(filters);
  }

  setWorkoutFilters(filters: WorkoutFilters) {
    this.workoutFilters = filters;
    this.workoutPagination.page = 1;
    this.loadWorkouts(filters);
  }

  setInvitationFilters(filters: InvitationFilters) {
    this.invitationFilters = filters;
    this.loadInvitations(filters);
  }

  // ================ STORAGE METHODS ================

  private saveUserToStorage() {
    if (this.user && this.token) {
      localStorage.setItem('gym_user', JSON.stringify(this.user));
      localStorage.setItem('gym_token', JSON.stringify(this.token));
    }
  }

  private async loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('gym_user');
      const tokenData = localStorage.getItem('gym_token');

      if (userData && tokenData) {
        const user = JSON.parse(userData);
        const token = JSON.parse(tokenData);

        // Check if token is still valid
        if (new Date(token.expiresAt) > new Date()) {
          runInAction(() => {
            this.user = user;
            this.token = token;
            this.isAuthenticated = true;
          });
        } else {
          // Try to refresh token
          await this.refreshToken();
        }
      }
    } catch (error) {
      console.warn('Error loading user from storage:', error);
      this.clearUserFromStorage();
    }
  }

  private clearUserFromStorage() {
    localStorage.removeItem('gym_user');
    localStorage.removeItem('gym_token');
  }

  private saveActiveWorkout() {
    if (this.activeWorkout) {
      localStorage.setItem('gym_active_workout', JSON.stringify({
        workout: this.activeWorkout,
        timer: this.workoutTimer
      }));
    }
  }

  private async loadActiveWorkout() {
    try {
      const data = localStorage.getItem('gym_active_workout');
      if (data) {
        const { workout, timer } = JSON.parse(data);
        
        runInAction(() => {
          this.activeWorkout = workout;
          this.workoutTimer = {
            ...timer,
            startTime: timer.startTime ? new Date(timer.startTime) : null
          };
        });

        if (this.workoutTimer.isRunning) {
          this.startTimer();
        }
      }
    } catch (error) {
      console.warn('Error loading active workout:', error);
      this.clearActiveWorkout();
    }
  }

  private clearActiveWorkout() {
    localStorage.removeItem('gym_active_workout');
  }

  // ================ USER WORKOUT ANALYTICS METHODS ================

  /**
   * Получить последнюю завершенную тренировку пользователя
   */

  
  async getLastWorkout(userId?: string): Promise<Workout | null> {
    const targetUserId = userId || this.user?.vkId.toString();
    if (!targetUserId) return null;

    try {
      const userWorkouts = this.workouts.filter(
        w => w.createdBy === targetUserId && w.status === 'completed'
      );
      
      if (userWorkouts.length === 0) {
        await this.loadWorkouts({ 
          createdBy: targetUserId, 
          status: 'completed' 
        });
        
        const completedWorkouts = this.workouts.filter(
          w => w.createdBy === targetUserId && w.status === 'completed'
        );
        
        if (completedWorkouts.length === 0) return null;
        
        return completedWorkouts.sort((a, b) => 
          new Date(b.completedAt || b.updatedAt).getTime() - 
          new Date(a.completedAt || a.updatedAt).getTime()
        )[0];
      }

      return userWorkouts.sort((a, b) => 
        new Date(b.completedAt || b.updatedAt).getTime() - 
        new Date(a.completedAt || a.updatedAt).getTime()
      )[0];
    } catch (error) {
      console.error('Error getting last workout:', error);
      return null;
    }
  }

  /**
   * Получить следующую запланированную тренировку пользователя
   */
  async getNextWorkout(userId?: string): Promise<Workout | null> {
    const targetUserId = userId || this.user?.vkId.toString();
    if (!targetUserId) return null;

    try {
      const now = new Date();
      const userWorkouts = this.workouts.filter(
        w => w.createdBy === targetUserId && 
        w.status === 'planned' &&
        new Date(w.date + 'T' + w.startTime) > now
      );
      
      if (userWorkouts.length === 0) {
        await this.loadWorkouts({ 
          createdBy: targetUserId, 
          status: 'planned',
          dateFrom: now.toISOString().split('T')[0]
        });
        
        const plannedWorkouts = this.workouts.filter(
          w => w.createdBy === targetUserId && 
          w.status === 'planned' &&
          new Date(w.date + 'T' + w.startTime) > now
        );
        
        if (plannedWorkouts.length === 0) return null;
        
        return plannedWorkouts.sort((a, b) => 
          new Date(a.date + 'T' + a.startTime).getTime() - 
          new Date(b.date + 'T' + b.startTime).getTime()
        )[0];
      }

      return userWorkouts.sort((a, b) => 
        new Date(a.date + 'T' + a.startTime).getTime() - 
        new Date(b.date + 'T' + b.startTime).getTime()
      )[0];
    } catch (error) {
      console.error('Error getting next workout:', error);
      return null;
    }
  }

  /**
   * Получить тренировки пользователя за текущую неделю
   */
  async getWorkoutsThisWeek(userId?: string): Promise<Workout[]> {
    const targetUserId = userId || this.user?.vkId.toString();
    if (!targetUserId) return [];

    try {
      const now = new Date();
      const startOfWeek = this.getStartOfWeek(now);
      const endOfWeek = this.getEndOfWeek(now);
      
      const userWorkouts = this.workouts.filter(
        w => w.createdBy === targetUserId &&
        new Date(w.date) >= startOfWeek &&
        new Date(w.date) <= endOfWeek
      );
      
      if (userWorkouts.length === 0) {
        // Если в кэше нет, загружаем с сервера
        await this.loadWorkouts({ 
          createdBy: targetUserId,
          dateFrom: startOfWeek.toISOString().split('T')[0],
          dateTo: endOfWeek.toISOString().split('T')[0]
        });
        
        return this.workouts.filter(
          w => w.createdBy === targetUserId &&
          new Date(w.date) >= startOfWeek &&
          new Date(w.date) <= endOfWeek
        );
      }

      return userWorkouts;
    } catch (error) {
      console.error('Error getting workouts this week:', error);
      return [];
    }
  }

  /**
   * Получить данные друга с информацией о тренировках
   */
  async getFriendWorkoutData(friendVkId: number): Promise<{
    lastWorkout?: Date;
    nextWorkout?: Date;
    workoutsThisWeek: Workout[];
  }> {
    const friendUserId = friendVkId.toString();
    
    try {
      const [lastWorkout, nextWorkout, workoutsThisWeek] = await Promise.all([
        this.getLastWorkout(friendUserId),
        this.getNextWorkout(friendUserId),
        this.getWorkoutsThisWeek(friendUserId)
      ]);

      return {
        lastWorkout: lastWorkout ? new Date(lastWorkout.completedAt || lastWorkout.updatedAt) : undefined,
        nextWorkout: nextWorkout ? new Date(nextWorkout.date + 'T' + nextWorkout.startTime) : undefined,
        workoutsThisWeek
      };
    } catch (error) {
      console.error('Error getting friend workout data:', error);
      return {
        workoutsThisWeek: []
      };
    }
  }

  /**
   * Вспомогательные методы для работы с датами
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник как начало недели
    return new Date(d.setDate(diff));
  }

  private getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return endOfWeek;
  }

  // ================ UTILITY METHODS ================

  clearError() {
    this.error = null;
    this.authError = null;
    this.exerciseError = null;
    this.workoutError = null;
    this.invitationError = null;
    this.friendsError = null;
  }

  dispose() {
    this.stopTimer();
    this.invitationTimers.forEach(timer => clearTimeout(timer));
    this.invitationTimers.clear();
  }
}

export default RootStore;
