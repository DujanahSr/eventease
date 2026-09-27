import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { websocketService, CheckInNotification } from '../services/websocketService';
import { mediaService } from '../services/mediaService';
import { EventSummary, Category } from '../types';
import Swal from 'sweetalert2';

export const OrganizerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInNotification[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State Buat Acara Baru (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    date: '',
    location: '',
    description: '',
    imageUrl: '',
    imageProvider: '',
  });

  const [ticketTiers, setTicketTiers] = useState<Array<{ name: string; price: number; capacity: number }>>([
    { name: 'Regular', price: 75000, capacity: 100 },
  ]);

  const fetchOrganizerEvents = async () => {
    setIsLoading(true);
    try {
      const [resEvents, resCats] = await Promise.all([
        eventService.getEvents('', '', 0, 10),
        eventService.getCategories(),
      ]);
      setEvents(resEvents.content || []);
      setCategories(resCats || []);
      if (resCats && resCats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: resCats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load organizer events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerEvents();

    // Inisialisasi koneksi WebSocket STOMP untuk real-time check-in
    websocketService.connect(() => {
      setIsWsConnected(true);
    });

    const unsubscribe = websocketService.subscribeToCheckIn((notification) => {
      setRecentCheckIns((prev) => [notification, ...prev.slice(0, 9)]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Batas maksimal ukuran poster adalah 5 MB.',
      });
      return;
    }

    setIsUploadingPoster(true);
    try {
      Swal.fire({
        title: 'Mengunggah Poster Acara...',
        text: 'Menyimpan berkas ke Cloud Storage (Cloudinary CDN)...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await mediaService.uploadImage(file, 'events');
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.url,
        imageProvider: res.provider,
      }));

      Swal.fire({
        icon: 'success',
        title: 'Poster Berhasil Diunggah!',
        text: `Tersimpan via ${res.provider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah Poster',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah poster acara.',
      });
    } finally {
      setIsUploadingPoster(false);
      if (posterInputRef.current) {
        posterInputRef.current.value = '';
      }
    }
  };

  const handleAddTier = () => {
    setTicketTiers((prev) => [...prev, { name: 'VIP', price: 150000, capacity: 50 }]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      Swal.fire({
        icon: 'info',
        title: 'Minimal 1 Kategori Tiket',
        text: 'Acara harus memiliki minimal 1 tier tiket.',
      });
      return;
    }
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: 'name' | 'price' | 'capacity', value: any) => {
    setTicketTiers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date.trim() || !formData.location.trim() || !formData.description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Harap isi semua kolom formulir acara.',
      });
      return;
    }

    if (!formData.categoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Kategori',
        text: 'Harap tentukan kategori acara.',
      });
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        imageUrl: formData.imageUrl || '/images/kikk_hero_stage.jpg',
        ticketTiers: ticketTiers.map((t) => ({
          name: t.name,
          price: Number(t.price),
          capacity: Number(t.capacity),
        })),
      };

      await eventService.createEvent(payload);

      Swal.fire({
        icon: 'success',
        title: 'Acara Berhasil Diterbitkan!',
        text: `Acara '${formData.name}' kini aktif dan tiket siap dipesan.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        date: '',
        location: '',
        description: '',
        imageUrl: '',
        imageProvider: '',
      });
      setTicketTiers([{ name: 'Regular', price: 75000, capacity: 100 }]);

      await fetchOrganizerEvents();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menerbitkan Acara',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem saat membuat acara.',
      });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengumpulkan data transaksi tiket dengan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Penjualan_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Penjualan_Semua_Acara_${Date.now()}.xlsx`;

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
        text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket.',
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
          {/* Brand Logo & Portal Badge */}
          <div className="mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
            <Link
              to="/"
              className="navbar-brand kikk-title text-lowercase d-flex align-items-center gap-1 mb-2"
              style={{ fontSize: '1.8rem' }}
            >
              eventease<span style={{ color: 'var(--kikk-yellow)', fontSize: '2.2rem', lineHeight: 0 }}>.</span>
            </Link>
            <span className="gold-glow-badge" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              <i className="fas fa-crown text-warning me-1"></i> ORGANIZER CONSOLE
            </span>
          </div>

          {/* Navigation Links */}
          <nav>
            <a href="#overview" className="sidebar-nav-item active">
              <i className="fas fa-chart-pie"></i>
              <span>Ringkasan & Metrik</span>
            </a>
            <a href="#events" className="sidebar-nav-item">
              <i className="fas fa-calendar-alt"></i>
              <span>Daftar Acara ({events.length})</span>
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer"
            >
              <i className="fas fa-plus-circle text-warning"></i>
              <span className="text-warning fw-semibold">Buat Acara Baru</span>
            </button>
            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer"
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} text-success`}></i>
              <span className="text-success fw-semibold">Ekspor Laporan (.xlsx)</span>
            </button>
            <Link to="/scan" className="sidebar-nav-item">
              <i className="fas fa-qrcode"></i>
              <span>Scanner QR Gate</span>
            </Link>
            <Link to="/wallet" className="sidebar-nav-item">
              <i className="fas fa-wallet"></i>
              <span>Dompet & Pendapatan</span>
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
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="rounded-circle"
                style={{ width: '38px', height: '38px', objectFit: 'cover', border: '2px solid var(--kikk-yellow)' }}
              />
            ) : (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #FFD700, #b8860b)', color: '#000', fontSize: '15px' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
            )}
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
            <i className="fas fa-sign-out-alt"></i> Keluar Portal
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
                  <i className="fas fa-shield-alt"></i> Penyelenggara Resmi Terverifikasi
                </span>
              </div>
              <h1 className="kikk-title m-0" style={{ fontSize: '2rem' }}>
                Selamat Datang, {user?.name}
              </h1>
              <p className="text-secondary small m-0 mt-1">
                Kelola penjualan tiket, ekspor laporan analitik, dan pantau aktivitas check-in gerbang konser Anda.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="d-flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-kikk px-3 py-2"
              style={{ fontSize: '13px', borderRadius: '10px' }}
            >
              <i className="fas fa-plus-circle me-1"></i> Buat Acara Baru
            </button>
            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="btn-kikk-outline px-3 py-2"
              style={{ fontSize: '13px', borderRadius: '10px', borderColor: '#22c55e', color: '#22c55e' }}
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} me-1`}></i>
              Ekspor Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* 4-Column High Performance Metrics Bar */}
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
                <div className="text-secondary small fw-medium">Total Acara Aktif</div>
                <div className="fs-3 fw-bold text-white">{events.length} Acara</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-satellite-dish text-success fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Gateway Gate STOMP</div>
                <div className="fs-5 fw-bold text-success">
                  <i className="fas fa-check-circle me-1"></i> {isWsConnected ? 'LIVE AKTIF' : 'TERHUBUNG'}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(234, 179, 8, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-wallet text-warning fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Saldo Dompet Pendapatan</div>
                <div className="fs-5 fw-bold text-warning">{formatRupiah(user?.saldo || 0)}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-shield-halved text-info fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Proteksi Anti-Bot Calo</div>
                <div className="fs-6 fw-bold text-info">Bucket4j Redis Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Gate Check-In Stream Widget */}
        <div className="luxury-glass-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="status-indicator-badge">
                <i className="fas fa-broadcast-tower"></i> LIVE STREAM
              </span>
              <h3 className="kikk-title m-0 fs-5">
                Aktivitas Check-In Gerbang Masuk (WebSocket STOMP)
              </h3>
            </div>
            <small className="text-secondary">
              Notifikasi toast otomatis muncul saat barcode/QR tiket dipindai di gate.
            </small>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-4 text-secondary">
              <i className="fas fa-qrcode fa-2x mb-2 d-block text-warning" style={{ opacity: 0.5 }}></i>
              Belum ada aktivitas check-in di gerbang saat ini. Buka halaman{' '}
              <Link to="/scan" className="text-warning text-decoration-none fw-semibold">
                Scanner QR Gate <i className="fas fa-arrow-right"></i>
              </Link>{' '}
              untuk memindai tiket penonton.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {recentCheckIns.map((ci) => (
                <div
                  key={ci.bookingId + '-' + (ci.timestamp || Math.random())}
                  className="d-flex justify-content-between align-items-center p-3 rounded-3"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle p-2 bg-success text-white d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px' }}
                    >
                      <i className="fas fa-user-check"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-white">
                        {ci.attendeeName} ({ci.attendeeEmail || 'Peserta'})
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        Acara: <span className="text-warning">{ci.eventName}</span> &bull; Tier:{' '}
                        <span className="badge bg-primary">{ci.ticketTier}</span> ({ci.attendeeCount} tiket)
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success mb-1">
                      <i className="fas fa-check-double me-1"></i> CHECKED-IN
                    </span>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                      Total Hadir: {ci.totalCheckedIn}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Managed Events Table Section */}
        <div id="events" className="luxury-glass-card p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <h3 className="kikk-title m-0 fs-4">
                <i className="fas fa-calendar-alt text-warning me-2"></i> Daftar Acara Diselenggarakan
              </h3>
              <p className="text-secondary small m-0 mt-1">
                Katalog acara yang Anda buat beserta opsi pengunduhan berkas rekap penjualan format Microsoft Excel (.xlsx).
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-kikk btn-sm px-3 py-2"
              style={{ borderRadius: '10px', fontSize: '12px' }}
            >
              <i className="fas fa-plus me-1"></i> Buat Acara Baru
            </button>
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
                    <th className="py-3">LOKASI VENUE</th>
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
                        <i className="fas fa-map-marker-alt text-warning me-1"></i> {e.location}
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
                            <i className="fas fa-eye me-1"></i> Detail
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

      {/* Modal Buat Acara Baru (Dark Luxury) */}
      {showCreateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(5, 2, 12, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1060 }}
        >
          <div
            className="luxury-glass-card p-4 p-md-5 w-100 anim-fade-in"
            style={{
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
              <div>
                <span className="gold-glow-badge" style={{ fontSize: '10px' }}>
                  <i className="fas fa-sparkles text-warning me-1"></i> FORMULIR PENYELENGGARA
                </span>
                <h3 className="kikk-title m-0 mt-1" style={{ fontSize: '1.7rem' }}>
                  Buat Acara Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-close btn-close-white shadow-none"
                aria-label="Tutup"
              ></button>
            </div>

            <form onSubmit={handleCreateEventSubmit}>
              {/* Nama Acara */}
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold">
                  <i className="fas fa-heading me-1"></i> NAMA ACARA *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: World Electronic Music Festival 2026"
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '10px', padding: '10px 14px' }}
                />
              </div>

              {/* Kategori & Tanggal */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-warning small fw-bold">
                    <i className="fas fa-tags me-1"></i> KATEGORI ACARA *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="form-select bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-warning small fw-bold">
                    <i className="far fa-calendar-alt me-1"></i> TANGGAL / JADWAL *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Contoh: 15 - 17 Agustus 2026"
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
              </div>

              {/* Lokasi Venue */}
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold">
                  <i className="fas fa-map-marker-alt me-1"></i> LOKASI VENUE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Contoh: Gelora Bung Karno Stadium, Jakarta"
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '10px', padding: '10px 14px' }}
                />
              </div>

              {/* Upload Poster Cloudinary */}
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold">
                  <i className="fas fa-image me-1"></i> POSTER ACARA (CLOUDINARY CDN)
                </label>
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="file"
                    ref={posterInputRef}
                    onChange={handlePosterUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '8px 14px' }}
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 small text-success">
                    <i className="fas fa-check-circle me-1"></i> Poster siap: {formData.imageUrl}
                  </div>
                )}
              </div>

              {/* Deskripsi Acara */}
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold">
                  <i className="fas fa-align-left me-1"></i> DESKRIPSI ACARA *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan daya tarik, penampil utama, dan fasilitas acara..."
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '10px', padding: '10px 14px' }}
                ></textarea>
              </div>

              {/* Tier Kategori Tiket */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-warning small fw-bold m-0">
                    <i className="fas fa-ticket-alt me-1"></i> TIER TIKET & HARGA
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="btn btn-sm btn-outline-warning"
                    style={{ borderRadius: '6px', fontSize: '11px' }}
                  >
                    <i className="fas fa-plus me-1"></i> Tambah Tier
                  </button>
                </div>

                {ticketTiers.map((tier, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                    <input
                      type="text"
                      placeholder="Nama Tier"
                      value={tier.name}
                      onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                      className="form-control bg-dark text-white border-secondary"
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <input
                      type="number"
                      placeholder="Harga (Rp)"
                      value={tier.price}
                      onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                      className="form-control bg-dark text-white border-secondary"
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <input
                      type="number"
                      placeholder="Kuota"
                      value={tier.capacity}
                      onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                      className="form-control bg-dark text-white border-secondary"
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="btn btn-outline-danger btn-sm"
                      style={{ borderRadius: '8px' }}
                      title="Hapus tier"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Tombol Simpan */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-kikk-outline btn-sm px-4 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="btn-kikk btn-sm px-4 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  <i className={`fas ${isSubmittingEvent ? 'fa-spinner fa-spin' : 'fa-check'} me-1`}></i> Terbitkan Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
