/**
 * VK API сервис для интеграции с VK API v5.199
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import bridge from '@vkontakte/vk-bridge';
import { 
  VKUserInfo, 
  VKFriendsGetResponse, 
  VKFriendsGetParams,
  VKNotificationsSendParams,
  VKNotificationsSendResponse,
  VKMessagesSendParams,
  VKApiResponse,
  VKErrorInfo,
  VK_API_VERSION,
  VKMiniAppGetLaunchParamsResponse,
  VKStorageGetResponse,
  VKGeolocationData
} from '../types/vk';

interface VKApiCallOptions {
  timeout?: number;
  retries?: number;
}

class VKApiService {
  private initialized: boolean = false;
  private userInfo: VKUserInfo | null = null;
  private launchParams: VKMiniAppGetLaunchParamsResponse | null = null;
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.init();
  }

  /**
   * Инициализация VK Bridge
   */
  private async init(): Promise<void> {
    try {
      if (this.initialized) return;

      // Инициализация VK Bridge
      await bridge.send('VKWebAppInit');
      
      // Получение параметров запуска
      this.launchParams = await bridge.send('VKWebAppGetLaunchParams');
      
      // Подписка на события
      bridge.subscribe(this.handleBridgeEvent.bind(this));
      
      this.initialized = true;
      console.log('VK API Service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize VK API Service:', error);
      throw error;
    }
  }

  /**
   * Обработчик событий VK Bridge
   */
  private handleBridgeEvent(event: any): void {
    try {
      const { type, data } = event;
      
      // Эмитим события для подписчиков
      const eventSubscribers = this.subscribers.get(type);
      if (eventSubscribers) {
        eventSubscribers.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in VK event subscriber for ${type}:`, error);
          }
        });
      }

      // Обработка специфичных событий
      switch (type) {
        case 'VKWebAppUpdateConfig':
          console.log('VK App config updated:', data);
          break;
          
        case 'VKWebAppViewHide':
          console.log('VK App view hidden');
          break;
          
        case 'VKWebAppViewRestore':
          console.log('VK App view restored');
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling VK Bridge event:', error);
    }
  }

  /**
   * Подписка на события VK Bridge
   */
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      const eventSubscribers = this.subscribers.get(eventType);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Выполнение VK API вызова
   */
  private async callApi<T = any>(
    method: string, 
    params: Record<string, any> = {},
    options: VKApiCallOptions = {}
  ): Promise<T> {
    await this.ensureInitialized();
    
    const { timeout = 10000, retries = 3 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response: VKApiResponse<T> = await Promise.race([
          bridge.send('VKWebAppCallAPIMethod', {
            method,
            params: {
              access_token: (this.launchParams as any)?.vk_access_token || '',
              v: VK_API_VERSION,
              ...params
            }
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        if (response.error) {
          throw this.createApiError(response.error);
        }

        return response.response;
        
      } catch (error: any) {
        console.error(`VK API call failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Экспоненциальная задержка между попытками
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Создание объекта ошибки API
   */
  private createApiError(error: VKErrorInfo): Error {
    const errorMessage = `VK API Error ${error.error_code}: ${error.error_msg}`;
    const apiError = new Error(errorMessage);
    (apiError as any).code = error.error_code;
    (apiError as any).details = error;
    return apiError;
  }

  /**
   * Утилита для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверка инициализации
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Получение информации о текущем пользователе
   */
  async getCurrentUser(): Promise<VKUserInfo> {
    if (this.userInfo) {
      return this.userInfo;
    }

    try {
      const users = await this.callApi<VKUserInfo[]>('users.get', {
        fields: 'photo_50,photo_100,photo_200_orig,city,online,last_seen,can_write_private_message'
      });

      if (users && users.length > 0) {
        this.userInfo = users[0];
        return this.userInfo;
      }

      throw new Error('User info not found');
      
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Получение списка друзей
   */
  async getFriends(params: VKFriendsGetParams = {}): Promise<VKFriendsGetResponse> {
    try {
      const defaultParams: VKFriendsGetParams = {
        order: 'name',
        fields: 'photo_50,photo_100,city,online,last_seen,can_write_private_message',
        count: 200,
        ...params
      };

      const response = await this.callApi<VKFriendsGetResponse>('friends.get', defaultParams);
      return response;
      
    } catch (error) {
      console.error('Failed to get friends:', error);
      throw error;
    }
  }

  /**
   * Поиск друзей по имени
   */
  async searchFriends(query: string, limit: number = 20): Promise<VKUserInfo[]> {
    try {
      const friends = await this.getFriends({ count: 1000 });
      
      const filteredFriends = friends.items
        .filter(friend => {
          const fullName = `${friend.first_name} ${friend.last_name}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        })
        .slice(0, limit);

      return filteredFriends;
      
    } catch (error) {
      console.error('Failed to search friends:', error);
      throw error;
    }
  }

  /**
   * Получение информации о пользователях по ID
   */
  async getUsers(userIds: number[], fields?: string): Promise<VKUserInfo[]> {
    try {
      const response = await this.callApi<VKUserInfo[]>('users.get', {
        user_ids: userIds.join(','),
        fields: fields || 'photo_50,photo_100,city,online,last_seen'
      });

      return response;
      
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Отправка уведомления через VK
   */
  async sendNotification(params: VKNotificationsSendParams): Promise<VKNotificationsSendResponse[]> {
    try {
      const response = await this.callApi<VKNotificationsSendResponse[]>(
        'notifications.sendMessage',
        params
      );

      return response;
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Отправка приглашения на тренировку через уведомления
   */
  async sendWorkoutInvitation(
    userIds: number[], 
    workoutTitle: string, 
    workoutDate: string,
    inviterName: string
  ): Promise<boolean> {
    try {
      const message = `${inviterName} приглашает вас на тренировку "${workoutTitle}" ${workoutDate}`;
      
      const result = await this.sendNotification({
        user_ids: userIds,
        message,
        fragment: 'workout_invitation',
        send_immediately: true
      });

      // Проверяем, что хотя бы одно уведомление отправлено успешно
      return result.some(r => r.status);
      
    } catch (error) {
      console.error('Failed to send workout invitation:', error);
      return false;
    }
  }

  /**
   * Отправка сообщения пользователю (если доступно)
   */
  async sendMessage(params: VKMessagesSendParams): Promise<number> {
    try {
      const response = await this.callApi<number>('messages.send', {
        ...params,
        random_id: Date.now()
      });

      return response;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Проверка возможности отправки сообщения пользователю
   */
  async canSendMessage(userId: number): Promise<boolean> {
    try {
      const users = await this.getUsers([userId], 'can_write_private_message');
      return users.length > 0 && users[0].can_write_private_message === 1;
      
    } catch (error) {
      console.error('Failed to check message permission:', error);
      return false;
    }
  }

  /**
   * Показ стены пользователя
   */
  async showWall(ownerId: number): Promise<void> {
    try {
      await bridge.send('VKWebAppShowWallPostBox', {
        owner_id: ownerId,
        message: '',
        upload_attachments: []
      });
    } catch (error) {
      console.error('Failed to show wall:', error);
      throw error;
    }
  }

  /**
   * Показ профиля пользователя
   */
  async showUserProfile(_userId: number): Promise<void> {
    try {
      // VK Bridge не предоставляет прямого метода для показа профиля
      // Можно использовать VKWebAppOpenApp или другие методы
      console.log('Show user profile functionality not directly available in VK Bridge');
    } catch (error) {
      console.error('Failed to show user profile:', error);
      throw error;
    }
  }

  /**
   * Запрос разрешений
   */
  async requestPermissions(permissions: string[]): Promise<string[]> {
    try {
      const response = await bridge.send('VKWebAppGetAuthToken', {
        app_id: this.launchParams?.vk_app_id || 0,
        scope: permissions.join(',')
      });

      return response.scope.split(',');
      
    } catch (error) {
      console.error('Failed to request permissions:', error);
      throw error;
    }
  }

  /**
   * Работа с хранилищем VK
   */
  async storageSet(key: string, value: string): Promise<void> {
    try {
      await bridge.send('VKWebAppStorageSet', {
        key,
        value
      });
    } catch (error) {
      console.error('Failed to set storage value:', error);
      throw error;
    }
  }

  async storageGet(keys: string[]): Promise<VKStorageGetResponse> {
    try {
      const response = await bridge.send('VKWebAppStorageGet', {
        keys
      });
      return response;
    } catch (error) {
      console.error('Failed to get storage values:', error);
      throw error;
    }
  }

  /**
   * Получение геолокации
   */
  async getGeoLocation(): Promise<VKGeolocationData> {
    try {
      const response = await bridge.send('VKWebAppGetGeodata');
      return response as VKGeolocationData;
    } catch (error) {
      console.error('Failed to get geolocation:', error);
      throw error;
    }
  }

  /**
   * Вибрация устройства
   */
  async vibrate(type: 'heavy' | 'light' | 'medium' = 'medium'): Promise<void> {
    try {
      await bridge.send('VKWebAppTapticImpactOccurred', { style: type });
    } catch (error) {
      console.error('Failed to vibrate:', error);
      // Не выбрасываем ошибку, так как вибрация не критична
    }
  }

  /**
   * Добавление в избранное
   */
  async addToFavorites(): Promise<void> {
    try {
      await bridge.send('VKWebAppAddToFavorites');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  }

  /**
   * Поделиться ссылкой
   */
  async share(link?: string): Promise<void> {
    try {
      await bridge.send('VKWebAppShare', {
        link: link || window.location.href
      });
    } catch (error) {
      console.error('Failed to share:', error);
      throw error;
    }
  }

  /**
   * Получение параметров запуска
   */
  getLaunchParams(): VKMiniAppGetLaunchParamsResponse | null {
    return this.launchParams;
  }

  /**
   * Получение информации о пользователе из параметров запуска
   */
  getUserId(): number | null {
    return this.launchParams?.vk_user_id || null;
  }

  /**
   * Получение ID приложения
   */
  getAppId(): number | null {
    return this.launchParams?.vk_app_id || null;
  }

  /**
   * Проверка, является ли пользователь пользователем приложения
   */
  isAppUser(): boolean {
    return this.launchParams?.vk_is_app_user === 1;
  }

  /**
   * Проверка, включены ли уведомления
   */
  areNotificationsEnabled(): boolean {
    return this.launchParams?.vk_are_notifications_enabled === 1;
  }

  /**
   * Получение языка пользователя
   */
  getUserLanguage(): string {
    return this.launchParams?.vk_language || 'ru';
  }

  /**
   * Получение платформы
   */
  getPlatform(): string {
    return this.launchParams?.vk_platform || 'unknown';
  }

  /**
   * Очистка кэша
   */
  clearCache(): void {
    this.userInfo = null;
  }

  /**
   * Получение статуса инициализации
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Создание singleton instance
const vkApiService = new VKApiService();

export default vkApiService;
export { VKApiService };