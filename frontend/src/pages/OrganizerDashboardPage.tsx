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
      Swal.fire({ icon: 'warning', title: 'Ukuran Terlalu Besar', text: 'Batas maksimal ukuran poster adalah 5 MB.' });
      return;
    }

    setIsUploadingPoster(true);
    try {
      Swal.fire({
        title: 'Mengunggah Poster Acara...',
        text: 'Menyimpan berkas ke Cloud Storage (Cloudinary CDN)...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); },
      });

      const res = await mediaService.uploadImage(file, 'events');
      setFormData((prev) => ({ ...prev, imageUrl: res.url, imageProvider: res.provider }));

      Swal.fire({
        icon: 'success',
        title: 'Poster Berhasil Diunggah!',
        text: `Tersimpan via ${res.provider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Gagal Mengunggah Poster', text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah poster acara.' });
    } finally {
      setIsUploadingPoster(false);
      if (posterInputRef.current) posterInputRef.current.value = '';
    }
  };

  const handleAddTier = () => setTicketTiers((prev) => [...prev, { name: 'VIP', price: 150000, capacity: 50 }]);

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      Swal.fire({ icon: 'info', title: 'Minimal 1 Kategori Tiket', text: 'Acara harus memiliki minimal 1 tier tiket.' });
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
      Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap isi semua kolom formulir acara.' });
      return;
    }
    if (!formData.categoryId) {
      Swal.fire({ icon: 'warning', title: 'Pilih Kategori', text: 'Harap tentukan kategori acara.' });
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
        ticketTiers: ticketTiers.map((t) => ({ name: t.name, price: Number(t.price), capacity: Number(t.capacity) })),
      };

      await eventService.createEvent(payload);

      Swal.fire({ icon: 'success', title: 'Acara Berhasil Diterbitkan!', text: `Acara '${formData.name}' kini aktif dan tiket siap dipesan.`, timer: 2000, showConfirmButton: false });

      setShowCreateModal(false);
      setFormData({ name: '', categoryId: categories[0]?.id || '', date: '', location: '', description: '', imageUrl: '', imageProvider: '' });
      setTicketTiers([{ name: 'Regular', price: 75000, capacity: 100 }]);
      await fetchOrganizerEvents();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Gagal Menerbitkan Acara', text: err.response?.data?.message || 'Terjadi kesalahan sistem saat membuat acara.' });
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengumpulkan data transaksi tiket dengan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Penjualan_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Penjualan_Semua_Acara_${Date.now()}.xlsx`;

      triggerFileDownload(blob, filename);

      Swal.fire({ icon: 'success', title: 'Ekspor Berhasil!', text: `File ${filename} berhasil diunduh.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error('Gagal mengekspor laporan Excel:', err);
      Swal.fire({ icon: 'error', title: 'Gagal Ekspor Excel', text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket.' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Avatar initials helper ──────────────────────────────────────────────────
  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase() : 'OR';

  return (
    <div className="dashboard-layout" style={{ background: '#080512' }}>

      {/* Full-page background image — fixed, very dark */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: 'url(/images/organizer_dashboard_bg.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.35, pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, rgba(8,5,18,0.92) 0%, rgba(12,6,28,0.88) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'show' : ''}`} style={{ zIndex: 1050 }}>
        {/* Brand */}
        <div>
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
            <Link to="/" className="d-block mb-2 text-decoration-none">
              <EventEaseLogo size="md" />
            </Link>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '20px', fontSize: '10px',
                fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                background: 'linear-gradient(90deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))',
                border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700',
              }}
            >
              <i className="fas fa-crown" style={{ fontSize: '9px' }}></i> Organizer Console
            </span>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <a href="#overview" className="sidebar-nav-item active">
              <i className="fas fa-chart-pie"></i>
              <span>Ringkasan</span>
            </a>
            <a href="#events" className="sidebar-nav-item">
              <i className="fas fa-calendar-alt"></i>
              <span>Daftar Acara</span>
              {events.length > 0 && (
                <span
                  style={{
                    marginLeft: 'auto', background: 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700',
                    borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 700,
                  }}
                >
                  {events.length}
                </span>
              )}
            </a>
            <a href="#checkin" className="sidebar-nav-item">
              <i className="fas fa-broadcast-tower"></i>
              <span>Gate Live</span>
              {isWsConnected && (
                <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '2px', background: '#4ade80', flexShrink: 0 }}></span>
              )}
            </a>

            {/* Divider */}
            <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}></div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0"
              style={{ cursor: 'pointer' }}
            >
              <i className="fas fa-plus-circle" style={{ color: '#FFD700' }}></i>
              <span style={{ color: '#FFD700', fontWeight: 600 }}>Buat Acara Baru</span>
            </button>
            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0"
              style={{ cursor: 'pointer' }}
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`} style={{ color: '#4ade80' }}></i>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>Ekspor Laporan</span>
            </button>
            <Link to="/scan" className="sidebar-nav-item">
              <i className="fas fa-qrcode"></i>
              <span>Scanner QR Gate</span>
            </Link>
            <Link to="/wallet" className="sidebar-nav-item">
              <i className="fas fa-wallet"></i>
              <span>Dompet &amp; Pendapatan</span>
            </Link>
            <Link to="/events" className="sidebar-nav-item">
              <i className="fas fa-globe"></i>
              <span>Katalog Publik</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Profile Footer */}
        <div style={{ borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: '16px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '12px',
            }}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture} alt={user.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFD700', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #FFD700, #b8860b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000', fontWeight: 800, fontSize: '14px',
                }}
              >
                {initials}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: '12px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar Portal
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="dashboard-main-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO HEADER BAR ── */}
        <div
          className="anim-fade-in"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            marginBottom: '32px', flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="d-lg-none"
              style={{
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
                color: '#FFD700', borderRadius: '10px', padding: '7px 11px', cursor: 'pointer',
              }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="status-indicator-badge">
                  <i className="fas fa-shield-alt"></i> Penyelenggara Terverifikasi
                </span>
              </div>
              <h1
                className="kikk-title m-0"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', letterSpacing: '-0.5px' }}
              >
                Halo, {user?.name?.split(' ')[0]}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '4px 0 0' }}>
                Kelola acara, pantau check-in real-time, dan analisis penjualan tiket Anda.
              </p>
            </div>
          </div>

          {/* Right — live pill + new event CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '50px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ width: '3px', height: '16px', borderRadius: '2px', background: 'linear-gradient(to bottom, #4ade80, #22c55e)', flexShrink: 0 }}></span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 500 }}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 22px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #FFD700 0%, #d4a800 100%)',
                color: '#0b0616', fontWeight: 700, fontSize: '13px',
                boxShadow: '0 6px 20px rgba(255,215,0,0.28)',
                transition: 'all 0.25s',
              }}
            >
              <i className="fas fa-plus"></i> Buat Acara
            </button>
          </div>
        </div>

        {/* ── BENTO METRICS GRID ── */}
        <div
          id="overview"
          className="anim-fade-in anim-delay-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {/* Metric 1 — Total Acara */}
          <div
            style={{
              background: 'rgba(255,215,0,0.05)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '20px', padding: '22px 24px',
              backdropFilter: 'blur(20px)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,215,0,0.06)', pointerEvents: 'none' }}></div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Total Acara</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFD700', lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
              {isLoading ? '—' : events.length}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '6px' }}>
              <i className="fas fa-calendar-check me-1"></i> Diselenggarakan
            </div>
          </div>

          {/* Metric 2 — Saldo */}
          <div
            style={{
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '20px', padding: '22px 24px',
              backdropFilter: 'blur(20px)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(34,197,94,0.06)', pointerEvents: 'none' }}></div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Saldo Dompet</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#4ade80', lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
              {formatRupiah(user?.saldo || 0)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '6px' }}>
              <i className="fas fa-wallet me-1"></i>
              <Link to="/wallet" style={{ color: 'rgba(74,222,128,0.7)', textDecoration: 'none', fontSize: '11px' }}>Lihat Dompet</Link>
            </div>
          </div>

          {/* Metric 3 — Gate Live */}
          <div
            style={{
              background: isWsConnected ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isWsConnected ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '20px', padding: '22px 24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Gateway Gate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: isWsConnected ? '#22c55e' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}></span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isWsConnected ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {isWsConnected ? 'LIVE AKTIF' : 'Menghubungkan...'}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '6px' }}>
              <i className="fas fa-satellite-dish me-1"></i> WebSocket STOMP
            </div>
          </div>

          {/* Metric 4 — Proteksi */}
          <div
            style={{
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '20px', padding: '22px 24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Proteksi Bot</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', lineHeight: 1 }}>
              <i className="fas fa-shield-halved me-2"></i>Aktif
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '6px' }}>Bucket4j + Redis Rate Limit</div>
          </div>
        </div>

        {/* ── LIVE GATE CHECK-IN ── */}
        <div
          id="checkin"
          className="luxury-glass-card anim-fade-in anim-delay-2"
          style={{ padding: '24px 28px', marginBottom: '24px' }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="fas fa-broadcast-tower" style={{ color: '#4ade80', fontSize: '15px' }}></i>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>Aktivitas Check-In Gerbang</span>
                  <span className="status-indicator-badge" style={{ fontSize: '10px' }}>
                    <i className="fas fa-circle" style={{ fontSize: '6px' }}></i> LIVE
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>
                  Notifikasi real-time saat QR tiket dipindai di gate
                </div>
              </div>
            </div>
            <Link
              to="/scan"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '10px', textDecoration: 'none',
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
                color: '#FFD700', fontSize: '12px', fontWeight: 600,
              }}
            >
              <i className="fas fa-qrcode"></i> Buka Scanner
            </Link>
          </div>

          {recentCheckIns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: 'rgba(255,255,255,0.3)' }}>
              <i className="fas fa-qrcode" style={{ fontSize: '28px', color: 'rgba(255,215,0,0.25)', display: 'block', marginBottom: '10px' }}></i>
              <div style={{ fontSize: '13px' }}>Belum ada aktivitas check-in. Pindai tiket penonton melalui <Link to="/scan" style={{ color: '#FFD700', textDecoration: 'none' }}>Scanner QR Gate</Link>.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentCheckIns.map((ci) => (
                <div
                  key={ci.bookingId + '-' + (ci.timestamp || Math.random())}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '14px',
                    background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)',
                    gap: '12px', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fas fa-user-check" style={{ color: '#4ade80', fontSize: '13px' }}></i>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{ci.attendeeName}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {ci.eventName} &bull; <span style={{ color: '#60a5fa' }}>{ci.ticketTier}</span> &bull; {ci.attendeeCount} tiket
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>
                      <i className="fas fa-check-double me-1"></i>CHECKED-IN
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Total: {ci.totalCheckedIn}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── EVENTS TABLE ── */}
        <div
          id="events"
          className="luxury-glass-card anim-fade-in anim-delay-3"
          style={{ padding: '24px 28px' }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 className="kikk-title m-0" style={{ fontSize: '1.2rem' }}>
                  Daftar Acara Diselenggarakan
                </h3>
                <span
                  style={{
                    background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)',
                    color: '#FFD700', borderRadius: '8px', padding: '2px 10px',
                    fontSize: '11px', fontWeight: 700,
                  }}
                >
                  {filteredEvents.length}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                Kelola tiket, pantau kehadiran, unduh rekap penjualan .xlsx
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <i
                  className="fas fa-search"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '12px', pointerEvents: 'none' }}
                ></i>
                <input
                  type="text"
                  placeholder="Cari acara atau lokasi..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: '34px', paddingRight: eventSearch ? '30px' : '12px',
                    padding: '9px 12px 9px 34px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: '#fff', fontSize: '12px', outline: 'none',
                  }}
                />
                {eventSearch && (
                  <button
                    onClick={() => setEventSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                  >
                    <i className="fas fa-times" style={{ fontSize: '11px' }}></i>
                  </button>
                )}
              </div>

              {/* Export All */}
              <button
                onClick={() => handleExportExcel()}
                disabled={isExporting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.3)',
                  background: 'rgba(34,197,94,0.06)', color: '#4ade80', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                <span>Export .xlsx</span>
              </button>

              {/* Create Event */}
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #FFD700 0%, #d4a800 100%)',
                  color: '#0b0616', fontWeight: 700, fontSize: '12px',
                  boxShadow: '0 4px 14px rgba(255,215,0,0.22)',
                }}
              >
                <i className="fas fa-plus"></i> Buat Acara
              </button>
            </div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)' }}>
              <div className="spinner-border" style={{ color: '#FFD700', width: '28px', height: '28px' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div
                style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <i className="fas fa-calendar-plus" style={{ color: '#FFD700', fontSize: '24px' }}></i>
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                {eventSearch ? 'Tidak Ada Acara yang Cocok' : 'Belum Ada Acara'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
                {eventSearch ? `Tidak ditemukan hasil untuk "${eventSearch}".` : 'Mulai buat acara resmi pertama Anda sekarang.'}
              </div>
              {!eventSearch && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '10px 24px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FFD700, #d4a800)', color: '#0b0616', fontWeight: 700, fontSize: '13px',
                  }}
                >
                  <i className="fas fa-plus me-2"></i> Buat Acara Pertama
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,215,0,0.15)' }}>
                    {['ACARA RESMI', 'JADWAL & VENUE', 'HARGA TIKET', 'AKSI'].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '10px 14px', textAlign: i === 3 ? 'right' : 'left',
                          color: 'rgba(255,215,0,0.7)', fontSize: '10px', fontWeight: 700,
                          letterSpacing: '1.2px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e, idx) => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                    >
                      {/* Event name + poster */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={e.imageUrl || '/images/kikk_hero_stage.jpg'}
                            alt={e.name}
                            style={{
                              width: '52px', height: '52px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0,
                              border: '1px solid rgba(255,215,0,0.2)',
                            }}
                          />
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '4px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.name}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
                                  color: '#FFD700', borderRadius: '6px', padding: '1px 8px', fontSize: '10px', fontWeight: 600,
                                }}
                              >
                                {e.categoryName || 'Umum'}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'monospace' }}>
                                #{e.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date & venue */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                            <i className="far fa-calendar-alt" style={{ color: '#FFD700', marginRight: '6px', fontSize: '11px' }}></i>
                            {e.date}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <i className="fas fa-map-marker-alt" style={{ color: '#60a5fa', marginRight: '6px', fontSize: '10px' }}></i>
                            {e.location}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                          {e.startingPrice > 0 ? formatRupiah(e.startingPrice) : 'Gratis'}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '2px' }}>Mulai dari</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <Link
                            to={`/events/${e.id}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '9px',
                              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500, textDecoration: 'none',
                            }}
                            title="Halaman publik acara"
                          >
                            <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i> Publik
                          </Link>
                          <Link
                            to="/scan"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '9px',
                              border: '1px solid rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.06)',
                              color: '#FFD700', fontSize: '11px', fontWeight: 500, textDecoration: 'none',
                            }}
                            title="QR Scanner gate"
                          >
                            <i className="fas fa-qrcode" style={{ fontSize: '10px' }}></i> Gate
                          </Link>
                          <button
                            onClick={() => handleExportExcel(e.id, e.name)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '9px',
                              border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(34,197,94,0.05)',
                              color: '#4ade80', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                            }}
                            title="Ekspor Excel acara ini"
                          >
                            <i className="fas fa-file-excel" style={{ fontSize: '10px' }}></i> Excel
                          </button>
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

      {/* ── MODAL: BUAT ACARA BARU ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1060,
            background: 'rgba(5,2,14,0.85)', backdropFilter: 'blur(18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div
            className="anim-fade-in"
            style={{
              width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto',
              background: 'rgba(12,7,26,0.97)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '24px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255,215,0,0.06)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 32px 20px',
                borderBottom: '1px solid rgba(255,215,0,0.12)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      padding: '3px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                      background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700',
                      textTransform: 'uppercase',
                    }}
                  >
                    <i className="fas fa-crown me-1" style={{ fontSize: '9px' }}></i> Konsol Penyelenggara
                  </span>
                </div>
                <h3 style={{ margin: 0, color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700 }}>
                  Terbitkan Acara Baru
                </h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Lengkapi data resmi, unggah poster, dan tentukan kategori tiket penonton.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <i className="fas fa-times" style={{ fontSize: '13px' }}></i>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEventSubmit} style={{ padding: '28px 32px' }}>
              {/* Section 1: Info Pokok */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span
                    style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #FFD700, #d4a800)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', fontWeight: 800, fontSize: '11px', flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Informasi Pokok Acara
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Nama Acara <span style={{ color: '#FFD700' }}>*</span>
                    </label>
                    <input
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: World Electronic Music Festival 2026"
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '13px', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                        Kategori <span style={{ color: '#FFD700' }}>*</span>
                      </label>
                      <select
                        required value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', fontSize: '13px', outline: 'none',
                        }}
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} style={{ background: '#0b0616' }}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                        Jadwal Pelaksanaan <span style={{ color: '#FFD700' }}>*</span>
                      </label>
                      <input
                        type="text" required value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        placeholder="Contoh: 15 Agustus 2026, 18:00 WIB"
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', fontSize: '13px', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                      Lokasi / Venue <span style={{ color: '#FFD700' }}>*</span>
                    </label>
                    <input
                      type="text" required value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Contoh: Gelora Bung Karno Stadium, Jakarta Pusat"
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Media Poster & Deskripsi */}
              <div style={{ marginBottom: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span
                    style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #FFD700, #d4a800)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', fontWeight: 800, fontSize: '11px', flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Media Poster &amp; Narasi
                  </span>
                </div>

                {/* Poster Uploader */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                    <span>Poster Acara</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Cloudinary CDN · Maks 5MB</span>
                  </label>

                  {!formData.imageUrl ? (
                    <div
                      onClick={() => posterInputRef.current?.click()}
                      style={{
                        border: '2px dashed rgba(255,215,0,0.25)', borderRadius: '16px',
                        padding: '28px', textAlign: 'center', cursor: 'pointer',
                        background: 'rgba(255,215,0,0.02)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,215,0,0.5)'; (ev.currentTarget as HTMLDivElement).style.background = 'rgba(255,215,0,0.04)'; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,215,0,0.25)'; (ev.currentTarget as HTMLDivElement).style.background = 'rgba(255,215,0,0.02)'; }}
                    >
                      <input type="file" ref={posterInputRef} onChange={handlePosterUpload} accept="image/jpeg,image/png,image/webp" className="d-none" />
                      <div
                        style={{
                          width: '52px', height: '52px', borderRadius: '16px', margin: '0 auto 12px',
                          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <i className={`fas ${isUploadingPoster ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`} style={{ color: '#FFD700', fontSize: '20px' }}></i>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Klik untuk Mengunggah Poster</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>JPG, PNG, WebP · Maks 5 MB</div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '14px',
                        background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={formData.imageUrl} alt="Preview"
                          style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)', flexShrink: 0 }}
                        />
                        <div>
                          <span style={{ display: 'inline-block', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '6px', padding: '2px 10px', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                            <i className="fas fa-check-circle me-1"></i> Poster Siap
                          </span>
                          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 500, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formData.imageUrl.split('/').pop()}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                            {formData.imageProvider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        style={{
                          padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)',
                          background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <i className="fas fa-rotate me-1"></i> Ganti
                      </button>
                      <input type="file" ref={posterInputRef} onChange={handlePosterUpload} accept="image/jpeg,image/png,image/webp" className="d-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                    Deskripsi &amp; Daya Tarik Acara <span style={{ color: '#FFD700' }}>*</span>
                  </label>
                  <textarea
                    required rows={3} value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan penampil, line-up, fasilitas, dan aturan masuk acara..."
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Section 3: Tier Tiket */}
              <div style={{ marginBottom: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '24px', height: '24px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FFD700, #d4a800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontWeight: 800, fontSize: '11px', flexShrink: 0,
                      }}
                    >
                      3
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Tingkatan Tiket &amp; Kuota
                    </span>
                  </div>
                  <button
                    type="button" onClick={handleAddTier}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.3)',
                      background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <i className="fas fa-plus"></i> Tambah Tier
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ticketTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 16px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                          <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, marginBottom: '5px', letterSpacing: '0.5px' }}>
                            NAMA KATEGORI
                          </label>
                          <input
                            type="text" required placeholder="Regular / VIP / VVIP"
                            value={tier.name}
                            onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                            style={{
                              width: '100%', padding: '9px 12px', borderRadius: '10px',
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff', fontSize: '12px', outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, marginBottom: '5px' }}>
                            <span>HARGA (RP)</span>
                            <span style={{ color: '#FFD700', fontWeight: 700 }}>{formatRupiah(tier.price)}</span>
                          </label>
                          <input
                            type="number" required min={0} placeholder="Harga satuan"
                            value={tier.price}
                            onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                            style={{
                              width: '100%', padding: '9px 12px', borderRadius: '10px',
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff', fontSize: '12px', outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, marginBottom: '5px' }}>
                            KUOTA TIKET
                          </label>
                          <input
                            type="number" required min={1} placeholder="Jumlah kuota"
                            value={tier.capacity}
                            onChange={(e) => handleTierChange(idx, 'capacity', e.target.value)}
                            style={{
                              width: '100%', padding: '9px 12px', borderRadius: '10px',
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff', fontSize: '12px', outline: 'none',
                            }}
                          />
                        </div>
                        <button
                          type="button" onClick={() => handleRemoveTier(idx)}
                          disabled={ticketTiers.length <= 1}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)',
                            color: ticketTiers.length <= 1 ? 'rgba(239,68,68,0.2)' : '#ef4444',
                            cursor: ticketTiers.length <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                          title="Hapus tier ini"
                        >
                          <i className="fas fa-trash" style={{ fontSize: '11px' }}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex', justifyContent: 'flex-end', gap: '10px',
                  paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '11px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmittingEvent}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '11px 28px', borderRadius: '12px', border: 'none', cursor: isSubmittingEvent ? 'not-allowed' : 'pointer',
                    background: isSubmittingEvent ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg, #FFD700 0%, #d4a800 100%)',
                    color: '#0b0616', fontWeight: 700, fontSize: '13px',
                    boxShadow: isSubmittingEvent ? 'none' : '0 6px 20px rgba(255,215,0,0.28)',
                  }}
                >
                  <i className={`fas ${isSubmittingEvent ? 'fa-spinner fa-spin' : 'fa-rocket'}`}></i>
                  {isSubmittingEvent ? 'Menerbitkan...' : 'Terbitkan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
