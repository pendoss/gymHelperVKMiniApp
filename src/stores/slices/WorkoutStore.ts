/**
 * Store для управления тренировками
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { makeAutoObservable, runInAction } from 'mobx';
import apiClient from '../../api/client';
import { handleError } from '../../utils/error-handler';
import Validator from '../../utils/validation';
import { 
  ApiResponse, 
  Workout, 
  PaginatedResponse,
  BaseEntity 
} from '../../types/api';

export interface WorkoutFilters {
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  search?: string;
  hasInvitations?: boolean;
}

export interface WorkoutState {
  workouts: Workout[];
  currentWorkout: Workout | null;
  activeWorkout: Workout | null; // Текущая активная тренировка
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isStarting: boolean;
  isCompleting: boolean;
  error: string | null;
  filters: WorkoutFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cache: Map<string, Workout>;
  workoutTimer: {
    startTime: Date | null;
    elapsedTime: number; // в секундах
    isRunning: boolean;
  };
}

class WorkoutStore {
  private timerInterval: number | null = null;

  state: WorkoutState = {
    workouts: [],
    currentWorkout: null,
    activeWorkout: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isStarting: false,
    isCompleting: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    cache: new Map(),
    workoutTimer: {
      startTime: null,
      elapsedTime: 0,
      isRunning: false
    }
  };

  constructor() {
    makeAutoObservable(this);
    this.loadActiveWorkout();
  }

  /**
   * Геттеры для удобства
   */
  get workouts() { return this.state.workouts; }
  get currentWorkout() { return this.state.currentWorkout; }
  get activeWorkout() { return this.state.activeWorkout; }
  get isLoading() { return this.state.isLoading; }
  get isCreating() { return this.state.isCreating; }
  get isUpdating() { return this.state.isUpdating; }
  get isDeleting() { return this.state.isDeleting; }
  get isStarting() { return this.state.isStarting; }
  get isCompleting() { return this.state.isCompleting; }
  get error() { return this.state.error; }
  get filters() { return this.state.filters; }
  get pagination() { return this.state.pagination; }
  get workoutTimer() { return this.state.workoutTimer; }

  /**
   * Получение тренировок по фильтрам
   */
  async loadWorkouts(newFilters?: WorkoutFilters, page?: number): Promise<void> {
    try {
      this.setLoading(true);
      this.clearError();

      // Обновляем фильтры если переданы
      if (newFilters) {
        runInAction(() => {
          this.state.filters = { ...this.state.filters, ...newFilters };
        });
      }

      // Обновляем страницу если передана
      const currentPage = page || this.state.pagination.page;

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', this.state.pagination.limit.toString());

      // Добавляем фильтры в параметры запроса
      Object.entries(this.state.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<ApiResponse<PaginatedResponse<Workout>>>(
        `/workouts?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        const { items, pagination } = response.data.data;
        
        runInAction(() => {
          // Если это первая страница или новые фильтры, заменяем список
          if (currentPage === 1 || newFilters) {
            this.state.workouts = items;
          } else {
            // Иначе добавляем к существующему списку
            this.state.workouts.push(...items);
          }
          
          this.state.pagination = pagination;
          
          // Кешируем тренировки
          items.forEach(workout => {
            this.state.cache.set(workout.id.toString(), workout);
          });
        });
      } else {
        throw new Error(response.data.message || 'Ошибка загрузки тренировок');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки тренировок');
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Загрузка следующей страницы тренировок
   */
  async loadNextPage(): Promise<void> {
    if (!this.state.pagination.hasNext || this.state.isLoading) {
      return;
    }

    await this.loadWorkouts(undefined, this.state.pagination.page + 1);
  }

  /**
   * Получение тренировки по ID
   */
  async getWorkoutById(id: string): Promise<Workout | null> {
    try {
      // Проверяем кеш
      const cached = this.state.cache.get(id);
      if (cached) {
        runInAction(() => {
          this.state.currentWorkout = cached;
        });
        return cached;
      }

      this.setLoading(true);
      
      const response = await apiClient.get<ApiResponse<Workout>>(`/workouts/${id}`);
      
      if (response.data.success && response.data.data) {
        const workout = response.data.data;
        
        runInAction(() => {
          this.state.currentWorkout = workout;
          this.state.cache.set(workout.id.toString(), workout);
        });
        
        return workout;
      } else {
        throw new Error(response.data.message || 'Тренировка не найдена');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки тренировки');
      return null;
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Создание новой тренировки
   */
  async createWorkout(workoutData: Omit<Workout, keyof BaseEntity>): Promise<Workout | null> {
    try {
      this.setCreating(true);
      this.clearError();

      // Валидация данных
      const validationResult = Validator.validateWorkout(workoutData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      const response = await apiClient.post<ApiResponse<Workout>>('/workouts', workoutData);
      
      if (response.data.success && response.data.data) {
        const newWorkout = response.data.data;
        
        runInAction(() => {
          // Добавляем в начало списка если применимо к текущим фильтрам
          if (this.shouldIncludeInCurrentList(newWorkout)) {
            this.state.workouts.unshift(newWorkout);
            this.state.pagination.total++;
          }
          
          this.state.currentWorkout = newWorkout;
          this.state.cache.set(newWorkout.id.toString(), newWorkout);
        });
        
        return newWorkout;
      } else {
        throw new Error(response.data.message || 'Ошибка создания тренировки');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка создания тренировки');
      return null;
    } finally {
      runInAction(() => {
        this.state.isCreating = false;
      });
    }
  }

  /**
   * Обновление тренировки
   */
  async updateWorkout(id: number, workoutData: Partial<Workout>): Promise<Workout | null> {
    try {
      this.setUpdating(true);
      this.clearError();

      runInAction(() => {
        // Находим тренировку по ID
        const index = this.state.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
          // Объединяем существующие данные с новыми
          const updatedWorkout: Workout = {
            ...this.state.workouts[index],
            ...workoutData,
            id: id, // Убеждаемся, что ID не изменился
            updatedAt: new Date().toISOString()
          };
          
          // Обновляем в списке
          this.state.workouts[index] = updatedWorkout;
          
          // Обновляем текущую тренировку
          if (this.state.currentWorkout?.id === id) {
            this.state.currentWorkout = updatedWorkout;
          }
          
          // Обновляем активную тренировку
          if (this.state.activeWorkout?.id === id) {
            this.state.activeWorkout = updatedWorkout;
          }
          
          // Обновляем кеш
          this.state.cache.set(updatedWorkout.id.toString(), updatedWorkout);
        }
      });
      
      const updatedWorkout = this.state.workouts.find(w => w.id === id);
      return updatedWorkout || null;
    } catch (error) {
      this.handleError(error, 'Ошибка обновления тренировки');
      return null;
    } finally {
      runInAction(() => {
        this.state.isUpdating = false;
      });
    }
  }

  /**
   * Удаление тренировки
   */
  async deleteWorkout(id: number): Promise<boolean> {
    try {
      this.setDeleting(true);
      this.clearError();

      const response = await apiClient.delete<ApiResponse<void>>(`/workouts/${id}`);
      
      if (response.data.success) {
        runInAction(() => {
          // Удаляем из списка
          this.state.workouts = this.state.workouts.filter(w => w.id !== id);
          
          // Очищаем текущую тренировку если это она
          if (this.state.currentWorkout?.id === id) {
            this.state.currentWorkout = null;
          }
          
          // Останавливаем активную тренировку если это она
          if (this.state.activeWorkout?.id === id) {
            this.stopWorkout();
          }
          
          // Удаляем из кеша
          this.state.cache.delete(id.toString());
          
          // Уменьшаем общее количество
          this.state.pagination.total = Math.max(0, this.state.pagination.total - 1);
        });
        
        return true;
      } else {
        throw new Error(response.data.message || 'Ошибка удаления тренировки');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка удаления тренировки');
      return false;
    } finally {
      runInAction(() => {
        this.state.isDeleting = false;
      });
    }
  }

  /**
   * Начало тренировки
   */
  async startWorkout(id: string): Promise<boolean> {
    try {
      this.setStarting(true);
      this.clearError();

      // Останавливаем текущую активную тренировку если есть
      if (this.state.activeWorkout) {
        await this.stopWorkout();
      }

      const response = await apiClient.post<ApiResponse<Workout>>(`/workouts/${id}/start`);
      
      if (response.data.success && response.data.data) {
        const startedWorkout = response.data.data;
        
        runInAction(() => {
          this.state.activeWorkout = startedWorkout;
          this.state.workoutTimer.startTime = new Date();
          this.state.workoutTimer.elapsedTime = 0;
          this.state.workoutTimer.isRunning = true;
          
          // Обновляем в списках и кеше
          this.updateWorkoutInLists(startedWorkout);
        });
        
        // Запускаем таймер
        this.startTimer();
        
        // Сохраняем состояние в localStorage
        this.saveActiveWorkoutState();
        
        return true;
      } else {
        throw new Error(response.data.message || 'Ошибка начала тренировки');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка начала тренировки');
      return false;
    } finally {
      runInAction(() => {
        this.state.isStarting = false;
      });
    }
  }

  /**
   * Завершение тренировки
   */
  async completeWorkout(id?: string): Promise<boolean> {
    const workoutId = id || this.state.activeWorkout?.id;
    if (!workoutId) {
      throw new Error('Нет активной тренировки для завершения');
    }

    try {
      this.setCompleting(true);
      this.clearError();

      const response = await apiClient.post<ApiResponse<Workout>>(`/workouts/${workoutId}/complete`);
      
      if (response.data.success && response.data.data) {
        const completedWorkout = response.data.data;
        
        runInAction(() => {
          // Обновляем в списках и кеше
          this.updateWorkoutInLists(completedWorkout);
          
          // Если это была активная тренировка, очищаем состояние
          if (this.state.activeWorkout?.id === workoutId) {
            this.state.activeWorkout = null;
            this.state.workoutTimer.isRunning = false;
          }
        });
        
        // Останавливаем таймер
        this.stopTimer();
        
        // Очищаем сохраненное состояние
        this.clearActiveWorkoutState();
        
        return true;
      } else {
        throw new Error(response.data.message || 'Ошибка завершения тренировки');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка завершения тренировки');
      return false;
    } finally {
      runInAction(() => {
        this.state.isCompleting = false;
      });
    }
  }

  /**
   * Остановка тренировки (пауза)
   */
  stopWorkout(): void {
    runInAction(() => {
      this.state.workoutTimer.isRunning = false;
    });
    
    this.stopTimer();
    this.saveActiveWorkoutState();
  }

  /**
   * Возобновление тренировки
   */
  resumeWorkout(): void {
    if (!this.state.activeWorkout) {
      return;
    }

    runInAction(() => {
      this.state.workoutTimer.isRunning = true;
      this.state.workoutTimer.startTime = new Date(Date.now() - this.state.workoutTimer.elapsedTime * 1000);
    });
    
    this.startTimer();
    this.saveActiveWorkoutState();
  }

  /**
   * Поиск тренировок
   */
  async searchWorkouts(query: string): Promise<void> {
    await this.loadWorkouts({ search: query }, 1);
  }

  /**
   * Применение фильтров
   */
  async applyFilters(filters: WorkoutFilters): Promise<void> {
    await this.loadWorkouts(filters, 1);
  }

  /**
   * Очистка фильтров
   */
  async clearFilters(): Promise<void> {
    runInAction(() => {
      this.state.filters = {};
    });
    await this.loadWorkouts({}, 1);
  }

  /**
   * Установка текущей тренировки
   */
  setCurrentWorkout(workout: Workout | null): void {
    runInAction(() => {
      this.state.currentWorkout = workout;
    });
  }

  /**
   * Очистка текущей тренировки
   */
  clearCurrentWorkout(): void {
    runInAction(() => {
      this.state.currentWorkout = null;
    });
  }

  /**
   * Очистка кеша
   */
  clearCache(): void {
    runInAction(() => {
      this.state.cache.clear();
    });
  }

  /**
   * Загрузка активной тренировки при инициализации
   */
  private async loadActiveWorkout(): Promise<void> {
    try {
      // Пытаемся восстановить состояние из localStorage
      const savedState = this.loadActiveWorkoutState();
      if (savedState) {
        runInAction(() => {
          this.state.activeWorkout = savedState.workout;
          this.state.workoutTimer = savedState.timer;
        });
        
        // Возобновляем таймер если тренировка была активна
        if (savedState.timer.isRunning) {
          this.startTimer();
        }
      }
    } catch (error) {
      console.warn('Ошибка восстановления активной тренировки:', error);
    }
  }

  /**
   * Запуск таймера
   */
  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      if (this.state.workoutTimer.isRunning && this.state.workoutTimer.startTime) {
        runInAction(() => {
          this.state.workoutTimer.elapsedTime = Math.floor(
            (Date.now() - this.state.workoutTimer.startTime!.getTime()) / 1000
          );
        });
      }
    }, 1000);
  }

  /**
   * Остановка таймера
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Сохранение состояния активной тренировки
   */
  private saveActiveWorkoutState(): void {
    try {
      if (this.state.activeWorkout) {
        const state = {
          workout: this.state.activeWorkout,
          timer: this.state.workoutTimer
        };
        localStorage.setItem('gymhelper_active_workout', JSON.stringify(state));
      } else {
        localStorage.removeItem('gymhelper_active_workout');
      }
    } catch (error) {
      console.warn('Ошибка сохранения состояния тренировки:', error);
    }
  }

  /**
   * Загрузка состояния активной тренировки
   */
  private loadActiveWorkoutState(): { workout: Workout; timer: WorkoutState['workoutTimer'] } | null {
    try {
      const stateStr = localStorage.getItem('gymhelper_active_workout');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        // Восстанавливаем дату из строки
        if (state.timer.startTime) {
          state.timer.startTime = new Date(state.timer.startTime);
        }
        return state;
      }
    } catch (error) {
      console.warn('Ошибка загрузки состояния тренировки:', error);
    }
    return null;
  }

  /**
   * Очистка сохраненного состояния активной тренировки
   */
  private clearActiveWorkoutState(): void {
    try {
      localStorage.removeItem('gymhelper_active_workout');
    } catch (error) {
      console.warn('Ошибка очистки состояния тренировки:', error);
    }
  }

  /**
   * Обновление тренировки во всех списках и кеше
   */
  private updateWorkoutInLists(workout: Workout): void {
    // Обновляем в основном списке
    const index = this.state.workouts.findIndex(w => w.id === workout.id);
    if (index !== -1) {
      if (this.shouldIncludeInCurrentList(workout)) {
        this.state.workouts[index] = workout;
      } else {
        this.state.workouts.splice(index, 1);
      }
    }
    
    // Обновляем текущую тренировку
    if (this.state.currentWorkout?.id === workout.id) {
      this.state.currentWorkout = workout;
    }
    
    // Обновляем кеш
    this.state.cache.set(workout.id.toString(), workout);
  }

  /**
   * Проверка должна ли тренировка быть включена в текущий список
   */
  private shouldIncludeInCurrentList(workout: Workout): boolean {
    const { filters } = this.state;
    
    // Проверяем каждый фильтр
    if (filters.status && workout.status !== filters.status) {
      return false;
    }
    
    if (filters.dateFrom && workout.date < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo && workout.date > filters.dateTo) {
      return false;
    }
    
    if (filters.createdBy && workout.createdBy !== filters.createdBy) {
      return false;
    }
    
    if (filters.search && !this.matchesSearch(workout, filters.search)) {
      return false;
    }
    
    if (filters.hasInvitations !== undefined) {
      const hasInvitations = workout.invitations && workout.invitations.length > 0;
      if (hasInvitations !== filters.hasInvitations) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Проверка соответствия тренировки поисковому запросу
   */
  private matchesSearch(workout: Workout, search: string): boolean {
    const query = search.toLowerCase();
    
    return (
      workout.title.toLowerCase().includes(query) ||
      (workout.description?.toLowerCase().includes(query) ?? false)
    );
  }

  /**
   * Установка состояния загрузки
   */
  private setLoading(loading: boolean): void {
    runInAction(() => {
      this.state.isLoading = loading;
    });
  }

  /**
   * Установка состояния создания
   */
  private setCreating(creating: boolean): void {
    runInAction(() => {
      this.state.isCreating = creating;
    });
  }

  /**
   * Установка состояния обновления
   */
  private setUpdating(updating: boolean): void {
    runInAction(() => {
      this.state.isUpdating = updating;
    });
  }

  /**
   * Установка состояния удаления
   */
  private setDeleting(deleting: boolean): void {
    runInAction(() => {
      this.state.isDeleting = deleting;
    });
  }

  /**
   * Установка состояния начала тренировки
   */
  private setStarting(starting: boolean): void {
    runInAction(() => {
      this.state.isStarting = starting;
    });
  }

  /**
   * Установка состояния завершения тренировки
   */
  private setCompleting(completing: boolean): void {
    runInAction(() => {
      this.state.isCompleting = completing;
    });
  }

  /**
   * Очистка ошибки
   */
  private clearError(): void {
    runInAction(() => {
      this.state.error = null;
    });
  }

  /**
   * Обработка ошибок
   */
  private handleError(error: any, defaultMessage: string): void {
    const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
    
    runInAction(() => {
      this.state.error = errorMessage;
    });

    handleError(error, {
      component: 'WorkoutStore',
      action: defaultMessage,
      additionalData: {
        currentFilters: this.state.filters,
        workoutsCount: this.state.workouts.length,
        activeWorkoutId: this.state.activeWorkout?.id
      }
    });
  }
}

export default WorkoutStore;
