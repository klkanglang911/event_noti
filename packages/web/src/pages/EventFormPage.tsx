import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useEvent, useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: event, isLoading: eventLoading } = useEvent(id ? parseInt(id) : 0);
  const { data: groups } = useGroups();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [remindDays, setRemindDays] = useState(7);
  const [groupId, setGroupId] = useState<number | ''>('');

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setContent(event.content || '');
      setTargetDate(event.targetDate);
      setRemindDays(event.remindDays);
      setGroupId(event.groupId || '');
    }
  }, [event]);

  const isLoading = createEvent.isPending || updateEvent.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('请输入事件标题');
      return;
    }

    if (!targetDate) {
      toast.error('请选择目标日期');
      return;
    }

    const input = {
      title: title.trim(),
      content: content.trim() || undefined,
      targetDate,
      remindDays,
      groupId: groupId || undefined,
    };

    try {
      if (isEditing) {
        await updateEvent.mutateAsync({ id: parseInt(id!), input });
        toast.success('事件已更新');
      } else {
        await createEvent.mutateAsync(input);
        toast.success('事件已创建');
      }
      navigate('/events');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (isEditing && eventLoading) {
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
          {isEditing ? '编辑事件' : '创建事件'}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="label">
            事件标题 <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="例如：项目报告提交"
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="label">
            事件描述
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="补充事件详细信息（可选）"
            disabled={isLoading}
            maxLength={500}
          />
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="targetDate" className="label">
            目标日期 <span className="text-red-500">*</span>
          </label>
          <input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="input"
            min={isEditing ? undefined : today}
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">事件的截止或目标日期</p>
        </div>

        {/* Remind Days */}
        <div>
          <label htmlFor="remindDays" className="label">
            提前提醒天数
          </label>
          <div className="flex items-center gap-2">
            <input
              id="remindDays"
              type="number"
              value={remindDays}
              onChange={(e) => setRemindDays(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
              className="input w-24"
              min={0}
              max={30}
              disabled={isLoading}
            />
            <span className="text-gray-500">天</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            从目标日期前 {remindDays} 天开始，每天发送提醒通知
          </p>
        </div>

        {/* Group */}
        <div>
          <label htmlFor="groupId" className="label">
            分组
          </label>
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
                <span>{isEditing ? '保存修改' : '创建事件'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
