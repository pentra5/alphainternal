import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Plus, Search, LayoutGrid, List as ListIcon,
  Clock, ChevronRight, MessageSquare, User, X, FolderDot
} from 'lucide-react';
import client from '../api/client';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-primary-500' },
  { key: 'review', label: 'Review', color: 'bg-warning-500' },
  { key: 'done', label: 'Done', color: 'bg-success-500' },
];

const PRIORITY_MAP: Record<string, { emoji: string; label: string; cls: string }> = {
  urgent: { emoji: '🔴', label: 'Urgent', cls: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' },
  normal: { emoji: '🟡', label: 'Normal', cls: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  santai: { emoji: '🟢', label: 'Santai', cls: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' },
};

export default function Tasks() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';
  const canCreate = isOwner || isEditor;

  useEffect(() => {
    loadTasks();
    loadProjects();
    if (canCreate) loadEmployees();
    
    // Auto-refresh tasks list
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const res = await client.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await client.get('/users');
      setEmployees(res.data.users || []);
    } catch {}
  };

  const loadProjects = async () => {
    try {
      const res = await client.get('/projects');
      setProjects(res.data.projects || []);
    } catch {}
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await client.post('/projects', { name: newProjectName });
      setProjects([...projects, res.data]);
      setNewProjectName('');
      setShowCreateProject(false);
      setSelectedProject(res.data.id);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal membuat project');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await client.patch(`/tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal update status');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchProject = selectedProject ? t.project_id === selectedProject : true;
    return matchSearch && matchProject;
  });

  const tasksByStatus = (statusKey: string) =>
    filteredTasks.filter(t => t.status === statusKey);

  if (loading) {
    return (
      <div className="flex gap-4 animate-fade-in overflow-x-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-4 flex-1 h-[500px]">
            <div className="skeleton w-full h-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-6">
        {/* Project Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedProject ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            onClick={() => setSelectedProject(null)}
          >
            Semua Tugas
          </button>
          {projects.map(p => (
            <button 
              key={p.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedProject === p.id ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              onClick={() => setSelectedProject(p.id)}
            >
              <FolderDot size={14} /> {p.name}
            </button>
          ))}
          {canCreate && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              {showCreateProject ? (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full pl-3 pr-1 py-1 border border-primary-300 shadow-sm relative">
                  <input 
                    autoFocus
                    className="bg-transparent border-none outline-none text-sm w-32 dark:text-white" 
                    placeholder="Nama project..." 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                  />
                  <button className="bg-primary-500 text-white p-1 rounded-full hover:bg-primary-600" onClick={handleCreateProject}><Plus size={14} /></button>
                  <button className="text-slate-400 p-1 hover:text-slate-600" onClick={() => setShowCreateProject(false)}><X size={14} /></button>
                </div>
              ) : (
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  onClick={() => setShowCreateProject(true)}
                >
                  <Plus size={14} /> Project Baru
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'Semua Papan Tugas'}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {filteredTasks.length} tugas ditemukan
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              className="input pl-9" 
              placeholder="Cari tugas..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <button 
              className={`p-2 rounded-md transition-colors ${view === 'kanban' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setView('kanban')}
              title="Kanban View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setView('list')}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>

          {canCreate && (
            <button className="btn btn-primary shadow-primary-500/20" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Buat Tugas
            </button>
          )}
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start pb-6">
          {STATUSES.map(col => (
            <div key={col.key} className="flex flex-col gap-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center gap-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1 uppercase tracking-wider">{col.label}</h3>
                <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 min-h-[150px]">
                {tasksByStatus(col.key).map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onClick={() => navigate(`/tasks/${task.id}`)} />
                ))}
                
                {tasksByStatus(col.key).length === 0 && (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-sm font-medium bg-white/50 dark:bg-slate-800/50">
                    Kosong
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 font-medium border-dashed border-2">
              Tidak ada tugas ditemukan
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-200 group"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <span className={`badge ${PRIORITY_MAP[task.priority]?.cls || 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                    {PRIORITY_MAP[task.priority]?.emoji} <span className="hidden sm:inline">{PRIORITY_MAP[task.priority]?.label}</span>
                  </span>
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                    {task.title}
                  </span>
                  {task.is_overdue && <span className="badge badge-danger">⏰ Terlambat</span>}
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 shrink-0">
                  {task.deadline && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <Clock size={13} /> {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {task.assignees?.length > 0 && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <User size={13} /> {task.assignees.map((a: any) => a.full_name).join(', ')}
                    </span>
                  )}
                  {task.comments?.length > 0 && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <MessageSquare size={13} /> {task.comments.length}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <CreateTaskModal employees={employees} projects={projects} selectedProjectId={selectedProject} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadTasks(); }} />
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onClick }: { task: any; onStatusChange: (id: number, status: string) => void; onClick: () => void }) {
  const p = PRIORITY_MAP[task.priority];
  const nextStatus: Record<string, string> = { todo: 'in_progress', in_progress: 'review', review: 'done' };
  const next = nextStatus[task.status];

  return (
    <div 
      className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200 group flex flex-col shadow-sm"
      onClick={onClick}
    >
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge text-[10px] py-0.5 px-2 ${p?.cls || 'bg-primary-100 text-primary-700'}`}>
          {p?.emoji} {p?.label}
        </span>
        {task.project_name && (
          <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] py-0.5 px-2 flex items-center gap-1">
            <FolderDot size={10} /> {task.project_name}
          </span>
        )}
        {task.is_overdue && <span className="badge badge-danger text-[10px] py-0.5 px-2 bg-red-100 text-red-700 animate-pulse">⏰ Overdue</span>}
        {task.label && <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] py-0.5 px-2">{task.label}</span>}
      </div>
      
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {task.description.replace(/<[^>]*>?/gm, '')}
        </p>
      )}
      
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {task.deadline && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Clock size={12} className={task.is_overdue ? 'text-red-500' : ''} />
              <span className={task.is_overdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </span>
          )}
          
          <div className="flex items-center gap-2">
            {task.assignees?.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <User size={10} /> {task.assignees.length}
              </span>
            )}
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <MessageSquare size={10} /> {task.comments.length}
              </span>
            )}
            {task.points_reward > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 px-1.5 py-0.5 rounded border border-warning-200 dark:border-warning-900/50">
                ⭐ {task.points_reward}
              </span>
            )}
          </div>
        </div>
        
        {next && (
          <button
            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-500 hover:border-primary-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            onClick={e => { e.stopPropagation(); onStatusChange(task.id, next); }}
            title={`Pindah ke ${next.replace('_', ' ')}`}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({ employees, projects, selectedProjectId, onClose, onCreated }: { employees: any[]; projects: any[]; selectedProjectId: number | null; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'normal', deadline: '', label: '', points_reward: 0, assignee_ids: [] as number[], project_id: selectedProjectId || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleAssignee = (id: number) => {
    setForm(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(id) ? prev.assignee_ids.filter(x => x !== id) : [...prev.assignee_ids, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title) { alert('Judul wajib diisi'); return; }
    setSaving(true);
    try {
      await client.post('/tasks', {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        points_reward: Number(form.points_reward) || 0,
        project_id: form.project_id ? Number(form.project_id) : null,
      });
      onCreated();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal membuat tugas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start sm:items-center p-4 sm:p-0 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 my-8 sm:my-0 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Buat Tugas Baru</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="input-label">Judul Tugas *</label>
            <input className="input" maxLength={150} placeholder="Apa yang perlu dikerjakan?" value={form.title} onChange={e => update('title', e.target.value)} autoFocus />
          </div>
          
          <div>
            <label className="input-label">Deskripsi Lengkap</label>
            <textarea className="input min-h-[100px] py-3" placeholder="Berikan detail, link, atau ekspektasi..." value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Project</label>
              <select className="input cursor-pointer" value={form.project_id} onChange={e => update('project_id', e.target.value)}>
                <option value="">-- Tanpa Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Prioritas</label>
              <select className="input cursor-pointer" value={form.priority} onChange={e => update('priority', e.target.value)}>
                <option value="urgent">🔴 Urgent (Kritis)</option>
                <option value="normal">🟡 Normal (Standar)</option>
                <option value="santai">🟢 Santai (Bisa Nanti)</option>
              </select>
            </div>
            <div>
              <label className="input-label">Batas Waktu (Deadline)</label>
              <input className="input cursor-pointer" type="datetime-local" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Label / Tag (opsional)</label>
              <input className="input" placeholder="contoh: Frontend, Bug, Marketing" value={form.label} onChange={e => update('label', e.target.value)} />
            </div>
            <div>
              <label className="input-label text-warning-600 dark:text-warning-500 font-bold">⭐ Poin Reward</label>
              <input className="input border-warning-200 focus:border-warning-500 focus:ring-warning-500/20" type="number" min={0} placeholder="0" value={form.points_reward} onChange={e => update('points_reward', e.target.value)} />
            </div>
          </div>
          
          <div>
            <label className="input-label border-t border-slate-100 dark:border-slate-700 pt-5 mt-2">Tugaskan Kepada</label>
            <div className="flex flex-wrap gap-2">
              {employees.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 w-full text-center">Belum ada data tim.</div>
              ) : (
                employees.map(emp => {
                  const isSelected = form.assignee_ids.includes(emp.id);
                  return (
                    <button
                      key={emp.id} type="button"
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2
                        ${isSelected 
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700 shadow-sm' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }
                      `}
                      onClick={() => toggleAssignee(emp.id)}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isSelected ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        {emp.full_name.charAt(0).toUpperCase()}
                      </div>
                      {emp.full_name.split(' ')[0]}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <button className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-primary shadow-primary-500/20 px-6" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Loading...' : 'Simpan Tugas Baru'}
          </button>
        </div>
      </div>
    </div>
  );
}
