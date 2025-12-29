import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  FolderOpen,
  Webhook,
  Users,
  History,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// Navigation items
const navItems = [
  { path: '/', label: '仪表板', icon: LayoutDashboard },
  { path: '/events', label: '事件管理', icon: Calendar },
  { path: '/groups', label: '分组管理', icon: FolderOpen },
  { path: '/notifications', label: '通知历史', icon: History },
];

const adminNavItems = [
  { path: '/webhooks', label: 'Webhook', icon: Webhook },
  { path: '/users', label: '用户管理', icon: Users },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: typeof Bell }) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <Bell className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">EventNoti</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <span className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  管理员
                </span>
              </div>
              {adminNavItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName}
              </p>
              <p className="text-xs text-gray-500">{user?.role === 'admin' ? '管理员' : '用户'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* Page title - can be set via context/state */}
            <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
              {navItems.find((item) => item.path === location.pathname)?.label ||
                adminNavItems.find((item) => item.path === location.pathname)?.label ||
                'EventNoti'}
            </h1>

            {/* Spacer */}
            <div className="w-8 md:hidden" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
