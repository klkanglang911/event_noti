import * as groupModel from '../models/groupModel.ts';
import * as webhookModel from '../models/webhookModel.ts';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

// Get groups for user
export function getGroupsByUser(userId: number): Group[] {
  return groupModel.findByUserId(userId);
}

// Get group by ID
export function getGroupById(id: number): Group | null {
  return groupModel.findById(id);
}

// Create group
export function createGroup(userId: number, input: CreateGroupInput): Group {
  // Validate webhook exists if provided
  if (input.webhookId) {
    const webhook = webhookModel.findById(input.webhookId);
    if (!webhook) {
      throw new Error('Webhook 不存在');
    }
  }

  return groupModel.create(userId, input);
}

// Update group
export function updateGroup(
  id: number,
  userId: number,
  input: UpdateGroupInput
): Group | null {
  // Check if group belongs to user
  if (!groupModel.belongsToUser(id, userId)) {
    return null;
  }

  // Validate webhook exists if provided
  if (input.webhookId) {
    const webhook = webhookModel.findById(input.webhookId);
    if (!webhook) {
      throw new Error('Webhook 不存在');
    }
  }

  return groupModel.update(id, input);
}

// Delete group
export function deleteGroup(id: number, userId: number): boolean {
  if (!groupModel.belongsToUser(id, userId)) {
    return false;
  }

  return groupModel.remove(id);
}

// Check if group belongs to user
export function groupBelongsToUser(id: number, userId: number): boolean {
  return groupModel.belongsToUser(id, userId);
}
