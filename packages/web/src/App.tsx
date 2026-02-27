import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PromptProvider } from '@/components/PromptProvider';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EventListPage from '@/pages/EventListPage';
import EventFormPage from '@/pages/EventFormPage';
import GroupListPage from '@/pages/GroupListPage';
import NotificationHistoryPage from '@/pages/NotificationHistoryPage';
import WebhookListPage from '@/pages/WebhookListPage';
import UserListPage from '@/pages/UserListPage';
import SettingsPage from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PromptProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/events" element={<EventListPage />} />
              <Route path="/events/new" element={<EventFormPage />} />
              <Route path="/events/:id/edit" element={<EventFormPage />} />
              <Route path="/notifications" element={<NotificationHistoryPage />} />

              {/* Admin routes */}
              <Route
                path="/groups"
                element={
                  <ProtectedRoute requireAdmin>
                    <GroupListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/webhooks"
                element={
                  <ProtectedRoute requireAdmin>
                    <WebhookListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <UserListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </PromptProvider>
    </QueryClientProvider>
  );
}

export default App;
