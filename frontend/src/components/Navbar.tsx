import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EventEaseLogo } from './EventEaseLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark fixed-top"
      style={{
        background: 'rgba(11, 6, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.12)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        zIndex: 1040,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container">
        {/* Official Brand Logo */}
        <Link to="/" className="navbar-brand py-0">
          <EventEaseLogo size="md" />
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: '#FFD700' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center gap-1">
            <li className="nav-item">
              <Link
                className={`nav-link px-3 ${isActive('/') ? 'text-warning fw-semibold' : 'text-white text-opacity-75'}`}
                to="/"
                style={{ fontSize: '0.92rem', transition: 'all 0.2s ease' }}
              >
                Beranda
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link px-3 ${isActive('/events') ? 'text-warning fw-semibold' : 'text-white text-opacity-75'}`}
                to="/events"
                style={{ fontSize: '0.92rem', transition: 'all 0.2s ease' }}
              >
                Katalog Acara
              </Link>
            </li>

            {/* Khusus User: Link Cepat ke Tiket Saya */}
            {isAuthenticated && user?.role === 'USER' && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 ${isActive('/my-tickets') ? 'text-warning fw-semibold' : 'text-white text-opacity-75'}`}
                  to="/my-tickets"
                  style={{ fontSize: '0.92rem', transition: 'all 0.2s ease' }}
                >
                  <i className="fas fa-ticket-alt me-1 text-warning"></i> Tiket Saya
                </Link>
              </li>
            )}

            {!isAuthenticated ? (
              <>
                <li className="nav-item ms-lg-2">
                  <Link
                    className="nav-link px-3 text-warning fw-medium"
                    to="/login"
                    style={{ fontSize: '0.92rem' }}
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
                      color: '#ffffff',
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
                          border: '2px solid #FFD700',
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
                    title="Keluar dari sesi akun"
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
