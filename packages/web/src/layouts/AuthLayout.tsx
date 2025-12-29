import { Outlet, Navigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Bell className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EventNoti</h1>
          <p className="text-gray-600 mt-2">事件通知管理平台</p>
        </div>

        {/* Auth content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} EventNoti. All rights reserved.
        </p>
      </div>
    </div>
  );
}
