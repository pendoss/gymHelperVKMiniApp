import { FC } from 'react';
import { Card, Text, Div, Button, Avatar, Chip } from '@vkontakte/vkui';
import { Icon28MessageOutline, Icon28AddOutline } from '@vkontakte/icons';
import { Friend } from '../types';
import bridge from '@vkontakte/vk-bridge';

interface FriendCardProps {
  friend: Friend;
  onInvite?: (friend: Friend) => void;
}

export const FriendCard: FC<FriendCardProps> = ({ friend, onInvite }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_gym': return '#4CAF50';
      case 'looking_for_partner': return '#2196F3';
      case 'finished_workout': return '#FF9800';
      case 'resting': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_gym': return 'В зале';
      case 'looking_for_partner': return 'Ищет партнера';
      case 'finished_workout': return 'Закончил тренировку';
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

  return (
    <Card mode="outline" style={{ marginBottom: 12 }}>
      <Div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={48} src={friend.photo_200} />
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
              {friend.first_name} {friend.last_name}
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
                {friend.workoutsThisWeek} тренировок на неделе
              </Text>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              <div>Последняя: {formatDate(friend.lastWorkout)}</div>
              <div>Предстоящая: {formatDate(friend.nextWorkout)}</div>
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
