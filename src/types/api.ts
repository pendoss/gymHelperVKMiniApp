/**
 * API типы для взаимодействия с backend
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  authRequired?: boolean;
}

// HTTP методы
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Базовые типы для API endpoints
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Типы для аутентификации
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: string; // ISO date string
}

export interface AuthCredentials {
  vkUserId: number;
  vkAccessToken: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserProfile extends BaseEntity {
  vkId: number;
  firstName: string;
  lastName: string;
  photo?: string;
  city?: string;
  isActive: boolean;
}

// Типы для упражнений
export interface Exercise extends BaseEntity {
  name: string;
  description?: string;
  muscleGroup: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  recomendations?: string[];
  imageUrl?: string;
  videoUrl?: string;
  videoFile?: File;
  restTime?: number; // время отдыха в секундах
  minWeight?: number; // минимальный рабочий вес
  maxWeight?: number; // максимальный рабочий вес
  steps?: ExerciseStep[]; // пошаговая техника выполнения
  recommendations?: ExerciseRecommendation[]; // рекомендации
  defaultSets?: ExerciseSet[]; // подходы по умолчанию для упражнения
  createdBy: number; // userId
  isPublic: boolean;
}

export interface ExerciseStep {
  id: number;
  stepNumber: number;
  description: string;
}

export interface ExerciseRecommendation {
  id: number;
  text: string;
}

export interface ExerciseSet {
  id: number;
  reps: number;
  weight?: number;
  distance?: number;
  duration?: number; // в секундах
  restTime?: number; // в секундах
}

// Типы для тренировок
export interface Workout extends BaseEntity {
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  duration?: number; // планируемая длительность в минутах
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  exercises: WorkoutExercise[];
  createdBy: string; // userId
  participants: WorkoutParticipant[]; // Объекты участников
  invitations: WorkoutInvitation[];
  completedAt?: string;
  actualDuration?: number; // фактическая длительность в минутах
  location?: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'amateur';
  firstLogin: boolean;
}

export interface WorkoutParticipant {
  userId: number;
  user: User;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  invitedAt: Date;
  respondedAt?: Date;
}

export interface WorkoutExercise {
  id: number;
  exerciseId: number;
  exercise: Exercise;
  sets: ExerciseSet[];
  order: number;
  notes?: string;
  completed: boolean;
}

// Типы для приглашений
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'auto_declined' | 'expired';

export interface WorkoutInvitation extends BaseEntity {
  workoutId: string;
  inviterId: string; // кто пригласил
  inviteeId: string; // кого пригласили
  status: InvitationStatus;
  message?: string;
  respondedAt?: string;
  autoDeclineAt?: string; // время автоматического отклонения
  notificationSent: boolean;
}

// Типы для VK API интеграции
export interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
  city?: {
    id: number;
    title: string;
  };
  online: number;
  last_seen?: {
    time: number;
    platform: number;
  };
}

export interface VKFriend extends VKUser {
  can_write_private_message: number;
  can_see_all_posts: number;
  can_post: number;
}

// Типы для статистики
export interface WorkoutStats {
  totalWorkouts: number;
  completedWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalWeight: number;
  averageDuration: number;
  streakDays: number;
  lastWorkoutDate?: string;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  maxWeight: number;
  maxReps: number;
  lastPerformed?: string;
  progressData: {
    date: string;
    weight: number;
    reps: number;
  }[];
}

// Типы для уведомлений
export interface Notification extends BaseEntity {
  userId: string;
  type: 'workout_invitation' | 'workout_reminder' | 'workout_started' | 'workout_completed' | 'friend_request';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  sentAt: string;
}

// Типы для поиска и фильтрации
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface ExerciseFilters {
  muscleGroup?: string[];
  difficulty?: string[];
  equipment?: string[];
  createdBy?: string;
  isPublic?: boolean;
}

export interface WorkoutFilters {
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  participantId?: string;
}
