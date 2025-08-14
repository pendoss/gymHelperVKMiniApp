import { FC, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  PanelHeaderButton,
  Group,
  Header,
  Div,
  Card,
  Text,
  Button,
  NavIdProps,
  Badge,
  Spacing,
  Avatar,
  Counter,
  Chip,
} from '@vkontakte/vkui';
import {
  Icon28EditOutline,
  Icon28CalendarOutline,
  Icon28LocationOutline,
  Icon28UserCircleOutline,
  Icon28CheckCircleOutline,
  Icon28DeleteOutline,
  Icon28ShareOutline,
} from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useStore } from '../stores/StoreContext';
import { NavBar } from '../components/NavBar';

export interface WorkoutDetailProps extends NavIdProps {}

export const WorkoutDetail: FC<WorkoutDetailProps> = observer(({ id }) => {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'workoutId'>();
  const store = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const workoutId = params?.workoutId || '1';
  // Ищем тренировку сначала в пользовательских тренировках, затем в общих
  const workout = store.getUserWorkouts().find((w: any) => w.id === workoutId) || 
                  store.workouts.find((w: any) => w.id === workoutId);

  if (!workout) {
    return (
      <Panel id={id}>
        <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
          Тренировка
        </PanelHeader>
        <Div>
          <Text>Тренировка не найдена</Text>
        </Div>
        <NavBar />
      </Panel>
    );
  }

  const workoutDetails = {
    ...workout,
    status: workout.completed ? 'completed' : (new Date(workout.date) < new Date() ? 'overdue' : 'planned'),
    totalSets: workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
    totalExercises: workout.exercises.length,
    muscleGroups: [...new Set(workout.exercises.flatMap(ex => ex.exercise.muscleGroup || []))],
  };

  const handleEdit = () => {
    routeNavigator.push(`/workout-edit/${workoutId}`);
  };

  const handleMarkCompleted = () => {
    // Проверяем, это пользовательская тренировка или общая
    const isUserWorkout = store.getUserWorkouts().find((w: any) => w.id === workoutId);
    if (isUserWorkout) {
      store.updateUserWorkout(workoutId, { completed: true, completedAt: new Date() });
    } else {
      store.markWorkoutAsCompleted(workoutId);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    // Проверяем, это пользовательская тренировка или общая
    const isUserWorkout = store.getUserWorkouts().find((w: any) => w.id === workoutId);
    if (isUserWorkout) {
      store.deleteUserWorkout(workoutId);
    } else {
      store.deleteWorkout(workoutId);
    }
    routeNavigator.back();
  };

  const handleShare = async () => {
    const shareText = `Тренировка: ${workout.title}\n` +
      `📅 ${new Date(workout.date).toLocaleDateString('ru-RU')} в ${workout.time}\n` +
      `🏋️ ${workoutDetails.totalExercises} упражнений, ${workoutDetails.totalSets} подходов\n` +
      `💪 Группы мышц: ${workoutDetails.muscleGroups.join(', ')}\n` +
      `📍 ${workout.gym}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Моя тренировка',
          text: shareText
        });
      } catch (error) {
        console.log('Sharing cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Информация о тренировке скопирована в буфер обмена!');
      } catch (error) {
        alert('Не удалось скопировать информацию');
      }
    }
  };

  const handleExerciseClick = (exerciseId: string) => {
    routeNavigator.push(`/exercise-detail/${exerciseId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'overdue': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнена';
      case 'overdue': return 'Просрочена';
      default: return 'Запланирована';
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader
        before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}
        after={
          <div style={{ display: 'flex', gap: 8 }}>
            <PanelHeaderButton onClick={handleShare} aria-label="Поделиться">
              <Icon28ShareOutline />
            </PanelHeaderButton>
            <PanelHeaderButton onClick={handleEdit} aria-label="Редактировать">
              <Icon28EditOutline />
            </PanelHeaderButton>
          </div>
        }
      > 
        <span className="train-sync-gradient-text">Тренировка</span>
      </PanelHeader>

      <Group>
        <Div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text weight="1" style={{ fontSize: 24 }}>{workout.title}</Text>
            <Badge
              style={{ 
                backgroundColor: getStatusColor(workoutDetails.status),
                color: 'white'
              }}
            >
              {getStatusText(workoutDetails.status)}
            </Badge>
          </div>
          {workout.description && (
            <Text style={{ fontSize: 16, opacity: 0.7 }}>{workout.description}</Text>
          )}
        </Div>
      </Group>

      <Group header={<Header size="s">Информация о тренировке</Header>}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 12,
            marginBottom: 20
          }}>
            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon28CalendarOutline style={{ color: 'var(--vkui--color_accent)', fontSize: 32 }} />
                <div>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                    {new Date(workout.date).toLocaleDateString('ru-RU')}
                  </Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, display: 'block' }}>{workout.time}</Text>
                </div>
              </div>
            </Card>
            
            <Card mode="outline" className="enhanced-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon28LocationOutline style={{ color: '#9C27B0', fontSize: 32 }} />
                <div>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#9C27B0' }}>
                    {workout.gym}
                  </Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, display: 'block' }}>зал</Text>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'block' }}>
              Статистика тренировки
            </Text>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                           padding: 12, background: 'var(--vkui--color_background_secondary)', 
                           borderRadius: 8 }}>
                <Text style={{ fontSize: 14, opacity: 0.8 }}>Количество упражнений</Text>
                <Counter appearance="accent-green" mode="primary">
                  {workoutDetails.totalExercises}
                </Counter>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                           padding: 12, background: 'var(--vkui--color_background_secondary)', 
                           borderRadius: 8 }}>
                <Text style={{ fontSize: 14, opacity: 0.8 }}>Общее количество подходов</Text>
                <Counter appearance="accent-green" mode="primary">
                  {workoutDetails.totalSets}
                </Counter>
              </div>
            </div>
          </div>

          <div>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, display: 'block' }}>
              Группы мышц
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {workoutDetails.muscleGroups.map((muscle, idx) => (
                <Chip 
                  key={idx} 
                  removable={false}
                  style={{ 
                    padding: '6px',
                    borderRadius: 12,
                    background: 'var(--train-sync-gradient)',
                  }}
                >
                  <p style={{ color: "white", fontWeight: 'bold'}}>{muscle}</p>
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Group>

      <Group header={<Header size="s">Упражнения ({workoutDetails.totalExercises})</Header>}>
        <Div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {workout.exercises.map((workoutExercise, idx) => (
              <Card 
                key={workoutExercise.exerciseId} 
                mode="outline" 
                className="enhanced-card" 
                style={{ 
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => handleExerciseClick(workoutExercise.exerciseId)}
              >
                <div style={{
                  padding: 16,
                  background: 'var(--train-sync-gradient)',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {idx + 1}. {workoutExercise.exercise.name}
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {workoutExercise.exercise.muscleGroup?.map((group, groupIdx) => (
                        <Badge 
                          key={groupIdx}
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: 12
                          }}
                        >
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: 'var(--vkui--color_accent)' }}>
                    Подходы ({workoutExercise.sets.length})
                  </Text>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {workoutExercise.sets.map((set, setIdx) => (
                      <div key={set.id} style={{
                        padding: 16,
                        background: 'var(--vkui--color_background_secondary)',
                        borderRadius: 12,
                        border: '1px solid var(--vkui--color_separator_primary)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vkui--color_accent)' }}>
                            Подход #{setIdx + 1}
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

                  {workoutExercise.notes && (
                    <Card mode="outline" style={{ 
                      marginTop: 12,
                      padding: 16,
                      background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(233, 30, 99, 0.05) 100%)',
                      border: '1px solid rgba(156, 39, 176, 0.1)'
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: 'var(--vkui--color_accent)' }}>
                        💡 Заметки:
                      </Text>
                      <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                        {workoutExercise.notes}
                      </Text>
                    </Card>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Div>
      </Group>

      {workout.participants && workout.participants.length > 0 && (
        <Group header={<Header size="s">👥 Участники ({workout.participants.length})</Header>}>
          <Div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {workout.participants.map((participant) => (
                <Card key={participant.userId} mode="outline" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar 
                      src={participant.user.photo_200} 
                      size={40}
                      fallbackIcon={<Icon28UserCircleOutline />}
                    />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                        {participant.user.first_name} {participant.user.last_name}
                      </Text>
                      {participant.user.favoriteGym && (
                        <Text style={{ fontSize: 14, opacity: 0.7 }}>
                          {participant.user.favoriteGym}
                        </Text>
                      )}
                    </div>
                    <Badge 
                      style={{ 
                        backgroundColor: participant.status === 'accepted' ? '#4CAF50' : 
                                        participant.status === 'pending' ? '#FF9800' : '#F44336',
                        color: 'white'
                      }}
                    >
                      {participant.status === 'accepted' ? 'Принял' : 
                       participant.status === 'pending' ? 'Ожидает' : 'Отклонил'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Div>
        </Group>
      )}

      <Group>
        <Div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {!workoutDetails.status.includes('completed') && (
              <Button 
                size="l" 
                stretched 
                mode="primary"
                before={<Icon28CheckCircleOutline />}
                onClick={handleMarkCompleted}
                style={{ backgroundColor: '#4CAF50' }}
              >
                Отметить выполненной
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button 
              size="l" 
              stretched 
              mode="secondary"
              before={<Icon28DeleteOutline />}
              onClick={handleDelete}
              style={{ borderColor: '#F44336', color: '#F44336' }}
            >
              Удалить
            </Button>
            <Button 
              size="l" 
              stretched 
              mode="primary"
              before={<Icon28EditOutline />}
              onClick={handleEdit}
            >
              Править
            </Button>
          </div>
        </Div>
      </Group>

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ 
            margin: 16,
            padding: 24,
            maxWidth: 400,
            width: '100%'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Удалить тренировку?
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 24, textAlign: 'center', opacity: 0.8 }}>
              Это действие нельзя отменить. Вся информация о тренировке будет удалена.
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button 
                size="l" 
                stretched 
                mode="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </Button>
              <Button 
                size="l" 
                stretched 
                style={{ backgroundColor: '#F44336', color: 'white' }}
                onClick={confirmDelete}
              >
                Удалить
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Spacing size={80} />
      <NavBar />
    </Panel>
  );
});
