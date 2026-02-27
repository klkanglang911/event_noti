import * as groupModel from '../models/groupModel.ts';
import * as webhookModel from '../models/webhookModel.ts';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

const WEBHOOK_NOT_FOUND_ERROR = 'Webhook 不存在';
export const GROUP_NAME_EXISTS_ERROR = '分组名称已存在';

function isGroupNameConflictError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes('idx_groups_created_by_name_normalized')
    || error.message.includes('UNIQUE constraint failed')
  );
}

// Get groups (admin: all, user: assigned only)
export function getGroups(userId: number, isAdmin: boolean): Group[] {
  if (isAdmin) {
    return groupModel.findAll();
  }
  return groupModel.findByUserId(userId);
}

// Get group by ID (with access check)
export function getGroupById(id: number, userId: number, isAdmin: boolean): Group | null {
  const group = groupModel.findById(id);
  if (!group) return null;

  // Check access
  if (!groupModel.userHasAccess(id, userId, isAdmin)) {
    return null;
  }

  return group;
}

// Create group (admin only, checked in controller)
export function createGroup(createdBy: number, input: CreateGroupInput): Group {
  if (groupModel.existsByOwnerAndName(createdBy, input.name)) {
    throw new Error(GROUP_NAME_EXISTS_ERROR);
  }

  // Validate webhook exists if provided
  if (input.webhookId) {
    const webhook = webhookModel.findById(input.webhookId);
    if (!webhook) {
      throw new Error(WEBHOOK_NOT_FOUND_ERROR);
    }
  }

  try {
    return groupModel.create(createdBy, input);
  } catch (error) {
    if (isGroupNameConflictError(error)) {
      throw new Error(GROUP_NAME_EXISTS_ERROR);
    }
    throw error;
  }
}

// Update group (admin only, checked in controller)
export function updateGroup(id: number, input: UpdateGroupInput): Group | null {
  const group = groupModel.findById(id);
  if (!group) return null;

  if (input.name !== undefined && groupModel.existsByOwnerAndName(group.userId, input.name, id)) {
    throw new Error(GROUP_NAME_EXISTS_ERROR);
  }

  // Validate webhook exists if provided
  if (input.webhookId) {
    const webhook = webhookModel.findById(input.webhookId);
    if (!webhook) {
      throw new Error(WEBHOOK_NOT_FOUND_ERROR);
    }
  }

  try {
    return groupModel.update(id, input);
  } catch (error) {
    if (isGroupNameConflictError(error)) {
      throw new Error(GROUP_NAME_EXISTS_ERROR);
    }
    throw error;
  }
}

// Delete group (admin only, checked in controller)
export function deleteGroup(id: number): boolean {
  return groupModel.remove(id);
}

// Get users assigned to a group (admin only)
export function getAssignedUsers(groupId: number): { userId: number; username: string; displayName: string }[] {
  const users = groupModel.getAssignedUsers(groupId);
  return users.map((u) => ({
    userId: u.user_id,
    username: u.username,
    displayName: u.display_name,
  }));
}

// Set users assigned to group (admin only)
export function setAssignedUsers(groupId: number, userIds: number[], assignedBy: number): boolean {
  const group = groupModel.findById(groupId);
  if (!group) return false;

  groupModel.setAssignedUsers(groupId, userIds, assignedBy);
  return true;
}

// Check if user has access to group
export function userHasAccess(groupId: number, userId: number, isAdmin: boolean): boolean {
  return groupModel.userHasAccess(groupId, userId, isAdmin);
}
