import { FC } from 'react';
import {
  ModalRoot,
  ModalCard,
  Button,
  Text,
  Div,
  Group,
  Cell,
  Avatar,
  Spacing,
  Chip,
} from '@vkontakte/vkui';
import { Icon28AddOutline, Icon28EditOutline, Icon28DeleteOutline } from '@vkontakte/icons';
import { Workout, WorkoutParticipant } from '../types';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';

interface DayModalProps {
  date: Date;
  workouts: Workout[];
  onClose: () => void;
}

export const DayModal: FC<DayModalProps> = observer(({ date, workouts, onClose }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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

  const handleCreateWorkout = () => {
    onClose();
    routeNavigator.push('/create');
  };

  const handleEditWorkout = (workoutId: string) => {
    onClose();
    routeNavigator.push(`/edit-workout/${workoutId}`);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту тренировку?')) {
      store.deleteWorkout(workoutId);
      onClose();
    }
  };

  return (
    <ModalRoot activeModal="day-modal" onClose={onClose}>
      <ModalCard id="day-modal" onClose={onClose}>
        <Div>
          <Text weight="2" style={{ marginBottom: 16, fontSize: 18 }}>
            {formatDate(date)}
          </Text>

          {workouts.length === 0 ? (
            <Group>
              <Div>
                <Text weight="2" style={{ textAlign: 'center', marginBottom: 16 }}>
                  На этот день тренировки не запланированы
                </Text>
                <Button
                  size="l"
                  stretched
                  before={<Icon28AddOutline />}
                  onClick={handleCreateWorkout}
                >
                  Создать тренировку
                </Button>
              </Div>
            </Group>
          ) : (
            <Group>
              {workouts.map((workout) => (
                <div key={workout.id}>
                  <Cell
                    multiline
                    subtitle={`${workout.time} • ${workout.gym} • ${workout.exercises.length} упражнений`}
                    after={
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="s"
                          mode="tertiary"
                          before={<Icon28EditOutline />}
                          onClick={() => handleEditWorkout(workout.id)}
                          aria-label="Редактировать тренировку"
                        />
                        <Button
                          size="s"
                          mode="tertiary"
                          before={<Icon28DeleteOutline />}
                          onClick={() => handleDeleteWorkout(workout.id)}
                          aria-label="Удалить тренировку"
                        />
                      </div>
                    }
                  >
                    {workout.title}
                  </Cell>

                  {workout.participants.length > 0 && (
                    <Div style={{ paddingTop: 0 }}>
                      <Text weight="2" style={{ marginBottom: 8, fontSize: 14 }}>
                        Участники:
                      </Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {workout.participants.map((participant: WorkoutParticipant) => (
                          <div
                            key={participant.userId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 8px',
                              background: 'var(--vkui--color_background_secondary)',
                              borderRadius: 16,
                            }}
                          >
                            <Avatar size={20} src={participant.user.photo_200} />
                            <Text style={{ fontSize: 14 }}>
                              {participant.user.first_name} {participant.user.last_name}
                            </Text>
                            <Chip
                              style={{
                                backgroundColor: getParticipantStatusColor(participant.status),
                                color: 'white',
                                fontSize: 12,
                              }}
                            >
                              {getParticipantStatusText(participant.status)}
                            </Chip>
                          </div>
                        ))}
                      </div>
                    </Div>
                  )}

                  <Spacing size={16} />
                </div>
              ))}

              <Button
                size="l"
                stretched
                mode="secondary"
                before={<Icon28AddOutline />}
                onClick={handleCreateWorkout}
              >
                Добавить тренировку
              </Button>
            </Group>
          )}
        </Div>
      </ModalCard>
    </ModalRoot>
  );
});
