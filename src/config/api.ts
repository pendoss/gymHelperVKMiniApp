// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    VK_LOGIN: '/auth/vk-login',
  },

  // Users
  USERS: {
    ME: '/users/me',
    FRIENDS: '/users/friends',
  },

  // Exercises
  EXERCISES: {
    BASE: '/exercises',
    BY_ID: (id: string) => `/exercises/${id}`,
    MEDIA: (id: string) => `/exercises/${id}/media`,
  },

  // Workouts
  WORKOUTS: {
    BASE: '/workouts',
    BY_ID: (id: string) => `/workouts/${id}`,
    COMPLETE: (id: string) => `/workouts/${id}/complete`,
    PARTICIPANT_RESPOND: (workoutId: string, userId: number) => 
      `/workouts/${workoutId}/participants/${userId}/respond`,
  },

  // Calendar
  CALENDAR: {
    BASE: '/calendar',
  },

  // Statistics
  STATISTICS: {
    ME: '/statistics/me',
  },
} as const;

// Default pagination settings
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// API response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Нет соединения с сервером',
  UNAUTHORIZED: 'Необходима авторизация',
  FORBIDDEN: 'Доступ запрещен',
  NOT_FOUND: 'Ресурс не найден',
  VALIDATION_ERROR: 'Ошибка валидации данных',
  INTERNAL_ERROR: 'Внутренняя ошибка сервера',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
  VK_AUTH_FAILED: 'Ошибка авторизации через VK',
} as const;

// Request timeouts
export const TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000,  // 30 seconds
  AUTH: 15000,    // 15 seconds
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gym_helper_access_token',
  USER_DATA: 'gym_helper_user_data',
  THEME: 'gym_helper_theme',
  LAST_SYNC: 'gym_helper_last_sync',
} as const;

// Feature flags for API integration
export const FEATURE_FLAGS = {
  USE_BACKEND_API: false, // TODO: Установить в true когда backend будет готов
  CACHE_ENABLED: true,
  OFFLINE_MODE: false,
  DEBUG_MODE: import.meta.env.MODE === 'development',
} as const;
