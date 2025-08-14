/**
 * Store для управления аутентификацией пользователя
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { VKBridge } from '@vkontakte/vk-bridge';
import apiClient from '../../api/client';
import vkApiService from '../../services/vkApiService';
import { handleError } from '../../utils/error-handler';
import { 
  ApiResponse, 
  AuthTokens,
  AuthCredentials,
  RefreshTokenRequest 
} from '../../types/api';
import { VKUserInfo } from '../../types/vk';
import { User } from '../../types/domain';

export interface AuthState {
  user: User | null;
  token: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  vkUserInfo: VKUserInfo | null;
  loginAttempts: number;
  lastLoginAttempt: Date | null;
}

class AuthStore {
  private tokenRefreshTimer: number | null = null;
  private readonly maxLoginAttempts = 3;
  private readonly tokenRefreshBuffer = 5 * 60 * 1000; // 5 минут до истечения

  state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    vkUserInfo: null,
    loginAttempts: 0,
    lastLoginAttempt: null
  };

  constructor(_bridge: VKBridge) {
    makeAutoObservable(this);
    // bridge сохраняется неявно в vkApiService
    this.initializeAuth();
  }

  /**
   * Геттеры для удобства
   */
  get user() { return this.state.user; }
  get token() { return this.state.token; }
  get isAuthenticated() { return this.state.isAuthenticated; }
  get isLoading() { return this.state.isLoading; }
  get error() { return this.state.error; }
  get vkUserInfo() { return this.state.vkUserInfo; }
  get canRetryLogin() {
    return this.state.loginAttempts < this.maxLoginAttempts;
  }

  /**
   * Инициализация аутентификации при запуске
   */
  private async initializeAuth() {
    try {
      this.setLoading(true);
      
      // Проверяем сохраненный токен
      const savedToken = this.loadTokenFromStorage();
      if (savedToken && this.isTokenValid(savedToken)) {
        await this.authenticateWithToken(savedToken);
        return;
      }

      // Пытаемся получить информацию о пользователе VK
      const vkUser = await vkApiService.getCurrentUser();
      if (vkUser) {
        runInAction(() => {
          this.state.vkUserInfo = vkUser;
        });
        
        // Пытаемся войти через VK
        await this.loginWithVK();
      }
    } catch (error) {
      this.handleAuthError(error, 'Ошибка инициализации аутентификации');
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Вход через VK
   */
  async loginWithVK(): Promise<void> {
    if (!this.canRetryLogin) {
      throw new Error('Превышено количество попыток входа');
    }

    try {
      this.setLoading(true);
      this.clearError();
      
      runInAction(() => {
        this.state.loginAttempts++;
        this.state.lastLoginAttempt = new Date();
      });

      // Получаем информацию о пользователе VK
      const vkUser = await vkApiService.getCurrentUser();
      if (!vkUser) {
        throw new Error('Не удалось получить информацию о пользователе VK');
      }

      runInAction(() => {
        this.state.vkUserInfo = vkUser;
      });

      // Отправляем данные VK на бэкенд для аутентификации
      const credentials: AuthCredentials = {
        vkUserId: vkUser.id,
        vkAccessToken: '', // Здесь должен быть VK access token
        firstName: vkUser.first_name,
        lastName: vkUser.last_name,
        photo: vkUser.photo_200
      };

      const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/vk-login', credentials);
      
      if (response.data.success && response.data.data) {
        await this.setAuthenticationData(response.data.data, vkUser);
        
        // Отправляем уведомление об успешном входе
        await vkApiService.sendNotification({
          user_ids: [vkUser.id],
          message: 'Добро пожаловать в GymHelper!',
          fragment: 'home'
        });
      } else {
        throw new Error(response.data.message || 'Ошибка аутентификации');
      }
    } catch (error) {
      this.handleAuthError(error, 'Ошибка входа через VK');
      throw error;
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Обновление токена доступа
   */
  async refreshToken(): Promise<void> {
    if (!this.state.token?.refreshToken) {
      throw new Error('Отсутствует refresh token');
    }

    try {
      const request: RefreshTokenRequest = {
        refreshToken: this.state.token.refreshToken
      };

      const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', request);
      
      if (response.data.success && response.data.data) {
        await this.updateToken(response.data.data);
      } else {
        throw new Error(response.data.message || 'Ошибка обновления токена');
      }
    } catch (error) {
      this.handleAuthError(error, 'Ошибка обновления токена');
      await this.logout();
      throw error;
    }
  }

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      this.setLoading(true);
      
      // Отзываем токен на сервере
      if (this.state.token?.accessToken) {
        try {
          await apiClient.post('/auth/logout', {});
        } catch (error) {
          // Игнорируем ошибки при выходе
          console.warn('Ошибка при выходе на сервере:', error);
        }
      }

      // Очищаем локальные данные
      this.clearAuthenticationData();
      
      // Отправляем уведомление VK
      if (this.state.vkUserInfo) {
        try {
          await vkApiService.sendNotification({
            user_ids: [this.state.vkUserInfo.id],
            message: 'Вы вышли из GymHelper',
            fragment: 'login'
          });
        } catch (error) {
          console.warn('Ошибка отправки уведомления о выходе:', error);
        }
      }
    } catch (error) {
      this.handleAuthError(error, 'Ошибка при выходе');
    } finally {
      runInAction(() => {
        this.state.isLoading = false;
      });
    }
  }

  /**
   * Проверка действительности токена
   */
  private isTokenValid(token: AuthTokens): boolean {
    if (!token.accessToken || !token.expiresAt) {
      return false;
    }

    const expirationTime = new Date(token.expiresAt).getTime();
    const currentTime = Date.now();
    
    return expirationTime > currentTime + this.tokenRefreshBuffer;
  }

  /**
   * Аутентификация с использованием сохраненного токена
   */
  private async authenticateWithToken(token: AuthTokens): Promise<void> {
    try {
      // Устанавливаем токен в HTTP клиент
      apiClient.setAuthToken(token.accessToken);
      
      // Получаем информацию о пользователе
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      
      if (response.data.success && response.data.data) {
        runInAction(() => {
          this.state.user = response.data.data!;
          this.state.token = token;
          this.state.isAuthenticated = true;
        });
        
        this.setupTokenRefresh(token);
      } else {
        throw new Error('Недействительный токен');
      }
    } catch (error) {
      this.clearAuthenticationData();
      throw error;
    }
  }

  /**
   * Установка данных аутентификации
   */
  private async setAuthenticationData(token: AuthTokens, vkUser: VKUserInfo): Promise<void> {
    // Получаем полную информацию о пользователе
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Не удалось получить данные пользователя');
    }

    runInAction(() => {
      this.state.user = response.data.data!;
      this.state.token = token;
      this.state.isAuthenticated = true;
      this.state.vkUserInfo = vkUser;
      this.state.loginAttempts = 0;
      this.state.error = null;
    });

    // Устанавливаем токен в HTTP клиент
    apiClient.setAuthToken(token.accessToken);
    
    // Сохраняем токен в локальном хранилище
    this.saveTokenToStorage(token);
    
    // Настраиваем автоматическое обновление токена
    this.setupTokenRefresh(token);
  }

  /**
   * Обновление токена
   */
  private async updateToken(token: AuthTokens): Promise<void> {
    runInAction(() => {
      this.state.token = token;
    });

    apiClient.setAuthToken(token.accessToken);
    this.saveTokenToStorage(token);
    this.setupTokenRefresh(token);
  }

  /**
   * Настройка автоматического обновления токена
   */
  private setupTokenRefresh(token: AuthTokens): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!token.expiresAt) return;

    const expirationTime = new Date(token.expiresAt).getTime();
    const refreshTime = expirationTime - Date.now() - this.tokenRefreshBuffer;

    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Ошибка автоматического обновления токена:', error);
        }
      }, refreshTime);
    }
  }

  /**
   * Очистка данных аутентификации
   */
  private clearAuthenticationData(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    runInAction(() => {
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
      this.state.vkUserInfo = null;
      this.state.error = null;
    });

    apiClient.removeAuthToken();
    this.removeTokenFromStorage();
  }

  /**
   * Сохранение токена в локальном хранилище
   */
  private saveTokenToStorage(token: AuthTokens): void {
    try {
      localStorage.setItem('gymhelper_token', JSON.stringify(token));
    } catch (error) {
      console.warn('Ошибка сохранения токена:', error);
    }
  }

  /**
   * Загрузка токена из локального хранилища
   */
  private loadTokenFromStorage(): AuthTokens | null {
    try {
      const tokenStr = localStorage.getItem('gymhelper_token');
      if (tokenStr) {
        return JSON.parse(tokenStr) as AuthTokens;
      }
    } catch (error) {
      console.warn('Ошибка загрузки токена:', error);
    }
    return null;
  }

  /**
   * Удаление токена из локального хранилища
   */
  private removeTokenFromStorage(): void {
    try {
      localStorage.removeItem('gymhelper_token');
    } catch (error) {
      console.warn('Ошибка удаления токена:', error);
    }
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
   * Очистка ошибки
   */
  private clearError(): void {
    runInAction(() => {
      this.state.error = null;
    });
  }

  /**
   * Обработка ошибок аутентификации
   */
  private handleAuthError(error: any, defaultMessage: string): void {
    const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
    
    runInAction(() => {
      this.state.error = errorMessage;
    });

    handleError(error, {
      component: 'AuthStore',
      action: defaultMessage,
      userId: this.state.vkUserInfo?.id?.toString(),
      additionalData: { 
        defaultMessage,
        loginAttempts: this.state.loginAttempts,
        hasVkUserInfo: !!this.state.vkUserInfo
      }
    });
  }

  /**
   * Сброс попыток входа (для тестирования)
   */
  resetLoginAttempts(): void {
    runInAction(() => {
      this.state.loginAttempts = 0;
      this.state.lastLoginAttempt = null;
    });
  }
}

export default AuthStore;
