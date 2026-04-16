import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password, rememberMe);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login gagal. Cek koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-secondary-400/20 dark:bg-secondary-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-success-400/20 dark:bg-success-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg mb-4">
            <span className="text-white font-display font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Alpha</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Internal Work Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium animate-scale-in border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                id="login-username"
                type="text"
                className="input pl-10 bg-white/50 dark:bg-slate-950/50"
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input pl-10 pr-10 bg-white/50 dark:bg-slate-950/50"
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500/30 dark:bg-slate-900"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Ingat saya
              </span>
            </label>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="w-full btn btn-primary btn-lg mt-2 relative overflow-hidden group"
            disabled={loading}
          >
            <span className="relative z-10">{loading ? 'Masuk...' : 'Masuk'}</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
            Alpha v1.0.0 — Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
