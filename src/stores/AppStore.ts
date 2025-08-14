/**
 * Главный store приложения
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { makeAutoObservable } from 'mobx';
import { VKBridge } from '@vkontakte/vk-bridge';

// Импорт всех stores
import AuthStore from './slices/AuthStore';
import ExerciseStore from './slices/ExerciseStore';
import WorkoutStore from './slices/WorkoutStore';
import InvitationStore from './slices/InvitationStore';

export interface AppConfig {
  apiBaseUrl: string;
  vkAppId: number;
  isDevelopment: boolean;
  version: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
}

export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  currentView: string;
  theme: 'light' | 'dark' | 'auto';
  networkStatus: 'online' | 'offline';
  selectedDate: Date | null;
  pendingExerciseForWorkout: { exercise: any; sets: any[] };
  lastActivity: Date;
}

class AppStore {
  // Состояние приложения
  state: AppState = {
    isInitialized: false,
    isLoading: true,
    currentView: 'home',
    theme: 'auto',
    networkStatus: 'online',
    selectedDate: null,
    pendingExerciseForWorkout: { exercise: null, sets: [] },
    lastActivity: new Date()
  };

  // Конфигурация
  private config: AppConfig = {
    apiBaseUrl: 'https://api.gymhelper.ru',
    vkAppId: 0,
    isDevelopment: true,
    version: '2.0.0',
    enableAnalytics: true,
    enableNotifications: true
  };

  // Подключенные stores
  public readonly auth: AuthStore;
  public readonly exercises: ExerciseStore;
  public readonly workouts: WorkoutStore;
  public readonly invitations: InvitationStore;

  // VK Bridge
  private bridge: VKBridge;

  constructor(bridge: VKBridge) {
    makeAutoObservable(this, {
      // Исключаем stores из автонаблюдения, так как они сами observable
      auth: false,
      exercises: false,
      workouts: false,
      invitations: false
    });

    this.bridge = bridge;

    // Инициализируем stores
    this.auth = new AuthStore(bridge);
    this.exercises = new ExerciseStore();
    this.workouts = new WorkoutStore();
    this.invitations = new InvitationStore();

    // Запускаем инициализацию приложения
    this.initialize();
  }

  /**
   * Геттеры для удобства
   */
  get isInitialized() { return this.state.isInitialized; }
  get isLoading() { return this.state.isLoading; }
  get currentView() { return this.state.currentView; }
  get theme() { return this.state.theme; }
  get networkStatus() { return this.state.networkStatus; }
  get isAuthenticated() { return this.auth.isAuthenticated; }
  get currentUser() { return this.auth.user; }
  get vkUserInfo() { return this.auth.vkUserInfo; }
  get friends() { return (this.auth.state.vkUserInfo as any)?.friends || []; }
  get showOnBoardingModal() { return (this.currentUser as any)?.firstLogin || false; }
  get selectedDate() { return this.state.selectedDate; }
  get pendingExerciseForWorkout() { return this.state.pendingExerciseForWorkout; }

  // Методы
  setShowOnBoardingModal(show: boolean) {
    if (this.auth.state.user) {
      (this.auth.state.user as any).firstLogin = show;
    }
  }

  setSelectedDate(date: Date | null) {
    this.state.selectedDate = date;
  }

  setPendingExerciseForWorkout(exercise: any, sets: any[]) {
    this.state.pendingExerciseForWorkout = { exercise, sets };
  }

  clearPendingExerciseForWorkout() {
    this.state.pendingExerciseForWorkout = { exercise: null, sets: [] };
  }

  setMainGym(gymName: string) {
    if (this.auth.state.user) {
      (this.auth.state.user as any).settings = (this.auth.state.user as any).settings || {
        preferences: {}
      };
      (this.auth.state.user as any).settings.preferences.defaultGym = gymName;
    }
  }

  // Методы делегирования к workouts
  deleteWorkout(workoutId: number) {
    return this.workouts.deleteWorkout(workoutId);
  }

  addUserWorkout(workout: any) {
    const workoutWithId = {
      ...workout,
      id: Date.now(), // Генерируем уникальный number ID
    };
    this.workouts.workouts.push(workoutWithId);
    return workoutWithId;
  }

  updateUserWorkout(workoutId: number, updates: any) {
    return this.workouts.updateWorkout(workoutId, updates);
  }

  deleteUserWorkout(workoutId: number) {
    return this.workouts.deleteWorkout(workoutId);
  }

  getUserWorkouts() {
    // Возвращаем только тренировки текущего пользователя
    return this.workouts.workouts.filter((workout: any) => 
      this.currentUser && String(workout.createdBy) === String(this.currentUser.id)
    );
  }

  markWorkoutAsCompleted(workoutId: number) {
    return this.workouts.updateWorkout(workoutId, { completedAt: new Date().toISOString() } as any);
  }

  updateWorkout(workoutId: number, updates: any) {
    return this.workouts.updateWorkout(workoutId, updates);
  }

  getWorkoutById(workoutId: number) {
    // Ищем в пользовательских тренировках и общих, сравнивая как строки
    return this.workouts.workouts.find((w: any) => String(w.id) === String(workoutId));
  }

  // Методы делегирования к exercises  
  addExercise(exercise: any) {
    const newExercise = {
      ...exercise,
      id: exercise.id || Date.now().toString(),
    };
    this.exercises.exercises.push(newExercise);
  }

  updateExercise(exerciseId: string, exercise: any) {
    return this.exercises.updateExercise(+exerciseId, exercise);
  }

  // Общие методы
  updateCurrentUser(updates: any) {
    if (this.auth.state.user) {
      Object.assign(this.auth.state.user, updates);
    }
  }

  sendWorkoutInvitation(friendId: number, workoutId: number) {
    // Создаем приглашение
    const invitation = {
      id: Date.now().toString(),
      workoutId,
      friendId,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    this.invitations.invitations.push(invitation as any);
  }

  /**
   * Инициализация приложения
   */
  private async initialize(): Promise<void> {
    try {
      console.log(' Запуск инициализации GymHelper v' + this.config.version);

      // Установка обработчиков событий
      this.setupEventListeners();

      // Загрузка настроек из localStorage
      this.loadSettings();

      // Инициализация завершена
      this.state.isInitialized = true;
      this.state.isLoading = false;

      console.log(' Инициализация завершена успешно');

      // Запуск фоновых задач
      this.startBackgroundTasks();

    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.state.isLoading = false;
      this.state.isInitialized = true;
    }
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners(): void {
    // Обработка изменения состояния сети
    window.addEventListener('online', () => {
      this.state.networkStatus = 'online';
      console.log('🌐 Соединение восстановлено');
    });

    window.addEventListener('offline', () => {
      this.state.networkStatus = 'offline';
      console.log('🌐 Соединение потеряно');
    });

    // Обработка активности пользователя
    const updateLastActivity = () => {
      this.state.lastActivity = new Date();
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });

    // Обработка событий VK Bridge
    this.bridge.subscribe((event) => {
      console.log('VK Bridge Event:', event);
      
      switch (event.detail.type) {
        case 'VKWebAppViewHide':
          this.handleAppBackground();
          break;
        case 'VKWebAppViewRestore':
          this.handleAppForeground();
          break;
        case 'VKWebAppUpdateConfig':
          this.handleVKConfigUpdate(event.detail.data);
          break;
      }
    });

    // Обработка выхода из аутентификации
    window.addEventListener('auth:logout', () => {
      this.handleLogout();
    });
  }

  /**
   * Загрузка настроек из localStorage
   */
  private loadSettings(): void {
    try {
      const savedTheme = localStorage.getItem('gymhelper_theme') as 'light' | 'dark' | 'auto';
      if (savedTheme) {
        this.state.theme = savedTheme;
      }

      const savedView = localStorage.getItem('gymhelper_current_view');
      if (savedView) {
        this.state.currentView = savedView;
      }

      console.log('⚙️ Настройки загружены из localStorage');
    } catch (error) {
      console.warn('Ошибка загрузки настроек:', error);
    }
  }

  /**
   * Сохранение настроек в localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('gymhelper_theme', this.state.theme);
      localStorage.setItem('gymhelper_current_view', this.state.currentView);
    } catch (error) {
      console.warn('Ошибка сохранения настроек:', error);
    }
  }

  /**
   * Запуск фоновых задач
   */
  private startBackgroundTasks(): void {
    // Периодическое сохранение настроек
    setInterval(() => {
      this.saveSettings();
    }, 30000);

    // Периодическая проверка обновлений приглашений
    if (this.isAuthenticated) {
      setInterval(() => {
        this.invitations.loadInvitations();
      }, 60000);
    }

    console.log('🔄 Фоновые задачи запущены');
  }

  /**
   * Обработка ухода приложения в фон
   */
  private handleAppBackground(): void {
    console.log('📱 Приложение ушло в фон');
    this.saveSettings();
    
    if (this.workouts.activeWorkout && this.workouts.workoutTimer.isRunning) {
      this.workouts.stopWorkout();
    }
  }

  /**
   * Обработка восстановления приложения из фона
   */
  private handleAppForeground(): void {
    console.log('📱 Приложение восстановлено из фона');
    
    this.state.lastActivity = new Date();
    
    if (this.isAuthenticated) {
      this.invitations.loadInvitations();
      
      if (this.workouts.activeWorkout && !this.workouts.workoutTimer.isRunning) {
        this.workouts.resumeWorkout();
      }
    }
  }

  /**
   * Обработка обновления конфигурации VK
   */
  private handleVKConfigUpdate(config: any): void {
    console.log('🔄 Обновление VK конфигурации:', config);
    
    if (config.scheme) {
      const theme = config.scheme === 'bright_light' ? 'light' : 'dark';
      this.setTheme(theme);
    }
  }

  /**
   * Обработка выхода из аккаунта
   */
  private handleLogout(): void {
    console.log('👋 Выход из аккаунта');
    
    this.exercises.clearCache();
    this.workouts.clearCache();
    this.invitations.clearCache();
    
    this.state.currentView = 'home';
    this.saveSettings();
  }

  /**
   * Установка текущего представления
   */
  setCurrentView(view: string): void {
    this.state.currentView = view;
    this.saveSettings();
  }

  /**
   * Установка темы
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.state.theme = theme;
    this.saveSettings();
  }

  /**
   * Переключение темы
   */
  toggleTheme(): void {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  /**
   * Сброс всех данных
   */
  reset(): void {
    console.log('🔄 Сброс состояния приложения');
    
    ['gymhelper_theme', 'gymhelper_current_view', 'gymhelper_token', 'gymhelper_active_workout']
      .forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Ошибка удаления ${key}:`, e);
        }
      });
    
    this.state.currentView = 'home';
    this.state.theme = 'auto';
    this.state.lastActivity = new Date();
    
    this.exercises.clearCache();
    this.workouts.clearCache();
    this.invitations.clearCache();
    
    console.log('✅ Сброс завершен');
  }
}

export default AppStore;