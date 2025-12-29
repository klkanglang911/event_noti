import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupService from '@/services/groupService';
import type { CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  list: () => [...groupKeys.all, 'list'] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
  users: (id: number) => [...groupKeys.all, 'users', id] as const,
};

// Get groups list
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: () => groupService.getGroups(),
  });
}

// Get single group
export function useGroup(id: number) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupService.getGroup(id),
    enabled: !!id,
  });
}

// Create group
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupService.createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

// Update group
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateGroupInput }) =>
      groupService.updateGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

// Delete group
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => groupService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

// Get users assigned to group
export function useGroupUsers(groupId: number) {
  return useQuery({
    queryKey: groupKeys.users(groupId),
    queryFn: () => groupService.getGroupUsers(groupId),
    enabled: !!groupId,
  });
}

// Set users assigned to group
export function useSetGroupUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: number; userIds: number[] }) =>
      groupService.setGroupUsers(groupId, userIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.users(groupId) });
    },
  });
}
