import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;
    const isLoginRequest =
      typeof requestUrl === 'string' &&
      (requestUrl === '/auth/login' || requestUrl.endsWith('/auth/login'));

    if (status === 401 && !isLoginRequest) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || '请求失败';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}
