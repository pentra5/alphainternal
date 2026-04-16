import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Bell, Moon, Sun } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import client, { BASE_URL } from '../../api/client';
import FocusTimer from './FocusTimer';
import { useTranslation } from '../../locales';
import { useI18nStore } from '../../stores/i18nStore';

type OnlineStatus = 'Available' | 'Busy' | 'In a Meeting' | 'Away';

export default function TopBar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { t, lang } = useTranslation();
  const { setLang } = useI18nStore();
  const navigate = useNavigate();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifiedIds = useRef<Set<number>>(new Set());
  
  // Status state
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('Available');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      const newNotifs = res.data.notifications || [];
      setNotifications(newNotifs);
      setUnreadCount(res.data.unread_count || 0);

      // Tauri Native Notification
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      if (permissionGranted) {
        newNotifs.forEach((n: any) => {
          if (!n.is_read && !notifiedIds.current.has(n.id)) {
            sendNotification({ title: n.title, body: n.message });
            notifiedIds.current.add(n.id);
          }
        });
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await client.patch('/notifications/read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const getStatusColor = (s: OnlineStatus) => {
    switch (s) {
      case 'Available': return 'bg-emerald-500';
      case 'Busy': return 'bg-red-500';
      case 'In a Meeting': return 'bg-amber-500';
      case 'Away': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          {(() => {
            const h = new Date().getHours();
            if (h < 12) return t('good_morning');
            if (h < 17) return t('good_afternoon');
            return t('good_evening');
          })()},{' '}
          <span className="text-primary-500">{user?.full_name?.split(' ')[0]}</span> 👋
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Focus Timer */}
        <FocusTimer />

        {/* Status indicator */}
        <div className="relative">
          <button 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(onlineStatus)} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{onlineStatus}</span>
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="py-1">
                {(['Available', 'Busy', 'In a Meeting', 'Away'] as OnlineStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setOnlineStatus(s);
                      setShowStatusMenu(false);
                      // TODO: Broadcast status to backend websocket / polling
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(s)}`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200 ml-1"
          title="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs transition-all duration-200 uppercase"
          title="Toggle Language"
        >
          {lang}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-slide-down overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                      Belum ada notifikasi 📭
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div 
          onClick={() => {
            if (user?.role === 'owner') {
              navigate('/profile');
            } else if (user?.id) {
              navigate(`/employees/${user.id}`);
            }
          }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer ml-1 overflow-hidden hover:opacity-80 transition-opacity"
        >
          {user?.profile?.avatar_path ? (
            <img src={`${BASE_URL}${user.profile.avatar_path}`} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user?.full_name?.charAt(0).toUpperCase()
          )}
        </div>
      </div>
    </header>
  );
}


