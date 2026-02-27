import { useState, useEffect } from 'react';
import { Settings, Clock, Globe, Save, Loader2, RefreshCw } from 'lucide-react';
import { useSettings, useUpdateTimezone } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/services/api';
import { usePrompt } from '@/components/PromptProvider';

// Common timezones
const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '香港时间 (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Taipei', label: '台北时间 (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: '日本时间 (UTC+9)', offset: '+09:00' },
  { value: 'Asia/Seoul', label: '韩国时间 (UTC+9)', offset: '+09:00' },
  { value: 'Asia/Singapore', label: '新加坡时间 (UTC+8)', offset: '+08:00' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5/-4)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: '美国西部时间 (UTC-8/-7)', offset: '-08:00' },
  { value: 'America/Chicago', label: '美国中部时间 (UTC-6/-5)', offset: '-06:00' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0/+1)', offset: '+00:00' },
  { value: 'Europe/Paris', label: '巴黎时间 (UTC+1/+2)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: '柏林时间 (UTC+1/+2)', offset: '+01:00' },
  { value: 'Australia/Sydney', label: '悉尼时间 (UTC+10/+11)', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: '奥克兰时间 (UTC+12/+13)', offset: '+12:00' },
  { value: 'UTC', label: 'UTC (协调世界时)', offset: '+00:00' },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { data: settings, isLoading, refetch } = useSettings();
  const updateTimezone = useUpdateTimezone();
  const prompt = usePrompt();

  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Shanghai');
  const [currentTime, setCurrentTime] = useState('');

  // Initialize timezone from settings
  useEffect(() => {
    if (settings?.timezone) {
      setSelectedTimezone(settings.timezone);
    }
    if (settings?.currentTime) {
      setCurrentTime(settings.currentTime);
    }
  }, [settings]);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('zh-CN', {
          timeZone: selectedTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setCurrentTime(formatter.format(now));
      } catch {
        setCurrentTime('无效时区');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  const handleSave = async () => {
    try {
      await updateTimezone.mutateAsync({ timezone: selectedTimezone });
      await prompt.success('时区设置已保存');
    } catch (error) {
      await prompt.error(getErrorMessage(error));
    }
  };

  const isAdmin = user?.role === 'admin';
  const hasChanges = settings?.timezone !== selectedTimezone;

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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Settings className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">系统设置</h2>
          <p className="text-sm text-gray-500">配置系统参数和时区</p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Timezone Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <Globe className="w-5 h-5" />
            <span>时区设置</span>
          </div>

          <p className="text-sm text-gray-500">
            设置系统时区，所有通知将按照此时区的时间发送。
          </p>

          {/* Current Time Preview */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">当前时区时间</div>
              <div className="text-lg font-mono font-medium text-gray-900">
                {currentTime}
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Timezone Select */}
          <div>
            <label htmlFor="timezone" className="label">
              选择时区
            </label>
            <select
              id="timezone"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="input"
              disabled={!isAdmin || updateTimezone.isPending}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {!isAdmin && (
              <p className="text-sm text-amber-600 mt-2">
                仅管理员可以修改时区设置
              </p>
            )}
          </div>

          {/* Save Button */}
          {isAdmin && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={!hasChanges || updateTimezone.isPending}
                className="btn-primary"
              >
                {updateTimezone.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>保存设置</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="font-medium text-blue-900 mb-1">时区说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 通知将根据设定的时区时间发送</li>
          <li>• 修改时区后，已设置的通知时间保持不变</li>
          <li>• 建议选择与团队所在地区一致的时区</li>
        </ul>
      </div>
    </div>
  );
}
