import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { GateScannerPage } from './pages/GateScannerPage';
import { OrganizerWalletPage } from './pages/OrganizerWalletPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAuthPage && <Navbar />}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Routes */}
          <Route
            path="/home-user"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />

          {/* Organizer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                <GateScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                <OrganizerWalletPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/home-admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
