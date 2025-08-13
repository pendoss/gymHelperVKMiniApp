import { FC, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  Header,
  Div,
  Card,
  Text,
  NavIdProps,
  Spacing,
  Chip,
  Button,
} from '@vkontakte/vkui';
import {
  Icon28EditOutline,
  Icon28ClockOutline,
  Icon28VideoOutline,
  Icon28CheckCircleOutline,
} from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useStore } from '../stores/StoreContext';
import { NavBar } from '../components/NavBar';
import { SetSelector } from '../components/SetSelector';
import { Set } from '../types';

export interface ExerciseDetailProps extends NavIdProps {}

export const ExerciseDetail: FC<ExerciseDetailProps> = observer(({ id }) => {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'exerciseId'>();
  const store = useStore();
  const [showSetSelector, setShowSetSelector] = useState(false);

  // Получаем exerciseId из параметров роута
  const exerciseId = params?.exerciseId || '1';
  const exercise = store.exercises.find((e: any) => e.id === exerciseId);

  if (!exercise) {
    return (
      <Panel id={id}>
        <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
          Упражнение
        </PanelHeader>
        <Div>
          <Text>Упражнение не найдено</Text>
        </Div>
        <NavBar />
      </Panel>
    );
  }

  const workoutsWithExercise = store.workouts.filter(workout => 
    workout.exercises.some(workoutExercise => workoutExercise.exerciseId === exerciseId)
  );

  const workoutGroups = workoutsWithExercise.map(workout => {
    const workoutExercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!workoutExercise) return null;
    
    return {
      workoutId: workout.id,
      workoutTitle: workout.title,
      workoutDate: workout.date,
      sets: workoutExercise.sets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }))
    };
  }).filter(Boolean);

  const sortedWorkoutGroups = workoutGroups.sort((a, b) => 
    new Date(b!.workoutDate).getTime() - new Date(a!.workoutDate).getTime()
  );

const calculateExerciseStats = () => {
    const allSets = sortedWorkoutGroups.flatMap(group => group!.sets);
    const totalSets = allSets.length;
    const avgSetsPerWorkout = totalSets > 0 ? Math.round(totalSets / sortedWorkoutGroups.length) : 3;

    const repsArr = allSets
        .map(s => s.reps)
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const repsRange = repsArr.length > 0
        ? `${Math.min(...repsArr)}-${Math.max(...repsArr)}`
        : '8-12';
    const avgReps = repsArr.length ? Math.round(repsArr.reduce((a, b) => a + b, 0) / repsArr.length) : undefined;

    // Вес
    const weights = allSets
        .map(s => s.weight)
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const avgWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : undefined;
    const histMaxWeight = weights.length ? Math.max(...weights) : undefined;
    const hasRange = typeof exercise.minWeight === 'number' && typeof exercise.maxWeight === 'number' && exercise.maxWeight > 0;
    const weightRange = hasRange
        ? `${exercise.minWeight}-${exercise.maxWeight} кг`
        : (weights.length ? `${Math.min(...weights)}-${Math.max(...weights)} кг` : '60-80 кг');

    // Время отдыха
    const restSeconds = typeof exercise.restTime === 'number' ? exercise.restTime : undefined;
    const restTimeDisplay = restSeconds ? `${restSeconds} сек` : '2-3 сек';

    // Длительность сета
    const durations = allSets
        .map(s => s.duration)
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : undefined;

    // Оценка сложности по введенным пользователем параметрам
    // Набираем очки сложности 
    let score = 0;

    // Вес: ближе к верхней границе — сложнее
    if (avgWeight !== undefined) {
        let ratio: number | undefined;
        if (hasRange) {
            const span = Math.max(1, (exercise.maxWeight as number) - (exercise.minWeight as number));
            ratio = (avgWeight - (exercise.minWeight as number)) / span; 
        } else if (histMaxWeight) {
            ratio = avgWeight / histMaxWeight;
        }
        if (ratio !== undefined) {
            if (ratio >= 0.85) score += 2;
            else if (ratio >= 0.6) score += 1;
        }
    } else {
        score += 1;
    }

    // Повторы
    if (avgReps !== undefined) {
        if (avgReps <= 5) score += 2;
        else if (avgReps <= 10) score += 1;
        else if (avgReps >= 15) score -= 1;
    }

    // Отдых
    if (restSeconds !== undefined) {
        if (restSeconds <= 45) score += 2;
        else if (restSeconds <= 90) score += 1;
        else if (restSeconds >= 150) score -= 1;
    }

    // Длительность
    if (avgDuration !== undefined) {
        if (avgDuration >= 90) score += 1;
    }

    // Объем
    if (avgSetsPerWorkout >= 5) score += 1;
    else if (avgSetsPerWorkout <= 2) score -= 1;

    let difficulty: 'Легкий' | 'Средний' | 'Сложный';
    if (score >= 5) difficulty = 'Сложный';
    else if (score >= 2) difficulty = 'Средний';
    else difficulty = 'Легкий';

    return {
        sets: avgSetsPerWorkout,
        reps: repsRange,
        restTime: restTimeDisplay,
        weight: weightRange,
        difficulty,
        muscleGroups: exercise.muscleGroup && exercise.muscleGroup.length > 0 ? exercise.muscleGroup : ['Не указано'],
    };
};

  const exerciseStats = calculateExerciseStats();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Легкий':
        return '#4CAF50';
      case 'Средний':
        return '#FF9800';
      case 'Сложный':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };
  //TODO: кнопку надо добавить к конце концов
  //добавил
//   const handleEdit = () => {
//     routeNavigator.push('/exercise-edit');
//   };


  const handleSetSelectionComplete = (selectedSets: Set[]) => {
    store.setPendingExerciseForWorkout(exercise, selectedSets);
    routeNavigator.push('/create');
  };


  if (showSetSelector) {
    return (
      <SetSelector
        id={id}
        exerciseName={exercise.name}
        existingSets={sortedWorkoutGroups.map(group => ({
          workoutTitle: group!.workoutTitle,
          workoutDate: group!.workoutDate,
          sets: group!.sets
        }))}
        onConfirm={handleSetSelectionComplete}
        onBack={() => setShowSetSelector(false)}
      />
    );
  }

  return (
    <Panel id={id}>
      <PanelHeader
        before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}
      >
        <span className="train-sync-gradient-text">Упражнение</span>
      </PanelHeader>
      <Group>
        <Div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text weight="1" style={{ fontSize: 24 }}>{exercise.name}</Text>
            <Button
              size="s"
              mode="secondary"
              before={<Icon28EditOutline />}
              onClick={() => routeNavigator.push(`/exercise-edit/${exerciseId}`)}
              
            >
            </Button>
          </div>
          <Text style={{ fontSize: 16, opacity: 0.7 }}>{exercise.muscleGroup.join(', ')}</Text>
        </Div>
      </Group>
      {(exercise.videoUrl || exercise.videoFile) && (
        <Group>
          <Card mode="outline">
            <div style={{ 
              height: 200, 
              background: 'var(--train-sync-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderRadius: '8px 8px 0 0'
            }}>
              <Icon28VideoOutline 
                style={{ 
                  width: 48, 
                  height: 48, 
                  color: 'white',
                  opacity: 0.8,
                  cursor: 'pointer'
                }} 
              />
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                color: 'white',
                fontSize: 14,
                opacity: 0.9
              }}>
                Видео демонстрация
              </div>
            </div>
          </Card>
        </Group>
      )}
      <Group header={<Header size="s">Рекомендации по выполнению</Header>}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 12,
            marginBottom: 20
          }}>
            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center', alignContent:"center"}}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                    {exerciseStats.sets}
                  </Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, display: 'block' }}>подхода</Text>
            </Card>
            
            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center',  alignContent:"center" }}>
                <Text style={{ 
                  backgroundColor: 'var(--vkui--color_accent)', 
                  fontSize: 24,
                  minWidth: 60,
                  fontWeight: "bold"
                  
                }}>
                  {exerciseStats.reps}
                </Text>
                <Text style={{ fontSize: 12, opacity: 0.7}}>повторений</Text>
            </Card>

            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon28ClockOutline style={{ color: '#FF9800', fontSize: 32 }} />
                <div>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF9800' }}>
                    {exercise.restTime ? `${exercise.restTime} сек` : exerciseStats.restTime}
                  </Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, display: 'block' }}>отдых</Text>
                </div>
              </div>
            </Card>

            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon28EditOutline style={{ color: '#9C27B0', fontSize: 32 }} />
                <div>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#9C27B0' }}>
                    {exercise.minWeight && exercise.maxWeight 
                      ? `${exercise.minWeight}-${exercise.maxWeight} кг`
                      : exerciseStats.weight}
                  </Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, display: 'block' }}>рабочий вес</Text>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'block' }}>
              Характеристики упражнения
            </Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                           padding: 12, background: 'var(--vkui--color_background_secondary)', 
                           borderRadius: 8 }}>
                <Text style={{ fontSize: 14, opacity: 0.8 }}>Уровень сложности</Text>
                <Chip
                    removable={false}
                  style={{ 
                    backgroundColor: getDifficultyColor(exerciseStats.difficulty),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 16
                  }}
                >
                  <p style={{color: "white"}}>{exerciseStats.difficulty}</p>
                </Chip>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                           padding: 12, background: 'var(--vkui--color_background_secondary)', 
                           borderRadius: 8 }}>
                <Text style={{ fontSize: 14, opacity: 0.8 }}>Оборудование</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {exercise.equipment && exercise.equipment.length > 0 ? (
                    exercise.equipment.map((eq, index) => (
                      <Chip key={index} removable={false} style={{ padding: '4px 12px', borderRadius: 16 }}>
                        {eq}
                      </Chip>
                    ))
                  ) : (
                    <Chip removable={false} style={{ padding: '4px 12px', borderRadius: 16 }}>
                      Не указано
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'block' }}>
              Задействованные мышцы
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {exerciseStats.muscleGroups.map((muscle: string, idx: number) => (
                <Chip 
                  key={idx} 
                    removable={false}
                  style={{ 
                    padding: '6px 12px',
                    borderRadius: 16,
                    background: 'var(--train-sync-gradient)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  <p style={{color: "white" }}>{muscle}</p>
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Group>
      <Group header={<Header size="s">Описание</Header>}>
        <Div>
          <Text style={{ lineHeight: 1.5 }}>{exercise.description}</Text>
        </Div>
      </Group>
      <Group header={<Header size="s">Пошаговая техника выполнения</Header>}>
        <Div>
          {exercise.steps && exercise.steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {exercise.steps.map((step) => (
                <Card key={step.id} mode="outline" className="enhanced-card" style={{ padding: 16 }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 16, 
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--train-sync-gradient)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 'bold',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                    }}>
                      {step.stepNumber}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        lineHeight: 1.6,
                        color: 'var(--vkui--color_text_primary)'
                      }}>
                        {step.description}
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)',
              opacity: 0.7
            }}>
              <Text>
                Пошаговая техника не добавлена
              </Text>
            </Card>
          )}
        </Div>
      </Group>
      <Group header={<Header size="s">💡 Советы и рекомендации</Header>}>
        <Div>
          {exercise.recommendations && exercise.recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {exercise.recommendations.map((recommendation) => (
                <Card key={recommendation.id} mode="outline" style={{ 
                  padding: 16,
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(233, 30, 99, 0.05) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.1)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'flex-start'
                  }}>
                    <Icon28CheckCircleOutline style={{
                      color: '#9C27B0',
                      fontSize: 20,
                      marginTop: 2,
                      flexShrink: 0
                    }} />
                    <Text style={{ 
                      flex: 1, 
                      lineHeight: 1.6,
                      fontSize: 15,
                      color: 'var(--vkui--color_text_primary)'
                    }}>
                      {recommendation.text}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card mode="outline" style={{ 
              padding: 24, 
              textAlign: 'center',
              background: 'var(--vkui--color_background_secondary)',
              opacity: 0.7
            }}>
              <Text>
                Рекомендации не добавлены
              </Text>
            </Card>
          )}
        </Div>
      </Group>
      {sortedWorkoutGroups.length > 0 && (
        <Group header={<Header size="s">📊 История выполнения по тренировкам</Header>}>
          <Div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {sortedWorkoutGroups.map((workoutGroup) => (
                <Card key={workoutGroup!.workoutId} mode="outline" className="enhanced-card" style={{ 
                  padding: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: 16,
                    background: 'var(--train-sync-gradient)',
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {workoutGroup!.workoutTitle}
                      </Text>
                      <Chip removable= {false} style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: 12
                      }}>
                        <p style={{color:"white", fontWeight:"bold"}}>{new Date(workoutGroup!.workoutDate).toLocaleDateString('ru-RU')}</p>
                      </Chip>
                    </div>
                  </div>
                  
                  <div style={{ padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: 'var(--vkui--color_accent)' }}>
                      Подходы ({workoutGroup!.sets.length})
                    </Text>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {workoutGroup!.sets.map((set) => (
                        <div key={set.id} style={{
                          padding: 16,
                          background: 'var(--vkui--color_background_secondary)',
                          borderRadius: 12,
                          border: '1px solid var(--vkui--color_separator_primary)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                              Подход #{set.setNumber}
                            </Text>
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                            gap: 12
                          }}>
                            {set.reps && (
                              <div style={{
                                padding: 12,
                                background: 'linear-gradient(135deg, #2196F3, #21CBF3)',
                                borderRadius: 8,
                                textAlign: 'center',
                                color: 'white'
                              }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                                  {set.reps}
                                </Text>
                                <Text style={{ fontSize: 11, opacity: 0.9, display: 'block' }}>
                                  повторений
                                </Text>
                              </div>
                            )}
                            
                            {set.weight && (
                              <div style={{
                                padding: 12,
                                background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
                                borderRadius: 8,
                                textAlign: 'center',
                                color: 'white'
                              }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                                  {set.weight}
                                </Text>
                                <Text style={{ fontSize: 11, opacity: 0.9, display: 'block' }}>
                                  кг
                                </Text>
                              </div>
                            )}
                            
                            {set.duration && (
                              <div style={{
                                padding: 12,
                                background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
                                borderRadius: 8,
                                textAlign: 'center',
                                color: 'white'
                              }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                                  {Math.floor(set.duration / 60)}:{(set.duration % 60).toString().padStart(2, '0')}
                                </Text>
                                <Text style={{ fontSize: 11, opacity: 0.9, display: 'block' }}>
                                  время
                                </Text>
                              </div>
                            )}
                            
                            {set.distance && (
                              <div style={{
                                padding: 12,
                                background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                                borderRadius: 8,
                                textAlign: 'center',
                                color: 'white'
                              }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                                  {set.distance}
                                </Text>
                                <Text style={{ fontSize: 11, opacity: 0.9, display: 'block' }}>
                                  метров
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {sortedWorkoutGroups.length === 0 && (
              <Card mode="outline" style={{ 
                padding: 24, 
                textAlign: 'center',
                background: 'var(--vkui--color_background_secondary)',
                opacity: 0.7
              }}>
                <Text style={{ fontSize: 16 }}>
                  Данные о подходах появятся после выполнения упражнения в тренировках
                </Text>
              </Card>
            )}
          </Div>
        </Group>
      )}

      {/* <Group>
        <Div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button 
              size="l" 
              stretched 
              className="train-sync-accent-bg"
              before={<Icon28AddCircleOutline />}
              onClick={handleAddToWorkout}
            >
              Добавить в тренировку
            </Button>
          </div>
          <Spacing size={8} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Button 
              size="l" 
              stretched 
              mode="outline"
              before={<Icon28PlayOutline />}
              onClick={handleStartWorkout}
              style={{ borderColor: 'var(--vkui--color_accent)', color: 'var(--vkui--color_accent)' }}
            >
              Начать тренировку
            </Button>
          </div>
        </Div>
      </Group> */}
      <Spacing size={80} />
    </Panel>
  );
});
