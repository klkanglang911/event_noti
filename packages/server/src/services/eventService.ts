import * as eventModel from '../models/eventModel.ts';
import * as groupModel from '../models/groupModel.ts';
import * as settingsService from './settingsService.ts';
import {
  DEFAULTS,
  getCalendarEventOption,
  getNextCalendarEventDate,
  isCalendarEventType,
  type CreateEventInput,
  type Event,
  type UpdateEventInput,
} from '@event-noti/shared';

function resolveCalendarTargetDate(eventType: 'traditional_festival' | 'solar_term', calendarKey: string): string {
  const option = getCalendarEventOption(eventType, calendarKey);

  if (!option) {
    throw new Error('不支持的节日或节气');
  }

  return getNextCalendarEventDate(eventType, calendarKey, settingsService.getTodayInTimezone());
}

function normalizeCreateInput(input: CreateEventInput): CreateEventInput {
  const eventType = input.eventType || 'custom';
  const remindDays = input.remindDays ?? DEFAULTS.REMIND_DAYS;

  if (eventType === 'custom') {
    if (!input.targetDate) {
      throw new Error('请选择目标日期');
    }

    return {
      ...input,
      eventType,
      calendarKey: undefined,
      remindDays,
    };
  }

  if (!isCalendarEventType(eventType)) {
    throw new Error('不支持的事件类型');
  }

  if (!input.calendarKey) {
    throw new Error('请选择节日或节气');
  }

  return {
    ...input,
    eventType,
    calendarKey: input.calendarKey,
    targetDate: resolveCalendarTargetDate(eventType, input.calendarKey),
    remindDays,
  };
}

function normalizeUpdateInput(existingEvent: Event, input: UpdateEventInput): UpdateEventInput {
  const nextEventType = input.eventType || existingEvent.eventType || 'custom';
  const normalizedInput: UpdateEventInput = { ...input };

  if (nextEventType === 'custom') {
    if (input.eventType === 'custom') {
      normalizedInput.calendarKey = null;
    }

    if (input.eventType === 'custom' && !input.targetDate && existingEvent.eventType !== 'custom') {
      throw new Error('请选择目标日期');
    }

    return normalizedInput;
  }

  if (!isCalendarEventType(nextEventType)) {
    throw new Error('不支持的事件类型');
  }

  const calendarKey = input.calendarKey ?? existingEvent.calendarKey;

  if (!calendarKey) {
    throw new Error('请选择节日或节气');
  }

  if (input.eventType !== undefined) {
    normalizedInput.eventType = nextEventType;
  }

  if (input.eventType !== undefined || input.calendarKey !== undefined) {
    normalizedInput.calendarKey = calendarKey;
  }

  if (
    input.eventType !== undefined ||
    input.calendarKey !== undefined ||
    input.remindDays !== undefined
  ) {
    normalizedInput.targetDate = resolveCalendarTargetDate(nextEventType, calendarKey);
    normalizedInput.remindDays = input.remindDays ?? existingEvent.remindDays ?? DEFAULTS.REMIND_DAYS;
  }

  return normalizedInput;
}

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

  return eventModel.create(userId, normalizeCreateInput(input));
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

  return eventModel.update(id, normalizeUpdateInput(event, input));
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
