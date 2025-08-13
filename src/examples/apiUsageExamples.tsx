// Пример использования API хуков в компонентах
// TODO: Этот файл можно удалить после интеграции с backend

import { FC, useState, useEffect } from 'react';
import { useApiData, useApiMutation, usePagination } from '../hooks/apiHooks';
import { apiService } from '../services/apiService';
import { Exercise, Workout } from '../types';

// Пример компонента для работы с упражнениями
const ExerciseListExample: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Использование хука для загрузки данных
  const {
    data: exercises,
    loading,
    error,
    fetchData: loadExercises,
  } = useApiData<Exercise[]>(apiService.getExercises, []);

  // Использование хука для создания упражнения
  const {
    mutate: createExercise,
    loading: creating,
    error: createError,
  } = useApiMutation<Omit<Exercise, 'id'>, Exercise>(apiService.createExercise);

  // Загрузка данных при изменении поиска
  useEffect(() => {
    loadExercises({ search: searchTerm });
  }, [searchTerm, loadExercises]);

  const handleCreateExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      const newExercise = await createExercise(exerciseData);
      console.log('Exercise created:', newExercise);
      // Перезагрузить список
      loadExercises({ search: searchTerm });
    } catch (err) {
      console.error('Failed to create exercise:', err);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Поиск упражнений..."
      />
      
      {exercises?.map(exercise => (
        <div key={exercise.id}>
          <h3>{exercise.name}</h3>
          <p>{exercise.description}</p>
        </div>
      ))}
      
      <button 
        onClick={() => handleCreateExercise({
          name: 'Новое упражнение',
          description: 'Описание',
          muscleGroup: ['Грудь'],
          steps: [],
          recommendations: [],
          createdBy: 1,
          createdAt: new Date(),
        })}
        disabled={creating}
      >
        {creating ? 'Создание...' : 'Создать упражнение'}
      </button>
      
      {createError && <div>Ошибка создания: {createError}</div>}
    </div>
  );
};

// Пример компонента с пагинацией
const WorkoutListExample: FC = () => {
  const {
    data: workouts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePagination<Workout>(apiService.getWorkouts, { limit: 10 });

  useEffect(() => {
    refresh(); // Загрузить первую страницу
  }, [refresh]);

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>
          <h3>{workout.title}</h3>
          <p>{new Date(workout.date).toLocaleDateString()}</p>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={() => loadMore()} disabled={loading}>
          {loading ? 'Загрузка...' : 'Загрузить еще'}
        </button>
      )}
      
      {error && <div>Ошибка: {error}</div>}
    </div>
  );
};

// Пример использования формы с валидацией
import { useForm } from '../hooks/apiHooks';

interface ExerciseFormData {
  name: string;
  description: string;
  muscleGroup: string[];
}

const ExerciseFormExample: FC = () => {
  const {
    values,
    errors,
    setValue,
    validate,
    isValid,
  } = useForm<ExerciseFormData>(
    {
      name: '',
      description: '',
      muscleGroup: [],
    },
    {
      name: (value: string) => 
        !value.trim() ? 'Название обязательно' : null,
      description: (value: string) => 
        value.length > 500 ? 'Описание слишком длинное' : null,
      muscleGroup: (value: string[]) => 
        value.length === 0 ? 'Выберите хотя бы одну группу мышц' : null,
    }
  );

  const handleSubmit = async () => {
    if (validate()) {
      try {
        // Отправка данных на сервер
        console.log('Отправка формы:', values);
      } catch (error) {
        console.error('Ошибка отправки:', error);
      }
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div>
        <input
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
          placeholder="Название упражнения"
        />
        {errors.name && <span>{errors.name}</span>}
      </div>
      
      <div>
        <textarea
          value={values.description}
          onChange={(e) => setValue('description', e.target.value)}
          placeholder="Описание"
        />
        {errors.description && <span>{errors.description}</span>}
      </div>
      
      <button type="submit" disabled={!isValid}>
        Создать упражнение
      </button>
    </form>
  );
};

export { ExerciseListExample, WorkoutListExample, ExerciseFormExample };
