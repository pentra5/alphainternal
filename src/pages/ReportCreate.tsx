import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft } from 'lucide-react';
import client from '../api/client';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Berat' },
  { value: 2, emoji: '😐', label: 'Biasa' },
  { value: 3, emoji: '🙂', label: 'Oke' },
  { value: 4, emoji: '😊', label: 'Baik' },
  { value: 5, emoji: '🔥', label: 'Produktif!' },
];

export default function ReportCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    report_type: 'daily',
    report_date: new Date().toISOString().split('T')[0],
    description: '',
    achievements: '',
    obstacles: '',
    next_plans: '',
    mood: 3,
  });

  const updateForm = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (submit: boolean) => {
    if (!form.title || !form.description) {
      alert('Judul dan deskripsi wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/reports', form);
      if (submit) {
        await client.patch(`/reports/${res.data.id}/submit`);
      }
      navigate('/reports');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            onClick={() => navigate('/reports')}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Buat Laporan Baru</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-outline"
            disabled={loading}
            onClick={() => handleSave(false)}
          >
            <Save size={16} /> Simpan Draft
          </button>
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => handleSave(true)}
          >
            <Send size={16} /> Submit Laporan
          </button>
        </div>
      </div>

      <div className="card p-6 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="input-label">Judul Laporan *</label>
            <input
              className="input text-base py-3"
              placeholder="Contoh: Progress Homepage Redesign"
              maxLength={100}
              value={form.title}
              onChange={e => updateForm('title', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Tipe Laporan</label>
            <select
              className="input text-base py-3 cursor-pointer"
              value={form.report_type}
              onChange={e => updateForm('report_type', e.target.value)}
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
          </div>
          <div>
            <label className="input-label">Tanggal</label>
            <input
              className="input text-base py-3 cursor-pointer"
              type="date"
              value={form.report_date}
              onChange={e => updateForm('report_date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Deskripsi Kegiatan *</label>
          <textarea
            className="input min-h-[120px] resize-y py-3"
            placeholder="Ceritakan apa yang kamu kerjakan hari ini..."
            value={form.description}
            onChange={e => updateForm('description', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label flex items-center gap-2">
            Pencapaian <span className="text-xl">✅</span>
          </label>
          <textarea
            className="input min-h-[100px] resize-y py-3"
            placeholder="List hal-hal yang berhasil diselesaikan..."
            value={form.achievements}
            onChange={e => updateForm('achievements', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label flex items-center gap-2">
            Kendala <span className="text-xl">⚠️</span> <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <textarea
            className="input min-h-[100px] resize-y py-3"
            placeholder="Ada hambatan? Tulis di sini..."
            value={form.obstacles}
            onChange={e => updateForm('obstacles', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label flex items-center gap-2">
            Rencana Berikutnya <span className="text-xl">🎯</span>
          </label>
          <textarea
            className="input min-h-[100px] resize-y py-3"
            placeholder="Apa rencana hari / minggu depan?"
            value={form.next_plans}
            onChange={e => updateForm('next_plans', e.target.value)}
          />
        </div>

        <div>
          <label className="input-label mb-3">Mood Hari Ini</label>
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {MOODS.map(m => {
              const isActive = form.mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border-2
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-md shadow-primary-500/10 scale-105' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }
                  `}
                  onClick={() => updateForm('mood', m.value)}
                >
                  <span className="text-3xl sm:text-4xl mb-2 filter drop-shadow-sm">{m.emoji}</span>
                  <span className={`text-[10px] sm:text-xs font-semibold ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
