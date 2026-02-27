import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Edit, X, Loader2, Send, Check, AlertCircle } from 'lucide-react';
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook } from '@/hooks/useWebhooks';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import type { Webhook as WebhookType } from '@event-noti/shared';

// Modal component
function WebhookModal({
  isOpen,
  onClose,
  webhook,
}: {
  isOpen: boolean;
  onClose: () => void;
  webhook?: WebhookType;
}) {
  const prompt = usePrompt();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();

  const isLoading = createWebhook.isPending || updateWebhook.isPending;
  const isEditing = !!webhook;

  // Sync state when webhook prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(webhook?.name || '');
      setUrl(webhook?.url || '');
      setIsDefault(webhook?.isDefault || false);
    }
  }, [isOpen, webhook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      await prompt.error('请输入名称');
      return;
    }

    if (!url.trim()) {
      await prompt.error('请输入 Webhook URL');
      return;
    }

    try {
      if (isEditing) {
        await updateWebhook.mutateAsync({
          id: webhook.id,
          input: { name: name.trim(), url: url.trim(), isDefault },
        });
        await prompt.success('Webhook 已更新');
      } else {
        await createWebhook.mutateAsync({
          name: name.trim(),
          url: url.trim(),
          isDefault,
        });
        await prompt.success('Webhook 已创建');
      }
      onClose();
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? '编辑 Webhook' : '添加 Webhook'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="label">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="例如：开发团队群"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="url" className="label">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input font-mono text-sm"
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              企业微信机器人 Webhook 地址
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isDefault"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              disabled={isLoading}
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">
              设为默认 Webhook
            </label>
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

// Test button component
function TestButton({ webhookId }: { webhookId: number }) {
  const testWebhook = useTestWebhook();
  const prompt = usePrompt();

  const handleTest = async () => {
    try {
      await testWebhook.mutateAsync(webhookId);
      await prompt.success('测试消息发送成功');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={testWebhook.isPending}
      className="btn-secondary text-sm py-1.5"
    >
      {testWebhook.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : testWebhook.isSuccess ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : testWebhook.isError ? (
        <AlertCircle className="w-4 h-4 text-red-600" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      <span>测试</span>
    </button>
  );
}

export default function WebhookListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | undefined>();
  const prompt = usePrompt();

  const { data: webhooks, isLoading } = useWebhooks();
  const deleteWebhook = useDeleteWebhook();

  const handleEdit = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingWebhook(undefined);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingWebhook(undefined);
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await prompt.confirm(`确定要删除 Webhook "${name}" 吗？`);
    if (!confirmed) return;

    try {
      await deleteWebhook.mutateAsync(id);
      await prompt.success('Webhook 已删除');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  // Mask URL for display
  const maskUrl = (url: string) => {
    try {
      const u = new URL(url);
      const key = u.searchParams.get('key');
      if (key && key.length > 8) {
        return `${u.origin}${u.pathname}?key=${key.slice(0, 4)}...${key.slice(-4)}`;
      }
      return url.length > 50 ? url.slice(0, 50) + '...' : url;
    } catch {
      return url.length > 50 ? url.slice(0, 50) + '...' : url;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Webhook 管理</h2>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>添加 Webhook</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{webhook.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {maskUrl(webhook.url)}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    {webhook.isDefault ? (
                      <span className="badge-success">默认</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">普通</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <TestButton webhookId={webhook.id} />
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id, webhook.name)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Webhook className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无 Webhook</p>
            <p className="text-sm mt-1">添加企业微信机器人 Webhook 以接收通知</p>
            <button onClick={handleCreate} className="btn-primary mt-4">
              <Plus className="w-5 h-5" />
              <span>添加 Webhook</span>
            </button>
          </div>
        )}
      </div>

      <WebhookModal isOpen={modalOpen} onClose={handleClose} webhook={editingWebhook} />
    </div>
  );
}
