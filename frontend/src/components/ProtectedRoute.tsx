import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'ORGANIZER' | 'USER')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to appropriate home
    if (user.role === 'USER') return <Navigate to="/home-user" replace />;
    if (user.role === 'ORGANIZER') return <Navigate to="/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/home-admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
