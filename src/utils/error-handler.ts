/**
 * Централизованная система обработки ошибок
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { ApiError } from '../types/api';
import vkApiService from '../services/vkApiService';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorHandlerConfig {
  showUserMessage: boolean;
  logToConsole: boolean;
  logToVK: boolean;
  sendTelemetry: boolean;
  vibrate: boolean;
}

export type ErrorType = 
  | 'network'
  | 'api'
  | 'vk_api'
  | 'validation'
  | 'permission'
  | 'storage'
  | 'unknown';

export interface ProcessedError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  context?: ErrorContext;
  originalError: any;
  timestamp: Date;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorSubscribers: Set<(error: ProcessedError) => void> = new Set();
  private errorHistory: ProcessedError[] = [];
  private readonly maxHistorySize = 100;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Настройка глобальных обработчиков ошибок
   */
  private setupGlobalErrorHandlers(): void {
    // Обработка необработанных ошибок
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        component: 'global',
        action: 'unhandled_error'
      });
    });

    // Обработка необработанных Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        component: 'global',
        action: 'unhandled_promise_rejection'
      });
    });

    // Обработка VK Bridge ошибок
    if (typeof window !== 'undefined' && vkApiService) {
      vkApiService.subscribe('VKWebAppUpdateConfig', (data: any) => {
        if (data.error) {
          this.handleError(data.error, {
            component: 'vk_bridge',
            action: 'config_update_error'
          });
        }
      });
    }
  }

  /**
   * Основной метод обработки ошибок
   */
  handleError(
    error: any, 
    context?: ErrorContext, 
    config?: Partial<ErrorHandlerConfig>
  ): ProcessedError {
    const processedError = this.processError(error, context);
    
    const defaultConfig: ErrorHandlerConfig = {
      showUserMessage: true,
      logToConsole: true,
      logToVK: false,
      sendTelemetry: false,
      vibrate: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Логирование в консоль
    if (finalConfig.logToConsole) {
      this.logToConsole(processedError);
    }

    // Сохранение в историю
    this.addToHistory(processedError);

    // Уведомление подписчиков
    this.notifySubscribers(processedError);

    // Показ сообщения пользователю
    if (finalConfig.showUserMessage) {
      this.showUserMessage(processedError);
    }

    // Вибрация для критических ошибок
    if (finalConfig.vibrate && processedError.severity === 'critical') {
      this.vibrateDevice();
    }

    // Логирование в VK (если разрешено и настроено)
    if (finalConfig.logToVK) {
      this.logToVK(processedError);
    }

    // Отправка телеметрии (если разрешено)
    if (finalConfig.sendTelemetry) {
      this.sendTelemetry(processedError);
    }

    return processedError;
  }

  /**
   * Обработка и категоризация ошибки
   */
  private processError(error: any, context?: ErrorContext): ProcessedError {
    const timestamp = new Date();
    let type: ErrorType = 'unknown';
    let code = 'UNKNOWN_ERROR';
    let message = 'Произошла неизвестная ошибка';
    let userMessage = 'Что-то пошло не так. Попробуйте еще раз.';
    let severity: ProcessedError['severity'] = 'medium';
    let recoverable = true;

    // Определение типа ошибки и подготовка сообщений
    if (this.isNetworkError(error)) {
      type = 'network';
      code = 'NETWORK_ERROR';
      message = 'Ошибка сети';
      userMessage = 'Проверьте подключение к интернету и попробуйте снова';
      severity = 'high';
      recoverable = true;
    } else if (this.isApiError(error)) {
      type = 'api';
      const apiError = error as ApiError;
      code = apiError.code;
      message = apiError.message;
      userMessage = this.getApiErrorUserMessage(apiError);
      severity = this.getApiErrorSeverity(apiError);
      recoverable = this.isApiErrorRecoverable(apiError);
    } else if (this.isVKApiError(error)) {
      type = 'vk_api';
      code = `VK_${error.code || 'UNKNOWN'}`;
      message = error.message || 'Ошибка VK API';
      userMessage = this.getVKApiErrorUserMessage(error);
      severity = this.getVKApiErrorSeverity(error);
      recoverable = this.isVKApiErrorRecoverable(error);
    } else if (this.isValidationError(error)) {
      type = 'validation';
      code = 'VALIDATION_ERROR';
      message = error.message || 'Ошибка валидации';
      userMessage = 'Проверьте правильность введенных данных';
      severity = 'low';
      recoverable = true;
    } else if (this.isPermissionError(error)) {
      type = 'permission';
      code = 'PERMISSION_DENIED';
      message = error.message || 'Недостаточно прав';
      userMessage = 'У вас недостаточно прав для выполнения этого действия';
      severity = 'medium';
      recoverable = false;
    } else if (this.isStorageError(error)) {
      type = 'storage';
      code = 'STORAGE_ERROR';
      message = 'Ошибка локального хранилища';
      userMessage = 'Проблема с сохранением данных. Попробуйте обновить страницу';
      severity = 'high';
      recoverable = true;
    } else {
      // Общая обработка для неизвестных ошибок
      if (error instanceof Error) {
        message = error.message;
        if (error.name === 'TypeError') {
          userMessage = 'Техническая ошибка. Обновите страницу';
          severity = 'high';
        }
      } else if (typeof error === 'string') {
        message = error;
      }
    }

    return {
      type,
      code,
      message,
      userMessage,
      severity,
      recoverable,
      context,
      originalError: error,
      timestamp
    };
  }

  /**
   * Проверки типов ошибок
   */
  private isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message.includes('fetch') ||
           error.name === 'NetworkError' ||
           error.code === 'NETWORK_ERROR' ||
           (error.message && error.message.includes('network'));
  }

  private isApiError(error: any): boolean {
    return error && typeof error === 'object' && 
           ('code' in error || 'status' in error) &&
           'message' in error &&
           'timestamp' in error;
  }

  private isVKApiError(error: any): boolean {
    return error && typeof error === 'object' &&
           'error_code' in error ||
           (error.code && typeof error.code === 'number' && error.code > 0);
  }

  private isValidationError(error: any): boolean {
    return error && (
      error.name === 'ValidationError' ||
      error.type === 'validation' ||
      (error.message && error.message.includes('validation'))
    );
  }

  private isPermissionError(error: any): boolean {
    return error && (
      error.name === 'PermissionError' ||
      error.code === 'PERMISSION_DENIED' ||
      (error.status >= 401 && error.status <= 403)
    );
  }

  private isStorageError(error: any): boolean {
    return error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'StorageError' ||
      (error.message && error.message.includes('storage'))
    );
  }

  /**
   * Получение пользовательского сообщения для API ошибок
   */
  private getApiErrorUserMessage(error: ApiError): string {
    const statusCode = parseInt(error.code);
    
    switch (statusCode) {
      case 400:
        return 'Неверные данные запроса';
      case 401:
        return 'Необходимо войти в систему';
      case 403:
        return 'Доступ запрещен';
      case 404:
        return 'Запрашиваемые данные не найдены';
      case 409:
        return 'Конфликт данных. Попробуйте обновить страницу';
      case 422:
        return 'Некорректные данные';
      case 429:
        return 'Слишком много запросов. Подождите немного';
      case 500:
        return 'Ошибка сервера. Попробуйте позже';
      case 502:
      case 503:
      case 504:
        return 'Сервер временно недоступен';
      default:
        return error.message || 'Произошла ошибка при обращении к серверу';
    }
  }

  /**
   * Получение серьезности API ошибки
   */
  private getApiErrorSeverity(error: ApiError): ProcessedError['severity'] {
    const statusCode = parseInt(error.code);
    
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400 && statusCode < 500) return 'medium';
    return 'low';
  }

  /**
   * Проверка восстановимости API ошибки
   */
  private isApiErrorRecoverable(error: ApiError): boolean {
    const statusCode = parseInt(error.code);
    
    // Серверные ошибки обычно временные
    if (statusCode >= 500) return true;
    
    // Ошибки аутентификации и авторизации
    if (statusCode === 401 || statusCode === 403) return false;
    
    // Ошибки "не найдено"
    if (statusCode === 404) return false;
    
    // Остальные клиентские ошибки могут быть исправлены
    return true;
  }

  /**
   * Обработка VK API ошибок
   */
  private getVKApiErrorUserMessage(error: any): string {
    const errorCode = error.error_code || error.code;
    
    switch (errorCode) {
      case 5:
        return 'Ошибка авторизации в VK';
      case 6:
        return 'Слишком много запросов к VK. Подождите немного';
      case 7:
        return 'Недостаточно прав для выполнения действия в VK';
      case 10:
        return 'Внутренняя ошибка VK. Попробуйте позже';
      case 15:
        return 'Доступ запрещен VK';
      case 18:
        return 'Пользователь заблокирован или удален';
      case 113:
        return 'Пользователь не найден в VK';
      default:
        return error.error_msg || error.message || 'Ошибка при работе с VK';
    }
  }

  private getVKApiErrorSeverity(error: any): ProcessedError['severity'] {
    const errorCode = error.error_code || error.code;
    
    if ([5, 10, 18].includes(errorCode)) return 'critical';
    if ([6, 7, 15].includes(errorCode)) return 'high';
    return 'medium';
  }

  private isVKApiErrorRecoverable(error: any): boolean {
    const errorCode = error.error_code || error.code;
    
    // Временные ошибки
    if ([6, 10].includes(errorCode)) return true;
    
    // Ошибки авторизации и прав
    if ([5, 7, 15, 18].includes(errorCode)) return false;
    
    return true;
  }

  /**
   * Методы вывода и логирования
   */
  private logToConsole(error: ProcessedError): void {
    const logLevel = error.severity === 'critical' ? 'error' : 
                    error.severity === 'high' ? 'warn' : 'log';
    
    console[logLevel]('🚨 Error Handler:', {
      type: error.type,
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      originalError: error.originalError
    });
  }

  private showUserMessage(error: ProcessedError): void {
    // Здесь можно интегрировать с системой уведомлений VKUI
    // Пока используем простой alert для критических ошибок
    if (error.severity === 'critical') {
      alert(error.userMessage);
    } else {
      // Для некритических ошибок можно использовать toast или снэкбар
      console.info('User message:', error.userMessage);
    }
  }

  private async vibrateDevice(): Promise<void> {
    try {
      await vkApiService.vibrate('heavy');
    } catch {
      // Игнорируем ошибки вибрации
    }
  }

  private logToVK(error: ProcessedError): void {
    // Здесь можно отправлять логи в VK или внешний сервис
    console.log('VK logging:', error);
  }

  private sendTelemetry(error: ProcessedError): void {
    // Здесь можно отправлять телеметрию
    console.log('Telemetry:', error);
  }

  /**
   * Управление подписчиками и историей
   */
  subscribe(callback: (error: ProcessedError) => void): () => void {
    this.errorSubscribers.add(callback);
    
    return () => {
      this.errorSubscribers.delete(callback);
    };
  }

  private notifySubscribers(error: ProcessedError): void {
    this.errorSubscribers.forEach(callback => {
      try {
        callback(error);
      } catch (subscriberError) {
        console.error('Error in error subscriber:', subscriberError);
      }
    });
  }

  private addToHistory(error: ProcessedError): void {
    this.errorHistory.unshift(error);
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Публичные методы для получения информации
   */
  getErrorHistory(): ProcessedError[] {
    return [...this.errorHistory];
  }

  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<string, number>;
    recent: ProcessedError[];
  } {
    const byType: Record<ErrorType, number> = {
      network: 0,
      api: 0,
      vk_api: 0,
      validation: 0,
      permission: 0,
      storage: 0,
      unknown: 0
    };

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    this.errorHistory.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recent: this.errorHistory.slice(0, 5)
    };
  }

  clearHistory(): void {
    this.errorHistory = [];
  }
}

// Создание singleton instance
const errorHandler = ErrorHandler.getInstance();

// Утилитарные функции для удобства использования
export const handleError = (error: any, context?: ErrorContext, config?: Partial<ErrorHandlerConfig>) => {
  return errorHandler.handleError(error, context, config);
};

export const subscribeToErrors = (callback: (error: ProcessedError) => void) => {
  return errorHandler.subscribe(callback);
};

export const getErrorHistory = () => {
  return errorHandler.getErrorHistory();
};

export const getErrorStats = () => {
  return errorHandler.getErrorStats();
};

export default errorHandler;
