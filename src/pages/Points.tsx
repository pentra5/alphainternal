import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Trophy, Star, Medal, History } from 'lucide-react';

export default function Points() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes, histRes] = await Promise.all([
        client.get('/points/leaderboard'),
        client.get('/points/me')
      ]);
      setLeaderboard(lbRes.data);
      setHistory(histRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const myRank = leaderboard.findIndex(l => l.user_id === user?.id) + 1;
  const myData = leaderboard.find(l => l.user_id === user?.id);

  if (loading) return <div className="p-6">Loading points data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Col: My Stats & History */}
        <div className="flex-1 space-y-6">
           <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-warning-500/20 rounded-full blur-3xl mix-blend-screen" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-gradient-to-b from-warning-400 to-orange-500 p-1 shadow-xl shadow-warning-500/20">
                    <div className="w-full h-full bg-slate-900 rounded-full flex gap-1 items-center justify-center border-4 border-slate-900">
                       <span className="text-3xl font-bold font-display">{myRank > 0 ? `#${myRank}` : '-'}</span>
                    </div>
                 </div>
                 <div className="text-center md:text-left">
                    <h2 className="text-3xl font-display font-bold mb-1">Poin & Peringkat Saya</h2>
                    <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                       <Star size={18} className="text-warning-500 fill-warning-500" /> {myData?.total_points || 0} Total Poin
                    </p>
                 </div>
              </div>
           </div>

           <div className="card overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                   <History size={20} className="text-primary-500" />
                   <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Riwayat Poin</h3>
               </div>
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                   {history.length === 0 ? (
                       <p className="p-8 text-center text-slate-500">Belum ada riwayat perolehan poin.</p>
                   ) : (
                       history.map(h => (
                           <div key={h.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                               <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{h.reason.replace(/_/g, ' ')}</span>
                                  <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                               <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${h.amount > 0 ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400' : 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400'}`}>
                                   {h.amount > 0 ? '+' : ''}{h.amount} <Star size={12} className="fill-current" />
                               </div>
                           </div>
                       ))
                   )}
               </div>
           </div>
        </div>

        {/* Right Col: Leaderboard */}
        <div className="w-full md:w-96 shrink-0 space-y-6">
           <div className="card p-6 min-h-[500px]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 rounded-xl flex items-center justify-center">
                    <Trophy size={20} />
                 </div>
                 <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Leaderboard</h3>
              </div>

              <div className="space-y-4">
                 {leaderboard.length === 0 ? (
                    <p className="text-center text-slate-500">Leaderboard kosong.</p>
                 ) : (
                    leaderboard.map((lb, idx) => (
                       <div key={lb.user_id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${idx < 3 ? 'bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                               idx === 0 ? 'bg-yellow-100 text-yellow-700 shadow-inner' :
                               idx === 1 ? 'bg-slate-200 text-slate-700 shadow-inner' :
                               idx === 2 ? 'bg-orange-100 text-orange-800 shadow-inner' :
                               'bg-transparent text-slate-400'
                           }`}>
                               {idx < 3 ? <Medal size={16} /> : `#${idx + 1}`}
                           </div>
                           
                           <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                      {lb.full_name?.charAt(0)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{lb.full_name}</span>
                                      <span className="text-xs text-slate-500 truncate">{lb.employee_id}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 ml-2">
                                  {lb.total_points} <Star size={12} className="text-warning-500 fill-warning-500" />
                              </div>
                           </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
