import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Plus, Trash2, Edit, MoreVertical, Pause, Play, History } from 'lucide-react';
import {
  useRecurringReminders,
  useDeleteRecurringReminder,
  usePauseRecurringReminder,
  useResumeRecurringReminder,
} from '@/hooks/useRecurringReminders';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import { REMINDER_CATEGORY_LABELS, REMINDER_CATEGORY_ICONS } from '@event-noti/shared';
import type { RecurringReminder, ReminderCategory } from '@event-noti/shared';

// StatusBadge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800', label: '运行中' },
    paused: { color: 'bg-yellow-100 text-yellow-800', label: '已暂停' },
    disabled: { color: 'bg-gray-100 text-gray-800', label: '已禁用' },
  };

  const { color, label } = config[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

// Format interval to human readable
function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  if (minutes === 60) return '1 小时';
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时 ${minutes % 60 > 0 ? `${minutes % 60} 分钟` : ''}`.trim();
  if (minutes === 1440) return '每天一次';
  return `${Math.floor(minutes / 1440)} 天`;
}

// Reminder card component
function ReminderCard({
  reminder,
  onDelete,
  onPause,
  onResume,
}: {
  reminder: RecurringReminder;
  onDelete: (id: number, title: string) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const icon = REMINDER_CATEGORY_ICONS[reminder.category] || '🔔';

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="text-3xl">{icon}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{reminder.title}</h3>
            <StatusBadge status={reminder.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
              每 {formatInterval(reminder.intervalMinutes)}
            </span>
            <span>
              {reminder.startTime} - {reminder.endTime}
            </span>
            <span>{reminder.workdaysOnly ? '仅工作日' : '每天'}</span>
            {reminder.group && (
              <span className="text-primary-600">· {reminder.group.name}</span>
            )}
          </div>
          {reminder.lastSentAt && (
            <p className="text-xs text-gray-400 mt-1">
              上次发送: {new Date(reminder.lastSentAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {reminder.status === 'active' ? (
                  <button
                    onClick={() => {
                      onPause(reminder.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50 w-full"
                  >
                    <Pause className="w-4 h-4" />
                    暂停
                  </button>
                ) : reminder.status === 'paused' ? (
                  <button
                    onClick={() => {
                      onResume(reminder.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-gray-50 w-full"
                  >
                    <Play className="w-4 h-4" />
                    恢复
                  </button>
                ) : null}
                <Link
                  to={`/recurring/${reminder.id}/logs`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <History className="w-4 h-4" />
                  历史记录
                </Link>
                <Link
                  to={`/recurring/${reminder.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </Link>
                <button
                  onClick={() => {
                    onDelete(reminder.id, reminder.title);
                    setMenuOpen(false);
                  }}
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
    </div>
  );
}

export default function RecurringReminderListPage() {
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | undefined>();
  const prompt = usePrompt();

  const { data: reminders, isLoading } = useRecurringReminders(selectedCategory);
  const deleteReminder = useDeleteRecurringReminder();
  const pauseReminder = usePauseRecurringReminder();
  const resumeReminder = useResumeRecurringReminder();

  const handleDelete = async (id: number, title: string) => {
    const confirmed = await prompt.confirm(`确定要删除提醒 "${title}" 吗？`);
    if (!confirmed) return;

    try {
      await deleteReminder.mutateAsync(id);
      await prompt.success('提醒已删除');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  const handlePause = async (id: number) => {
    try {
      await pauseReminder.mutateAsync(id);
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  const handleResume = async (id: number) => {
    try {
      await resumeReminder.mutateAsync(id);
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  // Group reminders by category
  const groupedReminders = reminders?.reduce(
    (acc, reminder) => {
      const category = reminder.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reminder);
      return acc;
    },
    {} as Record<string, RecurringReminder[]>
  );

  const categories: ReminderCategory[] = ['stand', 'water', 'eye', 'medicine', 'custom'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">循环提醒</h2>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value as ReminderCategory || undefined)}
            className="input w-36"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {REMINDER_CATEGORY_ICONS[cat]} {REMINDER_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <Link to="/recurring/new" className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>新建提醒</span>
        </Link>
      </div>

      {/* Reminders list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : reminders && reminders.length > 0 ? (
          selectedCategory ? (
            // Show flat list when category is selected
            <div className="divide-y divide-gray-100">
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onDelete={handleDelete}
                  onPause={handlePause}
                  onResume={handleResume}
                />
              ))}
            </div>
          ) : (
            // Show grouped list when no category selected
            <div className="divide-y divide-gray-100">
              {categories.map((category) => {
                const categoryReminders = groupedReminders?.[category];
                if (!categoryReminders || categoryReminders.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-700">
                        {REMINDER_CATEGORY_ICONS[category]} {REMINDER_CATEGORY_LABELS[category]}
                        <span className="ml-2 text-gray-400">({categoryReminders.length})</span>
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {categoryReminders.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          onDelete={handleDelete}
                          onPause={handlePause}
                          onResume={handleResume}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无循环提醒</p>
            <Link to="/recurring/new" className="text-primary-600 hover:underline mt-2 inline-block">
              创建第一个提醒
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
