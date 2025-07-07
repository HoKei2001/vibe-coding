import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  // 获取通知列表
  async getNotifications(unreadOnly: boolean = false, skip: number = 0, limit: number = 50): Promise<Notification[]> {
    const response = await api.get('/notifications', {
      params: { unread_only: unreadOnly, skip, limit }
    });
    return response.data;
  },

  // 获取未读通知数量
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.unread_count;
  },

  // 标记通知为已读
  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}`, {
      is_read: true
    });
    return response.data;
  },

  // 标记所有通知为已读
  async markAllAsRead(): Promise<number> {
    const response = await api.post('/notifications/mark-all-read');
    return response.data.marked_count;
  },

  // 删除通知
  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  // 响应邀请
  async respondToInvitation(notificationId: number, accepted: boolean): Promise<void> {
    await api.post(`/notifications/${notificationId}/respond`, null, {
      params: { accepted }
    });
  }
}; 