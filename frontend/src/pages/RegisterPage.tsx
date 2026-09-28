import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { EventEaseLogo } from '../components/EventEaseLogo';
import Swal from 'sweetalert2';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validasi lokal sebelum kirim ke backend
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Validasi Nama
    if (!name.trim()) {
      errors.name = 'Nama lengkap wajib diisi.';
    } else if (name.trim().length < 3) {
      errors.name = 'Nama lengkap minimal 3 karakter.';
    } else if (name.trim().length > 100) {
      errors.name = 'Nama lengkap maksimal 100 karakter.';
    }

    // 2. Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Format email tidak valid (contoh: user@domain.com).';
    }

    // 3. Validasi Nomor Telepon
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!phone.trim()) {
      errors.phone = 'Nomor WhatsApp / HP wajib diisi.';
    } else if (phoneClean.length < 10 || phoneClean.length > 15) {
      errors.phone = 'Nomor telepon harus berupa angka antara 10 hingga 15 digit (contoh: 081234567890).';
    }

    // 4. Validasi Kata Sandi
    if (!password) {
      errors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Kata sandi minimal 6 karakter.';
    }

    // 5. Validasi Konfirmasi Kata Sandi
    if (!confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role,
      });

      Swal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil!',
        text: 'Akun Anda berhasil dibuat. Mengalihkan ke halaman login...',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/login');
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      const serverErrors = err.response?.data?.errors;
      const serverMessage = err.response?.data?.message || 'Registrasi gagal. Harap periksa kembali isian formulir.';

      if (serverErrors && typeof serverErrors === 'object' && Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        setGeneralError('Terdapat kesalahan pada input formulir. Harap periksa rincian pesan di atas kolom masing-masing.');
      } else {
        const newFieldErrors: Record<string, string> = {};
        const lowerMsg = serverMessage.toLowerCase();

        if (lowerMsg.includes('email')) {
          newFieldErrors.email = serverMessage;
        } else if (lowerMsg.includes('password') || lowerMsg.includes('cocok')) {
          newFieldErrors.confirmPassword = serverMessage;
        } else if (lowerMsg.includes('telepon') || lowerMsg.includes('phone') || lowerMsg.includes('angka')) {
          newFieldErrors.phone = serverMessage;
        } else if (lowerMsg.includes('nama') || lowerMsg.includes('name')) {
          newFieldErrors.name = serverMessage;
        }

        setFieldErrors(newFieldErrors);
        setGeneralError(serverMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (fieldKey: string) => {
    const errorMsg = fieldErrors[fieldKey];
    if (!errorMsg) return null;

    return (
      <div
        className="d-flex align-items-center gap-2 mb-2 px-3 py-2 rounded-2 anim-fade-in"
        style={{
          background: 'rgba(239, 68, 68, 0.16)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <i className="fas fa-exclamation-circle text-danger" style={{ fontSize: '13px' }}></i>
        <span>{errorMsg}</span>
      </div>
    );
  };

  const getInputStyle = (fieldKey: string): React.CSSProperties => {
    const hasError = !!fieldErrors[fieldKey];
    return {
      border: hasError ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: hasError ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      borderRadius: '12px',
      padding: '12px 16px 12px 42px',
    };
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
        padding: '120px 20px 60px 20px',
      }}
    >
      {/* Dark Ambient Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(11,6,22,0.45) 0%, rgba(6,3,12,0.9) 100%)',
          zIndex: 1,
        }}
      ></div>

      <div
        className="auth-container anim-fade-in"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '540px',
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
              Daftarkan akun baru untuk pengalaman tiket kelas dunia
            </p>
          </div>

          {/* General Server Error Banner */}
          {generalError && (
            <div
              className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3 anim-fade-in"
              style={{
                background: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              <i className="fas fa-exclamation-triangle text-danger fs-5 me-1"></i>
              <div>
                <strong>Pemberitahuan:</strong> {generalError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Nama Lengkap */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">
                <i className="fas fa-user me-1"></i> Nama Lengkap *
              </label>
              {renderFieldError('name')}
              <div className="position-relative">
                <input
                  type="text"
                  className="kikk-form-control"
                  style={getInputStyle('name')}
                  placeholder="Contoh: Abu Dujanah Siregar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                />
                <i
                  className="fas fa-id-card position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
              </div>
            </div>

            {/* 2. Email */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">
                <i className="fas fa-envelope me-1"></i> Alamat Email *
              </label>
              {renderFieldError('email')}
              <div className="position-relative">
                <input
                  type="email"
                  className="kikk-form-control"
                  style={getInputStyle('email')}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                />
                <i
                  className="fas fa-at position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
              </div>
            </div>

            {/* 3. Nomor WhatsApp / HP */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">
                <i className="fab fa-whatsapp me-1"></i> Nomor WhatsApp / HP *
              </label>
              {renderFieldError('phone')}
              <div className="position-relative">
                <input
                  type="tel"
                  className="kikk-form-control"
                  style={getInputStyle('phone')}
                  placeholder="Contoh: 081234567890 (10-15 digit)"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                />
                <i
                  className="fas fa-phone-alt position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
              </div>
            </div>

            {/* 4. Pilihan Role (Visual Cards) */}
            <div className="mb-3">
              <label className="kikk-form-label mb-2">
                <i className="fas fa-users-cog me-1"></i> Daftar Sebagai
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    onClick={() => setRole('USER')}
                    className="p-3 rounded-3 text-center cursor-pointer"
                    style={{
                      cursor: 'pointer',
                      background: role === 'USER' ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: role === 'USER' ? '1.5px solid var(--kikk-yellow)' : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <i className={`fas fa-ticket-alt fs-5 mb-1 ${role === 'USER' ? 'text-warning' : 'text-secondary'}`}></i>
                    <div className={`fw-bold small ${role === 'USER' ? 'text-white' : 'text-secondary'}`}>Pembeli Tiket</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Role: USER</div>
                  </div>
                </div>

                <div className="col-6">
                  <div
                    onClick={() => setRole('ORGANIZER')}
                    className="p-3 rounded-3 text-center cursor-pointer"
                    style={{
                      cursor: 'pointer',
                      background: role === 'ORGANIZER' ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: role === 'ORGANIZER' ? '1.5px solid var(--kikk-yellow)' : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <i className={`fas fa-bullhorn fs-5 mb-1 ${role === 'ORGANIZER' ? 'text-warning' : 'text-secondary'}`}></i>
                    <div className={`fw-bold small ${role === 'ORGANIZER' ? 'text-white' : 'text-secondary'}`}>Penyelenggara</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Role: ORGANIZER</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Kata Sandi */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">
                <i className="fas fa-lock me-1"></i> Kata Sandi *
              </label>
              {renderFieldError('password')}
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="kikk-form-control"
                  style={{ ...getInputStyle('password'), paddingRight: '45px' }}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
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

            {/* 6. Konfirmasi Kata Sandi */}
            <div className="mb-4">
              <label className="kikk-form-label mb-1">
                <i className="fas fa-check-double me-1"></i> Konfirmasi Kata Sandi *
              </label>
              {renderFieldError('confirmPassword')}
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="kikk-form-control"
                  style={{ ...getInputStyle('confirmPassword'), paddingRight: '45px' }}
                  placeholder="Ulangi kata sandi Anda"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                />
                <i
                  className="fas fa-shield-alt position-absolute top-50 translate-middle-y text-secondary"
                  style={{ left: '16px', fontSize: '0.9rem' }}
                ></i>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary text-decoration-none"
                  style={{ paddingRight: '14px' }}
                  title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <i className={`far ${showConfirmPassword ? 'fa-eye-slash text-warning' : 'fa-eye'}`}></i>
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
                  <i className="fas fa-spinner fa-spin me-2"></i> MENDAFTARKAN AKUN...
                </>
              ) : (
                <>
                  <span>BUAT AKUN SEKARANG</span>
                  <i className="fas fa-user-plus"></i>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 0 }}>
              Sudah memiliki akun?{' '}
              <Link to="/login" style={{ color: 'var(--kikk-yellow)', fontWeight: 600, textDecoration: 'none' }}>
                Masuk di Sini <i className="fas fa-arrow-right small ms-1"></i>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
