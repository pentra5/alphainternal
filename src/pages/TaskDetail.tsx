import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Trash2, Clock, Send, MessageSquare, Award, Tag } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';
import client from '../api/client';
import confetti from 'canvas-confetti';

const PRIORITY_MAP: Record<string, { emoji: string; label: string; cls: string }> = {
  urgent: { emoji: '🔴', label: 'Urgent', cls: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' },
  normal: { emoji: '🟡', label: 'Normal', cls: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  santai: { emoji: '🟢', label: 'Santai', cls: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  todo: { label: 'To Do', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'In Progress', cls: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' },
  review: { label: 'Review', cls: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  done: { label: 'Done', cls: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' },
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const prevCommentCount = useRef(0);

  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    const count = task?.comments?.length || 0;
    if (count > prevCommentCount.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCommentCount.current = count;
  }, [task?.comments?.length]);

  // Load task on mount + poll every 5s for real-time comments
  useEffect(() => {
    loadTask();
    const interval = setInterval(loadTask, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const loadTask = async () => {
    try {
      const res = await client.get(`/tasks/${id}`);
      setTask(res.data);
    } catch { navigate('/tasks'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await client.patch(`/tasks/${id}/status`, { status: newStatus });
      loadTask();
      
      if (newStatus === 'done') {
        fireConfetti();
      }
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal update status'); }
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const deleteTask = async () => {
    const isConfirmed = await confirm('Hapus tugas ini?', { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await client.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal menghapus'); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await client.post(`/tasks/${id}/comments`, { content: comment });
      setComment('');
      loadTask();
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal mengirim komentar'); }
    finally { setSending(false); }
  };

  const deleteComment = async (commentId: number) => {
    const isConfirmed = await confirm('Hapus komentar ini?', { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await client.delete(`/tasks/${id}/comments/${commentId}`);
      loadTask();
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal menghapus komentar'); }
  };

  const saveEditedComment = async (commentId: number) => {
    if (!editingContent.trim()) return;
    try {
      await client.put(`/tasks/${id}/comments/${commentId}`, { content: editingContent });
      setEditingCommentId(null);
      setEditingContent('');
      loadTask();
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal mengubah komentar'); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="card h-96 p-8">
        <div className="skeleton w-full h-full rounded-xl" />
      </div>
    </div>
  );
  if (!task) return null;

  const p = PRIORITY_MAP[task.priority];
  const s = STATUS_MAP[task.status];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <button 
          className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          onClick={() => navigate('/tasks')}
        >
          <ArrowLeft size={16} /> <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex gap-2">
          {isOwner && (
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium border border-red-100 dark:border-red-900/30" 
              onClick={deleteTask}
            >
              <Trash2 size={16} /> Hapus
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`badge ${p?.cls}`}>{p?.emoji} {p?.label}</span>
                <span className={`badge ${s?.cls}`}>{s?.label}</span>
                {task.is_overdue && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse">⏰ Terlambat</span>}
                {task.label && <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><Tag size={12} className="mr-1" /> {task.label}</span>}
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-3">
                {task.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Dibuat oleh <span className="text-slate-700 dark:text-slate-300">{task.assigned_by_name}</span> &bull; {new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {task.description && (
              <div className="p-6 md:p-8 space-y-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  📝 Deskripsi
                </h4>
                <div className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 font-medium">
                  {task.description}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-primary-500" /> Komentar ({task.comments?.length || 0})
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(task.comments || []).map((c: any) => {
                const isCommentAuthor = user?.id === c.user_id;
                const canEditDelete = isCommentAuthor || isOwner || isEditor;
                const isEditing = editingCommentId === c.id;

                return (
                  <div key={c.id} className="flex gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm mt-1">
                      {c.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 relative group">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.user_name || 'Unknown'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-500 shrink-0">
                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {canEditDelete && !isEditing && (
                            <div className="hidden group-hover:flex items-center gap-1">
                              {isCommentAuthor && (
                                <button onClick={() => { setEditingCommentId(c.id); setEditingContent(c.content); }} className="text-slate-400 hover:text-primary-500 transition-colors p-1" title="Edit Komentar">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                              )}
                              <button onClick={() => deleteComment(c.id)} className="text-slate-400 hover:text-danger-500 transition-colors p-1" title="Hapus Komentar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="mt-2 text-right">
                          <textarea
                            className="input w-full min-h-[60px] resize-none mb-2 text-[13px]"
                            value={editingContent}
                            onChange={e => setEditingContent(e.target.value)}
                          />
                          <button onClick={() => setEditingCommentId(null)} className="btn bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-1.5 text-xs mr-2 border-none">Batal</button>
                          <button onClick={() => saveEditedComment(c.id)} className="btn btn-primary px-3 py-1.5 text-xs">Simpan</button>
                        </div>
                      ) : (
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(task.comments || []).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <MessageSquare size={32} />
                  <p className="text-sm font-medium">Belum ada komentar</p>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex gap-2">
                <input
                  className="input flex-1 bg-slate-50 dark:bg-slate-900 focus:bg-white"
                  placeholder="Tulis diskusi di sini..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                />
                <button 
                  className="btn btn-primary w-11 h-11 p-0 flex items-center justify-center shrink-0 shadow-primary-500/20" 
                  disabled={sending || !comment.trim()} 
                  onClick={addComment}
                >
                  <Send size={18} className={comment.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Status Tugas</h4>
            <div className="flex flex-col gap-2">
              {['todo', 'in_progress', 'review', 'done'].map(st => (
                <button
                  key={st}
                  className={`
                    w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border
                    ${task.status === st 
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }
                  `}
                  onClick={() => updateStatus(st)}
                  disabled={task.status === st}
                >
                  {STATUS_MAP[st]?.label}
                </button>
              ))}
              {(isOwner || isEditor) && task.status !== 'cancelled' && (
                <button 
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent text-red-500 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 mt-2"
                  onClick={() => updateStatus('cancelled')}
                >
                  Batal (Cancel)
                </button>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Informasi</h4>
            <div className="space-y-4">
              {task.deadline && (
                <div className="flex gap-3">
                  <div className={`mt-0.5 ${task.is_overdue ? 'text-red-500' : 'text-slate-400'}`}>
                    <Clock size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Deadline</span>
                    <span className={`text-sm font-medium ${task.is_overdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                      {new Date(task.deadline).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
              {task.points_reward > 0 && (
                <div className="flex gap-3">
                  <div className="mt-0.5 text-warning-500">
                    <Award size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Reward Poin</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      ⭐ {task.points_reward}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Ditugaskan Ke</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-xs">
                {task.assignees?.length || 0}
              </span>
            </h4>
            <div className="space-y-3">
              {(task.assignees || []).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {a.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{a.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate">{a.employee_id}</span>
                  </div>
                </div>
              ))}
              {(task.assignees || []).length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  Belum ada assignee
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
