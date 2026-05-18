import api from '@/services/api';
import type { Notification } from '@/types';

export const notificationService = {
  async getMyNotifications(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications/me');
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<number>('/notifications/unread-count');
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data } = await api.put<Notification>(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead(notifications: Notification[]): Promise<void> {
    const unread = notifications.filter(n => n.statut !== 'LU');
    await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`)));
  },
};
