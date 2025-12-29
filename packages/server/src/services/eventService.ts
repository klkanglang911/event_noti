import * as eventModel from '../models/eventModel.ts';
import * as groupModel from '../models/groupModel.ts';
import type { Event, CreateEventInput, UpdateEventInput } from '@event-noti/shared';

// Get events for user
export function getEventsByUser(userId: number, groupId?: number): Event[] {
  return eventModel.findByUserId(userId, groupId);
}

// Get event by ID
export function getEventById(id: number): Event | null {
  return eventModel.findById(id);
}

// Create event
export function createEvent(userId: number, input: CreateEventInput): Event {
  // Validate group belongs to user if provided
  if (input.groupId) {
    if (!groupModel.belongsToUser(input.groupId, userId)) {
      throw new Error('分组不存在');
    }
  }

  return eventModel.create(userId, input);
}

// Update event
export function updateEvent(
  id: number,
  userId: number,
  input: UpdateEventInput
): Event | null {
  const event = eventModel.findById(id);

  if (!event || event.userId !== userId) {
    return null;
  }

  // Validate group belongs to user if provided
  if (input.groupId) {
    if (!groupModel.belongsToUser(input.groupId, userId)) {
      throw new Error('分组不存在');
    }
  }

  return eventModel.update(id, input);
}

// Delete event
export function deleteEvent(id: number, userId: number): boolean {
  const event = eventModel.findById(id);

  if (!event || event.userId !== userId) {
    return false;
  }

  return eventModel.remove(id);
}

// Check if event belongs to user
export function eventBelongsToUser(id: number, userId: number): boolean {
  const event = eventModel.findById(id);
  return event?.userId === userId;
}
