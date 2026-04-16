import { create } from 'zustand';
import client from '../api/client';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markOneRead: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const res = await client.get('/notifications');
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unread_count || 0,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markAllRead: async () => {
    try {
      await client.patch('/notifications/read');
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      }));
    } catch {}
  },

  markOneRead: async (id: number) => {
    try {
      await client.patch(`/notifications/${id}/read`);
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));
    } catch {}
  },
}));
