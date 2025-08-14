import { ExerciseSet } from "./domain";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  firstName?: string; // Alias for compatibility
  lastName?: string; // Alias for compatibility
  photo_200?: string;
  photo?: string; // Alias for compatibility
  city?: {
    title: string;
  };
  level: UserLevel;
  favoriteGym?: string;
  mainGym?: string;
  firstLogin: boolean;
}

export type UserLevel = 'beginner' | 'amateur' | 'advanced' | 'expert';

export interface ExerciseStep {
  id: string;
  stepNumber: number;
  description: string;
}

export interface ExerciseRecommendation {
  id: string;
  text: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string[];
  equipment?: string[];
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoFile?: File;
  restTime?: number; // время отдыха в секундах
  minWeight?: number; // минимальный рабочий вес
  maxWeight?: number; // максимальный рабочий вес
  steps: ExerciseStep[]; // пошаговая техника выполнения
  recommendations: ExerciseRecommendation[]; // рекомендации
  defaultSets?: ExerciseSet[]; // подходы по умолчанию для упражнения
  createdBy: number;
  createdAt: Date;
}

export interface Set {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number; // в секундах
  distance?: number; // в метрах
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  title?: string; // Alias for name for compatibility
  description?: string;
  date: Date;
  startTime?: string; // Added for time display
  duration?: number;
  estimatedDuration?: number; // Alias for duration
  gym: string;
  exercises: WorkoutExercise[];
  participants: WorkoutParticipant[];
  completed?: boolean;
  completedAt?: Date;
  createdBy: number;
  createdAt: Date;
  isTemplate: boolean;
}

export interface WorkoutParticipant {
  userId: number;
  user: User;
  status: ParticipantStatus;
  invitedAt: Date;
  respondedAt?: Date;
}

export type ParticipantStatus = 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';

export interface WorkoutInvitation {
  id: string;
  workoutId: string;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  status: InvitationStatus;
  sentAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  workout?: Workout;
  // Additional fields for enhanced invitation system
  inviter?: User;
  invitee?: User;
  message?: string;
  autoDeclineAt?: Date;
  metadata?: {
    sentViaVK?: boolean;
    reminderSent?: boolean;
    [key: string]: any;
  };
}

export interface Friend {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  isOnline: boolean;
  gym?: string;
  workoutsThisWeek: number;
  lastWorkout?: Date;
  nextWorkout?: Date;
  status: FriendStatus;
}

export type FriendStatus = 'in_gym' | 'looking_for_partner' | 'finished_workout' | 'resting';

export interface Achievement {
  workoutsThisMonth: number;
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface CalendarDay {
  date: Date;
  hasWorkout: boolean;
  workouts: Workout[];
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error codes
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'VK_API_ERROR'
  | 'UNKNOWN_ERROR';

// Authentication types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface VKAuthResponse {
  access_token: string;
  user_id: number;
  expires_in: number;
}

export interface VKUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  city?: {
    id: number;
    title: string;
  };
  bdate?: string;
  sex?: number;
}

// Invitation status type
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'auto_declined';
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
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

