import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login gagal:', err);
      const msg = err.response?.data?.message || 'Email atau password yang Anda masukkan salah.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-slate-700/60 shadow-2xl relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-brand-purple/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-brand-cyan/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Ticket className="w-7 h-7 text-white transform -rotate-12" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Selamat Datang Kembali</h1>
          <p className="text-slate-400 text-xs mt-1">Masuk ke akun Eventease Anda untuk melanjutkan</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Masuk ke Akun</span>}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6 relative z-10">
          Belum punya akun?{' '}
          <Link to="/register" className="text-indigo-400 font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};
