import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await client.get('/announcements');
      setAnnouncements(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createAnnouncement = async () => {
    try {
      if (!title || !content) return alert('Judul dan isi wajib diisi');
      await client.post('/announcements', { title, content, priority: 'normal' });
      setShowModal(false);
      setTitle(''); setContent('');
      loadAnnouncements();
    } catch (e) {
      alert('Gagal membuat pengumuman');
    }
  };

  const deleteAnnouncement = async (id: number) => {
    const isConfirmed = await confirm('Hapus pengumuman ini?', { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await client.delete(`/announcements/${id}`);
      loadAnnouncements();
    } catch (e) { alert('Gagal menghapus'); }
  };

  const toggleReaction = async (id: number, emoji: string) => {
    try {
      await client.post(`/announcements/${id}/react`, { emoji });
      loadAnnouncements();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-6">Loading announcements...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-800 p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-2 text-white">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Megaphone size={32} /> Company Feed
          </h1>
          <p className="text-primary-100 max-w-lg">Papan pengumuman satu arah untuk seluruh tim. Baca informasi terbaru dari manajemen di sini.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-white/10 skew-x-12 translate-x-10" />
        
        {isOwner && (
          <button 
            onClick={() => setShowModal(true)}
            className="relative z-10 btn bg-white text-primary-700 hover:bg-slate-50 border-0 shadow-lg"
          >
            <Plus size={18} /> Buat Pengumuman
          </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <Megaphone size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum ada pengumuman</h3>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="card overflow-hidden">
              <div className="p-6 md:p-8 bg-white dark:bg-slate-900 relative">
                {user?.id === a.author_id && (
                  <button 
                    onClick={() => deleteAnnouncement(a.id)}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold shadow-sm">
                    {a.author_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{a.author_name}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(a.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-3">
                  {a.title}
                </h2>
                
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {a.content}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button 
                  onClick={() => toggleReaction(a.id, '👍')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    a.reactions?.find((r: any) => r.emoji === '👍')?.user_reacted
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>👍</span> 
                  <span>
                    {a.reactions?.find((r: any) => r.emoji === '👍')?.count || 0}
                  </span>
                </button>
                <button 
                  onClick={() => toggleReaction(a.id, '❤️')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    a.reactions?.find((r: any) => r.emoji === '❤️')?.user_reacted
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>❤️</span> 
                  <span>
                    {a.reactions?.find((r: any) => r.emoji === '❤️')?.count || 0}
                  </span>
                </button>
                <button 
                  onClick={() => toggleReaction(a.id, '🔥')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    a.reactions?.find((r: any) => r.emoji === '🔥')?.user_reacted
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>🔥</span> 
                  <span>
                    {a.reactions?.find((r: any) => r.emoji === '🔥')?.count || 0}
                  </span>
                </button>
                <button 
                  onClick={() => toggleReaction(a.id, '🎉')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    a.reactions?.find((r: any) => r.emoji === '🎉')?.user_reacted
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>🎉</span> 
                  <span>
                    {a.reactions?.find((r: any) => r.emoji === '🎉')?.count || 0}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">Buat Pengumuman</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Pengumuman Penting..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Isi</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  className="input w-full min-h-[120px] resize-none"
                  placeholder="Tulis detail pengumuman..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={createAnnouncement}>Kirim Pengumuman</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
