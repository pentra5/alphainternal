import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardList, Calendar, Star,
  Users, Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useTranslation, type TranslationKey } from '../../locales';
import { BASE_URL } from '../../api/client';

const menuItems: { path: string; icon: any; key: TranslationKey }[] = [
  { path: '/', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/announcements', icon: ClipboardList, key: 'feed' },
  { path: '/standups', icon: ClipboardList, key: 'standup' },
  { path: '/reports', icon: FileText, key: 'reports' },
  { path: '/tasks', icon: ClipboardList, key: 'tasks' },
  { path: '/schedules', icon: Calendar, key: 'schedule' },
  { path: '/points', icon: Star, key: 'points' },
  { path: '/summaries', icon: FileText, key: 'summary' },
  { path: '/employees', icon: Users, key: 'team' },
  { path: '/settings', icon: Settings, key: 'settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const filteredMenu = menuItems.filter(item => {
    if (item.path === '/employees' && user?.role === 'staff') return false;
    if (item.path === '/summaries' && user?.role === 'staff') return false;
    return true;
  });

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-30 flex flex-col
      bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
      transition-all duration-300 ease-in-out
      ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/30">
              A
            </div>
            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">Alpha</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 group
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
        {!sidebarCollapsed && user && (
          <div 
            onClick={() => {
              if (user?.role === 'owner') {
                navigate('/profile');
              } else if (user?.id) {
                navigate(`/employees/${user.id}`);
              }
            }}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm overflow-hidden group-hover:opacity-90">
              {user.profile?.avatar_path ? (
                <img src={`${BASE_URL}${user.profile.avatar_path}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {user.full_name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
            transition-all duration-200 w-full
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
