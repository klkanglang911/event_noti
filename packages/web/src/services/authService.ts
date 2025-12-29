import api from './api';
import type { LoginInput, LoginResponse, User } from '@event-noti/shared';

// Login
export async function login(input: LoginInput): Promise<LoginResponse> {
  const response = await api.post<{ data: LoginResponse; success: boolean }>(
    '/auth/login',
    input
  );
  return response.data.data;
}

// Logout
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

// Get current user
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ data: User; success: boolean }>('/auth/me');
  return response.data.data;
}
