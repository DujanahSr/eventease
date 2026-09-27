import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Tidak Lengkap',
        text: 'Email dan password wajib diisi.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil',
        text: `Selamat datang kembali, ${user.name}!`,
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        if (from) {
          navigate(from, { replace: true });
        } else {
          if (user.role === 'USER') navigate('/home-user');
          else if (user.role === 'ORGANIZER') navigate('/dashboard');
          else if (user.role === 'ADMIN') navigate('/home-admin');
          else navigate('/');
        }
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: err.response?.data?.message || 'Email atau password salah.',
        confirmButtonColor: '#FFD700',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: "url('/images/auth-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        padding: '20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.8) 100%)',
          zIndex: 1,
        }}
      ></div>

      <div
        className="auth-container"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '450px',
        }}
      >
        <div
          className="auth-card"
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(35px)',
            WebkitBackdropFilter: 'blur(35px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '30px',
            padding: '50px 40px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          }}
        >
          <div className="auth-header text-center mb-4">
            <Link
              to="/"
              className="auth-brand"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: '2.5rem',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Eventease
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Masuk untuk mengakses akun Anda</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="kikk-form-label">Email</label>
              <input
                type="email"
                className="kikk-form-control"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="kikk-form-label">Password</label>
              <input
                type="password"
                className="kikk-form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-kikk w-100 justify-content-center py-3"
              style={{ fontWeight: 700 }}
            >
              {isSubmitting ? 'MEMPROSES...' : 'MASUK KE AKUN'}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 0 }}>
              Belum punya akun?{' '}
              <Link to="/register" style={{ color: 'var(--kikk-yellow)', fontWeight: 600, textDecoration: 'none' }}>
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
