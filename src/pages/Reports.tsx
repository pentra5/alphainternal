import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Filter, Calendar } from 'lucide-react';
import client from '../api/client';

const MOODS = ['😔', '😐', '🙂', '😊', '🔥'];

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadReports();
    // Auto-refresh reports list
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [typeFilter, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 50 };
      if (typeFilter) params.report_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await client.get('/reports', { params });
      setReports(res.data.reports || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Laporan Kerja</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{total} laporan ditemukan</p>
        </div>
        <button className="btn btn-primary shadow-primary-500/20" onClick={() => navigate('/reports/new')}>
          <Plus size={18} /> Buat Laporan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <form className="relative flex-1 w-full" onSubmit={handleSearch}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            className="input pl-10"
            placeholder="Cari judul laporan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select
              className="input appearance-none pr-10 cursor-pointer min-w-[140px]"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">Semua Tipe</option>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
              <Filter size={14} />
            </div>
          </div>
          <div className="relative">
            <select
              className="input appearance-none pr-10 cursor-pointer min-w-[140px]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Terkirim</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
              <Filter size={14} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-6 h-40">
              <div className="skeleton w-full h-full" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-16 text-center border-dashed border-2 bg-slate-50 dark:bg-slate-800/50">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex flex-col items-center justify-center text-primary-500 mb-5">
            <FileText size={36} />
          </div>
          <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">Belum ada laporan</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">Mulai catat progres dan kegiatan kerjamu melalui laporan sekarang.</p>
          <button className="btn btn-primary shadow-primary-500/20" onClick={() => navigate('/reports/new')}>
            <Plus size={18} /> Buat Laporan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(r => (
            <div 
              key={r.id} 
              className="card p-5 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-300 group flex flex-col h-full"
              onClick={() => navigate(`/reports/${r.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {MOODS[(r.mood || 3) - 1]}
                </div>
                <span className={r.status === 'submitted' ? 'badge-success' : 'badge-warning'}>
                  {r.status === 'submitted' ? 'Terkirim' : 'Draft'}
                </span>
              </div>
              
              <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {r.title}
              </h4>
              
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                  {r.user_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(r.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
                <span className={r.report_type === 'daily' ? 'badge-primary text-[10px]' : 'badge-secondary text-[10px]'}>
                  {r.report_type === 'daily' ? 'Harian' : 'Mingguan'}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-auto">
                {r.description?.replace(/<[^>]*>?/gm, '') || 'Tidak ada deskripsi'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
