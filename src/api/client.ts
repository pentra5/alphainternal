import axios from 'axios';
import { getItem, setItem, removeItem } from '../utils/storage';

export const BASE_URL = import.meta.env.VITE_API_URL || 'https://workos.ain.web.id';
const API_BASE = `${BASE_URL}/api`;

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject token
client.interceptors.request.use(async (config) => {
  try {
    const token = await getItem<string>('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Failed to load token from store', e);
  }
  return config;
});

// Response interceptor: handle 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      let refreshToken: string | null = null;
      try {
        refreshToken = await getItem<string>('refresh_token');
      } catch (e) {
        console.error('Failed to load refresh token from store', e);
      }

      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          
          await setItem('access_token', access_token);
          await setItem('refresh_token', newRefresh);
          
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return client(error.config);
        } catch {
          await removeItem('access_token');
          await removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        await removeItem('access_token');
        await removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
