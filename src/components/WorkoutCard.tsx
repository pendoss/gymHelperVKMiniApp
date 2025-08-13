import { FC, useState } from 'react';
import { Card, Text, Div, Button, Avatar, Spacing } from '@vkontakte/vkui';
import {
  Icon28EditOutline,
  Icon28DeleteOutline,
  Icon28ChevronDownOutline,
  Icon28ChevronUpOutline,
  Icon28InfoOutline,
} from '@vkontakte/icons';
import { Workout } from '../types';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';

interface WorkoutCardProps {
  workout: Workout;
  expandable?: boolean;
}

export const WorkoutCard: FC<WorkoutCardProps> = observer(({ workout, expandable = true }) => {
  const [expanded, setExpanded] = useState(false);
  const store = useStore();
  const routeNavigator = useRouteNavigator();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'declined': return '#F44336';
      case 'in_progress': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getParticipantStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Принял';
      case 'pending': return 'Ожидает';
      case 'declined': return 'Отклонил';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Завершил';
      default: return status;
    }
  };

  const handleEdit = () => {
    routeNavigator.push(`/edit-workout/${workout.id}`);
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить эту тренировку?')) {
      store.deleteWorkout(workout.id);
    }
  };

  const handleClick = () => {
    if (expandable) {
      setExpanded(!expanded);
    } else {
      routeNavigator.push(`/workout-detail/${workout.id}`);
    }
  };

  const handleCardClick = () => {
    routeNavigator.push(`/workout-detail/${workout.id}`);
  };

  return (
    <Card mode="outline" className="workout-card" style={{ marginBottom: 12 }}>
      <Div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            cursor: expandable ? 'pointer' : 'default',
          }}
          onClick={handleClick}
        >
          <div style={{ flex: 1 }}>
            <Text weight="2" style={{ marginBottom: 4 }}>
              {workout.title}
            </Text>
            <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
              {formatDate(workout.date)} • {workout.time}
            </Text>
            <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
              {workout.gym} • {workout.exercises.length} упражнений
            </Text>
            {workout.participants.length > 0 && (
              <Text style={{ fontSize: 14, opacity: 0.7 }}>
                Участников: {workout.participants.length}
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button 
              size="s" 
              mode="tertiary" 
              before={<Icon28InfoOutline />} 
              onClick={handleCardClick}
              aria-label="Подробнее о тренировке"
            />
            <Button 
              size="s" 
              mode="tertiary" 
              before={<Icon28EditOutline />} 
              onClick={handleEdit}
              aria-label="Редактировать тренировку"
            />
            <Button 
              size="s" 
              mode="tertiary" 
              before={<Icon28DeleteOutline />} 
              onClick={handleDelete}
              aria-label="Удалить тренировку"
            />
            {expandable && (
              <Button
                size="s"
                mode="tertiary"
                before={expanded ? <Icon28ChevronUpOutline /> : <Icon28ChevronDownOutline />}
                aria-label={expanded ? "Свернуть" : "Развернуть"}
              />
            )}
          </div>
        </div>

        {expanded && (
          <>
            <Spacing size={16} />
            
            <div style={{ marginBottom: 16 }}>
              <Text weight="2" style={{ marginBottom: 8, fontSize: 16 }}>
                Упражнения:
              </Text>
              {workout.exercises.map((workoutExercise, index) => (
                <div
                  key={workoutExercise.exerciseId}
                  style={{
                    padding: 8,
                    background: 'var(--vkui--color_background_secondary)',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text weight="2" style={{ marginBottom: 4 }}>
                    {index + 1}. {workoutExercise.exercise.name}
                  </Text>
                  <Text style={{ fontSize: 14, opacity: 0.7 }}>
                    Подходов: {workoutExercise.sets.length}
                  </Text>
                  {workoutExercise.notes && (
                    <Text style={{ fontSize: 14, marginTop: 4 }}>
                      Заметки: {workoutExercise.notes}
                    </Text>
                  )}
                </div>
              ))}
            </div>

            {workout.participants.length > 0 && (
              <div>
                <Text weight="2" style={{ marginBottom: 8, fontSize: 16 }}>
                  Участники:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {workout.participants.map((participant) => (
                    <div
                      key={participant.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        background: 'var(--vkui--color_background_secondary)',
                        borderRadius: 16,
                      }}
                    >
                      <Avatar size={32} src={participant.user.photo_200} />
                      <div>
                        <Text style={{ fontSize: 14 }}>
                          {participant.user.first_name} {participant.user.last_name}
                        </Text>
                        <div
                          style={{
                            fontSize: 12,
                            color: getParticipantStatusColor(participant.status),
                            fontWeight: 500,
                          }}
                        >
                          {getParticipantStatusText(participant.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Div>
    </Card>
  );
});
