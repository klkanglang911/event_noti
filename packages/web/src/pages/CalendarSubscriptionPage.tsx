import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, CalendarClock } from 'lucide-react';
import { useCalendarSubscription, useUpdateCalendarSubscription } from '@/hooks/useCalendarSubscription';
import { useGroups } from '@/hooks/useGroups';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import { addDaysToIsoDate, getNextUpcomingCalendarEvent, type MessageFormat } from '@event-noti/shared';

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

export default function CalendarSubscriptionPage() {
  const { data: subscription, isLoading } = useCalendarSubscription();
  const { data: groups } = useGroups();
  const updateMutation = useUpdateCalendarSubscription();
  const prompt = usePrompt();

  const [enabled, setEnabled] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(7);
  const [targetTime, setTargetTime] = useState('09:00');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [messageFormat, setMessageFormat] = useState<MessageFormat>('text');

  useEffect(() => {
    if (subscription) {
      setEnabled(subscription.enabled);
      setAdvanceDays(subscription.advanceDays);
      setTargetTime(subscription.targetTime || '09:00');
      setGroupId(subscription.groupId || '');
      setMessageFormat(subscription.messageFormat || 'text');
    }
  }, [subscription]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = useMemo(() => {
    try {
      return getNextUpcomingCalendarEvent(today);
    } catch {
      return null;
    }
  }, [today]);
  const reminderDate = upcoming ? addDaysToIsoDate(upcoming.date, -advanceDays) : null;

  const handleSave = async () => {
    if (advanceDays < 0 || advanceDays > 365) {
      await prompt.error('提前天数必须在 0 到 365 之间');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        enabled,
        advanceDays,
        targetTime,
        groupId: groupId || null,
        messageFormat,
      });
      await prompt.success('订阅设置已保存');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <CalendarClock className="w-6 h-6 text-primary-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">节日/节气订阅</h2>
          <p className="text-sm text-gray-500">
            开启后，系统自动对每个传统节日和二十四节气提前 {advanceDays} 天发送提醒
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="label mb-0">启用订阅</label>
            <p className="text-sm text-gray-500">关闭后不再发送节日/节气提醒</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Advance days + target time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="advanceDays" className="label">
              提前天数
            </label>
            <input
              id="advanceDays"
              type="number"
              min={0}
              max={365}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(Math.min(365, Math.max(0, Number(e.target.value) || 0)))}
              className="input"
              disabled={updateMutation.isPending}
            />
            <p className="text-sm text-gray-500 mt-1">每个节日/节气到来前 N 天提醒（0 = 当天）</p>
          </div>
          <div>
            <label htmlFor="targetTime" className="label">
              通知时间
            </label>
            <input
              id="targetTime"
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="input w-32"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        {/* Group */}
        <div>
          <label htmlFor="groupId" className="label">
            分组
          </label>
          <select
            id="groupId"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="input"
            disabled={updateMutation.isPending}
          >
            <option value="">默认 Webhook</option>
            {groups?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">选择发到哪个分组的 Webhook；空 = 默认 Webhook</p>
        </div>

        {/* Message format */}
        <div>
          <label className="label">消息格式</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="messageFormat"
                value="text"
                checked={messageFormat === 'text'}
                onChange={() => setMessageFormat('text')}
                className="w-4 h-4 text-primary-600"
                disabled={updateMutation.isPending}
              />
              <span className="text-sm text-gray-600">纯文本</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="messageFormat"
                value="markdown"
                checked={messageFormat === 'markdown'}
                onChange={() => setMessageFormat('markdown')}
                className="w-4 h-4 text-primary-600"
                disabled={updateMutation.isPending}
              />
              <span className="text-sm text-gray-600">Markdown</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        {upcoming && reminderDate && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-500">
              下一个{upcoming.eventType === 'solar_term' ? '节气' : '节日'}
            </p>
            <p className="font-medium text-gray-900">
              {upcoming.name}（{formatDate(upcoming.date)}）
            </p>
            <p className="text-gray-500 mt-1">
              将于 <span className="font-medium text-gray-900">{formatDate(reminderDate)}</span> 提前 {advanceDays} 天提醒你
            </p>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
