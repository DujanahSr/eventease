import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'USER') return '/home-user';
    if (user.role === 'ORGANIZER') return '/dashboard';
    if (user.role === 'ADMIN') return '/home-admin';
    return '/';
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark fixed-top"
      style={{
        background: 'rgba(11, 6, 22, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.12)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        zIndex: 1040,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container">
        <Link
          className="navbar-brand kikk-title text-lowercase d-flex align-items-center gap-1"
          to="/"
          style={{ fontSize: '1.9rem', letterSpacing: '0.5px' }}
        >
          eventease<span style={{ color: 'var(--kikk-yellow)', fontSize: '2.4rem', lineHeight: '0' }}>.</span>
        </Link>
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: 'var(--kikk-yellow)' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            <li className="nav-item">
              <Link className="nav-link px-3" to="/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                Beranda
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3" to="/events" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                Katalog Acara
              </Link>
            </li>

            {!isAuthenticated ? (
              <>
                <li className="nav-item ms-lg-2">
                  <Link
                    className="nav-link px-3"
                    to="/login"
                    style={{ color: 'var(--kikk-yellow)', fontWeight: 500, fontSize: '0.95rem' }}
                  >
                    Masuk
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link
                    className="btn-kikk btn-sm px-4 py-2"
                    to="/register"
                    style={{ borderRadius: '12px', fontSize: '13px' }}
                  >
                    Daftar Akun
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-3">
                  <Link
                    to={getDashboardPath()}
                    className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                    style={{
                      background: 'rgba(255, 215, 0, 0.08)',
                      border: '1px solid rgba(255, 215, 0, 0.25)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="rounded-circle"
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'cover',
                          border: '2px solid var(--kikk-yellow)',
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: '32px',
                          height: '32px',
                          fontSize: '13px',
                          background: 'linear-gradient(135deg, #FFD700, #b8860b)',
                          color: '#000',
                        }}
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {user?.name?.split(' ')[0]}
                    </span>
                    <span
                      className="badge bg-warning text-dark"
                      style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '4px', letterSpacing: '0.5px' }}
                    >
                      {user?.role}
                    </span>
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <button
                    onClick={handleLogout}
                    className="btn-kikk-outline btn-sm px-3 py-1"
                    style={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.7)',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                    title="Keluar dari akun"
                  >
                    <i className="fas fa-sign-out-alt me-1"></i> Keluar
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
