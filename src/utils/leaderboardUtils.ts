
export interface UserStats {
  id: string | number;
  workoutsCount: number;
  totalExercises: number;
  completedWorkouts: number;
  name: string;
  photo_200?: string;
  first_name: string;
  last_name: string;
  score: number;
  position: number;
  qualityScore: number; // Новый показатель качества тренировок
}

/**
 * Вычисляет качественный балл упражнения на основе его характеристик
 */
const calculateExerciseQualityScore = (exercise: any, sets: any[]): number => {
  if (!sets || sets.length === 0) return 0;
  
  let qualityScore = 0;
  
  // Базовые баллы за выполнение
  qualityScore += sets.length * 2; // 2 балла за каждый подход
  
  // Анализируем параметры сетов
  const allSets = sets.filter(set => set && typeof set === 'object');
  if (allSets.length === 0) return qualityScore;
  
  // Баллы за вес
  const weights = allSets
    .map(s => s.weight)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
  
  if (weights.length > 0) {
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    // Прогрессия веса дает бонусы
    if (weights.length > 1) {
      const progression = weights[weights.length - 1] - weights[0];
      if (progression > 0) {
        qualityScore += Math.min(progression * 0.5, 10); // До 10 бонусных баллов за прогрессию
      }
    }
    
    // Баллы за рабочий вес (относительно границ упражнения)
    if (exercise.minWeight && exercise.maxWeight) {
      const weightRange = exercise.maxWeight - exercise.minWeight;
      const weightRatio = weightRange > 0 ? (avgWeight - exercise.minWeight) / weightRange : 0.5;
      qualityScore += Math.max(0, Math.min(weightRatio * 5, 5)); // До 5 баллов за работу в верхней части диапазона
    } else {
      // Если нет границ, даем баллы за абсолютный вес
      qualityScore += Math.min(avgWeight * 0.1, 8); // До 8 баллов
    }
  }
  
  // Баллы за повторения
  const reps = allSets
    .map(s => s.reps)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
    
  if (reps.length > 0) {
    const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length;
    
    // Оптимальные диапазоны повторений
    if (avgReps >= 8 && avgReps <= 12) {
      qualityScore += 3; // Оптимальный диапазон для силы
    } else if (avgReps >= 6 && avgReps <= 15) {
      qualityScore += 2; // Хороший диапазон
    } else if (avgReps >= 3 && avgReps <= 20) {
      qualityScore += 1; // Приемлемый диапазон
    }
    
    // Бонус за объем (общее количество повторений)
    const totalReps = reps.reduce((a, b) => a + b, 0);
    qualityScore += Math.min(totalReps * 0.1, 5); // До 5 баллов за объем
  }
  
  // Баллы за время/длительность
  const durations = allSets
    .map(s => s.duration)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
    
  if (durations.length > 0) {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    // Баллы за кардио нагрузки
    if (avgDuration >= 30) {
      qualityScore += Math.min(avgDuration * 0.05, 6); // До 6 баллов за длительность
    }
  }
  
  // Баллы за расстояние (для кардио)
  const distances = allSets
    .map(s => s.distance)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
    
  if (distances.length > 0) {
    const totalDistance = distances.reduce((a, b) => a + b, 0);
    qualityScore += Math.min(totalDistance * 0.001, 8); // До 8 баллов за расстояние
  }
  
  // Баллы за сложность упражнения
  if (exercise.muscleGroup && exercise.muscleGroup.length > 1) {
    qualityScore += exercise.muscleGroup.length * 0.5; // Многосуставные упражнения ценнее
  }
  
  // Бонус за последовательность (если время отдыха указано)
  if (exercise.restTime && typeof exercise.restTime === 'number') {
    qualityScore += 1; // Бонус за структурированный подход
  }
  
  return Math.round(qualityScore * 10) / 10; // Округляем до 1 знака после запятой
};

export const getUserStats = (store: any): UserStats[] => {
  const userStats = new Map();
  
  // Собираем статистику из пользовательских тренировок
  // Используем синхронный массив workouts вместо асинхронного getUserWorkouts()
  const userWorkouts = store.workouts.filter((workout: any) => 
    store.user && workout.createdBy === store.user.vkId.toString()
  );
  
  userWorkouts.forEach((workout: any) => {
    const createdBy = workout.createdBy;
    if (!userStats.has(createdBy)) {
      userStats.set(createdBy, {
        id: createdBy,
        workoutsCount: 0,
        totalExercises: 0,
        completedWorkouts: 0,
        qualityScore: 0
      });
    }
    
    const stats = userStats.get(createdBy);
    stats.workoutsCount++;
    stats.totalExercises += workout.exercises?.length || 0;
    
    // Вычисляем качественный балл для каждого упражнения в тренировке
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((workoutExercise: any) => {
        // Находим упражнение в store
        const exercise = store.exercises?.exercises?.find((e: any) => 
          String(e.id) === String(workoutExercise.exerciseId)
        );
        
        if (exercise && workoutExercise.sets) {
          const exerciseQuality = calculateExerciseQualityScore(exercise, workoutExercise.sets);
          stats.qualityScore += exerciseQuality;
        }
      });
    }
    
    if (workout.status === 'completed' || workout.completedAt) {
      stats.completedWorkouts++;
    }
  });
  
  const userStatsArray = Array.from(userStats.values()).map((stats: any) => {
    // Ищем пользователя в друзьях или используем текущего пользователя
    let user = store.friends.find((f: any) => String(f.id) === String(stats.id));
    if (!user && store.currentUser && String(store.currentUser.id) === String(stats.id)) {
      user = store.currentUser;
    }
    
    let firstName, lastName;
    if (user) {
      firstName = user.firstName || user.first_name || 'Неизвестный';
      lastName = user.lastName || user.last_name || 'пользователь';
    } else {
      firstName = 'Неизвестный';
      lastName = 'пользователь';
    }
    
    return {
      ...stats,
      name: `${firstName} ${lastName}`,
      photo_200: user?.photo_200 || user?.photo,
      first_name: firstName,
      last_name: lastName,
      // Новая формула: базовые баллы + качественный балл
      // завершенные тренировки * 10 + общее количество упражнений * 2 + качественный балл
      score: stats.completedWorkouts * 10 + stats.totalExercises * 2 + Math.round(stats.qualityScore)
    };
  });
  
  return userStatsArray
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({
      ...user,
      position: index + 1
    }));
};

export const getUserPosition = (store: any, userId: string | number): UserStats | null => {
  const leaderboardData = getUserStats(store);
  return leaderboardData.find(user => String(user.id) === String(userId)) || null;
};

export const getMedalIcon = (position: number) => {
  switch (position) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
};

export const getPositionColor = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
        if (position <= 3) {
            switch (position) {
                case 1:
                    return '#FFD700';
                case 2:
                    return '#C0C0C0';
                case 3:
                    return '#CD7F32';
                default:
                    return '#4CAF50';
            }
        }
        return '#4CAF50';
    }
    
    switch (position) {
        case 1:
            return '#FFD700';
        case 2:
            return '#C0C0C0';
        case 3:
            return '#CD7F32';
        default:
            return 'transparent';
    }
};
