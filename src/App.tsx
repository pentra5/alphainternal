import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch, exit } from '@tauri-apps/plugin-process';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import ReportCreate from './pages/ReportCreate';
import ReportDetail from './pages/ReportDetail';
import ReportEdit from './pages/ReportEdit';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Announcements from './pages/Announcements';
import Standups from './pages/Standups';
import Schedules from './pages/Schedules';
import Points from './pages/Points';
import Summaries from './pages/Summaries';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, initAuth, isLoading } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Initialize auth from Tauri secure store on app mount
    initAuth();

    // Setup Tauri Window Close Interceptor to force logout
    let unlisten: (() => void) | undefined;
    const setupCloseListener = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlisten = await appWindow.onCloseRequested(async (event) => {
          event.preventDefault(); // Prevent default close exactly like beforeunload
          try {
            const state = useAuthStore.getState();
            if (state.isAuthenticated) {
              // Try to post logout, but don't hang longer than 800ms
              await Promise.race([
                state.logout(),
                new Promise(resolve => setTimeout(resolve, 800))
              ]);
            }
          } catch (e) {
            console.error('Error logging out on exit', e);
          } finally {
            if (unlisten) unlisten();
            appWindow.close(); // Ask OS to close natively 
            await exit(0); // Force kill background process completely
          }
        });
      } catch (e) {
        console.log('Tauri window API not available (browser context)');
      }
    };

    setupCloseListener();

    // Auto-Updater Check on App Boot
    const checkUpdate = async () => {
      try {
        const update = await check();
        if (update?.available) {
          const yes = await ask(
            `Update otomatis versi terbaru (${update.version}) tersedia! Instal sekarang biar sistem bekerja optimal?`,
            { title: 'Update WorkOS', kind: 'info' }
          );
          if (yes) {
            await update.downloadAndInstall();
            await relaunch();
          }
        }
      } catch (err) {
        console.warn('Auto Updater Failed:', err);
      }
    };
    checkUpdate();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin shadow-lg"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Memuat Alpha...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/new" element={<ReportCreate />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="reports/:id/edit" element={<ReportEdit />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="standups" element={<Standups />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="points" element={<Points />} />
          <Route path="summaries" element={<Summaries />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
