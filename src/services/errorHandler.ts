import type { ErrorCode } from '../types';

/**
 * Custom error class with additional metadata
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error handler for consistent error management
 */
export class ErrorHandler {
  /**
   * Create a standardized error
   */
  static createError(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    details?: any
  ): AppError {
    return new AppError(code, message, statusCode, details);
  }

  /**
   * Handle and categorize errors
   */
  static handleError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return this.createError('NETWORK_ERROR', 'Network connection failed');
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return this.createError('VALIDATION_ERROR', error.message, 400, error.details);
    }

    // Default unknown error
    return this.createError('UNKNOWN_ERROR', error.message || 'An unknown error occurred');
  }

  /**
   * Log error for debugging
   */
  static logError(error: AppError | Error): void {
    if (error instanceof AppError) {
      console.error(`[${error.code}] ${error.message}`, {
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack
      });
    } else {
      console.error('Unhandled error:', error);
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    const userMessages: Record<ErrorCode, string> = {
      VALIDATION_ERROR: 'Пожалуйста, проверьте введенные данные',
      AUTHENTICATION_ERROR: 'Ошибка аутентификации. Войдите заново',
      AUTHORIZATION_ERROR: 'У вас нет прав для выполнения этого действия',
      NOT_FOUND_ERROR: 'Запрашиваемый ресурс не найден',
      CONFLICT_ERROR: 'Конфликт данных. Попробуйте еще раз',
      RATE_LIMIT_ERROR: 'Слишком много запросов. Попробуйте позже',
      SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
      NETWORK_ERROR: 'Проблемы с сетью. Проверьте подключение',
      VK_API_ERROR: 'Ошибка VK API. Попробуйте позже',
      UNKNOWN_ERROR: 'Произошла неизвестная ошибка'
    };

    return userMessages[error.code] || error.message;
  }
}
