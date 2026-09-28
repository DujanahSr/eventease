import React from 'react';
import { NavLink } from 'react-router-dom';

interface UserFloatingDockProps {
  onOpenSettings?: () => void;
}

export const UserFloatingDock: React.FC<UserFloatingDockProps> = ({ onOpenSettings }) => {
  return (
    <div
      className="position-fixed start-50 translate-middle-x"
      style={{
        bottom: '28px',
        zIndex: 1030,
        maxWidth: '92%',
      }}
    >
      <div
        className="d-flex align-items-center gap-1 p-2 rounded-pill shadow-lg"
        style={{
          background: 'rgba(18, 10, 36, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 215, 0, 0.12)',
        }}
      >
        {/* Brand Dot Logo */}
        <div
          className="d-none d-sm-flex align-items-center justify-content-center px-3 py-1 me-1 border-end"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', color: '#FFD700', fontFamily: "'Playfair Display', serif" }}>
            EE.
          </span>
        </div>

        {/* Dashboard Tab */}
        <NavLink
          to="/home-user"
          end
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none transition-all ${
              isActive ? 'bg-warning text-dark fw-bold' : 'text-white text-opacity-75 hover-gold'
            }`
          }
          style={{ fontSize: '13px', transition: 'all 0.25s ease' }}
        >
          <i className="fas fa-chart-pie"></i>
          <span className="d-none d-md-inline">Dashboard</span>
        </NavLink>

        {/* My Tickets Tab */}
        <NavLink
          to="/my-tickets"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none transition-all ${
              isActive ? 'bg-warning text-dark fw-bold' : 'text-white text-opacity-75 hover-gold'
            }`
          }
          style={{ fontSize: '13px', transition: 'all 0.25s ease' }}
        >
          <i className="fas fa-ticket-alt"></i>
          <span className="d-none d-md-inline">Tiket Saya</span>
        </NavLink>

        {/* Discover Events */}
        <NavLink
          to="/events"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none transition-all ${
              isActive ? 'bg-warning text-dark fw-bold' : 'text-white text-opacity-75 hover-gold'
            }`
          }
          style={{ fontSize: '13px', transition: 'all 0.25s ease' }}
        >
          <i className="fas fa-compass"></i>
          <span className="d-none d-md-inline">Jelajahi Acara</span>
        </NavLink>

        {/* Profile Tab */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded-pill text-decoration-none transition-all ${
              isActive ? 'bg-warning text-dark fw-bold' : 'text-white text-opacity-75 hover-gold'
            }`
          }
          style={{ fontSize: '13px', transition: 'all 0.25s ease' }}
        >
          <i className="fas fa-user-circle"></i>
          <span className="d-none d-md-inline">Profil</span>
        </NavLink>
      </div>
    </div>
  );
};
