import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Shield, Mail, Phone, Calendar, Award, UserCheck, UserX, Key, Camera, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { confirm } from '@tauri-apps/plugin-dialog';
import client, { BASE_URL } from '../api/client';
const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  staff: 'Staff',
};

const LEVELS = [
  { name: '🌱 Newbie', min: 0, max: 99 },
  { name: '⚡ Rising', min: 100, max: 299 },
  { name: '🔥 Solid', min: 300, max: 599 },
  { name: '💎 Pro', min: 600, max: 999 },
  { name: '🚀 Legend', min: 1000, max: Infinity },
];

function getLevel(points: number) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUser?.role === 'owner';

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const res = await client.get(`/users/${id}`);
      setEmployee(res.data);
    } catch {
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      await client.patch(`/users/${id}/status`, { status: newStatus });
      loadEmployee();
      setMsg(`Status berhasil diubah ke ${newStatus === 'active' ? 'Aktif' : 'Non-aktif'} ✅`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal mengubah status');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setMsg('Harap masukkan password baru');
      return;
    }
    try {
      setMsg('Mereset password...');
      setShowPasswordModal(false);
      const res = await client.post(`/users/${id}/reset-password`, { new_password: newPassword });
      setMsg(res.data.message || `Password berhasil direset! 🔑`);
      setNewPassword('');
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal reset password');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setMsg('Mengunggah foto...');
      await client.post(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadEmployee();
      setMsg('Foto profil berhasil diperbarui ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Gagal mengunggah foto');
    }
  };

  const deleteEmployee = async () => {
    const isConfirmed = await confirm('PERHATIAN: Hapus permanen akun pegawai ini beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.', { title: 'Alpha', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await client.delete(`/users/${id}`);
      navigate('/employees');
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal menghapus pegawai');
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="card h-64 p-8">
        <div className="skeleton w-full h-full rounded-xl" />
      </div>
    </div>
  );
  if (!employee) return null;

  const points = employee.profile?.total_points || 0;
  const level = getLevel(points);
  
  const isSuccessMsg = msg.includes('✅') || msg.includes('🔑');

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex items-center">
        <button 
          className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          onClick={() => navigate('/employees')}
        >
          <ArrowLeft size={16} /> <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold border shadow-sm flex items-center gap-3 animate-fade-in ${
          isSuccessMsg 
            ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-900/30' 
            : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30'
        }`}>
          <span>{msg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6 relative z-10">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/20 h-32 -z-10 border-b border-slate-100 dark:border-slate-700" />
          
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden shrink-0 mt-2 md:mt-4">
            {employee.profile?.avatar_path ? (
              <img src={`${BASE_URL}${employee.profile.avatar_path}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold bg-gradient-to-br from-primary-500 to-secondary-500 text-transparent bg-clip-text">
                {employee.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-3 md:mt-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                {employee.full_name}
              </h2>
              <p className="font-mono text-sm text-slate-500 mt-1">{employee.employee_id}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge flex items-center gap-1.5 ${
                employee.role === 'owner' ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' :
                employee.role === 'editor' ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' :
                'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              }`}>
                <Shield size={12} /> {ROLE_LABELS[employee.role]}
              </span>
              <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-danger py-0.5 px-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {employee.status === 'active' ? 'Aktif' : 'Non-aktif'}
              </span>
              {employee.status === 'active' && (
                <span className={`badge border ${
                  employee.is_online 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {employee.is_online ? '🟢 Online' : '⚫ Offline'}
                </span>
              )}
            </div>
          </div>
          
          {isOwner && employee.id !== currentUser?.id && (
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:mt-4 w-full md:w-auto mt-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
              <input 
                 type="file" 
                 accept="image/jpeg, image/png, image/webp" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleUploadPhoto}
              />
              <button className="btn btn-outline btn-sm bg-white dark:bg-slate-800" onClick={() => fileInputRef.current?.click()}>
                <Camera size={14} className="mr-1.5" /> Update Foto
              </button>
              <button 
                className={`btn btn-sm ${employee.status === 'active' ? 'btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20' : 'btn-primary'}`} 
                onClick={toggleStatus}
              >
                {employee.status === 'active' ? <UserX size={14} className="mr-1.5" /> : <UserCheck size={14} className="mr-1.5" />}
                {employee.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button className="btn btn-outline btn-sm bg-white dark:bg-slate-800" onClick={() => setShowPasswordModal(true)}>
                <Key size={14} className="mr-1.5" /> Reset Password
              </button>
              <button className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border-0" onClick={deleteEmployee}>
                <Trash2 size={14} className="mr-1.5" /> Hapus Akun
              </button>
            </div>
          )}
        </div>

        {employee.profile?.bio && (
          <div className="p-6 md:p-8 pt-0 md:pt-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Bio</h4>
            <div className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 font-medium">
              {employee.profile.bio}
            </div>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="card p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            Informasi Kontak
          </h3>
          <div className="space-y-5">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Email</span>
                <span className="text-[15px] font-medium text-slate-900 dark:text-white truncate">{employee.email || '-'}</span>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Phone size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Telepon</span>
                <span className="text-[15px] font-medium text-slate-900 dark:text-white truncate">{employee.phone || '-'}</span>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Calendar size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Bergabung Sejak</span>
                <span className="text-[15px] font-medium text-slate-900 dark:text-white truncate">
                  {new Date(employee.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 md:p-8 border-t-4 border-t-primary-500">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            Departemen & Poin
          </h3>
          <div className="space-y-5">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Shield size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Departemen</span>
                <span className="text-[15px] font-medium text-slate-900 dark:text-white truncate">{employee.department_name || 'Tidak ada'}</span>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center text-warning-500 shrink-0 shadow-sm border border-warning-100 dark:border-warning-900/50">
                <Award size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Total Poin</span>
                <span className="text-[15px] font-bold text-warning-600 dark:text-warning-400 truncate">{points} poin</span>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 shadow-sm border border-primary-100 dark:border-primary-900/50">
                <span className="text-xl filter drop-shadow-sm">{level.name.split(' ')[0]}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Level Bekerja</span>
                <span className="text-[15px] font-bold text-primary-600 dark:text-primary-400 truncate">{level.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
            <h3 className="text-xl font-bold mb-4">Reset Password Pegawai</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Silakan masukkan password baru untuk <strong>{employee.full_name}</strong>.
            </p>
            <div className="mb-6">
              <label className="input-label">Password Baru</label>
              <input 
                type="text" 
                className="input" 
                placeholder="MasaDepanCerah123" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}>Batal</button>
              <button className="btn btn-danger" onClick={handleResetPassword} disabled={!newPassword.trim()}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
