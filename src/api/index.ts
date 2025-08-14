/**
 * Main API module - exports all API endpoint classes
 * Provides a unified interface to all backend services
 */

// Export all API endpoint classes
export { AuthAPI } from './endpoints/auth.js';
export { ExerciseAPI } from './endpoints/exercises.js';
export { WorkoutAPI } from './endpoints/workouts.js';
export { UsersAPI } from './endpoints/users.js';

// Import for internal use
import { AuthAPI } from './endpoints/auth.js';
import { ExerciseAPI } from './endpoints/exercises.js';
import { WorkoutAPI } from './endpoints/workouts.js';
import { UsersAPI } from './endpoints/users.js';

// Re-export types for convenience
export type {
  APIResponse,
  PaginatedResponse,
  PaginationParams,
  ErrorCode,
  AuthTokens,
  VKUserInfo,
  VKAuthResponse
} from '../types/index.js';

/**
 * Combined API class with all endpoints
 * Provides a single entry point for all API operations
 */
export class API {
  static auth = AuthAPI;
  static exercises = ExerciseAPI;
  static workouts = WorkoutAPI;
  static users = UsersAPI;
}

// Default export for convenience
export default API;
