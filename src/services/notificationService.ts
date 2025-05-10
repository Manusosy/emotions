import { api } from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  read: boolean;
  avatar?: string | null;
  senderName: string;
  title?: string;
  created_at?: string;
  user_id?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  patientUpdates: boolean;
  groupNotifications: boolean;
  marketingCommunications: boolean;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/api/notifications');
    return response.json();
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get('/api/notifications/preferences');
    return response.json();
  },

  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    await api.put('/api/notifications/preferences', preferences);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/api/notifications/mark-all-read');
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/api/notifications/${id}/mark-read`);
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/api/notifications/${id}`);
  },
}; 