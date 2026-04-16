import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Download, FileText, Paperclip, Calendar } from 'lucide-react';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';

const MOODS = ['😔 Berat', '😐 Biasa', '🙂 Oke', '😊 Baik', '🔥 Produktif!'];

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const res = await client.get(`/reports/${id}`);
      setReport(res.data);
    } catch {
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: ReportPDF } = await import('../components/pdf/ReportPDF');
      const blob = await pdf(<ReportPDF report={report} />).toBlob();
      const fileName = `Laporan_${report?.user_name?.replace(/\\s+/g, '_')}_${report?.report_date}.pdf`;

      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const filePath = await save({
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
          defaultPath: fileName
        });

        if (filePath) {
          await writeFile(filePath, uint8Array);
        }
      } catch (tauriError) {
        // Fallback for Web Browser
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      console.error('PDF download error:', e);
      alert('Gagal export PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="card p-8 min-h-[400px]">
        <div className="skeleton w-full h-full rounded-xl" />
      </div>
    </div>
  );
  if (!report) return null;

  const canEdit = report.status === 'draft' || user?.role === 'owner' || user?.role === 'editor';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          onClick={() => navigate('/reports')}
        >
          <ArrowLeft size={16} /> <span className="text-sm font-medium">Kembali</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button
            className="btn btn-outline bg-white dark:bg-slate-800"
            onClick={handleExportPDF}
            disabled={downloading}
          >
            <Download size={16} /> <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Export PDF'}</span>
          </button>
          {canEdit && (
            <button className="btn btn-primary shadow-primary-500/20" onClick={() => navigate(`/reports/${id}/edit`)}>
              <Edit size={16} /> <span className="hidden sm:inline">Edit Laporan</span>
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {report.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs">
                  {report.user_name.charAt(0).toUpperCase()}
                </div>
                {report.user_name}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {new Date(report.report_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className={report.report_type === 'daily' ? 'badge-primary' : 'badge-secondary'}>
                {report.report_type === 'daily' ? 'Harian' : 'Mingguan'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-2xl filter drop-shadow-sm">{MOODS[(report.mood || 3) - 1]?.split(' ')[0]}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {MOODS[(report.mood || 3) - 1]?.split(' ')[1]}
              </span>
            </div>
            <span className={report.status === 'submitted' ? 'badge-success py-1.5 px-3' : 'badge-warning py-1.5 px-3'}>
              {report.status === 'submitted' ? 'Terkirim' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 space-y-8">
          <Section title="📝 Deskripsi Kegiatan" content={report.description} />
          {report.achievements && <Section title="✅ Pencapaian" content={report.achievements} />}
          {report.obstacles && <Section title="⚠️ Kendala" content={report.obstacles} />}
          {report.next_plans && <Section title="🎯 Rencana Berikutnya" content={report.next_plans} />}
        </div>

        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <div className="p-6 md:p-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-4">
              <Paperclip size={16} className="text-primary-500" /> 
              Lampiran ({report.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.attachments.map((a: any) => (
                <div 
                  key={a.id} 
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors shadow-sm group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <FileText size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{a.filename}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {(a.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        {title}
      </h4>
      <div className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 font-medium">
        {content}
      </div>
    </div>
  );
}
