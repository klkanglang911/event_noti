import { Calendar, Plus, Clock, Bell, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useNotificationStats } from '@/hooks/useNotifications';

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

// EventCard component
function EventCard({ event }: { event: { id: number; title: string; targetDate: string; daysRemaining?: number; group?: { name: string; color: string } } }) {
  const daysRemaining = event.daysRemaining ?? 0;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        {event.group && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: event.group.color }}
            title={event.group.name}
          />
        )}
        <div>
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          <p className="text-sm text-gray-500">
            {new Date(event.targetDate).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>
      <CountdownBadge days={daysRemaining} />
    </div>
  );
}

export default function DashboardPage() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  // Filter upcoming events (next 7 days)
  const upcomingEvents = events
    ?.filter((e) => e.status === 'active' && (e.daysRemaining ?? 0) >= 0 && (e.daysRemaining ?? 0) <= 7)
    .slice(0, 5) || [];

  // Count active events
  const activeEvents = events?.filter((e) => e.status === 'active').length || 0;

  // Count today's notifications
  const todayNotifications = stats?.pending || 0;

  // Count events in 7 days
  const eventsIn7Days = events?.filter(
    (e) => e.status === 'active' && (e.daysRemaining ?? 0) >= 0 && (e.daysRemaining ?? 0) <= 7
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">活动事件</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventsLoading ? '--' : activeEvents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待发送通知</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '--' : todayNotifications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">7天内到期</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventsLoading ? '--' : eventsIn7Days}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Failed notifications alert */}
      {stats && stats.failed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800">
              有 <strong>{stats.failed}</strong> 条通知发送失败
            </p>
          </div>
          <Link to="/notifications?status=failed" className="text-sm text-red-600 hover:underline">
            查看详情
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/events/new" className="btn-primary">
            <Plus className="w-5 h-5" />
            <span>创建事件</span>
          </Link>
          <Link to="/events" className="btn-secondary">
            <Calendar className="w-5 h-5" />
            <span>查看所有事件</span>
          </Link>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">即将到来的事件</h2>
          {upcomingEvents.length > 0 && (
            <Link to="/events" className="text-sm text-primary-600 hover:underline">
              查看全部
            </Link>
          )}
        </div>

        {eventsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无即将到来的事件</p>
            <Link to="/events/new" className="text-primary-600 hover:underline mt-2 inline-block">
              创建第一个事件
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
