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
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Eventease
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/events" style={{ color: 'var(--kikk-yellow)' }}>
                Cari Acara
              </Link>
            </li>

            {!isAuthenticated ? (
              <>
                <li className="nav-item ms-lg-3">
                  <Link className="btn-kikk-outline btn-sm px-4 py-2" to="/login">
                    Masuk
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link className="btn-kikk btn-sm px-4 py-2" to="/register">
                    Daftar
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to={getDashboardPath()}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item ms-lg-3">
                  <button
                    onClick={handleLogout}
                    className="btn-kikk-outline btn-sm px-4 py-2"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                  >
                    Logout
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
