import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Users, Edit3, Calendar } from 'lucide-react';

export default function Standups() {
  const { user } = useAuthStore();
  const [standups, setStandups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');

  useEffect(() => {
    loadStandups();
    // Auto-refresh standups while looking at a specific date
    const interval = setInterval(loadStandups, 30000);
    return () => clearInterval(interval);
  }, [date]);

  const loadStandups = async () => {
    setLoading(true);
    try {
      const endpoint = date === new Date().toISOString().split('T')[0] 
        ? '/standups/today' 
        : `/standups/${date}`;
      const res = await client.get(endpoint);
      setStandups(res.data);
    } catch (e) {
      console.error(e);
      setStandups([]);
    } finally {
      setLoading(false);
    }
  };

  const submitStandup = async () => {
    if (!yesterday || !today) return alert('Kemarin dan Hari Ini wajib diisi');
    try {
      await client.post('/standups', {
        yesterday: yesterday,
        today: today,
        blocker: blockers || undefined
      });
      setShowModal(false);
      setYesterday(''); setToday(''); setBlockers('');
      loadStandups();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal submit standup');
    }
  };

  // Check if I already submitted today
  const hasSubmittedToday = standups.some(s => s.user_id === user?.id && s.date === new Date().toISOString().split('T')[0]);
  const isTodaySelected = date === new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Daily Standup</h1>
            <p className="text-sm text-slate-500 max-w-lg mt-1">Transparansi progres harian tim. Lihat apa yang dikerjakan rekan kerjamu hari ini.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          {isTodaySelected && !hasSubmittedToday && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary shadow-lg shadow-primary-500/20 px-6"
            >
              <Edit3 size={18} /> Tulis Standup
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="card p-6 h-64 skeleton" />)}
        </div>
      ) : standups.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum ada standup di tanggal ini</h3>
          {isTodaySelected && !hasSubmittedToday && (
            <p className="text-sm text-slate-500 mt-2">Jadilah yang pertama untuk update progres!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standups.map(s => (
            <div key={s.id} className="card overflow-hidden hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-primary-500">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                    {s.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{s.user_name}</span>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kemarin</h4>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-none prose dark:prose-invert">
                    {s.yesterday}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-2">Hari Ini</h4>
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/40">
                    {s.today_planned || s.today}
                  </p>
                </div>
                {(s.blockers || s.blocker) && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      ⚠️ Blocker
                    </h4>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 leading-relaxed bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                       {s.blockers || s.blocker}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={20} className="text-primary-500" /> Tulis Standup Hari Ini
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">&times;</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Kemarin Selesai Apa?
                </label>
                <textarea 
                  value={yesterday} 
                  onChange={e => setYesterday(e.target.value)}
                  className="input w-full min-h-[100px] resize-none focus:ring-slate-500/30 focus:border-slate-400"
                  placeholder="- Menyelesaikan API endpoint login&#10;- Meeting dengan klien X"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-primary-600 dark:text-primary-400 mb-2">
                  Target Hari Ini?
                </label>
                <textarea 
                  value={today} 
                  onChange={e => setToday(e.target.value)}
                  className="input w-full min-h-[100px] resize-none border-primary-200 dark:border-primary-900/50 focus:ring-primary-500/30 focus:border-primary-400 bg-primary-50/30 dark:bg-primary-900/10"
                  placeholder="- Buat komponen frontend Standup&#10;- Code review PR teman"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                  Ada Blocker? (Opsional)
                </label>
                <textarea 
                  value={blockers} 
                  onChange={e => setBlockers(e.target.value)}
                  className="input w-full min-h-[80px] resize-none border-red-200 dark:border-red-900/50 focus:ring-red-500/30 focus:border-red-400 bg-red-50/30 dark:bg-red-900/10"
                  placeholder="Misal: API third-party error, nunggu aset UI..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary shadow-lg shadow-primary-500/20 px-8" onClick={submitStandup}>Kirim Standup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
