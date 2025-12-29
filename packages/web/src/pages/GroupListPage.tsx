import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Edit, X, Loader2, Users } from 'lucide-react';
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useGroupUsers, useSetGroupUsers } from '@/hooks/useGroups';
import { useWebhooks } from '@/hooks/useWebhooks';
import { useUsers } from '@/hooks/useUsers';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';
import type { Group } from '@event-noti/shared';

// Predefined colors
const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
];

// Modal component for create/edit group
function GroupModal({
  isOpen,
  onClose,
  group,
  webhooks,
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: Group;
  webhooks: { id: number; name: string }[];
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [webhookId, setWebhookId] = useState<number | ''>('');

  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();

  const isLoading = createGroup.isPending || updateGroup.isPending;
  const isEditing = !!group;

  // Sync state when group prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(group?.name || '');
      setColor(group?.color || COLORS[0]);
      setWebhookId(group?.webhookId || '');
    }
  }, [isOpen, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('请输入分组名称');
      return;
    }

    try {
      if (isEditing) {
        await updateGroup.mutateAsync({
          id: group.id,
          input: { name: name.trim(), color, webhookId: webhookId || null },
        });
        toast.success('分组已更新');
      } else {
        await createGroup.mutateAsync({
          name: name.trim(),
          color,
          webhookId: webhookId || undefined,
        });
        toast.success('分组已创建');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? '编辑分组' : '创建分组'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              分组名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="例如：工作项目"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {/* Color */}
          <div>
            <label className="label">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Webhook */}
          <div>
            <label htmlFor="webhookId" className="label">
              关联 Webhook
            </label>
            <select
              id="webhookId"
              value={webhookId}
              onChange={(e) => setWebhookId(e.target.value ? parseInt(e.target.value) : '')}
              className="input"
              disabled={isLoading}
            >
              <option value="">使用默认 Webhook</option>
              {webhooks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              该分组的事件通知将发送到选中的 Webhook
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isEditing ? '保存' : '创建'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal component for user assignment
function UserAssignmentModal({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: allUsers, isLoading: loadingUsers } = useUsers();
  const { data: assignedUsers, isLoading: loadingAssigned } = useGroupUsers(group?.id || 0);
  const setGroupUsers = useSetGroupUsers();

  const isLoading = setGroupUsers.isPending;

  // Sync selected users when modal opens
  useEffect(() => {
    if (isOpen && assignedUsers) {
      setSelectedUserIds(assignedUsers.map((u) => u.userId));
    }
  }, [isOpen, assignedUsers]);

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!group) return;

    try {
      await setGroupUsers.mutateAsync({
        groupId: group.id,
        userIds: selectedUserIds,
      });
      toast.success('用户分配已更新');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!isOpen || !group) return null;

  // Filter out admin users - they have access to all groups anyway
  const regularUsers = allUsers?.filter((u) => u.role !== 'admin') || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">分配用户</h3>
            <p className="text-sm text-gray-500 mt-1">
              分组：<span className="font-medium">{group.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User list */}
        <div className="p-6">
          {loadingUsers || loadingAssigned ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : regularUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无普通用户</p>
              <p className="text-sm mt-1">请先创建普通用户账号</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {regularUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">
            已选择 {selectedUserIds.length} 个用户
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isLoading || regularUsers.length === 0}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>保存</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState<Group | null>(null);

  const { data: groups, isLoading } = useGroups();
  const { data: webhooks } = useWebhooks();
  const deleteGroup = useDeleteGroup();

  // Transform webhooks to simple format for modal
  const webhookOptions = webhooks?.map((w) => ({ id: w.id, name: w.name })) || [];

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingGroup(undefined);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingGroup(undefined);
  };

  const handleAssignUsers = (group: Group) => {
    setAssigningGroup(group);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setAssigningGroup(null);
  };

  const handleDelete = async (id: number, name: string, eventCount?: number) => {
    const message = eventCount
      ? `分组 "${name}" 包含 ${eventCount} 个事件，删除后这些事件将变为无分组。确定删除吗？`
      : `确定要删除分组 "${name}" 吗？`;

    if (!confirm(message)) return;

    try {
      await deleteGroup.mutateAsync(id);
      toast.success('分组已删除');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">分组管理</h2>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>创建分组</span>
        </button>
      </div>

      {/* Groups grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAssignUsers(group)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                    title="分配用户"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id, group.name, group.eventCount)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>{group.eventCount || 0} 个事件</p>
                {group.webhook ? (
                  <p className="truncate">Webhook: {group.webhook.name}</p>
                ) : (
                  <p className="text-gray-400">使用默认 Webhook</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无分组</p>
          <p className="text-sm mt-1">创建分组来组织您的事件</p>
          <button onClick={handleCreate} className="btn-primary mt-4">
            <Plus className="w-5 h-5" />
            <span>创建分组</span>
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <GroupModal
        isOpen={modalOpen}
        onClose={handleClose}
        group={editingGroup}
        webhooks={webhookOptions}
      />

      {/* User Assignment Modal */}
      <UserAssignmentModal
        isOpen={userModalOpen}
        onClose={handleCloseUserModal}
        group={assigningGroup}
      />
    </div>
  );
}
