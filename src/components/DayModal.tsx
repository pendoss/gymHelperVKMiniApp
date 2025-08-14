import React, { FC, useState } from 'react';
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
} from '@vkontakte/vkui';
import { Icon28AddOutline, Icon28EditOutline, Icon28DeleteOutline } from '@vkontakte/icons';

import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { observer } from 'mobx-react-lite';
import { Workout } from '../store/RootStore';
import { useRootStore } from '../store/RootStoreContext';

interface DayModalProps {
  date: Date;
  workouts: Workout[];
  onClose: () => void;
}

export const DayModal: FC<DayModalProps> = observer(({ date, workouts, onClose }) => {
  const store = useRootStore();
  const routeNavigator = useRouteNavigator();
  const [deleteAlert, setDeleteAlert] = useState<{
    show: boolean;
    workoutId?: number;
    workoutTitle?: string;
  }>({ show: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleCreateWorkout = () => {
    onClose();
    routeNavigator.push('/create');
  };

  const handleEditWorkout = (workoutId: number) => {
    routeNavigator.push(`/workout-edit/${workoutId}`);
    onClose();
  };

  const handleDeleteWorkout = (workoutId: number) => {
    const workout = workouts.find(w => w.id === workoutId);
    setDeleteAlert({
      show: true,
      workoutId,
      workoutTitle: workout?.title || 'тренировку'
    });
  };

  const confirmDeleteWorkout = async () => {
    if (!deleteAlert.workoutId) return;

    try {
      setIsDeleting(true);
      const success = await store.deleteWorkout(deleteAlert.workoutId);
      
      if (success) {
        // Закрываем alert и основное модальное окно
        setDeleteAlert({ show: false });
        onClose();
      }
    } catch (error) {
      console.error('Ошибка при удалении тренировки:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteAlert({ show: false });
  };

  return (
    <>
      <ModalRoot activeModal="day-modal" onClose={onClose}  >
        <ModalCard id="day-modal" onClose={onClose}
        actions={
          <React.Fragment>
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
                      subtitle={`${workout.startTime || '00:00'} • ${(workout as any).gym || workout.title || 'Тренировка'} • ${workout.exercises.length} упражнений`}
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

                    {workout.participants && workout.participants.length > 0 && (
                      <Div style={{ paddingTop: 0 }}>
                        <Text weight="2" style={{ marginBottom: 8, fontSize: 14 }}>
                          Участники:
                        </Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {workout.participants.map((participant) => (
                            <div
                              key={participant.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 8px',
                                backgroundColor: 'var(--vkui--color_background_secondary)',
                                borderRadius: 12,
                                fontSize: 12
                              }}
                            >
                              <Avatar size={20} src={participant.photo} />
                              <Text style={{ fontSize: 12 }}>
                                {participant.firstName} {participant.lastName}
                              </Text>
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
          </React.Fragment>
        } />
  
      </ModalRoot>

      {deleteAlert.show && (
        <ModalRoot activeModal="delete-alert">
          <ModalCard
            id="delete-alert"
            onClose={cancelDeleteWorkout}
            actions={[
              <Button
                key="cancel"
                size="l"
                mode="secondary"
                onClick={cancelDeleteWorkout}
              >
                Отмена
              </Button>,
              <Button
                key="delete"
                size="l"
                mode="primary"
                loading={isDeleting}
                onClick={confirmDeleteWorkout}
              >
                Удалить
              </Button>
            ]}
          >
            <Div>
              <Text weight="2" style={{ marginBottom: 16 }}>
                Удаление тренировки
              </Text>
              <Text>
                Вы уверены, что хотите удалить {deleteAlert.workoutTitle}? Это действие нельзя отменить.
              </Text>
            </Div>
          </ModalCard>
        </ModalRoot>
      )}

    </>
  );
});
