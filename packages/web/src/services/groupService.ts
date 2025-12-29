import api from './api';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

interface GroupListResponse {
  data: Group[];
  success: boolean;
}

interface GroupResponse {
  data: Group;
  success: boolean;
}

// Get all groups
export async function getGroups(): Promise<Group[]> {
  const response = await api.get<GroupListResponse>('/groups');
  return response.data.data;
}

// Get group by ID
export async function getGroup(id: number): Promise<Group> {
  const response = await api.get<GroupResponse>(`/groups/${id}`);
  return response.data.data;
}

// Create group
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const response = await api.post<GroupResponse>('/groups', input);
  return response.data.data;
}

// Update group
export async function updateGroup(id: number, input: UpdateGroupInput): Promise<Group> {
  const response = await api.put<GroupResponse>(`/groups/${id}`, input);
  return response.data.data;
}

// Delete group
export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/groups/${id}`);
}
