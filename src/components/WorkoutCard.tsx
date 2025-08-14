import { FC, useState } from 'react';
import { Card, Text, Div, Button, Avatar, Spacing } from '@vkontakte/vkui';
import {
  Icon28EditOutline,
  Icon28DeleteOutline,
  Icon28ChevronDownOutline,
  Icon28ChevronUpOutline,
  Icon28InfoOutline,
  Icon28UsersOutline,
} from '@vkontakte/icons';
import { Workout } from '../types';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';
import { InviteFriendsModal } from './InviteFriendsModal';

interface WorkoutCardProps {
  workout: Workout;
  expandable?: boolean;
}

export const WorkoutCard: FC<WorkoutCardProps> = observer(({ workout, expandable = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
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
    routeNavigator.push(`/workout-edit/${workout.id}`);
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить эту тренировку?')) {
      store.deleteUserWorkout(workout.id);
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
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              aria-label="Подробнее о тренировке"
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
            
            {/* Кнопки управления */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button 
                size="m" 
                mode="secondary" 
                before={<Icon28UsersOutline />} 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInviteModal(true);
                }}
                stretched
              >
                Пригласить друзей
              </Button>
              <Button 
                size="m" 
                mode="secondary" 
                before={<Icon28EditOutline />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                Редактировать
              </Button>
              <Button 
                size="m" 
                mode="secondary" 
                before={<Icon28DeleteOutline />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                Удалить
              </Button>
            </div>
            
            {/* Упражнения */}
            <div style={{ marginBottom: 16 }}>
              <Text weight="2" style={{ marginBottom: 8, fontSize: 16 }}>
                Упражнения:
              </Text>
              {workout.exercises.map((workoutExercise, index) => (
                <div
                  key={workoutExercise.exerciseId}
                  style={{
                    padding: 12,
                    background: 'var(--vkui--color_background_secondary)',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text weight="2" style={{ marginBottom: 4 }}>
                    {index + 1}. {workoutExercise.exercise.name}
                  </Text>
                  <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
                    Подходов: {workoutExercise.sets.length}
                  </Text>
                  
                  {/* Показываем подходы */}
                  <div style={{ marginTop: 8 }}>
                    {workoutExercise.sets.map((set, setIndex) => (
                      <Text key={set.id} style={{ fontSize: 13, opacity: 0.8, display: 'block' }}>
                        Подход {setIndex + 1}: {set.reps ? `${set.reps} повторений` : ''} 
                        {set.weight ? ` × ${set.weight} кг` : ''}
                        {set.duration ? ` × ${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, '0')}` : ''}
                        {set.distance ? ` × ${set.distance}м` : ''}
                      </Text>
                    ))}
                  </div>
                  
                  {workoutExercise.notes && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: 8, 
                      background: 'var(--vkui--color_background_tertiary)', 
                      borderRadius: 6 
                    }}>
                      <Text style={{ fontSize: 13, fontStyle: 'italic' }}>
                        Заметки: {workoutExercise.notes}
                      </Text>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Участники */}
            {workout.participants.length > 0 && (
              <div>
                <Text weight="2" style={{ marginBottom: 8, fontSize: 16 }}>
                  Участники ({workout.participants.length}):
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workout.participants.map((participant) => (
                    <div
                      key={participant.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 12,
                        background: 'var(--vkui--color_background_secondary)',
                        borderRadius: 8,
                        gap: 12,
                      }}
                    >
                      <Avatar size={36} src={participant.user.photo_200} />
                      <div style={{ flex: 1 }}>
                        <Text weight="2" style={{ fontSize: 14 }}>
                          {participant.user.first_name} {participant.user.last_name}
                        </Text>
                        <Text style={{ fontSize: 12, opacity: 0.7 }}>
                          Приглашен: {new Date(participant.invitedAt).toLocaleDateString('ru-RU')}
                        </Text>
                      </div>
                      <div
                        style={{
                          padding: '4px 8px',
                          borderRadius: 12,
                          backgroundColor: getParticipantStatusColor(participant.status),
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 500,
                          textAlign: 'center',
                          minWidth: 80,
                        }}
                      >
                        {getParticipantStatusText(participant.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Div>

      <InviteFriendsModal
        workoutId={workout.id}
        isVisible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </Card>
  );
});
