import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, Workout, Exercise, Friend, Achievement, Theme } from '../types';

interface AppState {
  user: User | null;
  workouts: Workout[];
  exercises: Exercise[];
  friends: Friend[];
  achievements: Achievement;
  theme: Theme;
  selectedDate: Date;
  isLoading: boolean;
}

interface AppActions {
  setUser: (user: User | null) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, workout: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  setFriends: (friends: Friend[]) => void;
  updateAchievements: (achievements: Achievement) => void;
  toggleTheme: () => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
}

type AppContextType = AppState & AppActions;

const initialState: AppState = {
  user: null,
  workouts: [
    {
      id: '1',
      name: 'Тренировка груди',
      title: 'Тренировка груди',
      description: 'Интенсивная тренировка грудных мышц',
      date: new Date(2025, 7, 15),
      startTime: '18:00',
      gym: 'FitnesLife',
      exercises: [
        {
          exerciseId: '1',
          exercise: {
            id: '1',
            name: 'Жим лежа',
            description: 'Базовое упражнение для груди',
            muscleGroup: ['Грудь'],
            equipment: ['Штанга'],
            instructions: '',
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: 1, reps: 10, weight: 80, completed: false },
            { id: 2, reps: 8, weight: 85, completed: false },
            { id: 3, reps: 6, weight: 90, completed: false },
          ],
        },
      ],
      participants: [
        {
          userId: 2,
          user: {
            id: 2,
            first_name: 'Алексей',
            last_name: 'Иванов',
            photo_200: 'https://via.placeholder.com/200',
            level: 'amateur',
            firstLogin: false
          },
          status: 'accepted',
          invitedAt: new Date(),
          respondedAt: new Date(),
        },
      ],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
    },
    {
      id: '2',
      name: 'Тренировка ног',
      title: 'Тренировка ног',
      description: 'Базовая тренировка ног',
      date: new Date(2025, 7, 18),
      startTime: '19:00',
      gym: 'World Gym',
      exercises: [
        {
          exerciseId: '2',
          exercise: {
            id: '2',
            name: 'Приседания',
            description: 'Базовое упражнение для ног',
            muscleGroup: ['Ноги'],
            equipment: ['Штанга'],
            instructions: '',
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: 4, reps: 12, weight: 100, completed: false },
            { id: 5, reps: 10, weight: 110, completed: false },
            { id: 6, reps: 8, weight: 120, completed: false },
          ],
        },
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
    },
  ],
  exercises: [
    {
      id: '1',
      name: 'Жим лежа',
      description: 'Базовое упражнение для груди',
      muscleGroup: ['Грудь'],
      equipment: ['Штанга'],
      instructions: 'Лягте на скамью, возьмите штангу широким хватом...',
      steps: [],
      recommendations: [],
      createdBy: 1,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Приседания',
      description: 'Базовое упражнение для ног',
      muscleGroup: ['Ноги'],
      equipment: ['Штанга'],
      instructions: 'Поставьте ноги на ширине плеч...',
      steps: [],
      recommendations: [],
      createdBy: 1,
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Становая тяга',
      description: 'Базовое упражнение для спины',
      muscleGroup: ['Спина'],
      equipment: ['Штанга'],
      instructions: 'Встаньте перед штангой...',
      steps: [],
      recommendations: [],
      createdBy: 1,
      createdAt: new Date(),
    },
  ],
  friends: [
    {
      id: 2,
      first_name: 'Алексей',
      last_name: 'Иванов',
      photo_200: 'https://via.placeholder.com/200',
      isOnline: true,
      gym: 'FitnesLife',
      workoutsThisWeek: 3,
      lastWorkout: new Date(2025, 7, 10),
      nextWorkout: new Date(2025, 7, 14),
      status: 'looking_for_partner',
    },
    {
      id: 3,
      first_name: 'Мария',
      last_name: 'Петрова',
      photo_200: 'https://via.placeholder.com/200',
      isOnline: false,
      gym: 'World Gym',
      workoutsThisWeek: 2,
      lastWorkout: new Date(2025, 7, 9),
      nextWorkout: new Date(2025, 7, 13),
      status: 'resting',
    },
    {
      id: 4,
      first_name: 'Дмитрий',
      last_name: 'Сидоров',
      photo_200: 'https://via.placeholder.com/200',
      isOnline: true,
      gym: 'FitnesLife',
      workoutsThisWeek: 4,
      lastWorkout: new Date(2025, 7, 11),
      nextWorkout: new Date(2025, 7, 12),
      status: 'in_gym',
    },
  ],
  achievements: {
    workoutsThisMonth: 0,
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
  },
  theme: { mode: 'light' },
  selectedDate: new Date(),
  isLoading: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, setState] = useState<AppState>(initialState);

  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user }));
  };

  const addWorkout = (workout: Workout) => {
    setState(prev => ({
      ...prev,
      workouts: [...prev.workouts, workout],
    }));
  };

  const updateWorkout = (id: string, workout: Partial<Workout>) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => w.id === id ? { ...w, ...workout } : w),
    }));
  };

  const deleteWorkout = (id: string) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.filter(w => w.id !== id),
    }));
  };

  const addExercise = (exercise: Exercise) => {
    setState(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise],
    }));
  };

  const updateExercise = (id: string, exercise: Partial<Exercise>) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id === id ? { ...e, ...exercise } : e),
    }));
  };

  const deleteExercise = (id: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== id),
    }));
  };

  const setFriends = (friends: Friend[]) => {
    setState(prev => ({ ...prev, friends }));
  };

  const updateAchievements = (achievements: Achievement) => {
    setState(prev => ({ ...prev, achievements }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: { mode: prev.theme.mode === 'light' ? 'dark' : 'light' },
    }));
  };

  const setSelectedDate = (date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const workoutsThisMonth = state.workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear;
    }).length;

    updateAchievements({
      ...state.achievements,
      workoutsThisMonth,
      totalWorkouts: state.workouts.length,
    });
  }, [state.workouts]);

  const value: AppContextType = {
    ...state,
    setUser,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
    setFriends,
    updateAchievements,
    toggleTheme,
    setSelectedDate,
    setLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
