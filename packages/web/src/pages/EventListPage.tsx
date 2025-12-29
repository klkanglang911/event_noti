import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Trash2, Edit, MoreVertical } from 'lucide-react';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';

// CountdownBadge component
function CountdownBadge({ days }: { days: number }) {
  let colorClass = 'bg-green-100 text-green-800';
  let text = `${days} 天`;

  if (days <= 0) {
    colorClass = 'bg-red-100 text-red-800';
    text = days === 0 ? '今天' : `已过期 ${Math.abs(days)} 天`;
  } else if (days <= 3) {
    colorClass = 'bg-red-100 text-red-800';
  } else if (days <= 7) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

// StatusBadge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800', label: '进行中' },
    completed: { color: 'bg-blue-100 text-blue-800', label: '已完成' },
    expired: { color: 'bg-gray-100 text-gray-800', label: '已过期' },
  };

  const { color, label } = config[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function EventListPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const { data: events, isLoading } = useEvents(selectedGroupId);
  const { data: groups } = useGroups();
  const deleteEvent = useDeleteEvent();

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除事件 "${title}" 吗？`)) return;

    try {
      await deleteEvent.mutateAsync(id);
      toast.success('事件已删除');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">事件列表</h2>
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="input w-40"
          >
            <option value="">全部分组</option>
            {groups?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <Link to="/events/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>创建事件</span>
        </Link>
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                {/* Group color indicator */}
                {event.group && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.group.color }}
                    title={event.group.name}
                  />
                )}
                {!event.group && <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-200" />}

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    截止日期: {new Date(event.targetDate).toLocaleDateString('zh-CN')}
                    {event.group && (
                      <span className="ml-2">· {event.group.name}</span>
                    )}
                  </p>
                </div>

                {/* Countdown */}
                <div className="flex-shrink-0">
                  <CountdownBadge days={event.daysRemaining ?? 0} />
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === event.id ? null : event.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>

                  {menuOpenId === event.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <Link
                          to={`/events/${event.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setMenuOpenId(null)}
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无事件</p>
            <Link to="/events/new" className="text-primary-600 hover:underline mt-2 inline-block">
              创建第一个事件
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
