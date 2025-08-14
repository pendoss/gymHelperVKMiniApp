import { makeAutoObservable } from 'mobx';
import { Exercise, Workout, Friend, User, WorkoutInvitation, WorkoutParticipant } from '../types';

export interface Achievements {
  totalWorkouts: number;
  workoutsThisMonth: number;
  currentStreak: number;
  bestStreak: number;
}

export interface Theme {
  mode: 'light' | 'dark';
}

class AppStore {
  exercises: Exercise[] = [
    {
      id: '1',
      name: 'Жим лежа',
      description: 'Базовое упражнение для развития грудных мышц',
      muscleGroup: ['Грудь'],
      equipment: ['Штанга', 'Скамья'],
      instructions: 'Лягте на скамью, возьмите штангу, опустите к груди, выжмите вверх',
      restTime: 120, 
      minWeight: 60,
      maxWeight: 100,
      steps: [
        { id: '1', stepNumber: 1, description: 'Лягте на скамью, ноги поставьте на пол' },
        { id: '2', stepNumber: 2, description: 'Возьмите штангу хватом чуть шире плеч' },
        { id: '3', stepNumber: 3, description: 'Медленно опустите штангу к груди' },
        { id: '4', stepNumber: 4, description: 'Выжмите штангу вверх до полного выпрямления рук' },
      ],
      recommendations: [
        { id: '1', text: 'Держите лопатки сведенными' },
        { id: '2', text: 'Не отрывайте поясницу от скамьи' },
        { id: '3', text: 'Контролируйте дыхание: вдох при опускании, выдох при подъеме' },
      ],
      createdBy: 1,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Приседания',
      description: 'Базовое упражнение для ног и ягодиц',
      muscleGroup: ['Ноги', 'Ягодицы'],
      equipment: ['Штанга'],
      instructions: 'Поставьте ноги на ширине плеч, опуститесь вниз, поднимитесь вверх',
      restTime: 180,
      minWeight: 80,
      maxWeight: 150,
      steps: [
        { id: '5', stepNumber: 1, description: 'Поставьте ноги на ширине плеч' },
        { id: '6', stepNumber: 2, description: 'Медленно опуститесь вниз, сгибая колени' },
        { id: '7', stepNumber: 3, description: 'Опускайтесь до параллели бедер с полом' },
        { id: '8', stepNumber: 4, description: 'Мощно поднимитесь вверх' },
      ],
      recommendations: [
        { id: '4', text: 'Колени должны следовать в направлении носков' },
        { id: '5', text: 'Держите спину прямо' },
        { id: '6', text: 'Вес тела на пятках' },
      ],
      createdBy: 1,
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Становая тяга',
      description: 'Базовое упражнение для спины и ног',
      muscleGroup: ['Спина', 'Ноги'],
      equipment: ['Штанга'],
      instructions: 'Встаньте перед штангой, наклонитесь и возьмите штангу, поднимите штангу',
      restTime: 240,
      minWeight: 100,
      maxWeight: 200,
      steps: [
        { id: '9', stepNumber: 1, description: 'Встаньте перед штангой, ноги на ширине плеч' },
        { id: '10', stepNumber: 2, description: 'Наклонитесь и возьмите штангу прямым хватом' },
        { id: '11', stepNumber: 3, description: 'Держите спину прямо, напрягите корпус' },
        { id: '12', stepNumber: 4, description: 'Поднимите штангу, выпрямляя ноги и корпус' },
      ],
      recommendations: [
        { id: '7', text: 'Штанга должна оставаться близко к телу' },
        { id: '8', text: 'Не округляйте спину' },
        { id: '9', text: 'Используйте силу ног, а не спины' },
      ],
      createdBy: 1,
      createdAt: new Date(),
    },
    {
      id: '4',
      name: 'Бег на беговой дорожке',
      description: 'Кардио упражнение для развития выносливости и сжигания калорий',
      muscleGroup: ['Кардио'],
      equipment: ['Беговая дорожка'],
      instructions: 'Установите комфортную скорость, следите за дыханием, поддерживайте ритм',
      restTime: 60,
      steps: [
        { id: '13', stepNumber: 1, description: 'Начните с разминки в медленном темпе' },
        { id: '14', stepNumber: 2, description: 'Постепенно увеличивайте скорость' },
        { id: '15', stepNumber: 3, description: 'Поддерживайте комфортный ритм' },
        { id: '16', stepNumber: 4, description: 'Завершите заминкой' },
      ],
      recommendations: [
        { id: '10', text: 'Следите за дыханием - оно должно быть ритмичным' },
        { id: '11', text: 'Держите корпус прямо' },
        { id: '12', text: 'Не забывайте о разминке и заминке' },
      ],
      createdBy: 1,
      createdAt: new Date(),
    },
  ];

  workouts: Workout[] = [
    {
      id: '1',
      title: 'Тренировка груди',
      date: new Date('2024-01-15'),
      time: '18:00',
      gym: 'FitnessPro',
      exercises: [
        {
          exerciseId: '1',
          exercise: {
            id: '1',
            name: 'Жим лежа',
            description: 'Базовое упражнение для развития грудных мышц',
            muscleGroup: ['Грудь'],
            equipment: ['Штанга', 'Скамья'],
            instructions: 'Лягте на скамью, возьмите штангу, опустите к груди, выжмите вверх',
            restTime: 120,
            minWeight: 60,
            maxWeight: 100,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '1', reps: 10, weight: 80 },
            { id: '2', reps: 8, weight: 85 },
            { id: '3', reps: 6, weight: 90 },
          ],
          notes: 'Хорошая тренировка'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
    },
    {
      id: '2',
      title: 'Вечерняя тренировка груди',
      date: new Date('2024-01-20'),
      time: '19:30',
      gym: 'PowerGym',
      exercises: [
        {
          exerciseId: '1',
          exercise: {
            id: '1',
            name: 'Жим лежа',
            description: 'Базовое упражнение для развития грудных мышц',
            muscleGroup: ['Грудь'],
            equipment: ['Штанга', 'Скамья'],
            instructions: 'Лягте на скамью, возьмите штангу, опустите к груди, выжмите вверх',
            restTime: 120,
            minWeight: 60,
            maxWeight: 100,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '4', reps: 12, weight: 70 },
            { id: '5', reps: 10, weight: 75 },
            { id: '6', reps: 8, weight: 80 },
            { id: '7', reps: 6, weight: 85 },
          ],
          notes: 'Увеличил рабочий вес!'
        },
        {
          exerciseId: '2',
          exercise: {
            id: '2',
            name: 'Приседания',
            description: 'Базовое упражнение для ног и ягодиц',
            muscleGroup: ['Ноги', 'Ягодицы'],
            equipment: ['Штанга'],
            instructions: 'Поставьте ноги на ширине плеч, опуститесь вниз, поднимитесь вверх',
            restTime: 180,
            minWeight: 80,
            maxWeight: 150,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '8', reps: 15, weight: 100 },
            { id: '9', reps: 12, weight: 110 },
            { id: '10', reps: 10, weight: 120 },
          ],
          notes: 'Отличная техника!'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
    },
    {
      id: '3',
      title: 'Утренняя кардио',
      date: new Date('2024-01-25'),
      time: '07:00',
      gym: 'FitnessPro',
      exercises: [
        {
          exerciseId: '4',
          exercise: {
            id: '4',
            name: 'Бег на беговой дорожке',
            description: 'Кардио упражнение для выносливости',
            muscleGroup: ['Кардио'],
            equipment: ['Беговая дорожка'],
            instructions: 'Установите комфортную скорость и бегите',
            restTime: 60,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '11', duration: 1800, distance: 5000 },
          ],
          notes: 'Хорошая разминка'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
    },
  ];

  friends: Friend[] = [
    {
      id: 1,
      first_name: 'Мария',
      last_name: 'Иванова',
      photo_200: '',
      isOnline: true,
      gym: 'GoldGym',
      workoutsThisWeek: 3,
      status: 'in_gym',
    },
    {
      id: 2,
      first_name: 'Дмитрий',
      last_name: 'Сидоров',
      photo_200: '',
      isOnline: false,
      gym: 'FitnessPro',
      workoutsThisWeek: 2,
      status: 'resting',
    },
  ];

  currentUser: User | null = {
    id: 1,
    first_name: 'Владимир',
    last_name: 'Тарасов',
    photo_200: '',
    level: 'amateur',
    mainGym: 'FitnessPro',
    firstLogin: false
  };
  showOnBoardingModal: boolean = false;

  // Тренировки конкретного пользователя (приватные)
  userWorkouts: Workout[] = [
    {
      id: 'user1',
      title: 'Моя тренировка груди',
      date: new Date('2025-08-11'),
      time: '18:00',
      gym: 'FitnessPro',
      exercises: [
        {
          exerciseId: '1',
          exercise: {
            id: '1',
            name: 'Жим лежа',
            description: 'Базовое упражнение для развития грудных мышц',
            muscleGroup: ['Грудь'],
            equipment: ['Штанга', 'Скамья'],
            instructions: 'Лягте на скамью, возьмите штангу, опустите к груди, выжмите вверх',
            restTime: 120,
            minWeight: 60,
            maxWeight: 100,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '1', reps: 10, weight: 80 },
            { id: '2', reps: 8, weight: 85 },
            { id: '3', reps: 6, weight: 90 },
          ],
          notes: 'Отличная техника! Следующий раз можно увеличить вес на 5 кг.'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
      completed: true,
      completedAt: new Date('2025-08-11'),
    },
    {
      id: 'user2',
      title: 'Моя вечерняя тренировка',
      date: new Date('2025-08-12'),
      time: '19:30',
      gym: 'FitnessPro',
      exercises: [
        {
          exerciseId: '2',
          exercise: {
            id: '2',
            name: 'Приседания',
            description: 'Базовое упражнение для ног и ягодиц',
            muscleGroup: ['Ноги', 'Ягодицы'],
            equipment: ['Штанга'],
            instructions: 'Поставьте ноги на ширине плеч, опуститесь вниз, поднимитесь вверх',
            restTime: 180,
            minWeight: 80,
            maxWeight: 150,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '8', reps: 15, weight: 100 },
            { id: '9', reps: 12, weight: 110 },
            { id: '10', reps: 10, weight: 120 },
          ],
          notes: 'Хорошая глубина приседа, следить за коленями.'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
      completed: true,
      completedAt: new Date('2025-08-12'),
    },
    {
      id: 'user3',
      title: 'Планируемая тренировка спины',
      date: new Date('2025-08-20'),
      time: '19:00',
      gym: 'FitnessPro',
      exercises: [
        {
          exerciseId: '3',
          exercise: {
            id: '3',
            name: 'Становая тяга',
            description: 'Базовое упражнение для спины и ног',
            muscleGroup: ['Спина', 'Ноги'],
            equipment: ['Штанга'],
            instructions: 'Встаньте перед штангой, наклонитесь и возьмите штангу, поднимите штангу',
            restTime: 240,
            minWeight: 100,
            maxWeight: 200,
            steps: [],
            recommendations: [],
            createdBy: 1,
            createdAt: new Date(),
          },
          sets: [
            { id: '11', reps: 5, weight: 140 },
            { id: '12', reps: 5, weight: 150 },
            { id: '13', reps: 3, weight: 160 },
          ],
          notes: 'Подготовиться к новому максимуму!'
        }
      ],
      participants: [],
      createdBy: 1,
      createdAt: new Date(),
      isTemplate: false,
      completed: false,
    }
  ];

  // Приглашения на тренировки
  workoutInvitations: WorkoutInvitation[] = [];

  selectedDate: Date = new Date();
  theme: Theme = { mode: 'light' };
  pendingExerciseForWorkout: {
    exercise: Exercise | null;
    sets: any[];
  } = {
    exercise: null,
    sets: []
  };

  constructor() {
    makeAutoObservable(this);
  }

  get achievements(): Achievements {
    // Используем пользовательские тренировки для статистики
    const userWorkouts = this.getUserWorkouts();
    const totalWorkouts = userWorkouts.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const workoutsThisMonth = userWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear;
    }).length;
    const sortedWorkouts = userWorkouts
      .map(w => new Date(w.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    if (sortedWorkouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      for (let i = 0; i < sortedWorkouts.length; i++) {
        const workoutDate = new Date(sortedWorkouts[i]);
        workoutDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (i === 0 && daysDiff <= 1) {
          currentStreak = 1;
        } else if (i > 0 && currentStreak > 0) {
          const prevWorkoutDate = new Date(sortedWorkouts[i - 1]);
          prevWorkoutDate.setHours(0, 0, 0, 0);
          const daysBetween = Math.floor((prevWorkoutDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysBetween <= 2) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      tempStreak = 1;
      for (let i = 1; i < sortedWorkouts.length; i++) {
        const currentDate = new Date(sortedWorkouts[i]);
        const prevDate = new Date(sortedWorkouts[i - 1]);
        const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween <= 2) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    return {
      totalWorkouts,
      workoutsThisMonth,
      currentStreak,
      bestStreak,
    };
  }

  addExercise = (exercise: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: Date.now().toString(),
    };
    this.exercises.push(newExercise);
  };

  updateExercise = (id: string, updates: Partial<Exercise>) => {
    const index = this.exercises.findIndex(exercise => exercise.id === id);
    if (index !== -1) {
      this.exercises[index] = { ...this.exercises[index], ...updates };
    }
  };

  deleteExercise = (id: string) => {
    this.exercises = this.exercises.filter(exercise => exercise.id !== id);
  };

  getExerciseById = (id: string): Exercise | undefined => {
    return this.exercises.find(exercise => exercise.id === id);
  };

  addWorkout = (workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString(),
    };
    this.workouts.push(newWorkout);
  };

  updateWorkout = (id: string, updates: Partial<Workout>) => {
    const index = this.workouts.findIndex(workout => workout.id === id);
    if (index !== -1) {
      this.workouts[index] = { ...this.workouts[index], ...updates };
    }
  };

  deleteWorkout = (id: string) => {
    this.workouts = this.workouts.filter(workout => workout.id !== id);
  };

  markWorkoutAsCompleted = (id: string) => {
    const workout = this.workouts.find(w => w.id === id);
    if (workout) {
      workout.completed = true;
      workout.completedAt = new Date();
    }
  };

  getWorkoutById = (id: string): Workout | undefined => {
    return this.workouts.find(workout => workout.id === id);
  };

  setSelectedDate = (date: Date) => {
    this.selectedDate = date;
  };

  // Методы для работы с пользовательскими тренировками
  addUserWorkout = (workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString(),
      createdBy: this.currentUser?.id || 1,
    };
    this.userWorkouts.push(newWorkout);
    // Также добавляем в общий список для отображения в статистике
    this.workouts.push(newWorkout);
  };

  getUserWorkouts = (userId?: number): Workout[] => {
    if (userId && userId !== this.currentUser?.id) {
      // Возвращаем тренировки другого пользователя из общего списка
      return this.workouts.filter(workout => Number(workout.createdBy) === userId);
    }
    // Возвращаем тренировки текущего пользователя из userWorkouts
    return this.userWorkouts;
  };

  updateUserWorkout = (id: string, updates: Partial<Workout>) => {
    const userIndex = this.userWorkouts.findIndex(workout => workout.id === id);
    if (userIndex !== -1) {
      this.userWorkouts[userIndex] = { ...this.userWorkouts[userIndex], ...updates };
    }
    
    // Также обновляем в общем списке
    const generalIndex = this.workouts.findIndex(workout => workout.id === id);
    if (generalIndex !== -1) {
      this.workouts[generalIndex] = { ...this.workouts[generalIndex], ...updates };
    }
  };

  deleteUserWorkout = (id: string) => {
    this.userWorkouts = this.userWorkouts.filter(workout => workout.id !== id);
    this.workouts = this.workouts.filter(workout => workout.id !== id);
  };

  // Методы для работы с приглашениями на тренировки
  sendWorkoutInvitation = (toUserId: number, workoutId: string) => {
    if (!this.currentUser) return;

    const workout = this.workouts.find(w => w.id === workoutId) || this.userWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    const invitation: WorkoutInvitation = {
      id: Date.now().toString(),
      workoutId,
      fromUserId: this.currentUser.id,
      fromUserName: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      toUserId,
      status: 'pending',
      sentAt: new Date(),
      createdAt: new Date(),
      workout
    };

    this.workoutInvitations.push(invitation);
  };

  acceptWorkoutInvitation = (invitationId: string) => {
    const invitation = this.workoutInvitations.find(inv => inv.id === invitationId);
    if (invitation && this.currentUser) {
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      
      // Добавляем пользователя в участники тренировки
      if (invitation.workout) {
        invitation.workout.participants = invitation.workout.participants || [];
        const participant: WorkoutParticipant = {
          userId: this.currentUser.id,
          user: this.currentUser,
          status: 'accepted',
          invitedAt: invitation.sentAt,
          respondedAt: new Date()
        };
        invitation.workout.participants.push(participant);
      }
    }
  };

  declineWorkoutInvitation = (invitationId: string) => {
    const invitation = this.workoutInvitations.find(inv => inv.id === invitationId);
    if (invitation) {
      invitation.status = 'declined';
      invitation.respondedAt = new Date();
    }
  };

  getIncomingInvitations = (): WorkoutInvitation[] => {
    if (!this.currentUser) return [];
    return this.workoutInvitations.filter(
      inv => inv.toUserId === this.currentUser!.id && inv.status === 'pending'
    );
  };

  getSentInvitations = (): WorkoutInvitation[] => {
    if (!this.currentUser) return [];
    return this.workoutInvitations.filter(
      inv => inv.fromUserId === this.currentUser!.id
    );
  };

  toggleTheme = () => {
    this.theme.mode = this.theme.mode === 'light' ? 'dark' : 'light';
  };

  addFriend = (friend: Friend) => {
    this.friends.push(friend);
  };

  removeFriend = (id: number) => {
    this.friends = this.friends.filter(friend => friend.id !== id);
  };

  setPendingExerciseForWorkout = (exercise: Exercise, sets: any[]) => {
    this.pendingExerciseForWorkout = {
      exercise,
      sets
    };
  };

  clearPendingExerciseForWorkout = () => {
    this.pendingExerciseForWorkout = {
      exercise: null,
      sets: []
    };
  };

  getUniqueCategories = () => {
    const allCategories = this.exercises.flatMap(exercise => exercise.muscleGroup || []);
    const categories = [...new Set(allCategories)];
    return categories.sort();
  };

  getUniqueEquipment = () => {
    const allEquipment = this.exercises.flatMap(exercise => exercise.equipment || []);
    const uniqueEquipment = [...new Set(allEquipment)];
    return uniqueEquipment.sort();
  };

  setCurrentUser = (user: User) => {
    this.currentUser = user;
    if (user.firstLogin) {
      this.showOnBoardingModal = true;
    }
  };

  updateCurrentUser = (updates: Partial<User>) => {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
    }
  };

  setMainGym = (gymName: string) => {
    if (this.currentUser) {
      this.currentUser.mainGym = gymName;
    }
  };

  clearCurrentUser = () => {
    this.currentUser = null;
  };

  setShowOnBoardingModal = (show: boolean) => {
    this.showOnBoardingModal = show;
  };

  checkAndShowOnBoarding = () => {
    if (this.currentUser && this.currentUser.firstLogin) {
      this.showOnBoardingModal = true;
    }
  };

  getPersonalizedRecommendations = () => {
    if (!this.currentUser) return [];

    const recommendations = [];
    const { level, mainGym } = this.currentUser;
    const { totalWorkouts, currentStreak } = this.achievements;

    if (level === 'beginner' && totalWorkouts < 5) {
      recommendations.push("Начните с базовых упражнений: жим лежа, приседания и становая тяга");
    }

    if (mainGym) {
      const gymWorkouts = this.workouts.filter(w => w.gym === mainGym).length;
      if (gymWorkouts > 10) {
        recommendations.push(`Отличная привязанность к залу ${mainGym}! Вы провели здесь ${gymWorkouts} тренировок`);
      }
    } else {
      recommendations.push("Выберите основной спортзал для персонализированных рекомендаций");
    }

    if (currentStreak > 7) {
      recommendations.push(`Потрясающая регулярность! ${currentStreak} дней подряд - так держать!`);
    } else if (currentStreak === 0) {
      recommendations.push("Время возвращаться к тренировкам! Начните с легкой разминки");
    }

    return recommendations;
  };

  // Методы для лидерборда
  getLeaderboard = () => {
    // Получаем всех друзей и добавляем текущего пользователя
    const allUsers = [...this.friends];
    if (this.currentUser) {
      allUsers.push({
        id: this.currentUser.id,
        first_name: this.currentUser.first_name,
        last_name: this.currentUser.last_name,
        photo_200: this.currentUser.photo_200 || '',
        isOnline: true,
        gym: this.currentUser.mainGym,
        workoutsThisWeek: 0,
        status: 'resting' as const
      });
    }

    // Подсчитываем реальное количество тренировок для каждого пользователя
    const usersWithRealWorkouts = allUsers.map(user => {
      let userWorkouts;
      
      // Для текущего пользователя используем userWorkouts, для остальных - workouts
      if (user.id === this.currentUser?.id) {
        userWorkouts = this.userWorkouts.filter(workout => workout.completed);
      } else {
        userWorkouts = this.workouts.filter(workout => 
          Number(workout.createdBy) === user.id && workout.completed
        );
      }
      
      // Считаем тренировки за текущую неделю
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const friendCompletedWorkouts = userWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= startOfWeek && workoutDate <= now;
      }).length;

      return {
        ...user,
        workoutsThisWeek: friendCompletedWorkouts
      };
    });

    // Сортируем по количеству тренировок (по убыванию)
    const sortedUsers = usersWithRealWorkouts
      .sort((a, b) => b.workoutsThisWeek - a.workoutsThisWeek)
      .map((user, index) => ({
        ...user,
        position: index + 1
      }));

    return sortedUsers;
  };

  getTopLeaders = (count: number = 5) => {
    return this.getLeaderboard().slice(0, count);
  };

  getCurrentUserPosition = () => {
    if (!this.currentUser) return null;
    
    const leaderboard = this.getLeaderboard();
    const userPosition = leaderboard.find(user => user.id === this.currentUser!.id);
    
    return userPosition || null;
  };
}

export const appStore = new AppStore();
