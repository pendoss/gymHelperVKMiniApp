import { FC } from 'react';
import { Cell, Avatar, Text } from '@vkontakte/vkui';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { getUserPosition, getPositionColor } from '../utils/leaderboardUtils';

interface UserLeaderboardPositionProps {
  userId?: string | number;
  isCurrentUser?: boolean;
  clickable?: boolean;
}

export const UserLeaderboardPosition: FC<UserLeaderboardPositionProps> = observer(({ 
  userId, 
  isCurrentUser = false,
  clickable = true 
}) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  
  const targetUserId = userId || store.currentUser?.id;
  if (!targetUserId) return null;
  
  const userPosition = getUserPosition(store, targetUserId);
  if (!userPosition) {
    return (
      <Cell
        style={{
          backgroundColor: 'rgba(158, 158, 158, 0.1)',
          borderRadius: '8px',
          margin: '4px 0',
        }}
        before={
          <>
            <div
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                minWidth: '24px',
                textAlign: 'center',
                marginRight: '5px',
                border: '1px solid #ddd'
              }}
            >
              #-
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={(store.currentUser as any)?.photo_200 || (store.currentUser as any)?.photo} 
                size={40}
                style={{
                  border: isCurrentUser ? '2px solid #4CAF50' : 'none'
                }}
              />
            </div>
          </>
        }
        after={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <Text weight="2" style={{ color: '#666', fontSize: 16 }}>
                0 очков
              </Text>
            </div>
          </div>
        }
        subtitle="Пока нет тренировок"
      >
        <div style={{ 
          fontWeight: isCurrentUser ? 600 : 400,
          color: isCurrentUser ? '#4CAF50' : 'inherit'
        }}>
          {store.currentUser?.firstName || 'Пользователь'} {store.currentUser?.lastName || ''}
          {isCurrentUser && ' (Вы)'}
        </div>
      </Cell>
    );
  }
  
  const positionColor = getPositionColor(userPosition.position, isCurrentUser);
  
  const handleClick = () => {
    if (clickable && !isCurrentUser) {
      routeNavigator.push(`/user-profile/${targetUserId}`);
    }
  };
  
  return (
    <Cell
      onClick={clickable ? handleClick : undefined}
      style={{
        backgroundColor: isCurrentUser ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
        borderRadius: '8px',
        margin: '4px 0',
        cursor: clickable && !isCurrentUser ? 'pointer' : 'default'
      }}
      before={
        <>
          <div
            style={{
              backgroundColor: positionColor,
              color: positionColor === 'transparent' ? '#666' : 'white',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '24px',
              textAlign: 'center',
              marginRight: '5px',
              border: positionColor === 'transparent' ? '1px solid #ddd' : 'none'
            }}
          >
            #{userPosition.position}
          </div>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={userPosition.photo_200} 
              size={40}
              style={{
                border: isCurrentUser ? '2px solid #4CAF50' : 'none'
              }}
            />
            {/* {medal && (
              <div 
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  fontSize: '16px',
                  background: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {medal}
              </div>
            )} */}
          </div>
        </>
      }
      after={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'right' }}>
            <Text weight="2" style={{ color: '#666', fontSize: 16 }}>
              {userPosition.score} очков
            </Text>
          </div>
        </div>
      }
    >
      <div style={{ 
        fontWeight: isCurrentUser ? 600 : 400,
        color: isCurrentUser ? '#4CAF50' : 'inherit'
      }}>
        {userPosition.name}
        {isCurrentUser && ' (Вы)'}
      </div>
    </Cell>
  );
});
