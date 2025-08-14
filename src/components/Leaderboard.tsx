import { FC, useState } from 'react';
import {
  Group,
  Header,
  Cell,
  Avatar,
  Button,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  PanelHeaderButton,
  Div,
  Text,
  Spacing
} from '@vkontakte/vkui';
import { Icon28CrownOutline } from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

interface LeaderboardProps {
  className?: string;
}

const getMedalIcon = (position: number) => {
  switch (position) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
};

const getPositionColor = (position: number, isCurrentUser: boolean) => {
  if (isCurrentUser) {
    return '#4CAF50';
  }
  
  switch (position) {
    case 1:
      return '#FFD700';
    case 2:
      return '#C0C0C0';
    case 3:
      return '#CD7F32';
    default:
      return 'transparent';
  }
};

export const Leaderboard: FC<LeaderboardProps> = observer(({ className }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  const topLeaders = store.getTopLeaders(5);
  const fullLeaderboard = store.getLeaderboard();
  const currentUserPosition = store.getCurrentUserPosition();
  
  const renderUserCell = (user: any, isCurrentUser: boolean = false, showPosition: boolean = true) => {
    const medal = getMedalIcon(user.position);
    const positionColor = getPositionColor(user.position, isCurrentUser);
    
    const handleUserClick = () => {
      if (!isCurrentUser) {
        routeNavigator.push(`/user-profile/${user.id}`);
      }
    };
    
    return (
      <Cell
        key={user.id}
        onClick={handleUserClick}
        style={{
          backgroundColor: isCurrentUser ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
          borderRadius: '8px',
          margin: '4px 0',
          cursor: isCurrentUser ? 'default' : 'pointer'
        }}
        before={
            <>
                {showPosition && (
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
                    #{user.position}
                </div>
                )}
            
            
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={user.photo_200} 
              size={40}
              style={{
                border: isCurrentUser ? '2px solid #4CAF50' : 'none'
              }}
            />
            {medal && (
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
            )}
          </div>
          </>
        }
        after={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text weight="2" style={{ color: '#666' }}>
              {user.workoutsThisWeek}
            </Text>
            
          </div>
        }
        subtitle={user.gym || 'Зал не указан'}
      >
        <div style={{ 
          fontWeight: isCurrentUser ? 600 : 400,
          color: isCurrentUser ? '#4CAF50' : 'inherit'
        }}>
          {user.first_name} {user.last_name}
          {isCurrentUser && ' (Вы)'}
        </div>
      </Cell>
    );
  };

  const modal = (
    <ModalRoot activeModal={showFullLeaderboard ? 'leaderboard' : null}>
      <ModalPage
        id="leaderboard"
        onClose={() => setShowFullLeaderboard(false)}
        header={
          <ModalPageHeader
            before={
              <PanelHeaderButton onClick={() => setShowFullLeaderboard(false)}>
                ✕
              </PanelHeaderButton>
            }
          >
            Полный лидерборд
          </ModalPageHeader>
        }
      >
        <Group>
          <Div>
            {fullLeaderboard.map((user) => {
              const isCurrentUser = user.id === store.currentUser?.id;
              return renderUserCell(user, isCurrentUser);
            })}
          </Div>
        </Group>
      </ModalPage>
    </ModalRoot>
  );

  if (topLeaders.length === 0) {
    return null;
  }

  return (
    <>
      <Group
        header={
          <Header className="enhanced-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon28CrownOutline width={20} height={20} />
              Лидерборд по тренировкам
            </div>
          </Header>
        }
        className={`enhanced-group ${className || ''}`}
      >
        <Div>
          {topLeaders.map((user) => {
            const isCurrentUser = user.id === store.currentUser?.id;
            return renderUserCell(user, isCurrentUser);
          })}
          
          {/* Показываем позицию текущего пользователя внизу, если он не в топ-5 */}
          {currentUserPosition && currentUserPosition.position > 5 && (
            <>
              <Spacing size={16} />
              <div style={{ 
                borderTop: '1px solid #eee', 
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <Text 
                  weight="2" 
                  style={{ 
                    color: '#666', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}
                >
                  Ваша позиция
                </Text>
                {renderUserCell(currentUserPosition, true)}
              </div>
            </>
          )}
          
          <Spacing size={12} />
          
          <Button
            size="m"
            mode="secondary"
            stretched
            onClick={() => setShowFullLeaderboard(true)}
          >
            Посмотреть всех
          </Button>
        </Div>
      </Group>
      
      {modal}
    </>
  );
});
