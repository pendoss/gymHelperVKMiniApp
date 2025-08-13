# GymHelper VK Mini App - API Documentation

## Общее описание

API для VK Mini App "TrainSync" - приложения для управления тренировками и фитнес-активностями.

**Base URL:** `https://your-backend-domain.com/api/v1`

**Аутентификация:** Все запросы должны содержать заголовок `Authorization` с VK User Token.

## Модели данных

### User
```typescript
interface User {
  id: number;
  vk_id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  city?: {
    title: string;
  };
  level: 'beginner' | 'amateur' | 'advanced' | 'expert';
  favoriteGym?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Exercise
```typescript
interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string[];
  equipment?: string[];
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  restTime?: number; // время отдыха в секундах
  minWeight?: number; // минимальный рабочий вес
  maxWeight?: number; // максимальный рабочий вес
  steps: ExerciseStep[];
  recommendations: ExerciseRecommendation[];
  createdBy: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface ExerciseStep {
  id: string;
  stepNumber: number;
  description: string;
}

interface ExerciseRecommendation {
  id: string;
  text: string;
}
```

### Workout
```typescript
interface Workout {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO 8601 date
  time: string; // HH:mm format
  estimatedDuration?: number; // в минутах
  duration?: number; // фактическое время в минутах
  gym: string;
  exercises: WorkoutExercise[];
  participants: WorkoutParticipant[];
  completed?: boolean;
  completedAt?: string; // ISO 8601
  createdBy: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isTemplate: boolean;
}

interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: Set[];
  notes?: string;
}

interface Set {
  id: string;
  reps?: number;
  weight?: number; // в кг
  duration?: number; // в секундах
  distance?: number; // в метрах
}

interface WorkoutParticipant {
  userId: number;
  user: User;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  invitedAt: string; // ISO 8601
  respondedAt?: string; // ISO 8601
}
```

### Friend
```typescript
interface Friend {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  isOnline: boolean;
  gym?: string;
  workoutsThisWeek: number;
  lastWorkout?: string; // ISO 8601
  nextWorkout?: string; // ISO 8601
  status: 'in_gym' | 'looking_for_partner' | 'finished_workout' | 'resting';
}
```

### Achievement
```typescript
interface Achievement {
  workoutsThisMonth: number;
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
}
```

## Endpoints

### Authentication

#### POST /auth/vk-login
Аутентификация пользователя через VK
```typescript
// Request
{
  vk_user_id: number;
  vk_access_token: string;
  user_info: {
    first_name: string;
    last_name: string;
    photo_200?: string;
    city?: { title: string };
  }
}

// Response 200
{
  user: User;
  access_token: string;
}
```

### Users

#### GET /users/me
Получить информацию о текущем пользователе
```typescript
// Response 200
{
  user: User;
  achievements: Achievement;
}
```

#### PUT /users/me
Обновить профиль пользователя
```typescript
// Request
{
  level?: 'beginner' | 'amateur' | 'advanced' | 'expert';
  favoriteGym?: string;
}

// Response 200
{
  user: User;
}
```

#### GET /users/friends
Получить список друзей
```typescript
// Query Parameters
// ?status=online|in_gym|looking_for_partner
// ?search=string

// Response 200
{
  friends: Friend[];
  total: number;
}
```

### Exercises

#### GET /exercises
Получить список упражнений
```typescript
// Query Parameters
// ?page=1&limit=20
// ?search=string
// ?muscleGroup=string
// ?equipment=string
// ?createdBy=number

// Response 200
{
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
}
```

#### GET /exercises/:id
Получить упражнение по ID
```typescript
// Response 200
{
  exercise: Exercise;
}

// Response 404
{
  error: "Exercise not found";
}
```

#### POST /exercises
Создать новое упражнение
```typescript
// Request
{
  name: string;
  description: string;
  muscleGroup: string[];
  equipment?: string[];
  instructions?: string;
  restTime?: number;
  minWeight?: number;
  maxWeight?: number;
  steps: {
    stepNumber: number;
    description: string;
  }[];
  recommendations: {
    text: string;
  }[];
}

// Response 201
{
  exercise: Exercise;
}
```

#### PUT /exercises/:id
Обновить упражнение
```typescript
// Request (все поля опциональны)
{
  name?: string;
  description?: string;
  muscleGroup?: string[];
  equipment?: string[];
  instructions?: string;
  restTime?: number;
  minWeight?: number;
  maxWeight?: number;
  steps?: {
    id?: string; // если есть - обновить, если нет - создать
    stepNumber: number;
    description: string;
  }[];
  recommendations?: {
    id?: string;
    text: string;
  }[];
}

// Response 200
{
  exercise: Exercise;
}
```

#### DELETE /exercises/:id
Удалить упражнение
```typescript
// Response 204
// Нет тела ответа

// Response 403
{
  error: "You can only delete your own exercises";
}
```

#### POST /exercises/:id/media
Загрузить медиа для упражнения
```typescript
// Request: multipart/form-data
// file: File (image или video)
// type: "image" | "video"

// Response 200
{
  exercise: Exercise; // с обновленными imageUrl/videoUrl
}
```

### Workouts

#### GET /workouts
Получить список тренировок
```typescript
// Query Parameters
// ?page=1&limit=20
// ?status=upcoming|past|templates
// ?search=string
// ?date_from=YYYY-MM-DD
// ?date_to=YYYY-MM-DD
// ?gym=string

// Response 200
{
  workouts: Workout[];
  total: number;
  page: number;
  limit: number;
}
```

#### GET /workouts/:id
Получить тренировку по ID
```typescript
// Response 200
{
  workout: Workout;
}
```

#### POST /workouts
Создать новую тренировку
```typescript
// Request
{
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  estimatedDuration?: number;
  gym: string;
  exercises: {
    exerciseId: string;
    sets: {
      reps?: number;
      weight?: number;
      duration?: number;
      distance?: number;
    }[];
    notes?: string;
  }[];
  participants?: number[]; // user IDs
  isTemplate: boolean;
}

// Response 201
{
  workout: Workout;
}
```

#### PUT /workouts/:id
Обновить тренировку
```typescript
// Request (все поля опциональны)
{
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  estimatedDuration?: number;
  gym?: string;
  exercises?: {
    exerciseId: string;
    sets: {
      id?: string;
      reps?: number;
      weight?: number;
      duration?: number;
      distance?: number;
    }[];
    notes?: string;
  }[];
  participants?: number[];
}

// Response 200
{
  workout: Workout;
}
```

#### DELETE /workouts/:id
Удалить тренировку
```typescript
// Response 204
```

#### POST /workouts/:id/complete
Отметить тренировку как завершенную
```typescript
// Request
{
  actualDuration?: number; // фактическое время тренировки в минутах
  exercises: {
    exerciseId: string;
    sets: {
      id: string;
      actualReps?: number;
      actualWeight?: number;
      actualDuration?: number;
      actualDistance?: number;
    }[];
    notes?: string;
  }[];
}

// Response 200
{
  workout: Workout;
}
```

#### POST /workouts/:id/participants/:userId/respond
Ответить на приглашение в тренировку
```typescript
// Request
{
  status: 'accepted' | 'declined';
}

// Response 200
{
  participant: WorkoutParticipant;
}
```

### Calendar

#### GET /calendar
Получить календарь тренировок
```typescript
// Query Parameters
// ?month=YYYY-MM
// ?year=YYYY

// Response 200
{
  days: {
    date: string; // YYYY-MM-DD
    hasWorkout: boolean;
    workouts: Workout[]; // краткая информация
  }[];
}
```

### Statistics

#### GET /statistics/me
Получить статистику пользователя
```typescript
// Query Parameters
// ?period=week|month|year
// ?year=YYYY
// ?month=MM

// Response 200
{
  achievements: Achievement;
  workoutsByMuscleGroup: {
    muscleGroup: string;
    count: number;
  }[];
  workoutsByMonth: {
    month: string; // YYYY-MM
    count: number;
  }[];
  averageWorkoutDuration: number; // в минутах
  mostUsedExercises: {
    exercise: Exercise;
    count: number;
  }[];
}
```

## Коды ошибок

### 400 Bad Request
```typescript
{
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
}
```

### 401 Unauthorized
```typescript
{
  error: "Unauthorized";
  message: "Invalid or expired token";
}
```

### 403 Forbidden
```typescript
{
  error: "Forbidden";
  message: "Access denied";
}
```

### 404 Not Found
```typescript
{
  error: "Not Found";
  message: "Resource not found";
}
```

### 422 Unprocessable Entity
```typescript
{
  error: "Validation Error";
  details: {
    field: string;
    message: string;
  }[];
}
```

### 500 Internal Server Error
```typescript
{
  error: "Internal Server Error";
  message: "Something went wrong";
}
```

## Примеры использования

### Создание тренировки
```javascript
const workout = await fetch('/api/v1/workouts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Тренировка груди',
    description: 'Интенсивная тренировка грудных мышц',
    date: '2024-01-15',
    time: '18:00',
    gym: 'FitnessPro',
    exercises: [
      {
        exerciseId: '1',
        sets: [
          { reps: 12, weight: 80 },
          { reps: 10, weight: 85 },
          { reps: 8, weight: 90 }
        ],
        notes: 'Хорошая техника'
      }
    ],
    participants: [2, 3],
    isTemplate: false
  })
});
```

### Получение списка упражнений с фильтрацией
```javascript
const exercises = await fetch('/api/v1/exercises?muscleGroup=Грудь&search=жим', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Отметка тренировки как завершенной
```javascript
const completed = await fetch(`/api/v1/workouts/${workoutId}/complete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    actualDuration: 75,
    exercises: [
      {
        exerciseId: '1',
        sets: [
          { id: '1', actualReps: 12, actualWeight: 80 },
          { id: '2', actualReps: 10, actualWeight: 85 }
        ]
      }
    ]
  })
});
```

## Заметки по реализации

1. **Пагинация**: Для всех списочных endpoint'ов используется пагинация
2. **Фильтрация**: Поддерживается фильтрация по различным параметрам
3. **Поиск**: Текстовый поиск по названиям и описаниям
4. **Валидация**: Все входящие данные должны валидироваться
5. **Права доступа**: Пользователи могут редактировать только свои упражнения и тренировки
6. **Медиа файлы**: Для загрузки изображений и видео используются отдельные endpoint'ы
7. **Real-time**: Рекомендуется использовать WebSocket для уведомлений о приглашениях
