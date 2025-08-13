export interface User {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
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
  sets: Set[];
  notes?: string;
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time: string;
  estimatedDuration?: number;
  duration?: number;
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
