import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { EventSummary, Category } from '../types';
import Swal from 'sweetalert2';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [eventData, catData] = await Promise.all([
          eventService.getEvents('', '', 0, 30),
          eventService.getCategories(),
        ]);
        setEvents(eventData.content || []);
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengonsolidasikan transaksi tiket dengan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Admin_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Konsolidasi_Penjualan_Platform_${Date.now()}.xlsx`;

      triggerFileDownload(blob, filename);

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: `File ${filename} berhasil diunduh.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Gagal mengekspor laporan Excel:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Ekspor Excel',
        text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket platform.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Background Subtle Geometric Pattern */}
      <div className="pattern-geometric-overlay" style={{ opacity: 0.15 }}></div>

      {/* Luxury Left Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div>
          {/* Brand Logo & Super Admin Badge */}
          <div className="mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
            <Link
              to="/"
              className="navbar-brand kikk-title text-lowercase d-flex align-items-center gap-1 mb-2"
              style={{ fontSize: '1.8rem' }}
            >
              eventease<span style={{ color: 'var(--kikk-yellow)', fontSize: '2.2rem', lineHeight: 0 }}>.</span>
            </Link>
            <span className="gold-glow-badge" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              <i className="fas fa-shield-alt text-warning me-1"></i> SUPER ADMIN CONSOLE
            </span>
          </div>

          {/* Navigation Links */}
          <nav>
            <a href="#overview" className="sidebar-nav-item active">
              <i className="fas fa-chart-line"></i>
              <span>Ringkasan Platform</span>
            </a>
            <a href="#events" className="sidebar-nav-item">
              <i className="fas fa-calendar-alt"></i>
              <span>Semua Acara ({events.length})</span>
            </a>
            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer"
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} text-success`}></i>
              <span className="text-success fw-semibold">Ekspor Konsolidasi (.xlsx)</span>
            </button>
            <Link to="/scan" className="sidebar-nav-item">
              <i className="fas fa-qrcode"></i>
              <span>Scanner Gate Access</span>
            </Link>
            <Link to="/events" className="sidebar-nav-item">
              <i className="fas fa-globe"></i>
              <span>Lihat Katalog Publik</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="pt-3 border-top" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
          <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #FFD700, #b8860b)', color: '#000', fontSize: '15px' }}
            >
              A
            </div>
            <div className="overflow-hidden">
              <div className="text-white fw-bold text-truncate" style={{ fontSize: '13px' }}>{user?.name}</div>
              <div className="text-secondary text-truncate" style={{ fontSize: '11px' }}>{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-kikk-outline btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            style={{ borderRadius: '10px', fontSize: '12px' }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar Console
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="dashboard-main-content">
        {/* Mobile Toggle & Top Greeting Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-outline-warning d-lg-none"
              style={{ borderRadius: '8px', padding: '6px 12px' }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="status-indicator-badge">
                  <i className="fas fa-shield-check"></i> Super Administrator Otentik
                </span>
              </div>
              <h1 className="kikk-title m-0" style={{ fontSize: '2rem' }}>
                Panel Pengelola Platform Eventease
              </h1>
              <p className="text-secondary small m-0 mt-1">
                Pemantauan menyeluruh seluruh transaksi tiket, status gateway, dan ekspor konsolidasi format Excel POI.
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="btn-kikk-outline px-3 py-2"
              style={{ fontSize: '13px', borderRadius: '10px', borderColor: '#22c55e', color: '#22c55e' }}
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} me-1`}></i>
              Unduh Laporan Konsolidasi (.xlsx)
            </button>
          </div>
        </div>

        {/* 4-Column Platform Metrics Bar */}
        <div id="overview" className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-calendar-check text-warning fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Total Acara Terdaftar</div>
                <div className="fs-3 fw-bold text-white">{events.length}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-layer-group text-success fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Kategori Acara Aktif</div>
                <div className="fs-3 fw-bold text-white">{categories.length} Kategori</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(234, 179, 8, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-users-gear text-warning fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Role System</div>
                <div className="fs-4 fw-bold text-white">3 Role Aktif</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-credit-card text-info fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Gateway Transaksi</div>
                <div className="fs-5 fw-bold text-success">
                  <i className="fas fa-check-circle me-1"></i> Midtrans Snap
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Events Table Section */}
        <div id="events" className="luxury-glass-card p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <h3 className="kikk-title m-0 fs-4">
                <i className="fas fa-server text-warning me-2"></i> Konsol Seluruh Acara Platform
              </h3>
              <p className="text-secondary small m-0 mt-1">
                Daftar semua acara yang dipublikasikan oleh berbagai organizer di platform Eventease.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover m-0 align-middle" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ borderColor: 'rgba(255, 215, 0, 0.2)', fontSize: '12px', letterSpacing: '1px' }}>
                    <th className="py-3">NAMA ACARA</th>
                    <th className="py-3">KATEGORI</th>
                    <th className="py-3">TANGGAL</th>
                    <th className="py-3">PENYELENGGARA</th>
                    <th className="py-3 text-end">AKSI & LAPORAN</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <td className="fw-bold text-white py-3">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={e.imageUrl || '/images/kikk_hero_stage.jpg'}
                            alt={e.name}
                            className="rounded"
                            style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="text-white">{e.name}</div>
                            <div className="text-secondary small font-monospace">ID: {e.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255, 215, 0, 0.12)', color: 'var(--kikk-yellow)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                          {e.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="text-secondary small">
                        <i className="far fa-calendar-alt text-warning me-1"></i> {e.date}
                      </td>
                      <td className="text-secondary small">
                        <i className="fas fa-building text-warning me-1"></i> {e.organizerName || 'Eventease Official'}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            onClick={() => handleExportExcel(e.id, e.name)}
                            className="btn-kikk-outline btn-sm py-1 px-3"
                            style={{ fontSize: '11px', borderColor: '#22c55e', color: '#22c55e', borderRadius: '8px' }}
                            title="Unduh laporan penjualan acara ini (.xlsx)"
                          >
                            <i className="fas fa-file-excel me-1"></i> Excel
                          </button>
                          <Link
                            to={`/events/${e.id}`}
                            className="btn-kikk btn-sm py-1 px-3"
                            style={{ fontSize: '11px', borderRadius: '8px' }}
                          >
                            <i className="fas fa-eye me-1"></i> Lihat
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
