import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventService from '@/services/eventService';
import type { CreateEventInput, UpdateEventInput } from '@event-noti/shared';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  list: (groupId?: number) => [...eventKeys.all, 'list', groupId] as const,
  detail: (id: number) => [...eventKeys.all, 'detail', id] as const,
};

// Get events list
export function useEvents(groupId?: number) {
  return useQuery({
    queryKey: eventKeys.list(groupId),
    queryFn: () => eventService.getEvents(groupId),
  });
}

// Get single event
export function useEvent(id: number) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventService.getEvent(id),
    enabled: !!id,
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => eventService.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateEventInput }) =>
      eventService.updateEvent(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
