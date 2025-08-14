/**
 * Компонент для отображения приглашений на тренировки
 * с автоматическим отклонением и real-time обновлениями
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import React, { FC, useState, useEffect } from 'react';
import {
  Group,
  Header,
  Card,
  Div,
  Text,
  Button,
  Avatar,
  Chip,
  Badge,
  Placeholder,
  IconButton,
  Alert,
  Snackbar,
  Progress,
  Title,
  Footnote
} from '@vkontakte/vkui';
import { 
  Icon24ClockOutline, 
  Icon24CheckCircleOutline, 
  Icon24CancelOutline,
  Icon24Users,
  Icon24CalendarOutline,
  Icon24RefreshOutline,
  Icon24ErrorCircleOutline
} from '@vkontakte/icons';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../store/RootStoreContext';
import { WorkoutInvitation } from '../../store/RootStore';

// Define invitation status type
type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'auto_declined' | 'expired' | 'cancelled';

// Simple error handler
const handleError = (error: any, context?: { action?: string }) => {
  console.error('Error:', error, context);
};

export interface WorkoutInvitationsProps {
  showSent?: boolean;
  showReceived?: boolean;
  maxItems?: number;
}

// Цвета для статусов
const statusColors: Record<InvitationStatus, string> = {
  pending: '#FFA726',
  accepted: '#66BB6A',
  declined: '#EF5350',
  auto_declined: '#FF7043',
  expired: '#BDBDBD',
  cancelled: '#9E9E9E'
};

// Иконки для статусов
const statusIcons: Record<InvitationStatus, React.ReactNode> = {
  pending: <Icon24ClockOutline />,
  accepted: <Icon24CheckCircleOutline />,
  declined: <Icon24CancelOutline />,
  auto_declined: <Icon24ErrorCircleOutline />,
  expired: <Icon24ClockOutline />,
  cancelled: <Icon24CancelOutline />
};

// Переводы статусов
const statusLabels: Record<InvitationStatus, string> = {
  pending: 'Ожидает ответа',
  accepted: 'Принято',
  declined: 'Отклонено',
  auto_declined: 'Автоматически отклонено',
  expired: 'Истекло',
  cancelled: 'Отменено'
};

export const WorkoutInvitations: FC<WorkoutInvitationsProps> = observer(({
  showSent = true,
  showReceived = true,
  maxItems = 10
}) => {
  const appStore = useRootStore();
  const invitations = appStore.invitations; // Это массив WorkoutInvitation[]
  const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);
  const [popout, setPopout] = useState<React.ReactNode | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});

  // Обновление оставшегося времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      const timeMap: Record<number, number> = {};
      
      invitations.forEach(invitation => {
        if (invitation.status === 'pending' && invitation.autoDeclineAt) {
          const now = new Date().getTime();
          const autoDeclineTime = new Date(invitation.autoDeclineAt).getTime();
          timeMap[invitation.id] = Math.max(0, Math.floor((autoDeclineTime - now) / 1000));
        }
      });
      
      setTimeRemaining(timeMap);
    }, 1000);

    return () => clearInterval(timer);
  }, [invitations]);

  // Загрузка приглашений при монтировании
  useEffect(() => {
    appStore.loadInvitations();
  }, []);

  /**
   * Обработка принятия приглашения
   */
  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      setActionLoading(invitationId);
      await appStore.acceptInvitation(invitationId);
      
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Avatar size={24}><Icon24CheckCircleOutline /></Avatar>}
        >
          Приглашение принято
        </Snackbar>
      );
    } catch (error) {
      handleError(error, {
        action: 'acceptInvitation'
      });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Обработка отклонения приглашения
   */
  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      setActionLoading(invitationId);
      await appStore.declineInvitation(invitationId);
      
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
        >
          Приглашение отклонено
        </Snackbar>
      );
    } catch (error) {
      handleError(error, {
        action: 'declineInvitation'
      });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Обработка отмены приглашения
   */
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      setActionLoading(invitationId);
      await appStore.cancelInvitation(invitationId);
      
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
        >
          Приглашение отменено
        </Snackbar>
      );
    } catch (error) {
      handleError(error, {
        action: 'cancelInvitation'
      });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Показ диалога подтверждения отклонения
   */
  const showDeclineConfirm = (invitation: WorkoutInvitation) => {
    setPopout(
      <Alert
        actions={[
          {
            title: 'Отменить',
            mode: 'cancel'
          },
          {
            title: 'Отклонить',
            mode: 'destructive',
            action: () => handleDeclineInvitation(invitation.id)
          }
        ]}
        actionsLayout="horizontal"
        onClose={() => setPopout(null)}
      >
        <div>
          <Text weight="2" style={{ marginBottom: 8 }}>Отклонить приглашение?</Text>
          <Text>Вы действительно хотите отклонить приглашение на тренировку?</Text>
        </div>
      </Alert>
    );
  };

  /**
   * Показ диалога подтверждения отмены
   */
  const showCancelConfirm = (invitation: WorkoutInvitation) => {
    setPopout(
      <Alert
        actions={[
          {
            title: 'Отменить',
            mode: 'cancel'
          },
          {
            title: 'Отменить приглашение',
            mode: 'destructive',
            action: () => handleCancelInvitation(invitation.id)
          }
        ]}
        actionsLayout="horizontal"
        onClose={() => setPopout(null)}
      >
        <div>
          <Text weight="2" style={{ marginBottom: 8 }}>Отменить приглашение?</Text>
          <Text>Вы действительно хотите отменить приглашение?</Text>
        </div>
      </Alert>
    );
  };

  /**
   * Форматирование времени до автоматического отклонения
   */
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Истекло';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  /**
   * Получение прогресса автоматического отклонения (0-100)
   */
  const getAutoDeclineProgress = (invitation: WorkoutInvitation): number => {
    if (!invitation.autoDeclineAt) return 0;
    
    const now = new Date().getTime();
    const autoDeclineTime = new Date(invitation.autoDeclineAt).getTime();
    const createdTime = new Date(invitation.createdAt).getTime();
    
    const totalTime = autoDeclineTime - createdTime;
    const remainingTime = autoDeclineTime - now;
    
    if (remainingTime <= 0) return 100;
    if (totalTime <= 0) return 0;
    
    return Math.max(0, Math.min(100, ((totalTime - remainingTime) / totalTime) * 100));
  };

  /**
   * Рендер карточки приглашения
   */
  const renderInvitationCard = (invitation: WorkoutInvitation, type: 'received' | 'sent') => {
    const isLoading = actionLoading === invitation.id;
    const remaining = timeRemaining[invitation.id] || 0;
    const progress = getAutoDeclineProgress(invitation);
    const isExpiringSoon = remaining > 0 && remaining <= 300; // 5 минут
    
    // Поскольку в WorkoutInvitation нет вложенных объектов user/workout, используем заглушки
    const userName = type === 'received' ? 'Пользователь' : 'Приглашенный';
    const workoutName = 'Тренировка';
    
    return (
      <Card key={invitation.id} mode="shadow" style={{ marginBottom: 12 }}>
        <Div>
          {/* Заголовок с аватаром и статусом */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Avatar
              size={40}
              fallbackIcon={<Icon24Users />}
            />
            <div style={{ marginLeft: 12, flex: 1 }}>
              <Title level="3" weight="2">
                {type === 'received' 
                  ? userName
                  : `Для ${userName}`
                }
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip
                  before={statusIcons[invitation.status]}
                  style={{ backgroundColor: statusColors[invitation.status] + '20' }}
                >
                  {statusLabels[invitation.status]}
                </Chip>
              </div>
            </div>
          </div>

          {/* Информация о тренировке */}
          <div style={{ marginBottom: 12 }}>
            <Text weight="2" style={{ marginBottom: 4 }}>{workoutName}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon24CalendarOutline width={16} height={16} />
                <Footnote>
                  {new Date(invitation.createdAt).toLocaleDateString('ru-RU')}
                </Footnote>
              </div>
            </div>
          </div>

          {/* Сообщение приглашения */}
          {invitation.message && (
            <div style={{ 
              padding: 8, 
              backgroundColor: 'var(--vkui--color_background_secondary)',
              borderRadius: 8,
              marginBottom: 12
            }}>
              <Footnote>{invitation.message}</Footnote>
            </div>
          )}

          {/* Прогресс автоматического отклонения для pending приглашений */}
          {invitation.status === 'pending' && invitation.autoDeclineAt && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 4
              }}>
                <Footnote>
                  {type === 'received' 
                    ? 'Автоматическое отклонение через:' 
                    : 'Автоматически отклонится через:'
                  }
                </Footnote>
                <Footnote style={{ 
                  color: isExpiringSoon ? 'var(--vkui--color_text_negative)' : 'var(--vkui--color_text_secondary)',
                  fontWeight: isExpiringSoon ? '500' : '400'
                }}>
                  {formatTimeRemaining(remaining)}
                </Footnote>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Кнопки действий */}
          {invitation.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {type === 'received' ? (
                <>
                  <Button
                    size="m"
                    appearance="positive"
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    Принять
                  </Button>
                  <Button
                    size="m"
                    appearance="negative"
                    mode="secondary"
                    onClick={() => showDeclineConfirm(invitation)}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    Отклонить
                  </Button>
                </>
              ) : (
                <Button
                  size="m"
                  appearance="negative"
                  mode="secondary"
                  onClick={() => showCancelConfirm(invitation)}
                  disabled={isLoading}
                  style={{ width: '100%' }}
                >
                  Отменить приглашение
                </Button>
              )}
            </div>
          )}

          {/* Время ответа для завершенных приглашений */}
          {invitation.respondedAt && (
            <Footnote style={{ 
              marginTop: 8, 
              textAlign: 'center',
              color: 'var(--vkui--color_text_secondary)'
            }}>
              {invitation.status === 'accepted' ? 'Принято' : 'Отклонено'} {' '}
              {new Date(invitation.respondedAt).toLocaleString('ru-RU')}
            </Footnote>
          )}
        </Div>
      </Card>
    );
  };

  /**
   * Получение списка приглашений для отображения
   */
  const getInvitationsToShow = () => {
    const invitationsToShow = selectedTab === 'received' 
      ? appStore.receivedInvitations 
      : appStore.sentInvitations;
    
    return invitationsToShow.slice(0, maxItems);
  };

  const invitationsToShow = getInvitationsToShow();
  const pendingCount = selectedTab === 'received' 
    ? appStore.pendingReceivedInvitations.length
    : appStore.pendingSentInvitations.length;

  return (
    <>
      <Group
        header={
          <Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Приглашения на тренировки
                {pendingCount > 0 && (
                  <Badge mode="new" style={{ marginLeft: 8 }}>
                    {pendingCount}
                  </Badge>
                )}
              </span>
              <IconButton onClick={() => appStore.loadInvitations()}>
                <Icon24RefreshOutline />
              </IconButton>
            </div>
          </Header>
        }
      >
        {/* Переключатель вкладок */}
        {showReceived && showSent && (
          <Div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button
                size="m"
                mode={selectedTab === 'received' ? 'primary' : 'secondary'}
                onClick={() => setSelectedTab('received')}
                style={{ flex: 1 }}
              >
                Полученные
                {appStore.pendingReceivedInvitations.length > 0 && (
                  <Badge mode="new" style={{ marginLeft: 8 }}>
                    {appStore.pendingReceivedInvitations.length}
                  </Badge>
                )}
              </Button>
              <Button
                size="m"
                mode={selectedTab === 'sent' ? 'primary' : 'secondary'}
                onClick={() => setSelectedTab('sent')}
                style={{ flex: 1 }}
              >
                Отправленные
                {appStore.pendingSentInvitations.length > 0 && (
                  <Badge mode="new" style={{ marginLeft: 8 }}>
                    {appStore.pendingSentInvitations.length}
                  </Badge>
                )}
              </Button>
            </div>
          </Div>
        )}

        {/* Список приглашений */}
        <Div>
          {invitationsToShow.length === 0 ? (
            <Placeholder icon={<Icon24Users />}>
              <Text>
                {selectedTab === 'received' 
                  ? 'Нет полученных приглашений'
                  : 'Нет отправленных приглашений'
                }
              </Text>
              <Footnote style={{ marginTop: 8 }}>
                {selectedTab === 'received' 
                  ? 'Когда друзья пригласят вас на тренировку, приглашения появятся здесь'
                  : 'Пригласите друзей на тренировку, чтобы увидеть отправленные приглашения'
                }
              </Footnote>
            </Placeholder>
          ) : (
            invitationsToShow.map((invitation: any) =>
              renderInvitationCard(invitation, selectedTab)
            )
          )}
        </Div>
      </Group>

      {snackbar}
      {popout}
    </>
  );
});

export default WorkoutInvitations;
