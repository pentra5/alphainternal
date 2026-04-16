import { useEffect, useState } from 'react';
import client from '../api/client';
import { FileText, Sparkles, Download, Calendar } from 'lucide-react';
// Removed unused import

export default function Summaries() {
  // Auth store not used directly here
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const res = await client.get('/summary/me');
      setSummaries(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      await client.post('/summary/generate');
      loadSummaries();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal generate summary minggu ini');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (id: number) => {
    try {
      const res = await client.get(`/summary/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Gagal mengunduh summary. Pastikan summary ada.');
    }
  };

  if (loading) return <div className="p-6">Loading summaries...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-800 p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 text-white">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 mb-2">
            <Sparkles size={32} className="text-secondary-200" /> Weekly Summary
          </h1>
          <p className="text-secondary-100 max-w-lg">Rangkuman performa kerjamu minggu ini. Tersusun otomatis berdasarkan Laporan, Standup, dan Poin.</p>
        </div>
        <div className="absolute left-0 top-0 w-full h-full bg-white/5 skew-y-6 scale-150 transform -translate-y-1/2" />
        
        <button 
          onClick={generateSummary}
          disabled={generating}
          className="relative z-10 btn bg-white text-secondary-700 hover:bg-slate-50 border-0 shadow-xl flex items-center gap-2 px-6"
        >
          {generating ? (
             <span className="w-5 h-5 border-2 border-secondary-600 border-t-transparent rounded-full animate-spin" />
          ) : (
             <><Sparkles size={18} /> Generate Minggu Ini</>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {summaries.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum ada rangkuman</h3>
            <p className="text-slate-500">Klik Generate untuk membuat rangkuman pertamamu minggu ini.</p>
          </div>
        ) : (
          summaries.map(s => (
            <div key={s.id} className="card p-0 overflow-hidden">
               <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 rounded-xl flex items-center justify-center">
                        <Calendar size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                        Minggu: {new Date(s.week_start).toLocaleDateString('id-ID')}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                           Mulai: {new Date(s.week_start).toLocaleDateString('id-ID')} &mdash; Selesai: {new Date(s.week_end).toLocaleDateString('id-ID')}
                        </p>
                     </div>
                  </div>
                  <button 
                    onClick={() => downloadPDF(s.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                     <Download size={16} /> Export PDF
                  </button>
               </div>
               <div className="p-6 md:p-8 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">{s.tasks_completed}</div>
                        <div className="text-xs text-slate-500 font-medium">Tugas Selesai</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">{s.reports_submitted}</div>
                        <div className="text-xs text-slate-500 font-medium">Laporan Dibuat</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-1">{Math.floor((s.focus_hours || 0))}h {Math.round(((s.focus_hours || 0) % 1) * 60)}m</div>
                        <div className="text-xs text-slate-500 font-medium">Waktu Fokus</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="text-2xl font-bold font-display text-warning-600 dark:text-warning-500 mb-1">{s.points_earned}</div>
                        <div className="text-xs text-slate-500 font-medium">Poin Terkumpul</div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">AI Recap</h4>
                     <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-primary-50/50 dark:bg-primary-900/10 p-5 rounded-xl border border-primary-100/50 dark:border-primary-900/20 whitespace-pre-wrap">
                         {s.recap_content || s.ai_recap || 'Belum ada rekap.'}
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
