import { useState } from 'react';
import { useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Save, Lock, Camera } from 'lucide-react';
import client from '../api/client';

import { BASE_URL } from '../api/client';

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put('/users/me', form);
      await fetchProfile();
      setMsg('Profil berhasil diupdate! ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal update profil');
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setSaving(true);
    try {
      await client.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      setMsg('Foto profil berhasil diupdate! ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg('Gagal upload foto: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
      setMsg('Isi password lama dan baru');
      return;
    }
    try {
      await client.post('/auth/change-password', passwordForm);
      setMsg('Password berhasil diubah! 🔑');
      setPasswordForm({ old_password: '', new_password: '' });
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal ganti password');
    }
  };

  if (!user) return null;

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <h2 className="page-title" style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>Account Settings</h2>

      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: 16,
          background: msg.includes('✅') || msg.includes('🔑') ? 'var(--success-light)' : 'var(--danger-light)',
          color: msg.includes('✅') || msg.includes('🔑') ? 'var(--success)' : 'var(--danger)',
          fontSize: 13, fontWeight: 600,
        }}>
          {msg}
        </div>
      )}

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} style={{ width: 80, height: 80, flexShrink: 0 }}>
            {user.profile?.avatar_path ? (
              <img 
                src={`${BASE_URL}${user.profile.avatar_path}`} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 28
              }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>{user.full_name}</h3>
            <p className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.employee_id}</p>
            <span className="badge badge-primary" style={{ marginTop: 4 }}>{user.role}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Nama Lengkap</label>
            <input className="input" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Nomor HP</label>
              <input className="input" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Bio (maks 200 karakter)</label>
            <input className="input" maxLength={200} value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} placeholder="Ceritakan tentang dirimu..." />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Lock size={18} /> Ganti Password
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Password Lama</label>
            <input className="input" type="password" value={passwordForm.old_password}
              onChange={e => setPasswordForm(p => ({...p, old_password: e.target.value}))} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Password Baru</label>
            <input className="input" type="password" value={passwordForm.new_password}
              onChange={e => setPasswordForm(p => ({...p, new_password: e.target.value}))} />
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleChangePassword} style={{ marginTop: 14 }}>
          Ubah Password
        </button>
      </div>
    </div>
  );
}
