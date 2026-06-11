import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import {
  useRecurringReminder,
  useCreateRecurringReminder,
  useUpdateRecurringReminder,
} from '@/hooks/useRecurringReminders';
import { useGroups } from '@/hooks/useGroups';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import { REMINDER_PRESETS, REMINDER_CATEGORY_LABELS, REMINDER_CATEGORY_ICONS } from '@event-noti/shared';
import type { ReminderCategory, MessageFormat } from '@event-noti/shared';

// Preset card component
function PresetCard({
  preset,
  onSelect,
}: {
  preset: (typeof REMINDER_PRESETS)[number];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
    >
      <span className="text-3xl">{preset.icon}</span>
      <span className="text-sm font-medium text-gray-900">{preset.name}</span>
      <span className="text-xs text-gray-500">
        每 {preset.intervalMinutes < 60 ? `${preset.intervalMinutes} 分钟` : `${preset.intervalMinutes / 60} 小时`}
      </span>
    </button>
  );
}

export default function RecurringReminderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: reminder, isLoading: reminderLoading } = useRecurringReminder(id ? parseInt(id) : 0);
  const { data: groups } = useGroups();
  const createReminder = useCreateRecurringReminder();
  const updateReminder = useUpdateRecurringReminder();

  const [showPresets, setShowPresets] = useState(!isEditing);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [customInterval, setCustomInterval] = useState('');
  const [useCustomInterval, setUseCustomInterval] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [workdaysOnly, setWorkdaysOnly] = useState(true);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [messageFormat, setMessageFormat] = useState<MessageFormat>('text');
  const prompt = usePrompt();

  // Populate form when editing
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setContent(reminder.content || '');
      setCategory(reminder.category);
      setIntervalMinutes(reminder.intervalMinutes);
      setStartTime(reminder.startTime);
      setEndTime(reminder.endTime);
      setWorkdaysOnly(reminder.workdaysOnly);
      setGroupId(reminder.groupId || '');
      setMessageFormat(reminder.messageFormat);
      setShowPresets(false);
    }
  }, [reminder]);

  // Handle preset selection
  const handlePresetSelect = (preset: (typeof REMINDER_PRESETS)[number]) => {
    setTitle(preset.title);
    setContent(preset.content);
    setCategory(preset.category);
    setIntervalMinutes(preset.intervalMinutes);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setWorkdaysOnly(preset.workdaysOnly);
    setShowPresets(false);
  };

  // Get effective interval
  const getEffectiveInterval = (): number => {
    if (useCustomInterval) {
      return parseInt(customInterval) || 60;
    }
    return intervalMinutes;
  };

  const isLoading = createReminder.isPending || updateReminder.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      await prompt.error('请输入提醒标题');
      return;
    }

    const effectiveInterval = getEffectiveInterval();
    if (effectiveInterval < 1 || effectiveInterval > 10080) {
      await prompt.error('循环间隔必须在 1 到 10080 分钟之间');
      return;
    }

    const input = {
      title: title.trim(),
      content: content.trim() || undefined,
      category,
      intervalMinutes: effectiveInterval,
      startTime,
      endTime,
      workdaysOnly,
      groupId: groupId || undefined,
      messageFormat,
    };

    try {
      if (isEditing) {
        await updateReminder.mutateAsync({ id: parseInt(id!), input });
        await prompt.success('提醒已更新');
      } else {
        await createReminder.mutateAsync(input);
        await prompt.success('提醒已创建');
      }
      navigate('/recurring');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  // Preset interval options
  const presetIntervals = [
    { label: '15 分钟', value: 15 },
    { label: '20 分钟', value: 20 },
    { label: '30 分钟', value: 30 },
    { label: '45 分钟', value: 45 },
    { label: '1 小时', value: 60 },
    { label: '1.5 小时', value: 90 },
    { label: '2 小时', value: 120 },
    { label: '3 小时', value: 180 },
  ];

  if (isEditing && reminderLoading) {
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
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? '编辑提醒' : '新建循环提醒'}
        </h2>
      </div>

      {/* Presets selection */}
      {showPresets && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">选择预置模板（快速创建）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {REMINDER_PRESETS.map((preset, index) => (
              <PresetCard key={index} preset={preset} onSelect={() => handlePresetSelect(preset)} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowPresets(false)}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            或者从空白开始自定义 →
          </button>
        </div>
      )}

      {/* Form */}
      {!showPresets && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="label">提醒分类</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(REMINDER_CATEGORY_LABELS) as ReminderCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    category === cat
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{REMINDER_CATEGORY_ICONS[cat]}</span>
                  <span className="text-sm">{REMINDER_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              提醒标题 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="例如：站立活动一下"
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="label">提醒内容</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="补充提醒详细信息（可选）"
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          {/* Interval */}
          <div>
            <label className="label">循环间隔</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {presetIntervals.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setIntervalMinutes(value);
                      setUseCustomInterval(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      !useCustomInterval && intervalMinutes === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomInterval}
                    onChange={(e) => setUseCustomInterval(e.target.checked)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-600">自定义</span>
                </label>
                {useCustomInterval && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customInterval}
                      onChange={(e) => setCustomInterval(e.target.value)}
                      className="input w-24"
                      placeholder="90"
                      min="1"
                      max="10080"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-500">分钟</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="label">活跃时间段</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input w-32"
                disabled={isLoading}
              />
              <span className="text-gray-500">至</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input w-32"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">只在指定时间段内发送提醒</p>
          </div>

          {/* Workdays Only */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={workdaysOnly}
                onChange={(e) => setWorkdaysOnly(e.target.checked)}
                className="w-4 h-4 text-primary-600"
                disabled={isLoading}
              />
              <div>
                <span className="text-sm font-medium text-gray-900">仅工作日提醒</span>
                <p className="text-xs text-gray-500">周一至周五提醒，周末不提醒</p>
              </div>
            </label>
          </div>

          {/* Message Format */}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">Markdown</span>
              </label>
            </div>
          </div>

          {/* Group */}
          <div>
            <label htmlFor="groupId" className="label">关联分组</label>
            <select
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value) : '')}
              className="input"
              disabled={isLoading}
            >
              <option value="">无分组</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">分组可以关联不同的 Webhook</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={isLoading}
            >
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? '保存修改' : '创建提醒'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
