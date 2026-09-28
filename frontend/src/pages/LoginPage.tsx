import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EventEaseLogo } from '../components/EventEaseLogo';
import Swal from 'sweetalert2';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || null;

  useEffect(() => {
    // Muat library resmi Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: '146370175848-nv395oku7lv35171e8t26011sajhamvp.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { theme: 'filled_black', size: 'large', width: '100%', text: 'continue_with', shape: 'pill' }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) return;
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle(response.credential);
      Swal.fire({
        icon: 'success',
        title: 'Login Google Berhasil',
        text: `Selamat datang, ${user.name}!`,
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
        title: 'Login Google Gagal',
        text: err.response?.data?.message || 'Gagal memverifikasi akun Google Anda.',
        confirmButtonColor: '#FFD700',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Tidak Lengkap',
        text: 'Email dan kata sandi wajib diisi.',
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
        text: err.response?.data?.message || 'Email atau kata sandi tidak cocok.',
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
        padding: '100px 20px 40px 20px',
      }}
    >
      {/* Dark Ambient Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(11,6,22,0.45) 0%, rgba(6,3,12,0.88) 100%)',
          zIndex: 1,
        }}
      ></div>

      <div
        className="auth-container anim-fade-in"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
        }}
      >
        {/* Explicit Back to Home Navigation */}
        <div className="mb-3">
          <Link
            to="/"
            className="btn-kikk-outline btn-sm d-inline-flex align-items-center gap-2 py-2 px-3"
            style={{ borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}
          >
            <i className="fas fa-arrow-left"></i> Kembali ke Beranda
          </Link>
        </div>

        <div
          className="luxury-glass-card pattern-wireframe-card"
          style={{
            padding: '45px 38px',
            border: '1px solid rgba(255, 215, 0, 0.25)',
          }}
        >
          {/* Header Brand - Non-navigational brand identity */}
          <div className="auth-header text-center mb-4">
            <div className="d-inline-flex justify-content-center mb-2">
              <EventEaseLogo size="lg" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.92rem', margin: '8px 0 0 0' }}>
              Masuk untuk mengakses tiket &amp; dasbor Anda
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="kikk-form-label">
                <i className="fas fa-envelope me-1"></i> Alamat Email
              </label>
              <div className="position-relative">
                <input
                  type="email"
                  className="kikk-form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <i
                  className="fas fa-at position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="kikk-form-label mb-0">
                  <i className="fas fa-lock me-1"></i> Kata Sandi
                </label>
              </div>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="kikk-form-control"
                  style={{ paddingLeft: '42px', paddingRight: '45px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <i
                  className="fas fa-key position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary text-decoration-none"
                  style={{ paddingRight: '14px' }}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <i className={`far ${showPassword ? 'fa-eye-slash text-warning' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-kikk w-100 justify-content-center py-3"
              style={{ fontWeight: 700, borderRadius: '14px' }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i> MEMVERIFIKASI...
                </>
              ) : (
                <>
                  <span>MASUK KE AKUN</span>
                  <i className="fas fa-sign-in-alt"></i>
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Divider & Button */}
          <div className="d-flex align-items-center my-4">
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }}></div>
            <span
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.75rem',
                padding: '0 12px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              ATAU MASUK DENGAN
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }}></div>
          </div>

          <div id="googleSignInBtn" className="d-flex justify-content-center w-100" style={{ minHeight: '44px' }}></div>

          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 0 }}>
              Belum memiliki akun?{' '}
              <Link to="/register" style={{ color: 'var(--kikk-yellow)', fontWeight: 600, textDecoration: 'none' }}>
                Daftar Akun Baru <i className="fas fa-arrow-right small ms-1"></i>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
