import api from './api';
import type { User, CreateUserInput, UpdateUserInput } from '@event-noti/shared';

interface UserListResponse {
  data: User[];
  success: boolean;
}

interface UserResponse {
  data: User;
  success: boolean;
}

// Get all users
export async function getUsers(): Promise<User[]> {
  const response = await api.get<UserListResponse>('/users');
  return response.data.data;
}

// Get user by ID
export async function getUser(id: number): Promise<User> {
  const response = await api.get<UserResponse>(`/users/${id}`);
  return response.data.data;
}

// Create user
export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await api.post<UserResponse>('/users', input);
  return response.data.data;
}

// Update user
export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  const response = await api.put<UserResponse>(`/users/${id}`, input);
  return response.data.data;
}

// Delete user
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
