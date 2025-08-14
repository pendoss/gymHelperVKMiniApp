// /**
//  * Компонент для отображения приглашений на тренировки
//  * с автоматическим отклонением и real-time обновлениями
//  * Версия: 2.0.0
//  * Дата: 2025-08-14
//  */

// import React, { FC, useState, useEffect } from 'react';
// import {
//   Group,
//   Header,
//   Card,
//   Div,
//   Text,
//   Button,
//   Avatar,
//   Chip,
//   Badge,
//   Spinner,
//   Placeholder,
//   IconButton,
//   Alert,
//   Snackbar,
//   Progress,
//   Spacing,
//   Title,
//   Footnote
// } from '@vkontakte/vkui';
// import { 
//   Icon24ClockOutline, 
//   Icon24CheckCircleOutline, 
//   Icon24CancelOutline,
//   Icon24Users,
//   Icon24CalendarOutline,
//   Icon24RefreshOutline,
//   Icon24NotificationOutline,
//   Icon24ErrorCircleOutline
// } from '@vkontakte/icons';
// import { observer } from 'mobx-react-lite';
// import InvitationStore from '../stores/slices/InvitationStore';
// import { WorkoutInvitation, InvitationStatus } from '../types/domain';
// import { handleError } from '../utils/error-handler';

// export interface WorkoutInvitationsProps {
//   invitationStore: InvitationStore;
//   showSent?: boolean;
//   showReceived?: boolean;
//   maxItems?: number;
// }

// // Цвета для статусов
// const statusColors: Record<InvitationStatus, string> = {
//   pending: '#FFA726',
//   accepted: '#66BB6A',
//   declined: '#EF5350',
//   auto_declined: '#FF7043',
//   expired: '#BDBDBD',
//   cancelled: '#9E9E9E'
// };

// // Иконки для статусов
// const statusIcons: Record<InvitationStatus, React.ReactNode> = {
//   pending: <Icon24ClockOutline />,
//   accepted: <Icon24CheckCircleOutline />,
//   declined: <Icon24CancelOutline />,
//   auto_declined: <Icon24ErrorCircleOutline />,
//   expired: <Icon24ClockOutline />,
//   cancelled: <Icon24CancelOutline />
// };

// // Переводы статусов
// const statusLabels: Record<InvitationStatus, string> = {
//   pending: 'Ожидает ответа',
//   accepted: 'Принято',
//   declined: 'Отклонено',
//   auto_declined: 'Автоматически отклонено',
//   expired: 'Истекло',
//   cancelled: 'Отменено'
// };

// export const WorkoutInvitations: FC<WorkoutInvitationsProps> = observer(({
//   invitationStore,
//   showSent = true,
//   showReceived = true,
//   maxItems = 10
// }) => {
//   const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);
//   const [popout, setPopout] = useState<React.ReactNode | null>(null);
//   const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

//   // Обновление оставшегося времени каждую секунду
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTimeRemaining(invitationStore.timeUntilAutoDecline);
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [invitationStore]);

//   // Загрузка приглашений при монтировании
//   useEffect(() => {
//     invitationStore.loadInvitations();
//   }, [invitationStore]);

//   /**
//    * Обработка принятия приглашения
//    */
//   const handleAcceptInvitation = async (invitationId: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.acceptInvitation(invitationId);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CheckCircleOutline /></Avatar>}
//         >
//           Приглашение принято
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'acceptInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Обработка отклонения приглашения
//    */
//   const handleDeclineInvitation = async (invitationId: string, reason?: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.declineInvitation(invitationId, reason);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
//         >
//           Приглашение отклонено
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'declineInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Обработка отмены приглашения
//    */
//   const handleCancelInvitation = async (invitationId: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.cancelInvitation(invitationId);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
//         >
//           Приглашение отменено
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'cancelInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Показ диалога подтверждения отклонения
//    */
//   const showDeclineConfirm = (invitation: WorkoutInvitation) => {
//     setPopout(
//       <Alert
//         actions={[
//           {
//             title: 'Отменить',
//             mode: 'cancel'
//           },
//           {
//             title: 'Отклонить',
//             mode: 'destructive',
//             action: () => handleDeclineInvitation(invitation.id)
//           }
//         ]}
//         actionsLayout="horizontal"
//         onClose={() => setPopout(null)}
//         header="Отклонить приглашение?"
//         text={`Вы действительно хотите отклонить приглашение на тренировку "${invitation.workout?.title}"?`}
//       />
//     );
//   };

//   /**
//    * Показ диалога подтверждения отмены
//    */
//   const showCancelConfirm = (invitation: WorkoutInvitation) => {
//     setPopout(
//       <Alert
//         actions={[
//           {
//             title: 'Отменить',
//             mode: 'cancel'
//           },
//           {
//             title: 'Отменить приглашение',
//             mode: 'destructive',
//             action: () => handleCancelInvitation(invitation.id)
//           }
//         ]}
//         actionsLayout="horizontal"
//         onClose={() => setPopout(null)}
//         header="Отменить приглашение?"
//         text={`Вы действительно хотите отменить приглашение для ${invitation.invitee?.firstName} ${invitation.invitee?.lastName}?`}
//       />
//     );
//   };

//   /**
//    * Форматирование времени до автоматического отклонения
//    */
//   const formatTimeRemaining = (seconds: number): string => {
//     if (seconds <= 0) return 'Истекло';
    
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
    
//     if (hours > 0) {
//       return `${hours}ч ${minutes}м`;
//     } else if (minutes > 0) {
//       return `${minutes}м ${secs}с`;
//     } else {
//       return `${secs}с`;
//     }
//   };

//   /**
//    * Получение прогресса автоматического отклонения (0-100)
//    */
//   const getAutoDeclineProgress = (invitation: WorkoutInvitation): number => {
//     if (!invitation.autoDeclineAt) return 0;
    
//     const now = new Date().getTime();
//     const autoDeclineTime = new Date(invitation.autoDeclineAt).getTime();
//     const createdTime = new Date(invitation.createdAt).getTime();
    
//     const totalTime = autoDeclineTime - createdTime;
//     const remainingTime = autoDeclineTime - now;
    
//     if (remainingTime <= 0) return 100;
//     if (totalTime <= 0) return 0;
    
//     return Math.max(0, Math.min(100, ((totalTime - remainingTime) / totalTime) * 100));
//   };

//   /**
//    * Рендер карточки приглашения
//    */
//   const renderInvitationCard = (invitation: WorkoutInvitation, type: 'received' | 'sent') => {
//     const isLoading = actionLoading === invitation.id;
//     const remaining = timeRemaining[invitation.id] || 0;
//     const progress = getAutoDeclineProgress(invitation);
//     const isExpiringSoon = remaining > 0 && remaining <= 300; // 5 минут
    
//     const user = type === 'received' ? invitation.inviter : invitation.invitee;
//     const workout = invitation.workout;
    
//     if (!user || !workout) return null;

//     return (
//       <Card key={invitation.id} mode="shadow" style={{ marginBottom: 12 }}>
//         <Div>
//           {/* Заголовок с аватаром и статусом */}
//           <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
//             <Avatar
//               size={40}
//               src={user.photo}
//               fallbackIcon={<Icon24Users />}
//             />
//             <div style={{ marginLeft: 12, flex: 1 }}>
//               <Title level="3" weight="2">
//                 {type === 'received' 
//                   ? `${user.firstName} ${user.lastName}` 
//                   : `Для ${user.firstName} ${user.lastName}`
//                 }
//               </Title>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <Chip
//                   before={statusIcons[invitation.status]}
//                   style={{ backgroundColor: statusColors[invitation.status] + '20' }}
//                 >
//                   {statusLabels[invitation.status]}
//                 </Chip>
//                 {invitation.status === 'pending' && invitation.metadata.sentViaVK && (
//                   <Badge mode="new">
//                     <Icon24NotificationOutline width={12} height={12} />
//                   </Badge>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Информация о тренировке */}
//           <div style={{ marginBottom: 12 }}>
//             <Text weight="2" style={{ marginBottom: 4 }}>{workout.title}</Text>
//             {workout.description && (
//               <Footnote style={{ marginBottom: 4 }}>{workout.description}</Footnote>
//             )}
//             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <Icon24CalendarOutline width={16} height={16} />
//                 <Footnote>
//                   {new Date(workout.date).toLocaleDateString('ru-RU')} в {workout.startTime}
//                 </Footnote>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <Icon24ClockOutline width={16} height={16} />
//                 <Footnote>{workout.estimatedDuration} мин</Footnote>
//               </div>
//             </div>
//           </div>

//           {/* Сообщение приглашения */}
//           {invitation.message && (
//             <div style={{ 
//               padding: 8, 
//               backgroundColor: 'var(--vkui--color_background_secondary)',
//               borderRadius: 8,
//               marginBottom: 12
//             }}>
//               <Footnote>{invitation.message}</Footnote>
//             </div>
//           )}

//           {/* Прогресс автоматического отклонения для pending приглашений */}
//           {invitation.status === 'pending' && invitation.autoDeclineAt && (
//             <div style={{ marginBottom: 12 }}>
//               <div style={{ 
//                 display: 'flex', 
//                 justifyContent: 'space-between', 
//                 alignItems: 'center',
//                 marginBottom: 4
//               }}>
//                 <Footnote>
//                   {type === 'received' 
//                     ? 'Автоматическое отклонение через:' 
//                     : 'Автоматически отклонится через:'
//                   }
//                 </Footnote>
//                 <Footnote style={{ 
//                   color: isExpiringSoon ? 'var(--vkui--color_text_negative)' : 'var(--vkui--color_text_secondary)',
//                   fontWeight: isExpiringSoon ? '500' : '400'
//                 }}>
//                   {formatTimeRemaining(remaining)}
//                 </Footnote>
//               </div>
//               <Progress value={progress} />
//             </div>
//           )}

//           {/* Кнопки действий */}
//           {invitation.status === 'pending' && (
//             <div style={{ display: 'flex', gap: 8 }}>
//               {type === 'received' ? (
//                 <>
//                   <Button
//                     size="m"
//                     appearance="positive"
//                     onClick={() => handleAcceptInvitation(invitation.id)}
//                     loading={isLoading}
//                     disabled={isLoading}
//                     style={{ flex: 1 }}
//                   >
//                     Принять
//                   </Button>
//                   <Button
//                     size="m"
//                     appearance="negative"
//                     mode="secondary"
//                     onClick={() => showDeclineConfirm(invitation)}
//                     disabled={isLoading}
//                     style={{ flex: 1 }}
//                   >
//                     Отклонить
//                   </Button>
//                 </>
//               ) : (
//                 <Button
//                   size="m"
//                   appearance="negative"
//                   mode="secondary"
//                   onClick={() => showCancelConfirm(invitation)}
//                   disabled={isLoading}
//                   style={{ width: '100%' }}
//                 >
//                   Отменить приглашение
//                 </Button>
//               )}
//             </div>
//           )}

//           {/* Время ответа для завершенных приглашений */}
//           {invitation.respondedAt && (
//             <Footnote style={{ 
//               marginTop: 8, 
//               textAlign: 'center',
//               color: 'var(--vkui--color_text_secondary)'
//             }}>
//               {invitation.status === 'accepted' ? 'Принято' : 'Отклонено'} {' '}
//               {new Date(invitation.respondedAt).toLocaleString('ru-RU')}
//             </Footnote>
//           )}
//         </Div>
//       </Card>
//     );
//   };

//   /**
//    * Получение списка приглашений для отображения
//    */
//   const getInvitationsToShow = () => {
//     const invitations = selectedTab === 'received' 
//       ? invitationStore.receivedInvitations 
//       : invitationStore.sentInvitations;
    
//     return invitations.slice(0, maxItems);
//   };

//   const invitations = getInvitationsToShow();
//   const pendingCount = selectedTab === 'received' 
//     ? invitationStore.pendingReceivedInvitations.length
//     : invitationStore.pendingSentInvitations.length;

//   return (
//     <>
//       <Group
//         header={
//           <Header
//             aside={
//               <IconButton onClick={() => invitationStore.loadInvitations()}>
//                 <Icon24RefreshOutline />
//               </IconButton>
//             }
//           >
//             Приглашения на тренировки
//             {pendingCount > 0 && (
//               <Badge mode="new" style={{ marginLeft: 8 }}>
//                 {pendingCount}
//               </Badge>
//             )}
//           </Header>
//         }
//       >
//         {/* Переключатель вкладок */}
//         {showReceived && showSent && (
//           <Div>
//             <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//               <Button
//                 size="m"
//                 mode={selectedTab === 'received' ? 'primary' : 'secondary'}
//                 onClick={() => setSelectedTab('received')}
//                 style={{ flex: 1 }}
//               >
//                 Полученные
//                 {invitationStore.pendingReceivedInvitations.length > 0 && (
//                   <Badge mode="new" style={{ marginLeft: 8 }}>
//                     {invitationStore.pendingReceivedInvitations.length}
//                   </Badge>
//                 )}
//               </Button>
//               <Button
//                 size="m"
//                 mode={selectedTab === 'sent' ? 'primary' : 'secondary'}
//                 onClick={() => setSelectedTab('sent')}
//                 style={{ flex: 1 }}
//               >
//                 Отправленные
//                 {invitationStore.pendingSentInvitations.length > 0 && (
//                   <Badge mode="new" style={{ marginLeft: 8 }}>
//                     {invitationStore.pendingSentInvitations.length}
//                   </Badge>
//                 )}
//               </Button>
//             </div>
//           </Div>
//         )}

//         {/* Индикатор загрузки */}
//         {invitationStore.isLoading && (
//           <Div style={{ textAlign: 'center', padding: 20 }}>
//             <Spinner size="l" />
//             <Spacing size={16} />
//             <Text>Загрузка приглашений...</Text>
//           </Div>
//         )}

//         {/* Ошибка */}
//         {invitationStore.error && (
//           <Div>
//             <Placeholder icon={<Icon24ErrorCircleOutline />}>
//               <Text>{invitationStore.error}</Text>
//             </Placeholder>
//           </Div>
//         )}

//         {/* Список приглашений */}
//         {!invitationStore.isLoading && !invitationStore.error && (
//           <Div>
//             {invitations.length === 0 ? (
//               <Placeholder icon={<Icon24Users />}>
//                 <Text>
//                   {selectedTab === 'received' 
//                     ? 'Нет полученных приглашений'
//                     : 'Нет отправленных приглашений'
//                   }
//                 </Text>
//                 <Footnote style={{ marginTop: 8 }}>
//                   {selectedTab === 'received' 
//                     ? 'Когда друзья пригласят вас на тренировку, приглашения появятся здесь'
//                     : 'Пригласите друзей на тренировку, чтобы увидеть отправленные приглашения'
//                   }
//                 </Footnote>
//               </Placeholder>
//             ) : (
//               invitations.map(invitation => 
//                 renderInvitationCard(invitation, selectedTab)
//               )
//             )}
//           </Div>
//         )}
//       </Group>

//       {snackbar}
//       {popout}
//     </>
//   );
// });

// export default WorkoutInvitations;

// import React, { FC, useState, useEffect } from 'react';
// import {
//   Group,
//   Header,
//   Card,
//   Div,
//   Text,
//   Button,
//   Avatar,
//   Chip,
//   Badge,
//   Spinner,
//   Placeholder,
//   IconButton,
//   Alert,
//   Snackbar,
//   Progress,
//   Spacing,
//   Title,
//   Footnote
// } from '@vkontakte/vkui';
// import { 
//   Icon24ClockOutline, 
//   Icon24CheckCircleOutline, 
//   Icon24CancelOutline,
//   Icon24Users,
//   Icon24CalendarOutline,
//   Icon24RefreshOutline,
//   Icon24NotificationOutline,
//   Icon24ErrorCircleOutline
// } from '@vkontakte/icons';
// import { observer } from 'mobx-react-lite';
// import InvitationStore from '../stores/slices/InvitationStore';
// import { WorkoutInvitation, InvitationStatus } from '../types/domain';
// import { handleError } from '../utils/error-handler';

// export interface WorkoutInvitationsProps {
//   invitationStore: InvitationStore;
//   showSent?: boolean;
//   showReceived?: boolean;
//   maxItems?: number;
// }

// // Цвета для статусов
// const statusColors: Record<InvitationStatus, string> = {
//   pending: '#FFA726',
//   accepted: '#66BB6A',
//   declined: '#EF5350',
//   auto_declined: '#FF7043',
//   expired: '#BDBDBD',
//   cancelled: '#9E9E9E'
// };

// // Иконки для статусов
// const statusIcons: Record<InvitationStatus, React.ReactNode> = {
//   pending: <Icon24ClockOutline />,
//   accepted: <Icon24CheckCircleOutline />,
//   declined: <Icon24CancelOutline />,
//   auto_declined: <Icon24ErrorCircleOutline />,
//   expired: <Icon24ClockOutline />,
//   cancelled: <Icon24CancelOutline />
// };

// // Переводы статусов
// const statusLabels: Record<InvitationStatus, string> = {
//   pending: 'Ожидает ответа',
//   accepted: 'Принято',
//   declined: 'Отклонено',
//   auto_declined: 'Автоматически отклонено',
//   expired: 'Истекло',
//   cancelled: 'Отменено'
// };

// export const WorkoutInvitations: FC<WorkoutInvitationsProps> = observer(({
//   invitationStore,
//   showSent = true,
//   showReceived = true,
//   maxItems = 10
// }) => {
//   const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);
//   const [popout, setPopout] = useState<React.ReactNode | null>(null);
//   const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

//   // Обновление оставшегося времени каждую секунду
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTimeRemaining(invitationStore.timeUntilAutoDecline);
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [invitationStore]);

//   // Загрузка приглашений при монтировании
//   useEffect(() => {
//     invitationStore.loadInvitations();
//   }, [invitationStore]);

//   /**
//    * Обработка принятия приглашения
//    */
//   const handleAcceptInvitation = async (invitationId: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.acceptInvitation(invitationId);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CheckCircleOutline /></Avatar>}
//         >
//           Приглашение принято
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'acceptInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Обработка отклонения приглашения
//    */
//   const handleDeclineInvitation = async (invitationId: string, reason?: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.declineInvitation(invitationId, reason);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
//         >
//           Приглашение отклонено
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'declineInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Обработка отмены приглашения
//    */
//   const handleCancelInvitation = async (invitationId: string) => {
//     try {
//       setActionLoading(invitationId);
//       await invitationStore.cancelInvitation(invitationId);
      
//       setSnackbar(
//         <Snackbar
//           onClose={() => setSnackbar(null)}
//           before={<Avatar size={24}><Icon24CancelOutline /></Avatar>}
//         >
//           Приглашение отменено
//         </Snackbar>
//       );
//     } catch (error) {
//       handleError(error, {
//         component: 'WorkoutInvitations',
//         action: 'cancelInvitation'
//       });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   /**
//    * Показ диалога подтверждения отклонения
//    */
//   const showDeclineConfirm = (invitation: WorkoutInvitation) => {
//     setPopout(
//       <Alert
//         actions={[
//           {
//             title: 'Отменить',
//             autoclose: true,
//             mode: 'cancel'
//           },
//           {
//             title: 'Отклонить',
//             autoclose: true,
//             mode: 'destructive',
//             action: () => handleDeclineInvitation(invitation.id)
//           }
//         ]}
//         actionsLayout="horizontal"
//         onClose={() => setPopout(null)}
//         header="Отклонить приглашение?"
//         text={`Вы действительно хотите отклонить приглашение на тренировку "${invitation.workout?.title}"?`}
//       />
//     );
//   };

//   /**
//    * Показ диалога подтверждения отмены
//    */
//   const showCancelConfirm = (invitation: WorkoutInvitation) => {
//     setPopout(
//       <Alert
//         actions={[
//           {
//             title: 'Отменить',
//             autoclose: true,
//             mode: 'cancel'
//           },
//           {
//             title: 'Отменить приглашение',
//             autoclose: true,
//             mode: 'destructive',
//             action: () => handleCancelInvitation(invitation.id)
//           }
//         ]}
//         actionsLayout="horizontal"
//         onClose={() => setPopout(null)}
//         header="Отменить приглашение?"
//         text={`Вы действительно хотите отменить приглашение для ${invitation.invitee?.firstName} ${invitation.invitee?.lastName}?`}
//       />
//     );
//   };

//   /**
//    * Форматирование времени до автоматического отклонения
//    */
//   const formatTimeRemaining = (seconds: number): string => {
//     if (seconds <= 0) return 'Истекло';
    
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
    
//     if (hours > 0) {
//       return `${hours}ч ${minutes}м`;
//     } else if (minutes > 0) {
//       return `${minutes}м ${secs}с`;
//     } else {
//       return `${secs}с`;
//     }
//   };

//   /**
//    * Получение прогресса автоматического отклонения (0-100)
//    */
//   const getAutoDeclineProgress = (invitation: WorkoutInvitation): number => {
//     if (!invitation.autoDeclineAt) return 0;
    
//     const now = new Date().getTime();
//     const autoDeclineTime = new Date(invitation.autoDeclineAt).getTime();
//     const createdTime = new Date(invitation.createdAt).getTime();
    
//     const totalTime = autoDeclineTime - createdTime;
//     const remainingTime = autoDeclineTime - now;
    
//     if (remainingTime <= 0) return 100;
//     if (totalTime <= 0) return 0;
    
//     return Math.max(0, Math.min(100, ((totalTime - remainingTime) / totalTime) * 100));
//   };

//   /**
//    * Рендер карточки приглашения
//    */
//   const renderInvitationCard = (invitation: WorkoutInvitation, type: 'received' | 'sent') => {
//     const isLoading = actionLoading === invitation.id;
//     const remaining = timeRemaining[invitation.id] || 0;
//     const progress = getAutoDeclineProgress(invitation);
//     const isExpiringSoon = remaining > 0 && remaining <= 300; // 5 минут
    
//     const user = type === 'received' ? invitation.inviter : invitation.invitee;
//     const workout = invitation.workout;
    
//     if (!user || !workout) return null;

//     return (
//       <Card key={invitation.id} mode="shadow" style={{ marginBottom: 12 }}>
//         <Div>
//           {/* Заголовок с аватаром и статусом */}
//           <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
//             <Avatar
//               size={40}
//               src={user.photo}
//               fallbackIcon={<Icon24Users />}
//             />
//             <div style={{ marginLeft: 12, flex: 1 }}>
//               <Title level="3" weight="2">
//                 {type === 'received' 
//                   ? `${user.firstName} ${user.lastName}` 
//                   : `Для ${user.firstName} ${user.lastName}`
//                 }
//               </Title>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <Chip
//                   before={statusIcons[invitation.status]}
//                   style={{ backgroundColor: statusColors[invitation.status] + '20' }}
//                 >
//                   {statusLabels[invitation.status]}
//                 </Chip>
//                 {invitation.status === 'pending' && invitation.metadata.sentViaVK && (
//                   <Badge mode="accent">
//                     <Icon24NotificationOutline width={12} height={12} />
//                   </Badge>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Информация о тренировке */}
//           <div style={{ marginBottom: 12 }}>
//             <Text weight="2" style={{ marginBottom: 4 }}>{workout.title}</Text>
//             {workout.description && (
//               <Footnote style={{ marginBottom: 4 }}>{workout.description}</Footnote>
//             )}
//             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <Icon24CalendarOutline width={16} height={16} />
//                 <Footnote>
//                   {new Date(workout.date).toLocaleDateString('ru-RU')} в {workout.startTime}
//                 </Footnote>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                 <Icon24ClockOutline width={16} height={16} />
//                 <Footnote>{workout.estimatedDuration} мин</Footnote>
//               </div>
//             </div>
//           </div>

//           {/* Сообщение приглашения */}
//           {invitation.message && (
//             <div style={{ 
//               padding: 8, 
//               backgroundColor: 'var(--vkui--color_background_secondary)',
//               borderRadius: 8,
//               marginBottom: 12
//             }}>
//               <Footnote>{invitation.message}</Footnote>
//             </div>
//           )}

//           {/* Прогресс автоматического отклонения для pending приглашений */}
//           {invitation.status === 'pending' && invitation.autoDeclineAt && (
//             <div style={{ marginBottom: 12 }}>
//               <div style={{ 
//                 display: 'flex', 
//                 justifyContent: 'space-between', 
//                 alignItems: 'center',
//                 marginBottom: 4
//               }}>
//                 <Footnote>
//                   {type === 'received' 
//                     ? 'Автоматическое отклонение через:' 
//                     : 'Автоматически отклонится через:'
//                   }
//                 </Footnote>
//                 <Footnote style={{ 
//                   color: isExpiringSoon ? 'var(--vkui--color_text_negative)' : 'var(--vkui--color_text_secondary)',
//                   fontWeight: isExpiringSoon ? '500' : '400'
//                 }}>
//                   {formatTimeRemaining(remaining)}
//                 </Footnote>
//               </div>
//               <Progress 
//                 value={progress} 
//                 style={{ 
//                   '--vkui--color_accent': isExpiringSoon 
//                     ? 'var(--vkui--color_background_negative)' 
//                     : 'var(--vkui--color_accent)'
//                 }}
//               />
//             </div>
//           )}

//           {/* Кнопки действий */}
//           {invitation.status === 'pending' && (
//             <div style={{ display: 'flex', gap: 8 }}>
//               {type === 'received' ? (
//                 <>
//                   <Button
//                     size="m"
//                     appearance="positive"
//                     onClick={() => handleAcceptInvitation(invitation.id)}
//                     loading={isLoading}
//                     disabled={isLoading}
//                     style={{ flex: 1 }}
//                   >
//                     Принять
//                   </Button>
//                   <Button
//                     size="m"
//                     appearance="negative"
//                     mode="secondary"
//                     onClick={() => showDeclineConfirm(invitation)}
//                     disabled={isLoading}
//                     style={{ flex: 1 }}
//                   >
//                     Отклонить
//                   </Button>
//                 </>
//               ) : (
//                 <Button
//                   size="m"
//                   appearance="negative"
//                   mode="secondary"
//                   onClick={() => showCancelConfirm(invitation)}
//                   disabled={isLoading}
//                   style={{ width: '100%' }}
//                 >
//                   Отменить приглашение
//                 </Button>
//               )}
//             </div>
//           )}

//           {/* Время ответа для завершенных приглашений */}
//           {invitation.respondedAt && (
//             <Footnote style={{ 
//               marginTop: 8, 
//               textAlign: 'center',
//               color: 'var(--vkui--color_text_secondary)'
//             }}>
//               {invitation.status === 'accepted' ? 'Принято' : 'Отклонено'} {' '}
//               {new Date(invitation.respondedAt).toLocaleString('ru-RU')}
//             </Footnote>
//           )}
//         </Div>
//       </Card>
//     );
//   };

//   /**
//    * Получение списка приглашений для отображения
//    */
//   const getInvitationsToShow = () => {
//     const invitations = selectedTab === 'received' 
//       ? invitationStore.receivedInvitations 
//       : invitationStore.sentInvitations;
    
//     return invitations.slice(0, maxItems);
//   };

//   const invitations = getInvitationsToShow();
//   const pendingCount = selectedTab === 'received' 
//     ? invitationStore.pendingReceivedInvitations.length
//     : invitationStore.pendingSentInvitations.length;

//   return (
//     <>
//       <Group
//         header={
//           <Header
//             mode="secondary"
//             aside={
//               <IconButton onClick={() => invitationStore.loadInvitations()}>
//                 <Icon24RefreshOutline />
//               </IconButton>
//             }
//           >
//             Приглашения на тренировки
//             {pendingCount > 0 && (
//               <Badge mode="accent" style={{ marginLeft: 8 }}>
//                 {pendingCount}
//               </Badge>
//             )}
//           </Header>
//         }
//       >
//         {/* Переключатель вкладок */}
//         {showReceived && showSent && (
//           <Div>
//             <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//               <Button
//                 size="m"
//                 mode={selectedTab === 'received' ? 'primary' : 'secondary'}
//                 onClick={() => setSelectedTab('received')}
//                 style={{ flex: 1 }}
//               >
//                 Полученные
//                 {invitationStore.pendingReceivedInvitations.length > 0 && (
//                   <Badge mode="accent" style={{ marginLeft: 8 }}>
//                     {invitationStore.pendingReceivedInvitations.length}
//                   </Badge>
//                 )}
//               </Button>
//               <Button
//                 size="m"
//                 mode={selectedTab === 'sent' ? 'primary' : 'secondary'}
//                 onClick={() => setSelectedTab('sent')}
//                 style={{ flex: 1 }}
//               >
//                 Отправленные
//                 {invitationStore.pendingSentInvitations.length > 0 && (
//                   <Badge mode="accent" style={{ marginLeft: 8 }}>
//                     {invitationStore.pendingSentInvitations.length}
//                   </Badge>
//                 )}
//               </Button>
//             </div>
//           </Div>
//         )}

//         {/* Индикатор загрузки */}
//         {invitationStore.isLoading && (
//           <Div style={{ textAlign: 'center', padding: 20 }}>
//             <Spinner size="l" />
//             <Spacing size={16} />
//             <Text>Загрузка приглашений...</Text>
//           </Div>
//         )}

//         {/* Ошибка */}
//         {invitationStore.error && (
//           <Div>
//             <Placeholder
//               icon={<Icon24ErrorCircleOutline />}
//               header="Ошибка загрузки"
//             >
//               {invitationStore.error}
//             </Placeholder>
//           </Div>
//         )}

//         {/* Список приглашений */}
//         {!invitationStore.isLoading && !invitationStore.error && (
//           <Div>
//             {invitations.length === 0 ? (
//               <Placeholder
//                 icon={<Icon24Users />}
//                 header={
//                   selectedTab === 'received' 
//                     ? 'Нет полученных приглашений'
//                     : 'Нет отправленных приглашений'
//                 }
//               >
//                 {selectedTab === 'received' 
//                   ? 'Когда друзья пригласят вас на тренировку, приглашения появятся здесь'
//                   : 'Пригласите друзей на тренировку, чтобы увидеть отправленные приглашения'
//                 }
//               </Placeholder>
//             ) : (
//               invitations.map(invitation => 
//                 renderInvitationCard(invitation, selectedTab)
//               )
//             )}
//           </Div>
//         )}
//       </Group>

//       {snackbar}
//       {popout}
//     </>
//   );
// });

// export default WorkoutInvitations;

//     const renderInvitation = (invitation: WorkoutInvitation, type: 'incoming' | 'sent') => {
//         const workout = invitation.workout;
//         if (!workout) return null;

//         const fromUser = appStore.auth.friends.find((f: any) => f.id === invitation.fromUserId) ||
//                         (invitation.fromUserId === appStore.auth.currentUser?.id ? appStore.auth.currentUser : null);
//         const toUser = appStore.auth.friends.find((f: any) => f.id === invitation.toUserId) ||
//                       (invitation.toUserId === appStore.auth.currentUser?.id ? appStore.auth.currentUser : null);

//         return (
//             <Card key={invitation.id} mode="shadow">
//                 <Div>
//                     <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
//                         <Avatar
//                             size={40}
//                             src={type === 'incoming' ? fromUser?.photo_200 : toUser?.photo_200}
//                         />
//                         <div style={{ marginLeft: 12, flex: 1 }}>
//                             <Text weight="2">
//                                 {type === 'incoming'
//                                     ? `${fromUser?.first_name} ${fromUser?.last_name} приглашает на тренировку`
//                                     : `Приглашение для ${toUser?.first_name} ${toUser?.last_name}`
//                                 }
//                             </Text>
//                             <Text style={{ fontSize: 13, opacity: 0.7 }}>
//                                 {new Date(invitation.sentAt).toLocaleDateString('ru-RU', {
//                                     day: 'numeric',
//                                     month: 'short',
//                                     hour: '2-digit',
//                                     minute: '2-digit'
//                                 })}
//                             </Text>
//                         </div>
//                         <Chip>
//                             {invitation.status === 'pending' ? 'Ожидает' :
//                              invitation.status === 'accepted' ? 'Принято' : 'Отклонено'}
//                         </Chip>
//                     </div>

//                     <Card mode="tint">
//                         <Div style={{ padding: 12 }}>
//                             <Text weight="2">{workout.title}</Text>
//                             <Text style={{ fontSize: 13, opacity: 0.7 }}>
//                                 {new Date(workout.date).toLocaleDateString('ru-RU')} в {workout.time}
//                             </Text>
//                             <Text style={{ fontSize: 13, opacity: 0.7 }}>
//                                 {workout.gym}
//                             </Text>
//                             <Text style={{ fontSize: 13, marginTop: 4 }}>
//                                 {workout.exercises.length} упражнени{workout.exercises.length === 1 ? 'е' : 'й'}
//                             </Text>
//                         </Div>
//                     </Card>

//                     {type === 'incoming' && invitation.status === 'pending' && (
//                         <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
//                             <Button
//                                 size="m"
//                                 mode="primary"
//                                 onClick={() => handleAcceptInvitation(invitation.id)}
//                                 stretched
//                             >
//                                 Принять
//                             </Button>
//                             <Button
//                                 size="m"
//                                 mode="secondary"
//                                 onClick={() => handleDeclineInvitation(invitation.id)}
//                                 stretched
//                             >
//                                 Отклонить
//                             </Button>
//                         </div>
//                     )}
//                 </Div>
//             </Card>
//         );
//     };

//     if (incomingInvitations.length === 0 && sentInvitations.length === 0) {
//         return (
//             <Group>
//                 <Header>Приглашения на тренировки</Header>
//                 <Div>
//                     <Text style={{ opacity: 0.7 }}>Нет приглашений</Text>
//                 </Div>
//             </Group>
//         );
//     }

//     return (
//         <>
//             {incomingInvitations.length > 0 && (
//                 <Group>
//                     <Header>Входящие приглашения</Header>
//                     <Div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                         {incomingInvitations.map((invitation: any) =>
//                             renderInvitation(invitation, 'incoming')
//                         )}
//                     </Div>
//                 </Group>
//             )}

//             {sentInvitations.length > 0 && (
//                 <Group>
//                     <Header>Отправленные приглашения</Header>
//                     <Div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                         {sentInvitations.map((invitation: any) =>
//                             renderInvitation(invitation, 'sent')
//                         )}
//                     </Div>
//                 </Group>
//             )}
//         </>
//     );
// });
