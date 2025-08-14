/**
 * Store для управления приглашениями на тренировки
 * с автоматическим отклонением
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { WorkoutInvitation, InvitationStatus, NotificationSent } from '../../types/domain';
import { ApiResponse } from '../../types/api';
import httpClient from '../../api/client';
import vkApiService from '../../services/vkApiService';
import { handleError } from '../../utils/error-handler';

interface InvitationTimer {
  invitationId: string;
  timeoutId: number;
  autoDeclineAt: Date;
  reminderTimeoutId?: number;
}

interface CreateInvitationRequest {
  workoutId: string;
  inviteeIds: string[];
  message?: string;
  sendVKNotification?: boolean;
  autoDeclineMinutes?: number; // Через сколько минут автоматически отклонить
}

interface InvitationFilters {
  status?: InvitationStatus[];
  workoutId?: string;
  inviterId?: string;
  inviteeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

class InvitationStore {
  // Состояние
  invitations: WorkoutInvitation[] = [];
  sentInvitations: WorkoutInvitation[] = [];
  receivedInvitations: WorkoutInvitation[] = [];
  isLoading = false;
  error: string | null = null;

  // Таймеры для автоматического отклонения
  private timers = new Map<string, InvitationTimer>();
  
  // Интервалы для проверки и обновления
  private checkInterval?: number;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 секунд
  
  // Настройки
  private readonly DEFAULT_AUTO_DECLINE_MINUTES = 30;
  private readonly REMINDER_BEFORE_MINUTES = 5;

  constructor() {
    makeAutoObservable(this);
    this.startPeriodicCheck();
    this.setupBeforeUnloadHandler();
  }

  /**
   * Загрузка всех приглашений пользователя
   */
  async loadInvitations(filters?: InvitationFilters): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      const params = this.buildQueryParams(filters);
      const response: ApiResponse<WorkoutInvitation[]> = await httpClient.get('/invitations', params);

      if (response.success) {
        runInAction(() => {
          this.invitations = response.data;
          this.updateInvitationLists();
          this.setupAutoDeclineTimers();
        });
      } else {
        throw new Error(response.message || 'Ошибка загрузки приглашений');
      }

    } catch (error: any) {
      const processedError = handleError(error, {
        component: 'InvitationStore',
        action: 'loadInvitations'
      });
      this.setError(processedError.userMessage);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Отправка приглашений
   */
  async sendInvitations(request: CreateInvitationRequest): Promise<WorkoutInvitation[]> {
    try {
      this.setLoading(true);
      this.setError(null);

      // Валидация запроса
      this.validateInvitationRequest(request);

      const response: ApiResponse<WorkoutInvitation[]> = await httpClient.post('/invitations', {
        ...request,
        autoDeclineMinutes: request.autoDeclineMinutes || this.DEFAULT_AUTO_DECLINE_MINUTES
      });

      if (response.success) {
        const newInvitations = response.data;
        
        runInAction(() => {
          // Добавляем новые приглашения к существующим
          this.invitations.push(...newInvitations);
          this.updateInvitationLists();
        });

        // Настраиваем таймеры для новых приглашений
        this.setupTimersForInvitations(newInvitations);

        // Отправляем VK уведомления если требуется
        if (request.sendVKNotification) {
          await this.sendVKNotifications(newInvitations, request.message);
        }

        return newInvitations;
      } else {
        throw new Error(response.message || 'Ошибка отправки приглашений');
      }

    } catch (error: any) {
      const processedError = handleError(error, {
        component: 'InvitationStore',
        action: 'sendInvitations'
      });
      this.setError(processedError.userMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Принятие приглашения
   */
  async acceptInvitation(invitationId: string, message?: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      const response: ApiResponse<WorkoutInvitation> = await httpClient.patch(
        `/invitations/${invitationId}/accept`,
        { message }
      );

      if (response.success) {
        runInAction(() => {
          this.updateInvitationStatus(invitationId, 'accepted', message);
        });

        // Удаляем таймер автоматического отклонения
        this.removeTimer(invitationId);

        // Отправляем уведомление создателю тренировки
        await this.notifyInvitationResponse(response.data, 'accepted');

      } else {
        throw new Error(response.message || 'Ошибка принятия приглашения');
      }

    } catch (error: any) {
      const processedError = handleError(error, {
        component: 'InvitationStore',
        action: 'acceptInvitation'
      });
      this.setError(processedError.userMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Отклонение приглашения
   */
  async declineInvitation(invitationId: string, message?: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      const response: ApiResponse<WorkoutInvitation> = await httpClient.patch(
        `/invitations/${invitationId}/decline`,
        { message }
      );

      if (response.success) {
        runInAction(() => {
          this.updateInvitationStatus(invitationId, 'declined', message);
        });

        // Удаляем таймер автоматического отклонения
        this.removeTimer(invitationId);

        // Отправляем уведомление создателю тренировки
        await this.notifyInvitationResponse(response.data, 'declined');

      } else {
        throw new Error(response.message || 'Ошибка отклонения приглашения');
      }

    } catch (error: any) {
      const processedError = handleError(error, {
        component: 'InvitationStore',
        action: 'declineInvitation'
      });
      this.setError(processedError.userMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Отмена приглашения (для создателя тренировки)
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      const response: ApiResponse<void> = await httpClient.delete(`/invitations/${invitationId}`);

      if (response.success) {
        runInAction(() => {
          this.removeInvitation(invitationId);
        });

        // Удаляем таймер
        this.removeTimer(invitationId);

      } else {
        throw new Error(response.message || 'Ошибка отмены приглашения');
      }

    } catch (error: any) {
      const processedError = handleError(error, {
        component: 'InvitationStore',
        action: 'cancelInvitation'
      });
      this.setError(processedError.userMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Автоматическое отклонение приглашения
   */
  private async autoDeclineInvitation(invitationId: string): Promise<void> {
    try {
      console.log(`Auto-declining invitation ${invitationId}`);

      const response: ApiResponse<WorkoutInvitation> = await httpClient.patch(
        `/invitations/${invitationId}/auto-decline`
      );

      if (response.success) {
        runInAction(() => {
          this.updateInvitationStatus(
            invitationId, 
            'auto_declined', 
            'Приглашение автоматически отклонено'
          );
        });

        // Удаляем таймер
        this.removeTimer(invitationId);

        // Отправляем уведомление создателю тренировки
        await this.notifyInvitationResponse(response.data, 'auto_declined');

        // Показываем уведомление пользователю
        await this.showAutoDeclineNotification(response.data);

      } else {
        console.error('Failed to auto-decline invitation:', response.message);
      }

    } catch (error: any) {
      handleError(error, {
        component: 'InvitationStore',
        action: 'autoDeclineInvitation'
      });
    }
  }

  /**
   * Настройка таймеров автоматического отклонения
   */
  private setupAutoDeclineTimers(): void {
    this.invitations
      .filter(invitation => 
        invitation.status === 'pending' && 
        invitation.autoDeclineAt &&
        new Date(invitation.autoDeclineAt) > new Date()
      )
      .forEach(invitation => {
        this.setupTimerForInvitation(invitation);
      });
  }

  /**
   * Настройка таймеров для конкретных приглашений
   */
  private setupTimersForInvitations(invitations: WorkoutInvitation[]): void {
    invitations.forEach(invitation => {
      this.setupTimerForInvitation(invitation);
    });
  }

  /**
   * Настройка таймера для одного приглашения
   */
  private setupTimerForInvitation(invitation: WorkoutInvitation): void {
    if (invitation.status !== 'pending' || !invitation.autoDeclineAt) {
      return;
    }

    const autoDeclineAt = new Date(invitation.autoDeclineAt);
    const now = new Date();
    const msUntilDecline = autoDeclineAt.getTime() - now.getTime();

    // Если время уже прошло, отклоняем немедленно
    if (msUntilDecline <= 0) {
      this.autoDeclineInvitation(invitation.id);
      return;
    }

    // Настраиваем основной таймер автоматического отклонения
    const timeoutId = window.setTimeout(() => {
      this.autoDeclineInvitation(invitation.id);
    }, msUntilDecline);

    // Настраиваем таймер напоминания (за 5 минут до отклонения)
    const reminderMs = msUntilDecline - (this.REMINDER_BEFORE_MINUTES * 60 * 1000);
    let reminderTimeoutId: number | undefined;

    if (reminderMs > 0) {
      reminderTimeoutId = window.setTimeout(() => {
        this.sendDeclineReminder(invitation);
      }, reminderMs);
    }

    // Сохраняем таймеры
    const timerInfo: InvitationTimer = {
      invitationId: invitation.id,
      timeoutId,
      autoDeclineAt,
      reminderTimeoutId
    };

    this.timers.set(invitation.id, timerInfo);
  }

  /**
   * Удаление таймера для приглашения
   */
  private removeTimer(invitationId: string): void {
    const timer = this.timers.get(invitationId);
    if (timer) {
      window.clearTimeout(timer.timeoutId);
      if (timer.reminderTimeoutId) {
        window.clearTimeout(timer.reminderTimeoutId);
      }
      this.timers.delete(invitationId);
    }
  }

  /**
   * Отправка напоминания о скором автоматическом отклонении
   */
  private async sendDeclineReminder(invitation: WorkoutInvitation): Promise<void> {
    try {
      // Здесь можно отправить push-уведомление или показать в UI
      console.log(`Reminder: invitation ${invitation.id} will be auto-declined in ${this.REMINDER_BEFORE_MINUTES} minutes`);
      
      // Можно добавить вибрацию для привлечения внимания
      await vkApiService.vibrate('light');
      
    } catch (error) {
      console.error('Failed to send decline reminder:', error);
    }
  }

  /**
   * Показ уведомления об автоматическом отклонении
   */
  private async showAutoDeclineNotification(invitation: WorkoutInvitation): Promise<void> {
    try {
      // Здесь можно показать toast или снэкбар
      console.log(`Invitation auto-declined: ${invitation.id}`);
      
      // Легкая вибрация для уведомления
      await vkApiService.vibrate('light');
      
    } catch (error) {
      console.error('Failed to show auto-decline notification:', error);
    }
  }

  /**
   * Отправка VK уведомлений
   */
  private async sendVKNotifications(
    invitations: WorkoutInvitation[], 
    _message?: string
  ): Promise<void> {
    try {
      // Группируем приглашения по тренировке
      const invitationsByWorkout = invitations.reduce((acc, invitation) => {
        const workoutId = invitation.workoutId;
        if (!acc[workoutId]) {
          acc[workoutId] = [];
        }
        acc[workoutId].push(invitation);
        return acc;
      }, {} as Record<string, WorkoutInvitation[]>);

      // Отправляем уведомления для каждой тренировки
      for (const [, workoutInvitations] of Object.entries(invitationsByWorkout)) {
        const workout = workoutInvitations[0].workout;
        const inviter = workoutInvitations[0].inviter;
        
        if (!workout || !inviter) continue;

        const userIds = workoutInvitations
          .map(inv => inv.invitee?.vkId)
          .filter(Boolean) as number[];

        if (userIds.length === 0) continue;

        const workoutDate = new Date(workout.date).toLocaleDateString('ru-RU');
        
        const success = await vkApiService.sendWorkoutInvitation(
          userIds,
          workout.title,
          workoutDate,
          `${inviter.firstName} ${inviter.lastName}`
        );

        // Обновляем статус отправки уведомлений
        if (success) {
          runInAction(() => {
            workoutInvitations.forEach(invitation => {
              const invIndex = this.invitations.findIndex(inv => inv.id === invitation.id);
              if (invIndex !== -1) {
                const notificationSent: NotificationSent = {
                  type: 'initial',
                  sentAt: new Date(),
                  success: true
                };
                this.invitations[invIndex].notificationsSent.push(notificationSent);
                this.invitations[invIndex].metadata.sentViaVK = true;
              }
            });
          });
        }
      }

    } catch (error) {
      console.error('Failed to send VK notifications:', error);
    }
  }

  /**
   * Уведомление об ответе на приглашение
   */
  private async notifyInvitationResponse(
    invitation: WorkoutInvitation, 
    status: 'accepted' | 'declined' | 'auto_declined'
  ): Promise<void> {
    try {
      if (!invitation.inviter || !invitation.invitee || !invitation.workout) {
        return;
      }

      const statusTexts = {
        accepted: 'принял(а)',
        declined: 'отклонил(а)',
        auto_declined: 'не ответил(а) на'
      };

      const message = `${invitation.invitee.firstName} ${invitation.invitee.lastName} ` +
                     `${statusTexts[status]} приглашение на тренировку "${invitation.workout.title}"`;

      // Отправляем уведомление создателю тренировки
      if (invitation.inviter.vkId) {
        await vkApiService.sendNotification({
          user_ids: [invitation.inviter.vkId],
          message,
          fragment: 'invitation_response'
        });
      }

    } catch (error) {
      console.error('Failed to notify invitation response:', error);
    }
  }

  /**
   * Периодическая проверка просроченных приглашений
   */
  private startPeriodicCheck(): void {
    this.checkInterval = window.setInterval(() => {
      this.checkExpiredInvitations();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Проверка просроченных приглашений
   */
  private checkExpiredInvitations(): void {
    const now = new Date();
    
    this.invitations
      .filter(invitation => 
        invitation.status === 'pending' &&
        invitation.autoDeclineAt &&
        new Date(invitation.autoDeclineAt) <= now &&
        !this.timers.has(invitation.id)
      )
      .forEach(invitation => {
        this.autoDeclineInvitation(invitation.id);
      });
  }

  /**
   * Обработчик закрытия приложения
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Очистка ресурсов
   */
  private cleanup(): void {
    // Очищаем все таймеры
    this.timers.forEach(timer => {
      window.clearTimeout(timer.timeoutId);
      if (timer.reminderTimeoutId) {
        window.clearTimeout(timer.reminderTimeoutId);
      }
    });
    this.timers.clear();

    // Очищаем интервал проверки
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
    }
  }

  /**
   * Вспомогательные методы
   */
  private validateInvitationRequest(request: CreateInvitationRequest): void {
    if (!request.workoutId) {
      throw new Error('ID тренировки обязателен');
    }
    if (!request.inviteeIds || request.inviteeIds.length === 0) {
      throw new Error('Выберите получателей приглашения');
    }
    if (request.inviteeIds.length > 10) {
      throw new Error('Можно пригласить максимум 10 человек');
    }
  }

  private buildQueryParams(filters?: InvitationFilters): Record<string, any> {
    if (!filters) return {};
    
    const params: Record<string, any> = {};
    
    if (filters.status) {
      params.status = filters.status.join(',');
    }
    if (filters.workoutId) {
      params.workoutId = filters.workoutId;
    }
    if (filters.inviterId) {
      params.inviterId = filters.inviterId;
    }
    if (filters.inviteeId) {
      params.inviteeId = filters.inviteeId;
    }
    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom.toISOString();
    }
    if (filters.dateTo) {
      params.dateTo = filters.dateTo.toISOString();
    }
    
    return params;
  }

  private updateInvitationLists(): void {
    // Разделяем приглашения на отправленные и полученные
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return;

    this.sentInvitations = this.invitations.filter(
      invitation => invitation.inviterId === currentUserId
    );
    
    this.receivedInvitations = this.invitations.filter(
      invitation => invitation.inviteeId === currentUserId
    );
  }

  private getCurrentUserId(): string | null {
    // Здесь должна быть логика получения ID текущего пользователя
    // Временно возвращаем null
    return null;
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  private setError(error: string | null): void {
    this.error = error;
  }

  private updateInvitationStatus(
    invitationId: string, 
    status: InvitationStatus, 
    message?: string
  ): void {
    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (invitation) {
      invitation.status = status;
      invitation.respondedAt = new Date();
      if (message) {
        invitation.message = message;
      }
      this.updateInvitationLists();
    }
  }

  private removeInvitation(invitationId: string): void {
    this.invitations = this.invitations.filter(inv => inv.id !== invitationId);
    this.updateInvitationLists();
  }

  /**
   * Геттеры для computed values
   */
  get pendingReceivedInvitations(): WorkoutInvitation[] {
    return this.receivedInvitations.filter(inv => inv.status === 'pending');
  }

  get pendingSentInvitations(): WorkoutInvitation[] {
    return this.sentInvitations.filter(inv => inv.status === 'pending');
  }

  get activeTimers(): InvitationTimer[] {
    return Array.from(this.timers.values());
  }

  get timeUntilAutoDecline(): Record<string, number> {
    const result: Record<string, number> = {};
    const now = new Date();
    
    this.timers.forEach((timer, invitationId) => {
      const msRemaining = timer.autoDeclineAt.getTime() - now.getTime();
      result[invitationId] = Math.max(0, Math.floor(msRemaining / 1000));
    });
    
    return result;
  }

  /**
   * Деструктор
   */
  /**
   * Очистка кеша
   */
  clearCache(): void {
    runInAction(() => {
      this.invitations = [];
      this.sentInvitations = [];
      this.receivedInvitations = [];
    });
  }

  /**
   * Очистка ресурсов при уничтожении
   */
  destroy(): void {
    this.cleanup();
  }
}

export default InvitationStore;
