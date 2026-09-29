import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload, BookingResponseData } from '../services/bookingService';
import { adminService } from '../services/adminService';
import { partnerApplicationService, PartnerApplication } from '../services/partnerApplicationService';
import { EventSummary, Category, User } from '../types';
import { EventEaseLogo } from '../components/EventEaseLogo';
import Swal from 'sweetalert2';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'partners' | 'categories' | 'events' | 'bookings'>('overview');

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [bookings, setBookings] = useState<BookingResponseData[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');

  // KYC Partner Applications State
  const [partnerApplications, setPartnerApplications] = useState<PartnerApplication[]>([]);
  const [pendingPartnerCount, setPendingPartnerCount] = useState(0);
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const filteredPartners = useMemo(() => {
    if (partnerStatusFilter === 'ALL') return partnerApplications;
    return partnerApplications.filter((p) => p.status === partnerStatusFilter);
  }, [partnerApplications, partnerStatusFilter]);

  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === 'ALL') return bookings;
    return bookings.filter((b) => b.status === bookingStatusFilter);
  }, [bookings, bookingStatusFilter]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal Tambah Kategori
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [eventData, catData, userData, bookingData, partnerData, pendingCount] = await Promise.all([
        eventService.getEvents('', '', 0, 30),
        eventService.getCategories(),
        adminService.getAllUsers(0, 20),
        bookingService.getAllBookings().catch(() => [] as BookingResponseData[]),
        partnerApplicationService.getAllApplications('ALL', 0, 50).catch(() => ({ content: [] as PartnerApplication[] })),
        partnerApplicationService.countPending().catch(() => 0),
      ]);
      setEvents(eventData.content || []);
      setCategories(catData || []);
      setUsers(userData.content || []);
      setTotalUsers(userData.totalElements || (userData.content ? userData.content.length : 0));
      setBookings(bookingData || []);
      setPartnerApplications(partnerData.content || []);
      setPendingPartnerCount(pendingCount);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePartner = async (app: PartnerApplication) => {
    const confirm = await Swal.fire({
      title: 'Setujui Kemitraan?',
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.6">
          <p>Anda akan menyetujui pengajuan kemitraan dari:</p>
          <div style="padding:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;margin-bottom:10px">
            <div><strong>Organisasi:</strong> ${app.organizationName}</div>
            <div><strong>Pemohon:</strong> ${app.userName} (${app.userEmail})</div>
            <div><strong>No. Rekening:</strong> ${app.bankName} - ${app.bankAccountNumber}</div>
          </div>
          <p class="mb-0 text-warning">Peran pengguna akan otomatis diubah menjadi <strong>ORGANIZER</strong>.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check-circle me-1"></i> Ya, Setujui Kemitraan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#22c55e',
      background: '#120a20',
      color: '#fff',
    });

    if (confirm.isConfirmed) {
      try {
        await partnerApplicationService.review(app.id, 'APPROVED');
        Swal.fire({
          icon: 'success',
          title: 'Kemitraan Disetujui!',
          text: `Akun ${app.userName} (${app.organizationName}) resmi menjadi Organizer.`,
          timer: 1800,
          showConfirmButton: false,
          background: '#120a20',
          color: '#fff',
        });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyetujui',
          text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
          background: '#120a20',
          color: '#fff',
        });
      }
    }
  };

  const handleRejectPartner = async (app: PartnerApplication) => {
    const { value: notes } = await Swal.fire({
      title: 'Tolak Pengajuan Kemitraan',
      input: 'textarea',
      inputLabel: 'Catatan / Alasan Penolakan untuk Pemohon',
      inputPlaceholder: 'Contoh: Foto identitas tidak jelas, mohon unggah ulang foto KTP yang dapat terbaca...',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-times me-1"></i> Tolak Pengajuan',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal',
      background: '#120a20',
      color: '#fff',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Alasan penolakan wajib dicantumkan agar pemohon dapat memperbaiki!';
        }
      },
    });

    if (notes) {
      try {
        await partnerApplicationService.review(app.id, 'REJECTED', notes.trim());
        Swal.fire({
          icon: 'info',
          title: 'Pengajuan Ditolak',
          text: 'Status pengajuan telah diubah menjadi REJECTED.',
          timer: 1800,
          showConfirmButton: false,
          background: '#120a20',
          color: '#fff',
        });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menolak',
          text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
          background: '#120a20',
          color: '#fff',
        });
      }
    }
  };

  const handlePreviewKtp = (imageUrl: string, orgName: string) => {
    Swal.fire({
      title: `Foto KTP: ${orgName}`,
      imageUrl: imageUrl,
      imageAlt: `KTP ${orgName}`,
      imageWidth: 500,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#FFD700',
      background: '#120a20',
      color: '#fff',
    });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateRole = async (targetUser: User, newRole: string) => {
    const confirm = await Swal.fire({
      title: 'Ubah Role Pengguna?',
      text: `Ubah peran akun ${targetUser.name} (${targetUser.email}) menjadi ${newRole}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah Role',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await adminService.updateUserRole(targetUser.id, newRole);
        Swal.fire({
          icon: 'success',
          title: 'Role Berhasil Diperbarui',
          text: `Peran ${targetUser.name} sekarang adalah ${newRole}.`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengubah Role',
          text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
        });
      }
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === user?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Diizinkan',
        text: 'Anda tidak dapat menghapus akun admin Anda sendiri saat sedang login.',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Hapus Pengguna Platform?',
      text: `PERINGATAN: Akun ${targetUser.name} (${targetUser.email}) akan dihapus permanen dari sistem.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus Permanen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
    });

    if (confirm.isConfirmed) {
      try {
        await adminService.deleteUser(targetUser.id);
        Swal.fire({
          icon: 'success',
          title: 'Pengguna Dihapus',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: err.response?.data?.message || 'Terjadi kesalahan saat menghapus pengguna.',
        });
      }
    }
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSubmittingCat(true);
    try {
      await adminService.createCategory({ name: catName.trim(), description: catDesc.trim() });
      Swal.fire({
        icon: 'success',
        title: 'Kategori Berhasil Dibuat',
        text: `Kategori '${catName}' kini aktif untuk semua penyelenggara acara.`,
        timer: 1800,
        showConfirmButton: false,
      });
      setShowAddCatModal(false);
      setCatName('');
      setCatDesc('');
      fetchAdminData();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambahkan Kategori',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setIsSubmittingCat(false);
    }
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

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleManualConfirm = async (booking: BookingResponseData) => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi Pembayaran Manual?',
      text: `Setujui pelunasan tiket pesanan ${booking.id.substring(0, 8)} untuk ${booking.buyerName || 'Pembeli'} senilai ${formatRupiah(booking.totalAmount)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Konfirmasi Lunas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#4b5563',
    });

    if (confirm.isConfirmed) {
      try {
        Swal.fire({
          title: 'Memproses Konfirmasi...',
          text: 'Mengubah status pesanan dan menerbitkan e-ticket...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await bookingService.manualConfirmPayment(booking.id);

        Swal.fire({
          icon: 'success',
          title: 'Pesanan Telah Lunas!',
          text: 'Status tiket diperbarui menjadi LUNAS dan tiket resmi telah aktif.',
          timer: 1800,
          showConfirmButton: false,
        });

        fetchAdminData();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Konfirmasi',
          text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
          confirmButtonColor: '#FFD700',
        });
      }
    }
  };

  const handleDownloadTicketPdf = async (booking: BookingResponseData) => {
    try {
      Swal.fire({
        title: 'Mengunduh Dokumen...',
        text: 'Menyiapkan berkas e-ticket PDF resmi...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await bookingService.downloadTicketPdf(booking.id, booking.eventName);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diunduh!',
        text: 'Dokumen tiket PDF telah disimpan.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunduh e-ticket PDF.',
      });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Background Subtle Geometric Pattern */}
      <div className="pattern-geometric-overlay" style={{ opacity: 0.15 }}></div>

      {/* Luxury Left Sidebar Navigation (Super Admin Exclusive) */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div>
          {/* Brand Logo & Super Admin Badge */}
          <div className="mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
            <Link to="/" className="d-block mb-2 text-decoration-none">
              <EventEaseLogo size="md" />
            </Link>
            <span className="gold-glow-badge" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              <i className="fas fa-shield-alt text-warning me-1"></i> SUPER ADMIN CONSOLE
            </span>
          </div>

          {/* Navigation Links (Fokus Regulasi & Pengawasan) */}
          <nav>
            <button
              onClick={() => setActiveTab('overview')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <i className="fas fa-chart-line"></i>
              <span>Ringkasan Platform</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer ${activeTab === 'bookings' ? 'active' : ''}`}
            >
              <i className="fas fa-receipt text-warning"></i>
              <span>Transaksi & Tiket ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer ${activeTab === 'users' ? 'active' : ''}`}
            >
              <i className="fas fa-users-gear text-info"></i>
              <span>Kelola Pengguna ({totalUsers})</span>
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer d-flex align-items-center justify-content-between ${activeTab === 'partners' ? 'active' : ''}`}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-id-card text-warning"></i>
                <span>Verifikasi Mitra (KYC)</span>
              </div>
              {pendingPartnerCount > 0 && (
                <span className="badge bg-danger rounded-pill font-monospace" style={{ fontSize: '10px' }}>
                  {pendingPartnerCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer ${activeTab === 'categories' ? 'active' : ''}`}
            >
              <i className="fas fa-layer-group text-warning"></i>
              <span>Kelola Kategori ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer ${activeTab === 'events' ? 'active' : ''}`}
            >
              <i className="fas fa-calendar-check"></i>
              <span>Audit Seluruh Acara ({events.length})</span>
            </button>

            <button
              onClick={() => handleExportExcel()}
              disabled={isExporting}
              className="sidebar-nav-item w-100 text-start bg-transparent border-0 cursor-pointer"
            >
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} text-success`}></i>
              <span className="text-success fw-semibold">Ekspor Konsolidasi (.xlsx)</span>
            </button>

            <Link to="/events" className="sidebar-nav-item">
              <i className="fas fa-globe"></i>
              <span>Katalog Acara Publik</span>
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
                  <i className="fas fa-shield-halved"></i> Hak Akses Tertinggi Super Administrator
                </span>
              </div>
              <h1 className="kikk-title m-0" style={{ fontSize: '2rem' }}>
                Pusat Pengawasan Ekosistem Platform
              </h1>
              <p className="text-secondary small m-0 mt-1">
                Kelola hak akses pengguna/organizer, regulasi kategori tiket, dan audit konsolidasi keuangan sistem.
              </p>
            </div>
          </div>

          {/* Subtle System Status Pill */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <span className="rounded-circle bg-success" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)' }}></span>
              <span className="text-secondary small fw-medium" style={{ fontSize: '11px' }}>
                Konsol Super Admin &bull; {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Column Platform Infrastructure Metrics */}
        <div className="row g-3 mb-4">
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
                <div className="fs-3 fw-bold text-white">{events.length} Acara</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-users-gear text-info fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Total Akun Terdaftar</div>
                <div className="fs-3 fw-bold text-info">{totalUsers} Akun</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="stat-box-luxury h-100">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', flexShrink: 0 }}
              >
                <i className="fas fa-receipt text-success fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Transaksi Tiket</div>
                <div className="fs-3 fw-bold text-white">{bookings.length} Pesanan</div>
                <div className="text-success small fw-semibold">
                  <i className="fas fa-check-circle me-1"></i> {bookings.filter((b) => b.status === 'PAID').length} Lunas
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
                <i className="fas fa-layer-group text-warning fs-4"></i>
              </div>
              <div>
                <div className="text-secondary small fw-medium">Kategori Resmi & Sistem</div>
                <div className="fs-3 fw-bold text-white">{categories.length} Kategori</div>
                <div className="text-success small fw-semibold">
                  <i className="fas fa-circle text-success me-1" style={{ fontSize: '8px' }}></i> Postgres & Midtrans Live
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB TRANSAKSI: AUDIT TRANSAKSI & PEMBAYARAN TIKET */}
        {(activeTab === 'overview' || activeTab === 'bookings') && (
          <div className="luxury-glass-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="gold-glow-badge" style={{ fontSize: '10px' }}>
                    <i className="fas fa-money-bill-wave text-warning me-1"></i> MONITORING FINANSIAL & GATEWAY
                  </span>
                </div>
                <h3 className="kikk-title m-0 fs-5">
                  <i className="fas fa-receipt text-warning me-2"></i> Audit Transaksi & Pelunasan Tiket ({bookings.length})
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Pantau status pelunasan Midtrans Snap, lakukan sinkronisasi verifikasi instan, atau konfirmasi manual jika diperlukan.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExportExcel()}
                  disabled={isExporting}
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-2 py-1 px-3"
                  style={{ fontSize: '11px', borderRadius: '8px', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80', background: 'rgba(34, 197, 94, 0.06)' }}
                  title="Ekspor seluruh rekap transaksi platform format .xlsx"
                >
                  <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                  <span>Ekspor Konsolidasi (.xlsx)</span>
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('ALL')}
                  className={`category-pill ${bookingStatusFilter === 'ALL' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Semua ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('PAID')}
                  className={`category-pill ${bookingStatusFilter === 'PAID' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <i className="fas fa-circle-check text-success me-1"></i> Lunas ({bookings.filter((b) => b.status === 'PAID').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('PENDING')}
                  className={`category-pill ${bookingStatusFilter === 'PENDING' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <i className="fas fa-hourglass-half text-warning me-1"></i> Menunggu Bayar ({bookings.filter((b) => b.status === 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('CANCELLED')}
                  className={`category-pill ${bookingStatusFilter === 'CANCELLED' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <i className="fas fa-ban text-secondary me-1"></i> Batal ({bookings.filter((b) => b.status === 'CANCELLED').length})
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status"></div>
                <div className="text-secondary small mt-2">Memuat transaksi platform...</div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-4 text-secondary">
                <i className="fas fa-inbox fa-2x mb-2 d-block text-warning" style={{ opacity: 0.5 }}></i>
                Tidak ada data transaksi tiket untuk filter status ini.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover m-0 align-middle" style={{ background: 'transparent' }}>
                  <thead>
                    <tr style={{ borderColor: 'rgba(255, 215, 0, 0.2)', fontSize: '11px', letterSpacing: '1px' }}>
                      <th className="py-2">ID PESANAN & TGL</th>
                      <th className="py-2">ACARA & KATEGORI</th>
                      <th className="py-2">PEMBELI</th>
                      <th className="py-2 text-center">KURSI</th>
                      <th className="py-2">TOTAL BAYAR</th>
                      <th className="py-2">STATUS</th>
                      <th className="py-2 text-end">KONTROL / AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <td className="py-2 font-monospace">
                          <div className="text-white fw-bold" style={{ fontSize: '12px' }}>
                            #{b.id.substring(0, 8).toUpperCase()}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '10px' }}>
                            {b.bookingDate || '-'}
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="text-white fw-semibold" style={{ fontSize: '13px' }}>
                            {b.eventName}
                          </div>
                          <div className="text-warning small" style={{ fontSize: '11px' }}>
                            {b.ticketCategoryName || 'General Pass'}
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="text-white fw-medium" style={{ fontSize: '12px' }}>
                            {b.buyerName || 'Pembeli'}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '11px' }}>
                            {b.buyerEmail || '-'}
                          </div>
                        </td>
                        <td className="text-center py-2">
                          <span className="badge bg-secondary" style={{ fontSize: '11px' }}>
                            {b.quantity} Kursi
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="text-white fw-bold" style={{ fontSize: '13px' }}>
                            {formatRupiah(b.totalAmount)}
                          </div>
                        </td>
                        <td className="py-2">
                          {b.status === 'PAID' ? (
                            <span
                              className="badge bg-success text-white"
                              style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '10px', letterSpacing: '0.5px' }}
                            >
                              <i className="fas fa-circle-check me-1"></i> LUNAS
                            </span>
                          ) : b.status === 'PENDING' ? (
                            <span
                              className="badge bg-warning text-dark"
                              style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '10px', letterSpacing: '0.5px' }}
                            >
                              <i className="fas fa-hourglass-half me-1"></i> MENUNGGU BAYAR
                            </span>
                          ) : (
                            <span
                              className="badge bg-secondary text-white"
                              style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '10px', letterSpacing: '0.5px' }}
                            >
                              {b.status}
                            </span>
                          )}
                        </td>
                        <td className="text-end py-2">
                          <div className="d-flex justify-content-end gap-2">
                            {b.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleManualConfirm(b)}
                                className="btn btn-sm btn-outline-success py-1 px-3"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Setujui pelunasan secara manual (Cash / Transfer Bank)"
                              >
                                <i className="fas fa-check-double me-1"></i> Konfirmasi Lunas
                              </button>
                            )}
                            {(b.status === 'PAID' || b.status === 'CHECKED_IN') && (
                              <button
                                type="button"
                                onClick={() => handleDownloadTicketPdf(b)}
                                className="btn btn-sm btn-outline-light py-1 px-3"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Unduh E-Ticket PDF"
                              >
                                <i className="fas fa-file-pdf me-1 text-danger"></i> Unduh PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: KELOLA PENGGUNA PLATFORM (Eksklusif Super Admin) */}
        {(activeTab === 'overview' || activeTab === 'users') && (
          <div className="luxury-glass-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="kikk-title m-0 fs-5">
                  <i className="fas fa-users-gear text-info me-2"></i> Manajemen Akun Pengguna & Hak Akses Role
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Daftar seluruh akun terdaftar. Promosi menjadi Penyelenggara dikurasi secara resmi melalui berkas di tab <strong>Verifikasi Mitra (KYC)</strong>.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-warning" role="status"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover m-0 align-middle" style={{ background: 'transparent' }}>
                  <thead>
                    <tr style={{ borderColor: 'rgba(255, 215, 0, 0.2)', fontSize: '11px', letterSpacing: '1px' }}>
                      <th className="py-2">PENGGUNA</th>
                      <th className="py-2">EMAIL</th>
                      <th className="py-2">KONTAK / HP</th>
                      <th className="py-2">PERAN (ROLE)</th>
                      <th className="py-2 text-end">AKSI KONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <td className="py-2">
                          <div className="d-flex align-items-center gap-2">
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt={u.name} className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                            ) : (
                              <div className="rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="fw-semibold text-white">{u.name}</div>
                          </div>
                        </td>
                        <td className="text-secondary small">{u.email}</td>
                        <td className="text-secondary small">{u.phone || '-'}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'ADMIN'
                                ? 'bg-danger text-white'
                                : u.role === 'ORGANIZER'
                                ? 'bg-warning text-dark'
                                : 'bg-secondary text-white'
                            }`}
                            style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '10px', letterSpacing: '0.5px' }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="text-end py-2">
                          <div className="d-flex justify-content-end gap-2">
                            {u.role === 'USER' && (
                              <button
                                onClick={() => setActiveTab('partners')}
                                className="btn btn-sm btn-outline-secondary py-1 px-2 text-secondary"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Promosi peran hanya melalui verifikasi berkas KYC resmi di tab Verifikasi Mitra"
                              >
                                <i className="fas fa-id-card me-1 text-warning"></i> Cek KYC
                              </button>
                            )}
                            {u.role === 'ORGANIZER' && (
                              <button
                                onClick={() => handleUpdateRole(u, 'USER')}
                                className="btn btn-sm btn-outline-warning py-1 px-2"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Cabut hak akses organizer (kembalikan ke akun User biasa)"
                              >
                                <i className="fas fa-user-slash me-1"></i> Cabut Organizer
                              </button>
                            )}
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Hapus pengguna"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: VERIFIKASI KEMITRAAN PENYELENGGARA (KYC / B2B Onboarding) */}
        {(activeTab === 'overview' || activeTab === 'partners') && (
          <div className="luxury-glass-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h3 className="kikk-title m-0 fs-5">
                  <i className="fas fa-id-card text-warning me-2"></i> Verifikasi Kemitraan Penyelenggara (KYC)
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Kurasi resmi berkas identitas &amp; rekening bank sebelum akun diaktifkan sebagai Penyelenggara Acara.
                </p>
              </div>

              {/* Status Filter Badges */}
              <div className="d-flex gap-1">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPartnerStatusFilter(st)}
                    className={`btn btn-sm py-1 px-3 ${
                      partnerStatusFilter === st
                        ? 'btn-warning text-dark fw-bold'
                        : 'btn-outline-secondary text-secondary'
                    }`}
                    style={{ fontSize: '11px', borderRadius: '8px' }}
                  >
                    {st === 'ALL'
                      ? `Semua (${partnerApplications.length})`
                      : st === 'PENDING'
                      ? `Menunggu (${partnerApplications.filter((p) => p.status === 'PENDING').length})`
                      : st === 'APPROVED'
                      ? 'Disetujui'
                      : 'Ditolak'}
                  </button>
                ))}
              </div>
            </div>

            {filteredPartners.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-clipboard-check text-warning fs-1 mb-3 opacity-50"></i>
                <h6 className="text-white fw-bold">Tidak Ada Antrean Pengajuan</h6>
                <p className="text-secondary small mb-0">
                  {partnerStatusFilter === 'ALL'
                    ? 'Belum ada pengguna yang mengirimkan formulir kemitraan.'
                    : `Tidak ada berkas dengan status ${partnerStatusFilter}.`}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover m-0 align-middle" style={{ background: 'transparent' }}>
                  <thead>
                    <tr style={{ borderColor: 'rgba(255, 215, 0, 0.2)', fontSize: '11px', letterSpacing: '1px' }}>
                      <th className="py-3">ORGANISASI / PEMOHON</th>
                      <th className="py-3">IDENTITAS (NIK)</th>
                      <th className="py-3">REKENING PENCAIRAN</th>
                      <th className="py-3">TANGGAL</th>
                      <th className="py-3">STATUS</th>
                      <th className="py-3 text-end">AKSI KURASI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map((app) => (
                      <tr key={app.id} style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                        <td className="py-3">
                          <div>
                            <div className="fw-bold text-white fs-6">{app.organizationName}</div>
                            <div className="text-warning small">
                              <i className="fas fa-user me-1"></i> {app.userName}
                            </div>
                            <div className="text-secondary small" style={{ fontSize: '11px' }}>
                              {app.userEmail} {app.userPhone ? `• ${app.userPhone}` : ''}
                            </div>
                            {app.reason && (
                              <div className="text-secondary fst-italic mt-1" style={{ fontSize: '11px', maxWidth: '300px' }}>
                                &ldquo;{app.reason}&rdquo;
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-monospace text-white small fw-bold">{app.idCardNumber}</div>
                            {app.idCardImage ? (
                              <button
                                onClick={() => handlePreviewKtp(app.idCardImage, app.organizationName)}
                                className="btn btn-sm btn-outline-warning py-0 px-2 mt-1"
                                style={{ fontSize: '10px', borderRadius: '6px' }}
                              >
                                <i className="fas fa-image me-1"></i> Lihat Foto KTP
                              </button>
                            ) : (
                              <span className="text-secondary small">Tanpa Foto</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className="badge bg-secondary text-white mb-1" style={{ fontSize: '10px' }}>
                              {app.bankName}
                            </span>
                            <div className="font-monospace text-white small">{app.bankAccountNumber}</div>
                            <div className="text-secondary" style={{ fontSize: '11px' }}>
                              a.n {app.bankAccountHolder}
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary small">
                          <div>{app.createdAt ? app.createdAt.substring(0, 10) : '-'}</div>
                          <div style={{ fontSize: '10px', opacity: 0.6 }}>
                            {app.createdAt ? app.createdAt.substring(11, 16) : ''}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              app.status === 'APPROVED'
                                ? 'bg-success text-white'
                                : app.status === 'PENDING'
                                ? 'bg-warning text-dark'
                                : 'bg-danger text-white'
                            }`}
                            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '10px', letterSpacing: '0.5px' }}
                          >
                            {app.status === 'APPROVED' ? 'DISETUJUI' : app.status === 'PENDING' ? 'MENUNGGU' : 'DITOLAK'}
                          </span>
                          {app.adminNotes && (
                            <div className="text-danger small mt-1" style={{ fontSize: '10px', maxWidth: '180px' }}>
                              Note: {app.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="text-end py-3">
                          {app.status === 'PENDING' ? (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                onClick={() => handleApprovePartner(app)}
                                className="btn btn-sm btn-success py-1 px-3 fw-bold"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Setujui dan promosikan akun ke ORGANIZER"
                              >
                                <i className="fas fa-check me-1"></i> Setujui
                              </button>
                              <button
                                onClick={() => handleRejectPartner(app)}
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                title="Tolak pengajuan dengan catatan"
                              >
                                <i className="fas fa-times me-1"></i> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-secondary small fst-italic">
                              {app.status === 'APPROVED' ? (
                                <span className="text-success small">
                                  <i className="fas fa-check-double me-1"></i> Aktif sebagai Organizer
                                </span>
                              ) : (
                                <span className="text-danger small">
                                  <i className="fas fa-ban me-1"></i> Ditolak
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAJEMEN KATEGORI RESMI (Eksklusif Super Admin) */}
        {(activeTab === 'overview' || activeTab === 'categories') && (
          <div className="luxury-glass-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="kikk-title m-0 fs-5">
                  <i className="fas fa-layer-group text-warning me-2"></i> Regulasi Kategori Acara Resmi
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Kategori resmi yang dapat dipilih oleh organizer saat membuat acara di platform.
                </p>
              </div>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="btn-kikk btn-sm py-1 px-3"
                style={{ fontSize: '12px' }}
              >
                <i className="fas fa-plus me-1"></i> Tambah Kategori
              </button>
            </div>

            <div className="row g-3">
              {categories.map((c) => (
                <div className="col-12 col-sm-6 col-md-4" key={c.id}>
                  <div
                    className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 215, 0, 0.15)' }}
                  >
                    <div>
                      <div className="text-white fw-bold">{c.name}</div>
                      <div className="text-secondary small">{c.description || 'Kategori resmi Eventease'}</div>
                    </div>
                    <span className="badge bg-warning text-dark">AKTIF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT SELURUH ACARA PLATFORM */}
        {(activeTab === 'overview' || activeTab === 'events') && (
          <div className="luxury-glass-card p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <div>
                <h3 className="kikk-title m-0 fs-5">
                  <i className="fas fa-server text-warning me-2"></i> Audit Seluruh Acara Platform ({events.length})
                </h3>
                <p className="text-secondary small m-0 mt-1">
                  Pantau seluruh acara yang diterbitkan oleh seluruh penyelenggara di platform.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover m-0 align-middle" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ borderColor: 'rgba(255, 215, 0, 0.2)', fontSize: '11px', letterSpacing: '1px' }}>
                    <th className="py-2">NAMA ACARA</th>
                    <th className="py-2">KATEGORI</th>
                    <th className="py-2">PENYELENGGARA</th>
                    <th className="py-2">JADWAL</th>
                    <th className="py-2 text-end">AKSI AUDIT</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <td className="fw-semibold text-white py-2">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={e.imageUrl || '/images/kikk_hero_stage.jpg'}
                            alt={e.name}
                            className="rounded"
                            style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                          />
                          <span>{e.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255, 215, 0, 0.12)', color: 'var(--kikk-yellow)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                          {e.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="text-warning small">{e.organizerName || 'Eventease Official'}</td>
                      <td className="text-secondary small">{e.date}</td>
                      <td className="text-end py-2">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            onClick={() => handleExportExcel(e.id, e.name)}
                            className="btn-kikk-outline btn-sm py-1 px-2"
                            style={{ fontSize: '11px', borderColor: '#22c55e', color: '#22c55e', borderRadius: '6px' }}
                            title="Unduh laporan penjualan acara ini"
                          >
                            <i className="fas fa-file-excel me-1"></i> Excel
                          </button>
                          <Link
                            to={`/events/${e.id}`}
                            className="btn-kikk btn-sm py-1 px-3"
                            style={{ fontSize: '11px', borderRadius: '6px' }}
                          >
                            Lihat
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Tambah Kategori Resmi Baru (Super Admin Only) */}
      {showAddCatModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(5, 2, 12, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1060 }}
        >
          <div
            className="luxury-glass-card p-4 p-md-5 w-100 anim-fade-in"
            style={{
              maxWidth: '520px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255, 215, 0, 0.15)' }}>
              <div>
                <span className="gold-glow-badge" style={{ fontSize: '10px' }}>
                  <i className="fas fa-layer-group text-warning me-1"></i> REGULASI PLATFORM
                </span>
                <h3 className="kikk-title m-0 mt-1" style={{ fontSize: '1.6rem' }}>
                  Tambah Kategori Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="btn-close btn-close-white shadow-none"
                aria-label="Tutup"
              ></button>
            </div>

            <form onSubmit={handleCreateCategorySubmit}>
              <div className="mb-3">
                <label className="form-label text-warning small fw-bold">NAMA KATEGORI *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: E-Sport & Gaming, Workshop, Teater"
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '10px', padding: '10px 14px' }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-warning small fw-bold">DESKRIPSI KATEGORI</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Jelaskan cakupan acara untuk kategori ini..."
                  className="form-control bg-dark text-white border-secondary"
                  style={{ borderRadius: '10px', padding: '10px 14px' }}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="btn-kikk-outline btn-sm px-4 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="btn-kikk btn-sm px-4 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  <i className={`fas ${isSubmittingCat ? 'fa-spinner fa-spin' : 'fa-check'} me-1`}></i> Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
