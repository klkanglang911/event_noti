import * as userModel from '../models/userModel.ts';
import * as authService from './authService.ts';
import type { User, CreateUserInput, UpdateUserInput } from '@event-noti/shared';

// Get all users
export function getAllUsers(): User[] {
  return userModel.findAll();
}

// Get user by ID
export function getUserById(id: number): User | null {
  return userModel.findById(id);
}

// Create user
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if username exists
  if (userModel.usernameExists(input.username)) {
    throw new Error('用户名已存在');
  }

  // Hash password
  const passwordHash = await authService.hashPassword(input.password);

  return userModel.create({
    ...input,
    passwordHash,
  });
}

// Update user
export function updateUser(id: number, input: UpdateUserInput): User | null {
  return userModel.update(id, input);
}

// Delete user (soft delete)
export function deleteUser(id: number): boolean {
  return userModel.remove(id);
}

// Check if user exists
export function userExists(id: number): boolean {
  return userModel.findById(id) !== null;
}
