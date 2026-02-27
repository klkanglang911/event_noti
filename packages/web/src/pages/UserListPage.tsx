import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, X, Loader2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import type { User } from '@event-noti/shared';

// Modal component
function UserModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}) {
  const prompt = usePrompt();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const isLoading = createUser.isPending || updateUser.isPending;
  const isEditing = !!user;

  // Sync state when user prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername(user?.username || '');
      setDisplayName(user?.displayName || '');
      setPassword('');
      setRole(user?.role || 'user');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      await prompt.error('请输入用户名');
      return;
    }

    if (!displayName.trim()) {
      await prompt.error('请输入显示名称');
      return;
    }

    if (!isEditing && !password) {
      await prompt.error('请输入密码');
      return;
    }

    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          input: {
            displayName: displayName.trim(),
            role,
            ...(password ? { password } : {}),
          },
        });
        await prompt.success('用户已更新');
      } else {
        await createUser.mutateAsync({
          username: username.trim(),
          displayName: displayName.trim(),
          password,
          role,
        });
        await prompt.success('用户已创建');
      }
      onClose();
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? '编辑用户' : '添加用户'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="username" className="label">
              用户名 <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="登录用户名"
              disabled={isLoading || isEditing}
              maxLength={50}
            />
            {isEditing && (
              <p className="text-sm text-gray-500 mt-1">用户名不可修改</p>
            )}
          </div>

          <div>
            <label htmlFor="displayName" className="label">
              显示名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="用户显示名称"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              密码 {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder={isEditing ? '留空表示不修改' : '设置密码'}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="role" className="label">
              角色
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              className="input"
              disabled={isLoading}
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isEditing ? '保存' : '添加'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const prompt = usePrompt();

  const { user: currentUser } = useAuthStore();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(undefined);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingUser(undefined);
  };

  const handleDelete = async (id: number, username: string) => {
    if (id === currentUser?.id) {
      await prompt.error('不能删除自己的账户');
      return;
    }

    const confirmed = await prompt.confirm(`确定要删除用户 "${username}" 吗？`);
    if (!confirmed) return;

    try {
      await deleteUser.mutateAsync(id);
      await prompt.success('用户已删除');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">用户管理</h2>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>添加用户</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {user.displayName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.username}</td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="badge-info">管理员</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">用户</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="badge-success">活跃</span>
                    ) : (
                      <span className="badge-error">禁用</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="删除"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className={`w-4 h-4 ${user.id === currentUser?.id ? 'text-gray-200' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无用户</p>
          </div>
        )}
      </div>

      <UserModal isOpen={modalOpen} onClose={handleClose} user={editingUser} />
    </div>
  );
}
