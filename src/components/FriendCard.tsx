import { FC, useEffect, useState } from 'react';
import { Card, Text, Div, Button, Avatar, Chip } from '@vkontakte/vkui';
import { Icon28MessageOutline, Icon28AddOutline } from '@vkontakte/icons';
import bridge from '@vkontakte/vk-bridge';
import { Friend } from '../store/RootStore';
import { useRootStore } from '../store/RootStoreContext';

interface FriendCardProps {
  friend: Friend;
  onInvite?: (friend: Friend) => void;
  onFriendClick?: (friendId: number) => void;
}

export const FriendCard: FC<FriendCardProps> = ({ friend, onInvite, onFriendClick }) => {
  const store = useRootStore();
  const [workoutData, setWorkoutData] = useState<{
    lastWorkout?: Date;
    nextWorkout?: Date;
    workoutsThisWeek: any[];
  }>({
    workoutsThisWeek: []
  });

  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        const data = await store.getFriendWorkoutData(friend.vkId);
        setWorkoutData(data);
      } catch (error) {
        console.error('Error loading workout data for friend:', error);
      }
    };

    loadWorkoutData();
  }, [friend.vkId, store]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'training': return '#4CAF50';
      case 'resting': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'training': return 'Тренируется';
      case 'resting': return 'Отдыхает';
      default: return 'Неизвестно';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Нет данных';
    return new Date(date).toLocaleDateString('ru', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleMessage = async () => {
    try {
      await bridge.send('VKWebAppOpenContacts', {});
    } catch (error) {
      console.error('Ошибка открытия диалога:', error);
    }
  };

  const handleInvite = () => {
    onInvite?.(friend);
  };

  const handleCardClick = () => {
    onFriendClick?.(friend.id);
  };

  return (
    <Card 
      mode="outline" 
      style={{ marginBottom: 12, cursor: onFriendClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <Div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={48} src={friend.photo} />
            {friend.isOnline && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  background: '#4CAF50',
                  borderRadius: '50%',
                  border: '2px solid var(--vkui--color_background)',
                }}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Text weight="2" style={{ marginBottom: 4 }}>
              {friend.firstName} {friend.lastName}
            </Text>
            
            {friend.gym && (
              <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
                Зал: {friend.gym}
              </Text>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Chip
                style={{
                  backgroundColor: getStatusColor(friend.status),
                  fontSize: 12,
                }}
                removable={false}
              >
                <p style={{ color: 'white' }}>{getStatusText(friend.status)}</p>
              </Chip>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>
                {workoutData.workoutsThisWeek.length} тренировок на неделе
              </Text>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              <div>Последняя: {formatDate(workoutData.lastWorkout)}</div>
              <div>Предстоящая: {formatDate(workoutData.nextWorkout)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button
            size="s"
            mode="secondary"
            before={<Icon28AddOutline />}
            onClick={handleInvite}
          >
            Пригласить
          </Button>
          <Button
            size="s"
            mode="tertiary"
            before={<Icon28MessageOutline />}
            onClick={handleMessage}
          >
            Написать
          </Button>
        </div>
      </Div>
    </Card>
  );
};
