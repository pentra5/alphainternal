import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Building, Palette, Wifi, WifiOff, Plus, Trash2 } from 'lucide-react';
import client from '../api/client';

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [company, setCompany] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_API_URL || 'https://workos.ain.web.id');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [msg, setMsg] = useState('');

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadSettings();
    checkConnection();
  }, []);

  const loadSettings = async () => {
    try {
      const [compRes, deptRes] = await Promise.all([
        client.get('/settings/company'),
        client.get('/settings/departments'),
      ]);
      setCompany(compRes.data);
      setDepartments(deptRes.data || []);
    } catch {}
  };

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      await client.get('/health');
      setConnectionStatus('ok');
    } catch {
      setConnectionStatus('error');
    }
  };

  const saveCompany = async () => {
    try {
      await client.put('/settings/company', company);
      setMsg('Settings berhasil disimpan! ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal menyimpan');
    }
  };

  const addDepartment = async () => {
    if (!newDeptName) return;
    try {
      await client.post('/settings/departments', { name: newDeptName });
      setNewDeptName('');
      loadSettings();
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal menambah departemen');
    }
  };

  const deleteDepartment = async (id: number) => {
    try {
      await client.delete(`/settings/departments/${id}`);
      loadSettings();
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Gagal menghapus departemen');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <h2 className="page-title" style={{ marginBottom: 24 }}>Settings</h2>

      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: 16,
          background: msg.includes('✅') ? 'var(--success-light)' : 'var(--danger-light)',
          color: msg.includes('✅') ? 'var(--success)' : 'var(--danger)',
          fontSize: 13, fontWeight: 600,
        }}>
          {msg}
        </div>
      )}

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Palette size={18} /> Tampilan
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mode gelap untuk kenyamanan mata di malam hari</p>
          </div>
          <button
            className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={toggleTheme}
          >
            <div className="toggle-knob" />
          </button>
        </div>
      </div>

      {/* Connection */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {connectionStatus === 'ok' ? <Wifi size={18} color="var(--success)" /> : <WifiOff size={18} color="var(--danger)" />}
          Koneksi Server
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input className="input" value={serverUrl} onChange={e => setServerUrl(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={checkConnection}>Test</button>
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: connectionStatus === 'ok' ? 'var(--success)' : 'var(--danger)' }}>
          {connectionStatus === 'checking' ? '⏳ Checking...' : connectionStatus === 'ok' ? '✅ Terhubung' : '❌ Gagal terhubung'}
        </p>
      </div>

      {/* Company Settings (Owner only) */}
      {isOwner && company && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Building size={18} /> Perusahaan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="label">Nama Perusahaan</label>
                <input className="input" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">Inisial (untuk ID)</label>
                <input className="input" maxLength={10} value={company.initials} onChange={e => setCompany({...company, initials: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Poin per Laporan Tepat Waktu</label>
              <input className="input" type="number" value={company.points_per_report} onChange={e => setCompany({...company, points_per_report: Number(e.target.value)})} />
            </div>
            <button className="btn btn-primary" onClick={saveCompany} style={{ alignSelf: 'flex-end' }}>
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Departments (Owner only) */}
      {isOwner && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Departemen</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="input"
              placeholder="Nama departemen baru"
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDepartment()}
            />
            <button className="btn btn-primary" onClick={addDepartment}>
              <Plus size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {departments.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--bg)'
              }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteDepartment(d.id)}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div style={{ textAlign: 'center', marginTop: 32, padding: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>© 2026 Alpha. All rights reserved.</p>
      </div>

      <style>{`
        .toggle-btn {
          width: 48px; height: 26px; border-radius: 999px; border: none; cursor: pointer;
          background: var(--border); position: relative; transition: var(--transition);
        }
        .toggle-btn.active { background: var(--primary); }
        .toggle-knob {
          width: 20px; height: 20px; border-radius: 50%; background: white;
          position: absolute; top: 3px; left: 3px; transition: var(--transition);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-btn.active .toggle-knob { left: 25px; }
      `}</style>
    </div>
  );
}
