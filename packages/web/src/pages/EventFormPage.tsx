import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Bold, Italic, List, ListOrdered, Quote, Code, Link, Eye, EyeOff } from 'lucide-react';
import { useEvent, useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';
import type { MessageFormat } from '@event-noti/shared';

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
  const [targetTime, setTargetTime] = useState('09:00');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [messageFormat, setMessageFormat] = useState<MessageFormat>('text');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prompt = usePrompt();

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setContent(event.content || '');
      setTargetDate(event.targetDate);
      setTargetTime(event.targetTime || '09:00');
      setGroupId(event.groupId || '');
      setMessageFormat(event.messageFormat || 'text');
    }
  }, [event]);

  // Markdown toolbar helpers
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + before.length,
        selectedText ? newCursorPos : start + before.length
      );
    }, 0);
  };

  const markdownActions = [
    { icon: Bold, title: '加粗', action: () => insertMarkdown('**', '**') },
    { icon: Italic, title: '斜体', action: () => insertMarkdown('*', '*') },
    { icon: Code, title: '代码', action: () => insertMarkdown('`', '`') },
    { icon: Link, title: '链接', action: () => insertMarkdown('[', '](url)') },
    { icon: Quote, title: '引用', action: () => insertMarkdown('> ') },
    { icon: List, title: '无序列表', action: () => insertMarkdown('- ') },
    { icon: ListOrdered, title: '有序列表', action: () => insertMarkdown('1. ') },
  ];

  // Simple markdown to HTML converter for preview
  const renderMarkdownPreview = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary-600 underline">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 text-gray-600">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
      .replace(/\n/g, '<br />');
  };

  const isLoading = createEvent.isPending || updateEvent.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      await prompt.error('请输入事件标题');
      return;
    }

    if (!targetDate) {
      await prompt.error('请选择目标日期');
      return;
    }

    const input = {
      title: title.trim(),
      content: content.trim() || undefined,
      targetDate,
      targetTime,
      messageFormat,
      groupId: groupId || undefined,
    };

    try {
      if (isEditing) {
        await updateEvent.mutateAsync({ id: parseInt(id!), input });
        await prompt.success('事件已更新');
      } else {
        await createEvent.mutateAsync(input);
        await prompt.success('事件已创建');
      }
      navigate('/events');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
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

        {/* Content with Message Format */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="label mb-0">
              事件描述
            </label>
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

          {/* Markdown Toolbar */}
          {messageFormat === 'markdown' && (
            <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 rounded-t-lg border border-b-0 border-gray-200">
              {markdownActions.map(({ icon: Icon, title, action }) => (
                <button
                  key={title}
                  type="button"
                  onClick={action}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors"
                  title={title}
                  disabled={isLoading}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`p-1.5 rounded transition-colors ${
                  showPreview ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
                title={showPreview ? '编辑' : '预览'}
                disabled={isLoading}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Editor / Preview */}
          {messageFormat === 'markdown' && showPreview ? (
            <div
              className="input min-h-[150px] prose prose-sm max-w-none overflow-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content) || '<span class="text-gray-400">预览区域</span>' }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`input min-h-[100px] resize-y ${
                messageFormat === 'markdown' ? 'rounded-t-none border-t-0 min-h-[150px] font-mono text-sm' : ''
              }`}
              placeholder={
                messageFormat === 'markdown'
                  ? '支持 Markdown 格式，如 **加粗**、*斜体*、`代码`、[链接](url) 等'
                  : '补充事件详细信息（可选）'
              }
              disabled={isLoading}
              maxLength={2000}
            />
          )}

          {messageFormat === 'markdown' && (
            <p className="text-xs text-gray-500 mt-1">
              支持基础 Markdown 语法：**加粗** *斜体* `代码` [链接](url) {'>'} 引用 - 列表
            </p>
          )}
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

        {/* Target Time */}
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
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            在指定时间发送提醒通知。系统将根据剩余天数智能安排通知频率：
            创建时立即通知，之后根据距离目标日期的时间自动调整（30天以上每30天、7-30天每7天、3-7天每3天、3天内每天）
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
