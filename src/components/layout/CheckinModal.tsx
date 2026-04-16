import { useState, useEffect } from 'react';
import client from '../../api/client';
import { LogIn, MapPin, CheckCircle } from 'lucide-react';

export default function CheckinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [workMode, setWorkMode] = useState<'WFO' | 'WFH'>('WFO');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      // Get my checkins for this month and see if there's one for today
      const today = new Date().toISOString().split('T')[0];
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      const res = await client.get(`/checkins/me?month=${month}&year=${year}`);
      const checkins = res.data;
      const hasCheckedInToday = checkins.some((c: any) => c.date.startsWith(today));
      
      if (!hasCheckedInToday) {
        setIsOpen(true);
      }
    } catch (e) {
      console.error("Failed to fetch checkin status", e);
    }
  };

  const handleCheckin = async () => {
    setIsLoading(true);
    try {
      await client.post('/checkins', {
        work_mode: workMode,
        checkin_note: note || undefined
      });
      setIsOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal check-in");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Halo, Selamat Pagi!</h2>
          <p className="text-primary-100 text-sm mt-1">Silakan absen dulu sebelum mulai bekerja ya.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <MapPin size={16} /> Mode Kerja Hari Ini
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWorkMode('WFO')}
                className={`py-2 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                  workMode === 'WFO' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {workMode === 'WFO' && <CheckCircle size={16} />}
                WFO
              </button>
              <button
                onClick={() => setWorkMode('WFH')}
                className={`py-2 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                  workMode === 'WFH' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {workMode === 'WFH' && <CheckCircle size={16} />}
                WFH
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Datang telat 10 menit karena macet"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border items-center border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          <button
            onClick={handleCheckin}
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Check-in Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
