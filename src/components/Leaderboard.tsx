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
import { getUserStats, getMedalIcon, getPositionColor } from '../utils/leaderboardUtils';

interface LeaderboardProps {
  className?: string;
}

export const Leaderboard: FC<LeaderboardProps> = observer(({ className }) => {
  const store = useStore();
  const routeNavigator = useRouteNavigator();
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  const leaderboardData = getUserStats(store);
  const topLeaders = leaderboardData.slice(0, 3);
  const fullLeaderboard = leaderboardData;
  const currentUserPosition = store.currentUser 
    ? leaderboardData.find(user => String(user.id) === String(store.currentUser!.id))
    : null;
  
  // Если нет данных для отображения, показываем заглушку
  if (topLeaders.length === 0) {
    return (
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
        <Div style={{ textAlign: 'center', padding: '20px' }}>
          <Text style={{ color: '#666' }}>
            Пока нет данных для отображения.
            <br />
            Создайте и завершите тренировки, чтобы увидеть рейтинг!
          </Text>
        </Div>
      </Group>
    );
  }
  
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
            <div style={{ textAlign: 'right' }}>
              <Text weight="2" style={{ color: '#666', fontSize: 16 }}>
                {user.score} очков
              </Text>
              {user.qualityScore > 0 && (
                <Text style={{ fontSize: 11, opacity: 0.6, display: 'block' }}>
                  качество: {Math.round(user.qualityScore)}
                </Text>
              )}
            </div>
          </div>
        }
        subtitle={`${user.workoutsCount} тренировок • ${user.completedWorkouts} завершено`}
      >
        <div style={{ 
          fontWeight: isCurrentUser ? 600 : 400,
          color: isCurrentUser ? '#4CAF50' : 'inherit'
        }}>
          {user.name}
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
              const isCurrentUser = !!(store.currentUser && String(user.id) === String(store.currentUser.id));
              return renderUserCell(user, isCurrentUser);
            })}
          </Div>
        </Group>
      </ModalPage>
    </ModalRoot>
  );

  return (
    <>
      <Group
        header={
          <Header className="enhanced-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon28CrownOutline width={20} height={20} />
                Лидерборд по тренировкам
              </div>
            </div>
          </Header>
        }
        className={`enhanced-group ${className || ''}`}
      >
        <Div>
          <div style={{ 
            padding: '12px', 
            background: 'var(--vkui--color_background_secondary)', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '13px',
            opacity: 0.8
          }}>
            <Text style={{ fontSize: '13px' }}>
              Рейтинг = Завершенные тренировки × 10 + Упражнения × 2 + Качество выполнения
            </Text>
          </div>
          
          {topLeaders.map((user) => {
            const isCurrentUser = !!(store.currentUser && String(user.id) === String(store.currentUser.id));
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
