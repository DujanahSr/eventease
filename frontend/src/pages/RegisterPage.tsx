import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Tidak Lengkap',
        text: 'Semua kolom formulir wajib diisi.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({ name, email, phone, password, role });
      Swal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil!',
        text: 'Akun Anda berhasil dibuat. Silakan masuk.',
        confirmButtonColor: '#FFD700',
      }).then(() => {
        navigate('/login');
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Registrasi Gagal',
        text: err.response?.data?.message || 'Gagal mendaftarkan akun. Silakan coba lagi.',
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
        padding: '30px 20px',
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
          maxWidth: '480px',
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
            padding: '40px',
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
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Daftarkan akun baru Anda</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="kikk-form-label">Nama Lengkap</label>
              <input
                type="text"
                className="kikk-form-control"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="mb-3">
              <label className="kikk-form-label">Nomor WhatsApp / HP</label>
              <input
                type="tel"
                className="kikk-form-control"
                placeholder="0812xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="kikk-form-label">Daftar Sebagai</label>
              <select className="kikk-form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="USER" style={{ background: '#0b0616', color: '#fff' }}>
                  Pembeli Tiket (USER)
                </option>
                <option value="ORGANIZER" style={{ background: '#0b0616', color: '#fff' }}>
                  Penyelenggara Acara (ORGANIZER)
                </option>
              </select>
            </div>

            <div className="mb-4">
              <label className="kikk-form-label">Password</label>
              <input
                type="password"
                className="kikk-form-control"
                placeholder="Minimal 6 karakter"
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
              {isSubmitting ? 'MENDAFTARKAN...' : 'BUAT AKUN SEKARANG'}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 0 }}>
              Sudah memiliki akun?{' '}
              <Link to="/login" style={{ color: 'var(--kikk-yellow)', fontWeight: 600, textDecoration: 'none' }}>
                Masuk di Sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
