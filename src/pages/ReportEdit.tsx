import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft } from 'lucide-react';
import client from '../api/client';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Berat' },
  { value: 2, emoji: '😐', label: 'Biasa' },
  { value: 3, emoji: '🙂', label: 'Oke' },
  { value: 4, emoji: '😊', label: 'Baik' },
  { value: 5, emoji: '🔥', label: 'Produktif!' },
];

export default function ReportEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    report_type: 'daily',
    report_date: '',
    description: '',
    achievements: '',
    obstacles: '',
    next_plans: '',
    mood: 3,
    status: 'draft',
  });

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const res = await client.get(`/reports/${id}`);
      const r = res.data;
      setForm({
        title: r.title || '',
        report_type: r.report_type || 'daily',
        report_date: r.report_date || '',
        description: r.description || '',
        achievements: r.achievements || '',
        obstacles: r.obstacles || '',
        next_plans: r.next_plans || '',
        mood: r.mood || 3,
        status: r.status || 'draft',
      });
    } catch {
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (submit: boolean) => {
    if (!form.title || !form.description) {
      alert('Judul dan deskripsi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await client.put(`/reports/${id}`, {
        title: form.title,
        report_type: form.report_type,
        description: form.description,
        achievements: form.achievements,
        obstacles: form.obstacles,
        next_plans: form.next_plans,
        mood: form.mood,
      });
      if (submit && form.status === 'draft') {
        await client.patch(`/reports/${id}/submit`);
      }
      navigate(`/reports/${id}`);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card h-[500px] p-8">
        <div className="skeleton w-full h-full rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            onClick={() => navigate(`/reports/${id}`)}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Laporan</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Perbarui aktivitas dan pencapaianmu</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            className="btn btn-outline bg-white dark:bg-slate-800" 
            disabled={saving} 
            onClick={() => handleSave(false)}
          >
            <Save size={16} /> <span className="hidden sm:inline">Simpan Draft</span>
          </button>
          {form.status === 'draft' && (
            <button 
              className="btn btn-primary shadow-primary-500/20" 
              disabled={saving} 
              onClick={() => handleSave(true)}
            >
              <Send size={16} className="mr-1.5" /> Submit Laporan
            </button>
          )}
        </div>
      </div>

      <div className="card p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Judul Laporan <span className="text-red-500">*</span></label>
            <input 
              className="input bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800" 
              maxLength={100} 
              placeholder="Contoh: Progress API Integrasi"
              value={form.title} 
              onChange={e => updateForm('title', e.target.value)} 
            />
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipe Laporan</label>
            <select 
              className="input cursor-pointer bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800" 
              value={form.report_type} 
              onChange={e => updateForm('report_type', e.target.value)}
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
            <input 
              className="input bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-transparent" 
              type="date" 
              value={form.report_date} 
              disabled 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Deskripsi Kegiatan <span className="text-red-500">*</span></span>
          </label>
          <textarea 
            className="textarea bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 min-h-[120px]" 
            placeholder="Jelaskan apa saja yang sudah dikerjakan hari ini..."
            value={form.description} 
            onChange={e => updateForm('description', e.target.value)} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Pencapaian <span className="text-success-500">✅</span>
          </label>
          <textarea 
            className="textarea bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 min-h-[100px]" 
            placeholder="Apa hasil atau fitur yang berhasil diselesaikan?"
            value={form.achievements} 
            onChange={e => updateForm('achievements', e.target.value)} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Kendala <span className="text-warning-500">⚠️</span> <span className="text-xs font-normal text-slate-400 ml-1">(opsional)</span>
          </label>
          <textarea 
            className="textarea bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 min-h-[100px]" 
            placeholder="Apakah ada blocker atau kesulitan teknis?"
            value={form.obstacles} 
            onChange={e => updateForm('obstacles', e.target.value)} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Rencana Berikutnya <span className="text-primary-500">🎯</span>
          </label>
          <textarea 
            className="textarea bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 min-h-[100px]" 
            placeholder="Apa target atau fokus untuk hari esok?"
            value={form.next_plans} 
            onChange={e => updateForm('next_plans', e.target.value)} 
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Bagaimana mood kerjamu hari ini?</label>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {MOODS.map(m => (
              <button 
                key={m.value} 
                type="button" 
                className={`
                  flex-1 min-w-[80px] sm:min-w-[100px] flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all duration-200
                  ${form.mood === m.value 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm shadow-primary-500/10' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }
                `}
                onClick={() => updateForm('mood', m.value)}
              >
                <span className={`text-2xl sm:text-3xl transition-transform duration-200 ${form.mood === m.value ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'}`}>
                  {m.emoji}
                </span>
                <span className={`text-xs sm:text-sm font-semibold ${form.mood === m.value ? 'text-primary-700 dark:text-primary-400' : 'text-slate-500'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
