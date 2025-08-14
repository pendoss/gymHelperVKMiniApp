/**
 * Доменные типы приложения GymHelper
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

// Базовые интерфейсы
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Пользователь в системе
export interface User extends BaseEntity {
  position: number;
  vkId: number;
  firstName: string;
  lastName: string;
  photo?: string;
  city?: string;
  isActive: boolean;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  notifications: {
    workoutReminders: boolean;
    invitations: boolean;
    friendActivity: boolean;
    achievements: boolean;
  };
  privacy: {
    profileVisible: boolean;
    workoutsVisible: boolean;
    statsVisible: boolean;
  };
  preferences: {
    defaultWorkoutDuration: number; // в минутах
    restTimeBetweenSets: number; // в секундах
    weightUnit: 'kg' | 'lbs';
    theme: 'light' | 'dark' | 'auto';
    language: 'ru' | 'en';
    defaultGym?: string; // название основного зала
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'; // уровень пользователя
  };
}

export interface UserStats {
  totalWorkouts: number;
  completedWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalExercises: number;
  favoriteExercises: string[]; // exercise IDs
  totalTimeSpent: number; // в минутах
  averageWorkoutDuration: number; // в минутах
  lastActivity: Date;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  type: 'streak' | 'workouts' | 'exercises' | 'time' | 'weight';
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number; // 0-100
}

// Упражнения
export interface Exercise extends BaseEntity {
  name: string;
  description?: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: ExerciseDifficulty;
  instructions: string[];
  tips?: string[];
  imageUrl?: string;
  videoUrl?: string;
  createdBy: string; // User ID
  isPublic: boolean;
  likes: number;
  usageCount: number;
  tags: string[];
  variations?: ExerciseVariation[];
}

export interface ExerciseVariation {
  id: string;
  name: string;
  description: string;
  difficultyModifier: number; // -2 to +2
  instructions: string[];
}

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface MuscleGroup {
  id: string;
  name: string;
  category: 'primary' | 'secondary';
}

export interface Equipment {
  id: string;
  name: string;
  category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'accessories';
}

// Тренировки
export interface Workout extends BaseEntity {
  title: string;
  description?: string;
  date: Date;
  startTime: string; // HH:mm format
  estimatedDuration: number; // в минутах
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];
  createdBy: string; // User ID
  participants: WorkoutParticipant[];
  invitations: WorkoutInvitation[];
  location?: WorkoutLocation;
  template?: WorkoutTemplate;
}

export type WorkoutStatus = 
  | 'planned' 
  | 'ready' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise; // populated
  sets: ExerciseSet[];
  order: number;
  notes?: string;
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
  restTimeAfter?: number; // в секундах
  variations?: string[]; // variation IDs
}

export interface ExerciseSet {
   id: number;
  reps: number;
  weight?: number;
  distance?: number;
  duration?: number; // в секундах
  restTime?: number; // в секундах
  completed: boolean;
  completedAt?: Date;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface WorkoutParticipant {
  userId: string;
  user?: User; // populated
  role: 'creator' | 'participant';
  status: 'joined' | 'left' | 'completed';
  joinedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
}

export interface WorkoutLocation {
  type: 'gym' | 'home' | 'outdoor' | 'other';
  name?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface WorkoutTemplate extends BaseEntity {
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  estimatedDuration: number;
  difficulty: ExerciseDifficulty;
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;
}

export interface TemplateExercise {
  exerciseId: string;
  order: number;
  sets: TemplateSet[];
  notes?: string;
  restTimeAfter?: number;
}

export interface TemplateSet {
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  restTime?: number;
}

// Приглашения на тренировки
export interface WorkoutInvitation extends BaseEntity {
  workoutId: string;
  workout?: Workout; // populated
  inviterId: string;
  inviter?: User; // populated
  inviteeId: string;
  invitee?: User; // populated
  status: InvitationStatus;
  message?: string;
  respondedAt?: Date;
  autoDeclineAt: Date; // время автоматического отклонения
  notificationsSent: NotificationSent[];
  metadata: InvitationMetadata;
}

export type InvitationStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'auto_declined' 
  | 'expired' 
  | 'cancelled';

export interface InvitationMetadata {
  sentViaVK: boolean;
  sentViaPush: boolean;
  remindersSent: number;
  lastReminderAt?: Date;
  declineReason?: 'user_action' | 'auto_timeout' | 'workout_started' | 'workout_cancelled';
}

export interface NotificationSent {
  type: 'initial' | 'reminder' | 'final_warning';
  sentAt: Date;
  success: boolean;
  error?: string;
}

// Друзья и социальные функции
export interface Friend {
  userId: string;
  user?: User; // populated
  vkFriend: boolean; // является ли другом в VK
  addedAt: Date;
  status: 'active' | 'blocked';
  sharedWorkouts: number;
  mutualFriends: number;
}

export interface FriendActivity {
  id: string;
  userId: string;
  user?: User;
  type: 'workout_completed' | 'exercise_added' | 'achievement_unlocked' | 'workout_invited';
  data: Record<string, any>;
  createdAt: Date;
  visibility: 'friends' | 'public';
}

// Уведомления
export interface AppNotification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export type NotificationType = 
  | 'workout_invitation'
  | 'workout_reminder'
  | 'workout_started'
  | 'workout_completed'
  | 'invitation_response'
  | 'friend_request'
  | 'achievement_unlocked'
  | 'exercise_shared'
  | 'system_update';

// Прогресс и статистика
export interface ExerciseProgress {
  exerciseId: string;
  userId: string;
  records: ProgressRecord[];
  personalBests: PersonalBest[];
  trends: ProgressTrend[];
  lastPerformed: Date;
  totalSessions: number;
}

export interface ProgressRecord {
  date: Date;
  workoutId: string;
  sets: {
    reps: number;
    weight?: number;
    duration?: number;
    rpe?: number;
  }[];
  notes?: string;
}

export interface PersonalBest {
  type: 'max_weight' | 'max_reps' | 'max_duration' | 'max_volume';
  value: number;
  achievedAt: Date;
  workoutId: string;
  setId?: string;
}

export interface ProgressTrend {
  period: 'week' | 'month' | 'quarter' | 'year';
  metric: 'weight' | 'reps' | 'volume' | 'frequency';
  change: number; // процентное изменение
  direction: 'up' | 'down' | 'stable';
}

// Планы тренировок
export interface WorkoutPlan extends BaseEntity {
  name: string;
  description?: string;
  duration: number; // в неделях
  difficulty: ExerciseDifficulty;
  goals: string[];
  schedule: PlanSchedule[];
  workouts: PlanWorkout[];
  createdBy: string;
  isPublic: boolean;
  participants: string[]; // User IDs
  tags: string[];
  rating: number;
  reviews: PlanReview[];
}

export interface PlanSchedule {
  dayOfWeek: number; // 0-6 (Monday-Sunday)
  workoutId: string;
  isRestDay: boolean;
  notes?: string;
}

export interface PlanWorkout {
  id: string;
  weekNumber: number;
  dayNumber: number;
  template: WorkoutTemplate;
  notes?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface PlanReview {
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// Константы
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'obliques', 'lower_back', 'quads', 'hamstrings', 'glutes',
  'calves', 'cardio', 'full_body'
] as const;

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'medicine_ball', 'foam_roller',
  'pull_up_bar', 'bench', 'cardio_machine', 'other'
] as const;

export const WORKOUT_TAGS = [
  'strength', 'cardio', 'endurance', 'flexibility', 'mobility',
  'powerlifting', 'bodybuilding', 'crossfit', 'hiit', 'yoga',
  'pilates', 'stretching', 'warm_up', 'cool_down'
] as const;

// Утилитарные типы
export type MuscleGroupType = typeof MUSCLE_GROUPS[number];
export type EquipmentType = typeof EQUIPMENT_TYPES[number];
export type WorkoutTagType = typeof WORKOUT_TAGS[number];

// Типы для форм
export interface CreateExerciseForm {
  name: string;
  description?: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  instructions: string[];
  tips?: string[];
  isPublic: boolean;
  tags: string[];
}

export interface CreateWorkoutForm {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  estimatedDuration: number;
  exercises: {
    exerciseId: string;
    sets: {
      targetReps?: number;
      targetWeight?: number;
      targetDuration?: number;
      restTime?: number;
    }[];
    notes?: string;
  }[];
  invitedFriends: string[];
  location?: {
    type: string;
    name?: string;
    address?: string;
  };
  visibility: 'private' | 'friends' | 'public';
  tags: string[];
}

export interface InviteFriendsForm {
  workoutId: string;
  friendIds: string[];
  message?: string;
  sendVKNotification: boolean;
}
