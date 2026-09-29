import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { websocketService, CheckInNotification } from '../services/websocketService';
import { mediaService } from '../services/mediaService';
import { EventSummary, Category } from '../types';
import { EventEaseLogo } from '../components/EventEaseLogo';
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
  const [eventSearch, setEventSearch] = useState('');

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
        eventService.getMyEvents(0, 50),
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

  const filteredEvents = events.filter((e) => {
    if (!eventSearch.trim()) return true;
    const q = eventSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      (e.categoryName && e.categoryName.toLowerCase().includes(q))
    );
  });

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
            <Link to="/" className="d-block mb-2 text-decoration-none">
              <EventEaseLogo size="md" />
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

          {/* Subtle Portal Status Pill */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <span className="rounded-circle bg-success" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)' }}></span>
              <span className="text-secondary small fw-medium" style={{ fontSize: '11px' }}>
                Konsol Aktif &bull; {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="kikk-title m-0 fs-4">
                  <i className="fas fa-calendar-alt text-warning me-2"></i> Daftar Acara Diselenggarakan
                </h3>
                <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '11px', borderRadius: '6px' }}>
                  {filteredEvents.length} Acara
                </span>
              </div>
              <p className="text-secondary small m-0">
                Katalog acara resmi yang Anda buat. Kelola tiket, pantau kehadiran, dan unduh berkas rekap penjualan .xlsx.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Filter / Search Input */}
              <div className="position-relative" style={{ minWidth: '220px' }}>
                <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" style={{ fontSize: '12px' }}></i>
                <input
                  type="text"
                  placeholder="Cari acara, lokasi..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="form-control bg-dark text-white border-secondary ps-5 py-2"
                  style={{ borderRadius: '10px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.04)' }}
                />
                {eventSearch && (
                  <button
                    onClick={() => setEventSearch('')}
                    className="btn btn-sm text-secondary position-absolute top-50 end-0 translate-middle-y me-1 p-0 px-2"
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleExportExcel()}
                disabled={isExporting}
                className="btn btn-sm btn-outline-success py-2 px-3 d-inline-flex align-items-center gap-1"
                style={{
                  borderRadius: '10px',
                  fontSize: '12px',
                  borderColor: 'rgba(34, 197, 94, 0.4)',
                  color: '#4ade80',
                  background: 'rgba(34, 197, 94, 0.08)',
                }}
                title="Ekspor rekap seluruh penjualan tiket format .xlsx"
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-warning text-dark fw-bold btn-sm py-2 px-3 d-inline-flex align-items-center gap-1"
                style={{
                  borderRadius: '10px',
                  fontSize: '12px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.25)',
                }}
              >
                <i className="fas fa-plus"></i>
                <span>Buat Acara Baru</span>
              </button>
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
                    <th className="py-3">ACARA RESMI</th>
                    <th className="py-3">JADWAL & VENUE</th>
                    <th className="py-3">HARGA TIKET</th>
                    <th className="py-3 text-end">KONTROL & LAPORAN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <div className="py-4">
                          <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: '60px', height: '60px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.2)' }}
                          >
                            <i className="fas fa-calendar-plus text-warning fs-3"></i>
                          </div>
                          <h6 className="text-white fw-bold mb-1">
                            {eventSearch ? 'Tidak Ada Acara yang Cocok' : 'Belum Ada Acara yang Diselenggarakan'}
                          </h6>
                          <p className="text-secondary small mb-3">
                            {eventSearch
                              ? `Tidak ditemukan acara dengan kata kunci "${eventSearch}".`
                              : 'Anda belum memiliki acara terdaftar. Mulai buat acara resmi pertama Anda sekarang!'}
                          </p>
                          {!eventSearch && (
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="btn btn-warning text-dark fw-bold btn-sm py-2 px-4"
                              style={{ borderRadius: '10px' }}
                            >
                              <i className="fas fa-plus me-1"></i> Buat Acara Pertama
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((e) => (
                      <tr key={e.id} style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={e.imageUrl || '/images/kikk_hero_stage.jpg'}
                              alt={e.name}
                              className="rounded-3 shadow-sm"
                              style={{
                                width: '56px',
                                height: '56px',
                                objectFit: 'cover',
                                border: '1px solid rgba(255, 215, 0, 0.25)',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div className="text-white fw-bold fs-6 mb-1">{e.name}</div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="badge" style={{ background: 'rgba(255, 215, 0, 0.12)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)', fontSize: '10px' }}>
                                  {e.categoryName || 'Umum'}
                                </span>
                                <span className="text-secondary small font-monospace" style={{ fontSize: '10px' }}>
                                  ID: {e.id.substring(0, 8)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex flex-column">
                            <span className="text-white small fw-semibold">
                              <i className="far fa-calendar-alt text-warning me-1"></i> {e.date}
                            </span>
                            <span className="text-secondary small mt-1 text-truncate" style={{ maxWidth: '240px' }}>
                              <i className="fas fa-map-marker-alt text-info me-1"></i> {e.location}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-white small fw-bold">
                            {e.startingPrice > 0 ? formatRupiah(e.startingPrice) : 'Gratis'}
                          </div>
                          <span className="text-secondary" style={{ fontSize: '11px' }}>
                            Mulai dari
                          </span>
                        </td>
                        <td className="py-3 text-end">
                          <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                            <Link
                              to={`/events/${e.id}`}
                              className="btn btn-sm btn-outline-light py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                              title="Lihat halaman publik acara"
                            >
                              <i className="fas fa-arrow-up-right-from-square me-1"></i> Publik
                            </Link>
                            <Link
                              to="/scan"
                              className="btn btn-sm btn-outline-warning py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '8px' }}
                              title="Buka QR Scanner untuk validasi tiket penonton"
                            >
                              <i className="fas fa-qrcode me-1"></i> Gate Scan
                            </Link>
                            <button
                              onClick={() => handleExportExcel(e.id, e.name)}
                              className="btn btn-sm btn-outline-success py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '8px', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' }}
                              title="Unduh laporan penjualan Excel (.xlsx)"
                            >
                              <i className="fas fa-file-excel me-1"></i> Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Buat Acara Baru (Modern Creative Luxury) */}
      {showCreateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(5, 2, 12, 0.88)', backdropFilter: 'blur(16px)', zIndex: 1060 }}
        >
          <div
            className="luxury-glass-card p-4 p-md-5 w-100 anim-fade-in"
            style={{
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header Modal */}
            <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
              <div>
                <span className="gold-glow-badge mb-2 d-inline-block" style={{ fontSize: '10px' }}>
                  <i className="fas fa-sparkles text-warning me-1"></i> KONSOL PENYELENGGARA
                </span>
                <h3 className="kikk-title m-0 text-white fs-4">
                  Buat Acara Baru
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Lengkapi data resmi acara, unggah poster beresolusi tinggi, dan tentukan kategori tiket penonton.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', border: '1px solid rgba(255,255,255,0.15)' }}
                aria-label="Tutup"
              >
                <i className="fas fa-times text-white"></i>
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit}>
              {/* Bagian 1: Informasi Pokok Acara */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                    1
                  </span>
                  <h6 className="text-white fw-bold m-0" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                    INFORMASI POKOK ACARA
                  </h6>
                </div>

                {/* Nama Acara */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium">
                    Nama Acara <span className="text-warning">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: World Electronic Music Festival 2026"
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)' }}
                  />
                </div>

                {/* Kategori & Tanggal */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-medium">
                      Kategori Acara <span className="text-warning">*</span>
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="form-select bg-dark text-white border-secondary"
                      style={{ borderRadius: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)' }}
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
                    <label className="form-label text-secondary small fw-medium">
                      Jadwal / Tanggal Pelaksanaan <span className="text-warning">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="Contoh: 15 - 17 Agustus 2026, 18:00 WIB"
                      className="form-control bg-dark text-white border-secondary"
                      style={{ borderRadius: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)' }}
                    />
                  </div>
                </div>

                {/* Lokasi Venue */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium">
                    Lokasi Venue / Tempat Acara <span className="text-warning">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Gelora Bung Karno Stadium, Jakarta Pusat"
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)' }}
                  />
                </div>
              </div>

              {/* Bagian 2: Media Poster & Narasi Acara */}
              <div className="mb-4 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                    2
                  </span>
                  <h6 className="text-white fw-bold m-0" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                    MEDIA POSTER &amp; NARASI ACARA
                  </h6>
                </div>

                {/* Dropzone Upload Poster */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium d-flex justify-content-between">
                    <span>Poster Acara Resmi</span>
                    <span className="text-secondary small" style={{ fontSize: '11px' }}>Cloudinary CDN Storage</span>
                  </label>

                  {!formData.imageUrl ? (
                    <div
                      onClick={() => posterInputRef.current?.click()}
                      className="p-4 text-center rounded-3 cursor-pointer"
                      style={{
                        border: '2px dashed rgba(255, 215, 0, 0.35)',
                        background: 'rgba(255, 215, 0, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="file"
                        ref={posterInputRef}
                        onChange={handlePosterUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="d-none"
                      />
                      <div className="mb-2">
                        <div
                          className="rounded-circle d-inline-flex align-items-center justify-content-center"
                          style={{ width: '52px', height: '52px', background: 'rgba(255, 215, 0, 0.1)' }}
                        >
                          <i className={`fas ${isUploadingPoster ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-warning fs-4`}></i>
                        </div>
                      </div>
                      <div className="fw-semibold text-white">Klik untuk Mengunggah Poster Acara</div>
                      <div className="text-secondary small mt-1">
                        Format yang didukung: JPG, PNG, atau WebP (Maksimal 5 MB)
                      </div>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-between p-3 rounded-3"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={formData.imageUrl}
                          alt="Preview Poster"
                          className="rounded-3 shadow-sm"
                          style={{ width: '64px', height: '64px', objectFit: 'cover', border: '1px solid rgba(255, 215, 0, 0.4)' }}
                        />
                        <div>
                          <span className="badge bg-success mb-1" style={{ fontSize: '10px' }}>
                            <i className="fas fa-check-circle me-1"></i> Poster Cloudinary Siap
                          </span>
                          <div className="text-white small fw-medium text-truncate" style={{ maxWidth: '300px' }}>
                            {formData.imageUrl.split('/').pop()}
                          </div>
                          <span className="text-secondary small" style={{ fontSize: '11px' }}>
                            {formData.imageProvider === 'CLOUDINARY' ? 'Tersimpan di Cloud Storage Cloudinary' : 'Tersimpan di Penyimpanan Server'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        className="btn btn-sm btn-outline-warning py-1 px-3"
                        style={{ fontSize: '11px', borderRadius: '8px' }}
                      >
                        <i className="fas fa-rotate me-1"></i> Ganti Poster
                      </button>
                      <input
                        type="file"
                        ref={posterInputRef}
                        onChange={handlePosterUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="d-none"
                      />
                    </div>
                  )}
                </div>

                {/* Deskripsi Acara */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium">
                    Deskripsi &amp; Daya Tarik Acara <span className="text-warning">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan daya tarik, penampil utama (line-up), fasilitas, dan aturan masuk acara..."
                    className="form-control bg-dark text-white border-secondary"
                    style={{ borderRadius: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)' }}
                  ></textarea>
                </div>
              </div>

              {/* Bagian 3: Tingkatan Tiket & Kuota Penonton */}
              <div className="mb-4 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning text-dark fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                      3
                    </span>
                    <h6 className="text-white fw-bold m-0" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                      TINGKATAN TIKET &amp; KUOTA PENONTON
                    </h6>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="btn btn-sm btn-outline-warning py-1 px-3"
                    style={{ borderRadius: '8px', fontSize: '11px' }}
                  >
                    <i className="fas fa-plus me-1"></i> Tambah Kategori Tiket
                  </button>
                </div>

                <div className="d-flex flex-column gap-2">
                  {ticketTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-3"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-4">
                          <label className="form-label text-secondary small mb-1" style={{ fontSize: '11px' }}>
                            Nama Kategori Tiket
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Misal: Regular, VIP, VVIP"
                            value={tier.name}
                            onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label text-secondary small m-0" style={{ fontSize: '11px' }}>
                              Harga Satuan (Rp)
                            </label>
                            <span className="text-warning small" style={{ fontSize: '10px' }}>
                              {formatRupiah(tier.price)}
                            </span>
                          </div>
                          <input
                            type="number"
                            required
                            min={0}
                            placeholder="Harga satuan"
                            value={tier.price}
                            onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <div className="col-10 col-md-3">
                          <label className="form-label text-secondary small mb-1" style={{ fontSize: '11px' }}>
                            Kuota Tiket
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Jumlah kuota"
                            value={tier.capacity}
                            onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: '8px', fontSize: '12px' }}
                          />
                        </div>
                        <div className="col-2 col-md-1 text-end pt-md-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="btn btn-outline-danger btn-sm w-100"
                            style={{ borderRadius: '8px' }}
                            title="Hapus kategori tiket ini"
                            disabled={ticketTiers.length <= 1}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Simpan Footer */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline-secondary px-4 py-2"
                  style={{ borderRadius: '10px', fontSize: '13px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="btn btn-warning text-dark fw-bold px-4 py-2 d-inline-flex align-items-center gap-2"
                  style={{
                    borderRadius: '10px',
                    fontSize: '13px',
                    background: 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <i className={`fas ${isSubmittingEvent ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  <span>{isSubmittingEvent ? 'Menerbitkan Acara...' : 'Terbitkan Acara'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
