/**
 * Базовый HTTP клиент для API запросов
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { ApiResponse, ApiError, ApiRequestConfig, HttpMethod } from '../types/api';

interface RequestConfig extends ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
}

interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: number;
}

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: any) => any>;
    error: Array<(error: any) => any>;
  };

  constructor(baseURL: string = '') {
    this.baseURL = baseURL || import.meta.env.VITE_API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.defaultTimeout = 30000; // 30 секунд
    this.defaultRetries = 3;
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };

    this.setupDefaultInterceptors();
  }

  /**
   * Настройка базовых interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request interceptor для добавления токенов
    this.addRequestInterceptor((config) => {
      const token = this.getAuthToken();
      if (token && config.authRequired !== false) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });

    // Response interceptor для обработки ошибок авторизации
    this.addResponseInterceptor((response) => {
      return response;
    });

    // Error interceptor для логирования и обработки
    this.addErrorInterceptor((error) => {
      console.error('API Error:', error);
      
      // Автоматическое обновление токена при 401
      if (error.status === 401) {
        this.handleUnauthorized();
      }
      
      return Promise.reject(error);
    });
  }

  /**
   * Получение токена авторизации
   */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Обработка неавторизованного доступа
   */
  private handleUnauthorized(): void {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      // Здесь можно добавить редирект на страницу авторизации
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.error('Error handling unauthorized access:', error);
    }
  }

  /**
   * Добавление request interceptor
   */
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ): void {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Добавление response interceptor
   */
  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Добавление error interceptor
   */
  addErrorInterceptor(interceptor: (error: any) => any): void {
    this.interceptors.error.push(interceptor);
  }

  /**
   * Применение request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  /**
   * Применение response interceptors
   */
  private applyResponseInterceptors(response: any): any {
    let processedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      processedResponse = interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Применение error interceptors
   */
  private async applyErrorInterceptors(error: any): Promise<any> {
    let processedError = error;
    
    for (const interceptor of this.interceptors.error) {
      processedError = await interceptor(processedError);
    }
    
    return processedError;
  }

  /**
   * Построение URL с параметрами
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullURL;
    }

    const urlObj = new URL(fullURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }

  /**
   * Retry логика для запросов
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retryConfig: RetryConfig
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        // Не повторяем запросы при клиентских ошибках (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (attempt === retryConfig.attempts) {
          throw error;
        }
        
        // Экспоненциальная задержка
        const delay = retryConfig.delay * Math.pow(retryConfig.backoff, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Утилита для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Основной метод для выполнения запросов
   */
  private async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // Применяем request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Настройка параметров запроса
      const url = this.buildURL(processedConfig.url, processedConfig.params);
      const headers = {
        ...this.defaultHeaders,
        ...processedConfig.headers
      };
      
      const timeout = processedConfig.timeout || this.defaultTimeout;
      const retries = processedConfig.retries || this.defaultRetries;

      // Создание AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Retry конфигурация
      const retryConfig: RetryConfig = {
        attempts: retries,
        delay: 1000,
        backoff: 2
      };

      // Выполнение запроса с retry логикой
      const response = await this.retryRequest(async () => {
        const fetchConfig: RequestInit = {
          method: processedConfig.method,
          headers,
          signal: controller.signal
        };

        if (processedConfig.data && processedConfig.method !== 'GET') {
          fetchConfig.body = JSON.stringify(processedConfig.data);
        }

        const response = await fetch(url, fetchConfig);
        
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw errorData;
        }

        return response;
      }, retryConfig);

      clearTimeout(timeoutId);

      // Парсинг ответа
      const data = await this.parseResponse<T>(response);
      
      // Применяем response interceptors
      const processedData = this.applyResponseInterceptors(data);
      
      return processedData;
      
    } catch (error: any) {
      // Применяем error interceptors
      const processedError = await this.applyErrorInterceptors(error);
      throw processedError;
    }
  }

  /**
   * Парсинг успешного ответа
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }
    
    // Если не JSON, возвращаем как текст
    const text = await response.text();
    return {
      success: true,
      data: text as any
    };
  }

  /**
   * Парсинг ошибки
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    const contentType = response.headers.get('content-type');
    let errorData: any = {};
    
    if (contentType && contentType.includes('application/json')) {
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
    } else {
      const text = await response.text();
      errorData = { message: text || response.statusText };
    }

    return {
      code: String(response.status),
      message: errorData.message || response.statusText,
      details: errorData,
      timestamp: new Date().toISOString(),
      ...errorData
    };
  }

  /**
   * GET запрос
   */
  async get<T = any>(
    url: string, 
    params?: Record<string, any>, 
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config
    });
  }

  /**
   * POST запрос
   */
  async post<T = any>(
    url: string, 
    data?: any, 
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * PUT запрос
   */
  async put<T = any>(
    url: string, 
    data?: any, 
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * PATCH запрос
   */
  async patch<T = any>(
    url: string, 
    data?: any, 
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T = any>(
    url: string, 
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }

  /**
   * Установка базового URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * Установка заголовков по умолчанию
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Установка токена авторизации
   */
  setAuthToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token);
      this.setDefaultHeaders({ 'Authorization': `Bearer ${token}` });
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  /**
   * Удаление токена авторизации
   */
  removeAuthToken(): void {
    try {
      localStorage.removeItem('auth_token');
      const { Authorization, ...restHeaders } = this.defaultHeaders;
      this.defaultHeaders = restHeaders;
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }
}

// Создание singleton instance
const httpClient = new HttpClient();

export default httpClient;
export { HttpClient };
