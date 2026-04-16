import { create } from 'zustand';
import client from '../api/client';
import { getItem, setItem, removeItem } from '../utils/storage';

interface User {
  id: number;
  employee_id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'editor' | 'staff';
  department_id?: number;
  department_name?: string;
  join_date: string;
  status: 'active' | 'inactive';
  must_change_password: boolean;
  profile?: {
    avatar_path?: string;
    bio?: string;
    total_points: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const token = await getItem<string>('access_token');
      if (token) {
        try {
          const res = await client.get('/users/me');
          set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch {
          await removeItem('access_token');
          await removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
          const { useFocusStore } = await import('./focusStore');
          useFocusStore.getState().reset();
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        const { useFocusStore } = await import('./focusStore');
        useFocusStore.getState().reset();
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (username, password, rememberMe) => {
    const res = await client.post('/auth/login', { username, password, remember_me: rememberMe });
    const { access_token, refresh_token } = res.data;
    
    await setItem('access_token', access_token);
    if (rememberMe) {
      await setItem('refresh_token', refresh_token);
    } else {
      await removeItem('refresh_token');
    }

    // Fetch full user profile
    const profileRes = await client.get('/users/me');
    set({ user: profileRes.data, isAuthenticated: true });
  },

  logout: async () => {
    // Notify backend to clear last_seen (shows Offline)
    try { await client.post('/auth/logout'); } catch {}
    await removeItem('access_token');
    await removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
    
    // Reset focus timer state so it doesn't bleed to next user
    const { useFocusStore } = await import('./focusStore');
    useFocusStore.getState().reset();
  },

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const res = await client.get('/users/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      await removeItem('access_token');
      await removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      const { useFocusStore } = await import('./focusStore');
      useFocusStore.getState().reset();
    }
  },
}));
