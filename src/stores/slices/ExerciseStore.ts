/**
 * Store для управления упражнениями
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { makeAutoObservable, runInAction } from 'mobx';
import apiClient from '../../api/client';
import { handleError } from '../../utils/error-handler';
import Validator from '../../utils/validation';
import { 
  ApiResponse, 
  Exercise, 
  PaginatedResponse,
  BaseEntity 
} from '../../types/api';

export interface ExerciseFilters {
  muscleGroup?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string;
  isPublic?: boolean;
  createdBy?: string;
  search?: string;
}

export interface ExerciseState {
  exercises: Exercise[];
  currentExercise: Exercise | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  filters: ExerciseFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cache: Map<string, Exercise>;
}

class ExerciseStore {
  state: ExerciseState = {
    exercises: [],
    currentExercise: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
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
    cache: new Map()
  };

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Геттеры для удобства
   */
  get exercises() { return this.state.exercises; }
  get currentExercise() { return this.state.currentExercise; }
  get isLoading() { return this.state.isLoading; }
  get isCreating() { return this.state.isCreating; }
  get isUpdating() { return this.state.isUpdating; }
  get isDeleting() { return this.state.isDeleting; }
  get error() { return this.state.error; }
  get filters() { return this.state.filters; }
  get pagination() { return this.state.pagination; }

  /**
   * Получение упражнений по фильтрам
   */
  async loadExercises(newFilters?: ExerciseFilters, page?: number): Promise<void> {
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

      const response = await apiClient.get<ApiResponse<PaginatedResponse<Exercise>>>(
        `/exercises?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        const { items, pagination } = response.data.data;
        
        runInAction(() => {
          // Если это первая страница или новые фильтры, заменяем список
          if (currentPage === 1 || newFilters) {
            this.state.exercises = items;
          } else {
            // Иначе добавляем к существующему списку (бесконечная прокрутка)
            this.state.exercises.push(...items);
          }
          
          this.state.pagination = pagination;
          
          // Кешируем упражнения
          items.forEach(exercise => {
            this.state.cache.set(exercise.id.toString(), exercise);
          });
        });
      } else {
        throw new Error(response.data.message || 'Ошибка загрузки упражнений');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки упражнений');
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Загрузка следующей страницы упражнений
   */
  async loadNextPage(): Promise<void> {
    if (!this.state.pagination.hasNext || this.state.isLoading) {
      return;
    }

    await this.loadExercises(undefined, this.state.pagination.page + 1);
  }

  /**
   * Получение упражнения по ID
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      // Проверяем кеш
      const cached = this.state.cache.get(id);
      if (cached) {
        runInAction(() => {
          this.state.currentExercise = cached;
        });
        return cached;
      }

      this.setLoading(true);
      
      const response = await apiClient.get<ApiResponse<Exercise>>(`/exercises/${id}`);
      
      if (response.data.success && response.data.data) {
        const exercise = response.data.data;
        
        runInAction(() => {
          this.state.currentExercise = exercise;
          this.state.cache.set(exercise.id.toString(), exercise);
        });
        
        return exercise;
      } else {
        throw new Error(response.data.message || 'Упражнение не найдено');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки упражнения');
      return null;
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Создание нового упражнения
   */
  async createExercise(exerciseData: Omit<Exercise, keyof BaseEntity>): Promise<Exercise | null> {
    try {
      this.setCreating(true);
      this.clearError();

      // Валидация данных
      const validationResult = Validator.validateExercise(exerciseData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      const response = await apiClient.post<ApiResponse<Exercise>>('/exercises', exerciseData);
      
      if (response.data.success && response.data.data) {
        const newExercise = response.data.data;
        
        runInAction(() => {
          // Добавляем в начало списка если применимо к текущим фильтрам
          if (this.shouldIncludeInCurrentList(newExercise)) {
            this.state.exercises.unshift(newExercise);
            this.state.pagination.total++;
          }
          
          this.state.currentExercise = newExercise;
          this.state.cache.set(newExercise.id.toString(), newExercise);
        });
        
        return newExercise;
      } else {
        throw new Error(response.data.message || 'Ошибка создания упражнения');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка создания упражнения');
      return null;
    } finally {
      runInAction(() => {
        this.state.isCreating = false;
      });
    }
  }

  /**
   * Обновление упражнения
   */
  async updateExercise(id: number, exerciseData: Partial<Exercise>): Promise<Exercise | null> {
    try {
      this.setUpdating(true);
      this.clearError();

      // Валидация данных (частичная)
      const validationResult = Validator.validateExercise(exerciseData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      const response = await apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}`, exerciseData);
      
      if (response.data.success && response.data.data) {
        const updatedExercise = response.data.data;
        
        runInAction(() => {
          // Обновляем в списке
          const index = this.state.exercises.findIndex(ex => ex.id === id);
          if (index !== -1) {
            if (this.shouldIncludeInCurrentList(updatedExercise)) {
              this.state.exercises[index] = updatedExercise;
            } else {
              // Убираем из списка если больше не соответствует фильтрам
              this.state.exercises.splice(index, 1);
            }
          }
          
          // Обновляем текущее упражнение
          if (this.state.currentExercise?.id === id) {
            this.state.currentExercise = updatedExercise;
          }
          
          // Обновляем кеш
          this.state.cache.set(updatedExercise.id.toString(), updatedExercise);
        });
        
        return updatedExercise;
      } else {
        throw new Error(response.data.message || 'Ошибка обновления упражнения');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка обновления упражнения');
      return null;
    } finally {
      runInAction(() => {
        this.state.isUpdating = false;
      });
    }
  }

  /**
   * Удаление упражнения
   */
  async deleteExercise(id: number): Promise<boolean> {
    try {
      this.setDeleting(true);
      this.clearError();

      const response = await apiClient.delete<ApiResponse<void>>(`/exercises/${id}`);
      
      if (response.data.success) {
        runInAction(() => {
          // Удаляем из списка
          this.state.exercises = this.state.exercises.filter(ex => ex.id !== id);
          
          // Очищаем текущее упражнение если это оно
          if (this.state.currentExercise?.id === id) {
            this.state.currentExercise = null;
          }
          
          // Удаляем из кеша
          this.state.cache.delete(id.toString());
          
          // Уменьшаем общее количество
          this.state.pagination.total = Math.max(0, this.state.pagination.total - 1);
        });
        
        return true;
      } else {
        throw new Error(response.data.message || 'Ошибка удаления упражнения');
      }
    } catch (error) {
      this.handleError(error, 'Ошибка удаления упражнения');
      return false;
    } finally {
      runInAction(() => {
        this.state.isDeleting = false;
      });
    }
  }

  /**
   * Поиск упражнений
   */
  async searchExercises(query: string): Promise<void> {
    await this.loadExercises({ search: query }, 1);
  }

  /**
   * Применение фильтров
   */
  async applyFilters(filters: ExerciseFilters): Promise<void> {
    await this.loadExercises(filters, 1);
  }

  /**
   * Очистка фильтров
   */
  async clearFilters(): Promise<void> {
    runInAction(() => {
      this.state.filters = {};
    });
    await this.loadExercises({}, 1);
  }

  /**
   * Установка текущего упражнения
   */
  setCurrentExercise(exercise: Exercise | null): void {
    runInAction(() => {
      this.state.currentExercise = exercise;
    });
  }

  /**
   * Очистка текущего упражнения
   */
  clearCurrentExercise(): void {
    runInAction(() => {
      this.state.currentExercise = null;
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
   * Проверка должно ли упражнение быть включено в текущий список
   */
  private shouldIncludeInCurrentList(exercise: Exercise): boolean {
    const { filters } = this.state;
    
    // Проверяем каждый фильтр
    if (filters.muscleGroup && !exercise.muscleGroup.includes(filters.muscleGroup)) {
      return false;
    }
    
    if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
      return false;
    }
    
    if (filters.equipment && (!exercise.equipment || !exercise.equipment.includes(filters.equipment))) {
      return false;
    }
    
    if (filters.isPublic !== undefined && exercise.isPublic !== filters.isPublic) {
      return false;
    }
    
    if (filters.createdBy && exercise.createdBy !== Number(filters.createdBy)) {
      return false;
    }
    
    if (filters.search && !this.matchesSearch(exercise, filters.search)) {
      return false;
    }
    
    return true;
  }

  /**
   * Проверка соответствия упражнения поисковому запросу
   */
  private matchesSearch(exercise: Exercise, search: string): boolean {
    const query = search.toLowerCase();
    
    return (
      exercise.name.toLowerCase().includes(query) ||
      (exercise.description?.toLowerCase().includes(query) ?? false) ||
      exercise.muscleGroup.some(mg => mg.toLowerCase().includes(query)) ||
      (exercise.equipment?.some(eq => eq.toLowerCase().includes(query)) ?? false)
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
      component: 'ExerciseStore',
      action: defaultMessage,
      additionalData: {
        currentFilters: this.state.filters,
        exercisesCount: this.state.exercises.length
      }
    });
  }
}

export default ExerciseStore;
