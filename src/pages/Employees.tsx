import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Plus, Search, UserCheck, UserX, X } from 'lucide-react';
import client, { BASE_URL } from '../api/client';
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  editor: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
  staff: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  staff: 'Staff',
};

export default function Employees() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '', full_name: '', password: '', email: '', phone: '',
    role: 'staff', department_id: '', bio: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
    // Auto-refresh every 15 seconds for real-time data
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        client.get('/users'),
        client.get('/settings/departments'),
      ]);
      setEmployees(empRes.data.users || []);
      setDepartments(deptRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.full_name || !formData.password) {
      setFormError('Username, nama lengkap, dan password wajib diisi');
      return;
    }
    try {
      setFormError('');
      const res = await client.post('/users', {
        ...formData,
        department_id: formData.department_id ? Number(formData.department_id) : null,
      });
      
      if (avatarFile && res.data?.id) {
         const avatarData = new FormData();
         avatarData.append('file', avatarFile);
         await client.post(`/users/${res.data.id}/avatar`, avatarData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });
      }
      
      setShowForm(false);
      setFormData({ username: '', full_name: '', password: '', email: '', phone: '', role: 'staff', department_id: '', bio: '' });
      setAvatarFile(null);
      loadData();
    } catch (e: any) {
      setFormError(e.response?.data?.detail || 'Gagal menambah pegawai');
    }
  };

  const toggleStatus = async (empId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await client.patch(`/users/${empId}/status`, { status: newStatus });
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Gagal mengubah status');
    }
  };

  const filteredEmployees = search
    ? employees.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.username.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const isOwner = user?.role === 'owner';

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Tim & Pegawai</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{employees.length} anggota tim terdaftar</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary shadow-primary-500/20" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Tambah Pegawai
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            className="input pl-10 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800"
            placeholder="Cari nama atau username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 h-64">
              <div className="skeleton w-full h-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(emp => (
            <div 
              key={emp.id} 
              className="card flex flex-col overflow-hidden hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="p-6 flex flex-col items-center text-center relative z-10">
                <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/20 h-24 -z-10 border-b border-slate-100 dark:border-slate-700/50" />
                
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                  {emp.profile?.avatar_path ? (
                    <img src={`${BASE_URL}${emp.profile.avatar_path}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold bg-gradient-to-br from-primary-500 to-secondary-500 text-transparent bg-clip-text">
                      {emp.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mb-2 flex-wrap justify-center">
                  <span className={`badge text-[10px] px-2 py-0.5 ${ROLE_COLORS[emp.role]}`}>
                    {ROLE_LABELS[emp.role]}
                  </span>
                  {emp.status === 'active' && (
                    <span className={`badge text-[10px] px-2 py-0.5 border ${
                      emp.is_online
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                        : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {emp.is_online ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {emp.full_name}
                </h4>
                
                <p className="font-mono text-[11px] text-slate-500 mt-1">{emp.employee_id}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1.5">{emp.department_name || 'No Department'}</p>
                
                {emp.profile?.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 line-clamp-2 leading-relaxed">
                    {emp.profile.bio}
                  </p>
                )}
              </div>
              
              <div className="mt-auto px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger py-0.5 px-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {emp.status === 'active' ? 'Aktif' : 'Non-aktif'}
                </span>
                {isOwner && emp.id !== user?.id && (
                  <button
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                      emp.status === 'active' 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:hover:bg-red-900/40' 
                        : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-900/30 dark:hover:bg-green-900/40'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(emp.id, emp.status);
                    }}
                    title={emp.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                  >
                    {emp.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start sm:items-center p-4 sm:p-0 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 my-8 sm:my-0 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Pegawai Baru</h3>
              <button onClick={() => { setShowForm(false); setAvatarFile(null); }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium border border-red-100 dark:border-red-900/50">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">Username *</label>
                  <input className="input" placeholder="contoh: budi.s" value={formData.username} onChange={e => setFormData(p => ({...p, username: e.target.value}))} />
                </div>
                <div>
                  <label className="input-label">Password *</label>
                  <input className="input" type="password" value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))} />
                </div>
              </div>
              
              <div>
                <label className="input-label">Nama Lengkap *</label>
                <input className="input" placeholder="contoh: Budi Santoso" value={formData.full_name} onChange={e => setFormData(p => ({...p, full_name: e.target.value}))} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">Email (opsional)</label>
                  <input className="input" type="email" placeholder="budi@example.com" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
                </div>
                <div>
                  <label className="input-label">Nomor HP (opsional)</label>
                  <input className="input" placeholder="081xxx" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">Role Akses</label>
                  <select className="input cursor-pointer" value={formData.role} onChange={e => setFormData(p => ({...p, role: e.target.value}))}>
                    <option value="staff">Staff (Standard)</option>
                    <option value="editor">Editor (Manajer)</option>
                    <option value="owner">Owner (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Departemen</label>
                  <select className="input cursor-pointer" value={formData.department_id} onChange={e => setFormData(p => ({...p, department_id: e.target.value}))}>
                    <option value="">Pilih departemen...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="input-label">Bio Singkat</label>
                <input className="input" maxLength={200} value={formData.bio} onChange={e => setFormData(p => ({...p, bio: e.target.value}))} placeholder="Deskripsi peran atau posisi..." />
              </div>

              <div>
                <label className="input-label">Foto Profil (Avatar)</label>
                <div className="flex items-center gap-4 mt-1">
                   {avatarFile && (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                         <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                   )}
                   <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp"
                      onChange={e => {
                         if (e.target.files && e.target.files.length > 0) {
                            setAvatarFile(e.target.files[0]);
                         }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 focus:outline-none dark:file:bg-primary-900/30 dark:file:text-primary-400 dark:text-slate-400"
                   />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setAvatarFile(null); }}>Batal</button>
              <button className="btn btn-primary shadow-primary-500/20 px-6" onClick={handleCreate}>Simpan Pegawai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
