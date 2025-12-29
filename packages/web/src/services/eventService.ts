import api from './api';
import type { Event, CreateEventInput, UpdateEventInput } from '@event-noti/shared';

interface EventListResponse {
  data: Event[];
  success: boolean;
}

interface EventResponse {
  data: Event;
  success: boolean;
}

// Get all events
export async function getEvents(groupId?: number): Promise<Event[]> {
  const params = groupId ? { groupId } : {};
  const response = await api.get<EventListResponse>('/events', { params });
  return response.data.data;
}

// Get event by ID
export async function getEvent(id: number): Promise<Event> {
  const response = await api.get<EventResponse>(`/events/${id}`);
  return response.data.data;
}

// Create event
export async function createEvent(input: CreateEventInput): Promise<Event> {
  const response = await api.post<EventResponse>('/events', input);
  return response.data.data;
}

// Update event
export async function updateEvent(id: number, input: UpdateEventInput): Promise<Event> {
  const response = await api.put<EventResponse>(`/events/${id}`, input);
  return response.data.data;
}

// Delete event
export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`);
}
