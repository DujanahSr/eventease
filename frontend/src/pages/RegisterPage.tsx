import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
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
        className="d-flex align-items-center gap-2 mb-2 px-3 py-2 rounded-2"
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          fontSize: '12px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-in-out',
        }}
      >
        <i className="fas fa-exclamation-circle text-danger" style={{ fontSize: '14px' }}></i>
        <span>{errorMsg}</span>
      </div>
    );
  };

  const getInputStyle = (fieldKey: string): React.CSSProperties => {
    const hasError = !!fieldErrors[fieldKey];
    return {
      border: hasError ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: hasError ? '0 0 12px rgba(239, 68, 68, 0.3)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      borderRadius: '12px',
      padding: '12px 16px',
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
        padding: '120px 20px 50px 20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)',
          zIndex: 1,
        }}
      ></div>

      <div
        className="auth-container"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '520px',
        }}
      >
        <div
          className="auth-card"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(35px)',
            WebkitBackdropFilter: 'blur(35px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '40px 35px',
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
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Daftarkan akun baru Anda
            </p>
          </div>

          {/* Banner Peringatan Umum */}
          {generalError && (
            <div
              className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
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
              <label className="kikk-form-label mb-1">Nama Lengkap *</label>
              {renderFieldError('name')}
              <input
                type="text"
                className="kikk-form-control"
                style={getInputStyle('name')}
                placeholder="Contoh: Abu Dujanah"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
              />
            </div>

            {/* 2. Email */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">Email *</label>
              {renderFieldError('email')}
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
            </div>

            {/* 3. Nomor WhatsApp / HP */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">Nomor WhatsApp / HP *</label>
              {renderFieldError('phone')}
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
            </div>

            {/* 4. Daftar Sebagai */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">Daftar Sebagai</label>
              <select
                className="kikk-form-control"
                style={{
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER" style={{ background: '#0b0616', color: '#fff' }}>
                  Pembeli Tiket (USER)
                </option>
                <option value="ORGANIZER" style={{ background: '#0b0616', color: '#fff' }}>
                  Penyelenggara Acara (ORGANIZER)
                </option>
              </select>
            </div>

            {/* 5. Kata Sandi */}
            <div className="mb-3">
              <label className="kikk-form-label mb-1">Kata Sandi *</label>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary text-decoration-none"
                  style={{ paddingRight: '15px' }}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                >
                  <i className={`far ${showPassword ? 'fa-eye-slash text-warning' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* 6. Konfirmasi Kata Sandi */}
            <div className="mb-4">
              <label className="kikk-form-label mb-1">Konfirmasi Kata Sandi *</label>
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary text-decoration-none"
                  style={{ paddingRight: '15px' }}
                  title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                >
                  <i className={`far ${showConfirmPassword ? 'fa-eye-slash text-warning' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-kikk w-100 justify-content-center py-3"
              style={{ fontWeight: 700, borderRadius: '12px' }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i> MENDAFTARKAN AKUN...
                </>
              ) : (
                'BUAT AKUN SEKARANG'
              )}
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
