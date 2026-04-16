import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getDailyMotivation } from '../lib/motivations';
import {
  FileText, Users, AlertTriangle, Plus, TrendingUp,
  Clock, ChevronRight, Zap, Target, Sparkles, Calendar, Star
} from 'lucide-react';
import client from '../api/client';

const MOODS = ['😔', '😐', '🙂', '😊', '🔥'];
const LEVELS = [
  { name: '🌱 Newbie', min: 0, max: 99 },
  { name: '⚡ Rising', min: 100, max: 299 },
  { name: '🔥 Solid', min: 300, max: 599 },
  { name: '💎 Pro', min: 600, max: 999 },
  { name: '🚀 Legend', min: 1000, max: Infinity },
];

function getLevel(points: number) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getLevelProgress(points: number) {
  const level = getLevel(points);
  if (level.max === Infinity) return 100;
  const range = level.max - level.min;
  return Math.round(((points - level.min) / range) * 100);
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [focusStats, setFocusStats] = useState({ totalMinutes: 0, sessions: 0 });
  const [stats, setStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, reportsRes, leaderRes, focusRes] = await Promise.all([
        client.get('/settings/dashboard-stats'),
        client.get('/reports', { params: { per_page: 5 } }),
        client.get('/points/leaderboard?limit=3').catch(() => ({ data: [] })),
        client.get('/focus/me').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setRecentReports(reportsRes.data.reports || []);
      setLeaderboard(leaderRes.data || []);
      
      const focusData = focusRes.data || [];
      const totalMin = focusData.reduce((acc: number, f: any) => acc + (f.duration_minutes || 0), 0);
      setFocusStats({ totalMinutes: totalMin, sessions: focusData.length });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6">
              <div className="skeleton h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-12">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isOwner ? (
          <>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/10 rounded-full blur-xl group-hover:bg-primary-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <FileText size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stats?.reports_today || 0}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Laporan Hari Ini</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-success-500/10 rounded-full blur-xl group-hover:bg-success-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
                <Users size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stats?.active_employees || 0}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pegawai Aktif</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-500/10 rounded-full blur-xl group-hover:bg-secondary-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 dark:text-secondary-400">
                <TrendingUp size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stats?.total_reports_month || 0}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Laporan Bulan Ini</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-warning-500/10 rounded-full blur-xl group-hover:bg-warning-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400">
                <AlertTriangle size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">0</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tugas Overdue</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-warning-500/10 rounded-full blur-xl group-hover:bg-warning-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400">
                <Target size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">0</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tugas Aktif</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/10 rounded-full blur-xl group-hover:bg-primary-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <FileText size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{recentReports.length}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Laporan Saya</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-500/10 rounded-full blur-xl group-hover:bg-secondary-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 dark:text-secondary-400">
                <Zap size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{user?.profile?.total_points || 0}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Poin</span>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-success-500/10 rounded-full blur-xl group-hover:bg-success-500/20 transition-all duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
                <Sparkles size={26} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">{getLevel(user?.profile?.total_points || 0).name}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Level Saya</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          {isOwner && (
            <div className="card p-6">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4">Aksi Cepat</h3>
              <div className="flex flex-wrap gap-4">
                <button className="btn btn-primary" onClick={() => navigate('/reports/new')}>
                  <Plus size={18} /> Buat Laporan
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/employees')}>
                  <Users size={18} /> Kelola Tim
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard Top 3 Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star size={18} className="text-warning-500 fill-warning-500" /> Leaderboard Top 3
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Belum ada poin.</p>
                ) : (
                  leaderboard.map((l: any, i: number) => (
                    <div key={l.user_id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400 font-bold shadow-sm">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.full_name}</div>
                        <div className="text-xs text-slate-500">{l.total_points} Poin</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Focus Stats Widget */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap size={18} className="text-emerald-500 fill-emerald-500" /> Statistik Fokus Saya
                </h3>
              </div>
              <div className="p-5 flex flex-col justify-center items-center h-[200px] text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
                  <Clock size={32} />
                </div>
                <div className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">
                  {Math.floor(focusStats.totalMinutes / 60)}h {focusStats.totalMinutes % 60}m
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Waktu Fokus</p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Target size={14} className="text-primary-500" /> {focusStats.sessions} Sesi Selesai
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reports / Timeline */}
          <div className="card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">
                Timeline Aktivitas (Laporan)
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>
                Lihat Semua <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {recentReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Belum ada aktivitas</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-sm">Jadilah yang pertama untuk membuat laporan kerja.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/reports/new')}>
                    <Plus size={16} /> Buat Laporan
                  </button>
                </div>
              ) : (
                recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg transform group-hover:scale-110 transition-transform duration-200 z-10 relative border-4 border-white dark:border-slate-900 shadow-sm">
                        {MOODS[(r.mood || 3) - 1]}
                      </div>
                      <div className="absolute top-10 bottom-[-30px] left-1/2 -translate-x-1/2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="flex flex-col mt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{r.user_name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">membuat laporan kerja</span>
                      </div>
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">{r.title}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(r.report_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Motivation Card */}
          <div className="card overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 pointer-events-none" />
            <div className="p-6 relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full border shadow-sm border-slate-100 dark:border-slate-700 flex items-center justify-center text-2xl mb-4 shadow-primary-500/20">
                💡
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic text-balance font-display">
                "{getDailyMotivation()}"
              </p>
            </div>
          </div>

          {/* Points / Level (non-owner) */}
          {!isOwner && (
            <div className="card p-6">
              <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Star size={18} className="text-warning-500 fill-warning-500" /> Poin & Level
              </h3>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-warning-500 to-orange-500 text-white font-display font-bold rounded-full text-lg shadow-md shadow-warning-500/20 mb-2">
                  {getLevel(user?.profile?.total_points || 0).name}
                </div>
                <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                  {user?.profile?.total_points || 0} <span className="text-base font-medium text-slate-500 dark:text-slate-400">poin</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-warning-400 to-orange-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${getLevelProgress(user?.profile?.total_points || 0)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[slideRight_2s_infinite]" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
                  <span className="text-warning-600 dark:text-warning-400 font-bold">{getLevelProgress(user?.profile?.total_points || 0)}%</span> menuju level berikutnya
                </div>
              </div>
            </div>
          )}

          {/* Today's Schedule placeholder */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary-500" /> Jadwal Hari Ini
            </h3>
            <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Calendar size={28} className="text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-0.5">Tidak ada agenda</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jadwal Anda kosong hari ini.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
