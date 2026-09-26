import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User as UserIcon, QrCode, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isOrganizer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Ticket className="w-6 h-6 text-white transform -rotate-12" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight gradient-text">Eventease</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PROD
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Jelajahi Acara
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-tickets"
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center space-x-2"
              >
                <Ticket className="w-4 h-4 text-indigo-400" />
                <span>Tiket Saya</span>
              </Link>
            )}

            {isOrganizer && (
              <Link
                to="/live-checkin"
                className="px-4 py-2 rounded-xl text-sm font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors flex items-center space-x-2 border border-amber-500/20"
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Live Check-In Monitor</span>
              </Link>
            )}
          </div>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-bold text-slate-200">{user?.name}</span>
                  <span className="text-xs text-indigo-400 font-medium capitalize">{user?.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
