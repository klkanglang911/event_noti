import { useState } from 'react';
import { History, RefreshCw, Loader2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import { useNotifications, useNotificationStats, useRetryNotification, useDeleteNotification } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';
import type { Notification } from '@event-noti/shared';

// Status filter options
const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待发送' },
  { value: 'sent', label: '已发送' },
  { value: 'failed', label: '失败' },
];

// Status badge component
function StatusBadge({ status }: { status: Notification['status'] }) {
  switch (status) {
    case 'sent':
      return (
        <span className="badge-success inline-flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          已发送
        </span>
      );
    case 'failed':
      return (
        <span className="badge-error inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          失败
        </span>
      );
    case 'pending':
      return (
        <span className="badge-warning inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          待发送
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
}

// Retry button component
function RetryButton({ notification }: { notification: Notification }) {
  const retryNotification = useRetryNotification();

  const handleRetry = async () => {
    try {
      await retryNotification.mutateAsync(notification.id);
      toast.success('通知已重新加入队列');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (notification.status !== 'failed') return null;

  return (
    <button
      onClick={handleRetry}
      disabled={retryNotification.isPending}
      className="btn-secondary text-sm py-1.5 px-3"
      title="重试发送"
    >
      {retryNotification.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      <span>重试</span>
    </button>
  );
}

// Delete/Cancel button component
function DeleteButton({ notification }: { notification: Notification }) {
  const deleteNotification = useDeleteNotification();

  const handleDelete = async () => {
    const isPending = notification.status === 'pending';
    const confirmMessage = isPending
      ? '确定要取消这条待发送的通知吗？'
      : '确定要删除这条通知记录吗？';

    if (!confirm(confirmMessage)) return;

    try {
      await deleteNotification.mutateAsync(notification.id);
      toast.success(isPending ? '通知已取消' : '通知已删除');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isPending = notification.status === 'pending';

  return (
    <button
      onClick={handleDelete}
      disabled={deleteNotification.isPending}
      className="btn-secondary text-sm py-1.5 px-3 text-red-600 hover:bg-red-50"
      title={isPending ? '取消发送' : '删除记录'}
    >
      {deleteNotification.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPending ? (
        <X className="w-4 h-4" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      <span>{isPending ? '取消' : '删除'}</span>
    </button>
  );
}

// Stats card component
function StatsCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className={`rounded-lg px-4 py-3 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
}

// Format date-only for display (e.g., "2025-12-29")
function formatScheduledDate(dateStr: string | null, timeStr?: string) {
  if (!dateStr) return '-';

  // scheduledDate is just a date string like "2025-12-29"
  // Combine with scheduledTime if available
  const displayTime = timeStr || '09:00';
  return `${dateStr} ${displayTime}`;
}

// Format datetime for display (handles both ISO and legacy formats)
function formatSentAt(dateStr: string | null) {
  if (!dateStr) return '-';

  let date: Date;

  // Check if it's ISO format with timezone (has 'T' and 'Z' or timezone offset)
  if (dateStr.includes('T')) {
    date = new Date(dateStr);
  } else {
    // Legacy format without timezone - assume UTC and add 'Z' suffix
    // Convert "2025-12-29 06:30:00" to "2025-12-29T06:30:00Z"
    date = new Date(dateStr.replace(' ', 'T') + 'Z');
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationHistoryPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useNotifications({
    page,
    limit,
    status: status || undefined,
  });
  const { data: stats } = useNotificationStats();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">通知历史</h2>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="input w-40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="总计" value={stats.total} color="blue" />
          <StatsCard label="待发送" value={stats.pending} color="yellow" />
          <StatsCard label="已发送" value={stats.sent} color="green" />
          <StatsCard label="失败" value={stats.failed} color="red" />
        </div>
      )}

      {/* Notifications list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    事件
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    计划时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    发送时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {notification.event?.title || `事件 #${notification.eventId}`}
                        </p>
                        {notification.errorMessage && (
                          <p className="text-sm text-red-500 mt-1 max-w-xs truncate" title={notification.errorMessage}>
                            {notification.errorMessage}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatScheduledDate(notification.scheduledDate, notification.scheduledTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatSentAt(notification.sentAt)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={notification.status} />
                      {notification.retryCount > 0 && (
                        <span className="ml-2 text-xs text-gray-400">
                          (重试 {notification.retryCount} 次)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <RetryButton notification={notification} />
                        <DeleteButton notification={notification} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无通知记录</p>
            {status && (
              <p className="text-sm mt-1">
                当前筛选：{STATUS_OPTIONS.find((o) => o.value === status)?.label}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
