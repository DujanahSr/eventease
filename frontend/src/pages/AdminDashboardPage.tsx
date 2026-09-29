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

// ── Shared inline helpers ──────────────────────────────────────────────────────
const th = (label: string, align: 'left' | 'right' | 'center' = 'left') => ({
  padding: '10px 14px', textAlign: align as any,
  color: 'rgba(255,215,0,0.65)', fontSize: '10px', fontWeight: 700,
  letterSpacing: '1.2px', textTransform: 'uppercase' as any, whiteSpace: 'nowrap' as any,
  borderBottom: '1px solid rgba(255,215,0,0.15)',
});
const tdBase = { padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' };

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

  const [partnerApplications, setPartnerApplications] = useState<PartnerApplication[]>([]);
  const [pendingPartnerCount, setPendingPartnerCount] = useState(0);
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const filteredPartners = useMemo(() =>
    partnerStatusFilter === 'ALL' ? partnerApplications : partnerApplications.filter((p) => p.status === partnerStatusFilter),
    [partnerApplications, partnerStatusFilter]
  );

  const filteredBookings = useMemo(() =>
    bookingStatusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === bookingStatusFilter),
    [bookings, bookingStatusFilter]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      html: `<div style="text-align:left;font-size:13px;line-height:1.6">
        <p>Anda akan menyetujui pengajuan kemitraan dari:</p>
        <div style="padding:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;margin-bottom:10px">
          <div><strong>Organisasi:</strong> ${app.organizationName}</div>
          <div><strong>Pemohon:</strong> ${app.userName} (${app.userEmail})</div>
          <div><strong>No. Rekening:</strong> ${app.bankName} - ${app.bankAccountNumber}</div>
        </div>
        <p class="mb-0 text-warning">Peran pengguna akan otomatis diubah menjadi <strong>ORGANIZER</strong>.</p>
      </div>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check-circle me-1"></i> Ya, Setujui Kemitraan',
      cancelButtonText: 'Batal', confirmButtonColor: '#22c55e', background: '#120a20', color: '#fff',
    });
    if (confirm.isConfirmed) {
      try {
        await partnerApplicationService.review(app.id, 'APPROVED');
        Swal.fire({ icon: 'success', title: 'Kemitraan Disetujui!', text: `Akun ${app.userName} (${app.organizationName}) resmi menjadi Organizer.`, timer: 1800, showConfirmButton: false, background: '#120a20', color: '#fff' });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Menyetujui', text: err.response?.data?.message || 'Terjadi kesalahan sistem.', background: '#120a20', color: '#fff' });
      }
    }
  };

  const handleRejectPartner = async (app: PartnerApplication) => {
    const { value: notes } = await Swal.fire({
      title: 'Tolak Pengajuan Kemitraan', input: 'textarea',
      inputLabel: 'Catatan / Alasan Penolakan',
      inputPlaceholder: 'Contoh: Foto KTP tidak jelas, mohon unggah ulang...',
      showCancelButton: true, confirmButtonText: '<i class="fas fa-times me-1"></i> Tolak Pengajuan',
      confirmButtonColor: '#ef4444', cancelButtonText: 'Batal', background: '#120a20', color: '#fff',
      inputValidator: (v) => (!v || !v.trim() ? 'Alasan penolakan wajib diisi!' : undefined),
    });
    if (notes) {
      try {
        await partnerApplicationService.review(app.id, 'REJECTED', notes.trim());
        Swal.fire({ icon: 'info', title: 'Pengajuan Ditolak', text: 'Status diubah menjadi REJECTED.', timer: 1800, showConfirmButton: false, background: '#120a20', color: '#fff' });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Menolak', text: err.response?.data?.message || 'Terjadi kesalahan sistem.', background: '#120a20', color: '#fff' });
      }
    }
  };

  const handlePreviewKtp = (imageUrl: string, orgName: string) =>
    Swal.fire({ title: `Foto KTP: ${orgName}`, imageUrl, imageAlt: `KTP ${orgName}`, imageWidth: 500, confirmButtonText: 'Tutup', confirmButtonColor: '#FFD700', background: '#120a20', color: '#fff' });

  useEffect(() => { fetchAdminData(); }, []);
  const handleLogout = () => { logout(); navigate('/login'); };

  const handleUpdateRole = async (targetUser: User, newRole: string) => {
    const confirm = await Swal.fire({ title: 'Ubah Role Pengguna?', text: `Ubah peran ${targetUser.name} menjadi ${newRole}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Ubah Role', cancelButtonText: 'Batal' });
    if (confirm.isConfirmed) {
      try {
        await adminService.updateUserRole(targetUser.id, newRole);
        Swal.fire({ icon: 'success', title: 'Role Diperbarui', text: `Peran ${targetUser.name} sekarang adalah ${newRole}.`, timer: 1500, showConfirmButton: false });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Mengubah Role', text: err.response?.data?.message || 'Terjadi kesalahan sistem.' });
      }
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === user?.id) { Swal.fire({ icon: 'warning', title: 'Tidak Diizinkan', text: 'Anda tidak dapat menghapus akun Anda sendiri.' }); return; }
    const confirm = await Swal.fire({ title: 'Hapus Pengguna?', text: `Akun ${targetUser.name} (${targetUser.email}) akan dihapus permanen.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus Permanen', cancelButtonText: 'Batal', confirmButtonColor: '#ef4444' });
    if (confirm.isConfirmed) {
      try {
        await adminService.deleteUser(targetUser.id);
        Swal.fire({ icon: 'success', title: 'Pengguna Dihapus', timer: 1500, showConfirmButton: false });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: err.response?.data?.message || 'Terjadi kesalahan.' });
      }
    }
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsSubmittingCat(true);
    try {
      await adminService.createCategory({ name: catName.trim(), description: catDesc.trim() });
      Swal.fire({ icon: 'success', title: 'Kategori Berhasil Dibuat', text: `Kategori '${catName}' kini aktif.`, timer: 1800, showConfirmButton: false });
      setShowAddCatModal(false); setCatName(''); setCatDesc(''); fetchAdminData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Menambahkan Kategori', text: err.response?.data?.message || 'Terjadi kesalahan sistem.' });
    } finally { setIsSubmittingCat(false); }
  };

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({ title: 'Mempersiapkan Excel...', text: 'Mengonsolidasikan transaksi platform...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName ? `Laporan_Admin_${eventName.replace(/\s+/g, '_')}.xlsx` : `Laporan_Konsolidasi_${Date.now()}.xlsx`;
      triggerFileDownload(blob, filename);
      Swal.fire({ icon: 'success', title: 'Ekspor Berhasil!', text: `${filename} berhasil diunduh.`, timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Ekspor Excel', text: 'Terjadi kesalahan saat mengekspor.' });
    } finally { setIsExporting(false); }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleManualConfirm = async (booking: BookingResponseData) => {
    const confirm = await Swal.fire({ title: 'Konfirmasi Pembayaran?', text: `Setujui pelunasan pesanan ${booking.id.substring(0, 8)} untuk ${booking.buyerName} senilai ${formatRupiah(booking.totalAmount)}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Konfirmasi Lunas', cancelButtonText: 'Batal', confirmButtonColor: '#22c55e' });
    if (confirm.isConfirmed) {
      try {
        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await bookingService.manualConfirmPayment(booking.id);
        Swal.fire({ icon: 'success', title: 'Pesanan Lunas!', text: 'Status tiket diperbarui ke LUNAS.', timer: 1800, showConfirmButton: false });
        fetchAdminData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Konfirmasi', text: err.response?.data?.message || 'Terjadi kesalahan sistem.', confirmButtonColor: '#FFD700' });
      }
    }
  };

  const handleDownloadTicketPdf = async (booking: BookingResponseData) => {
    try {
      Swal.fire({ title: 'Mengunduh PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await bookingService.downloadTicketPdf(booking.id, booking.eventName);
      Swal.fire({ icon: 'success', title: 'Berhasil Diunduh!', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Mengunduh', text: err.response?.data?.message || 'Terjadi kesalahan.' });
    }
  };

  const paidCount = bookings.filter((b) => b.status === 'PAID').length;
  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase() : 'SA';

  // ── nav items ──────────────────────────────────────────────────────────────
  const navItems: { tab: typeof activeTab; icon: string; label: string; badge?: number; color?: string }[] = [
    { tab: 'overview', icon: 'fa-chart-line', label: 'Ringkasan Platform' },
    { tab: 'bookings', icon: 'fa-receipt', label: 'Transaksi & Tiket', badge: bookings.length, color: '#FFD700' },
    { tab: 'users', icon: 'fa-users-gear', label: 'Kelola Pengguna', badge: totalUsers, color: '#60a5fa' },
    { tab: 'partners', icon: 'fa-id-card', label: 'Verifikasi Mitra (KYC)', badge: pendingPartnerCount || undefined, color: '#f87171' },
    { tab: 'categories', icon: 'fa-layer-group', label: 'Kategori Acara', badge: categories.length, color: '#FFD700' },
    { tab: 'events', icon: 'fa-calendar-check', label: 'Audit Semua Acara', badge: events.length },
  ];

  return (
    <div className="dashboard-layout" style={{ background: '#080512' }}>

      {/* Same background as organizer dashboard */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/images/organizer_dashboard_bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, rgba(8,5,18,0.94) 0%, rgba(10,5,24,0.9) 100%)', pointerEvents: 'none' }} />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'show' : ''}`} style={{ zIndex: 1050 }}>
        <div>
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
            <Link to="/" className="d-block mb-2 text-decoration-none"><EventEaseLogo size="md" /></Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', background: 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.04))', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <i className="fas fa-shield-alt" style={{ fontSize: '9px' }}></i> Super Admin Console
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ tab, icon, label, badge, color }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`sidebar-nav-item w-100 text-start bg-transparent border-0 ${activeTab === tab ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <i className={`fas ${icon}`} style={color ? { color } : {}}></i>
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: tab === 'partners' && pendingPartnerCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${tab === 'partners' && pendingPartnerCount > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`, color: tab === 'partners' && pendingPartnerCount > 0 ? '#f87171' : 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 700 }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}

            <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}></div>

            <button onClick={() => handleExportExcel()} disabled={isExporting} className="sidebar-nav-item w-100 text-start bg-transparent border-0" style={{ cursor: 'pointer' }}>
              <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`} style={{ color: '#4ade80' }}></i>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>Ekspor Konsolidasi</span>
            </button>
            <Link to="/events" className="sidebar-nav-item">
              <i className="fas fa-globe"></i>
              <span>Katalog Publik</span>
            </Link>
          </nav>
        </div>

        {/* Profile footer */}
        <div style={{ borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px' }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar Console
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <main className="dashboard-main-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="d-lg-none" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: '10px', padding: '7px 11px', cursor: 'pointer' }}>
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                  <i className="fas fa-shield-halved" style={{ fontSize: '10px' }}></i> Hak Akses Tertinggi
                </span>
              </div>
              <h1 className="kikk-title m-0" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', letterSpacing: '-0.5px' }}>
                Pusat Pengawasan Platform
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '4px 0 0' }}>
                Kelola hak akses, kurasi mitra KYC, dan audit konsolidasi keuangan sistem.
              </p>
            </div>
          </div>

          {/* Status pill — no blinking dot, replaced with thin accent bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '50px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: '3px', height: '16px', borderRadius: '2px', background: 'linear-gradient(to bottom, #4ade80, #22c55e)', flexShrink: 0 }}></span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 500 }}>
              Konsol Aktif &bull; {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── BENTO METRICS ──────────────────────────────────────────────────── */}
        <div className="anim-fade-in anim-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Acara', value: events.length, sub: 'Terdaftar di platform', color: '#FFD700', bg: 'rgba(255,215,0,0.05)', border: 'rgba(255,215,0,0.2)', icon: 'fa-calendar-check' },
            { label: 'Total Pengguna', value: totalUsers, sub: 'Akun aktif terdaftar', color: '#60a5fa', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', icon: 'fa-users-gear' },
            { label: 'Transaksi', value: bookings.length, sub: `${paidCount} pesanan lunas`, color: '#4ade80', bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.2)', icon: 'fa-receipt' },
            { label: 'Kategori', value: categories.length, sub: 'Kategori resmi aktif', color: '#FFD700', bg: 'rgba(255,215,0,0.05)', border: 'rgba(255,215,0,0.2)', icon: 'fa-layer-group' },
            ...(pendingPartnerCount > 0 ? [{ label: 'KYC Menunggu', value: pendingPartnerCount, sub: 'Butuh persetujuan admin', color: '#f87171', bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.25)', icon: 'fa-id-card' }] : []),
          ].map(({ label, value, sub, color, bg, border, icon }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '20px', padding: '22px 24px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: bg, pointerEvents: 'none' }}></div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>{label}</div>
              <div style={{ fontSize: isLoading ? '1.5rem' : '2.2rem', fontWeight: 800, color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
                {isLoading ? '—' : value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '6px' }}>
                <i className={`fas ${icon} me-1`}></i>{sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── TRANSAKSI ──────────────────────────────────────────────────────── */}
        {(activeTab === 'overview' || activeTab === 'bookings') && (
          <div className="luxury-glass-card anim-fade-in anim-delay-2" style={{ padding: '24px 28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div>
                <h3 className="kikk-title m-0" style={{ fontSize: '1.15rem' }}>
                  <i className="fas fa-receipt me-2" style={{ color: '#FFD700' }}></i>Audit Transaksi &amp; Pelunasan Tiket
                  <span style={{ marginLeft: '10px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '8px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, verticalAlign: 'middle' }}>{bookings.length}</span>
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 12px' }}>Pantau pelunasan Midtrans Snap, konfirmasi manual, dan unduh e-ticket PDF.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(['ALL', 'PAID', 'PENDING', 'CANCELLED'] as const).map((s) => (
                    <button key={s} onClick={() => setBookingStatusFilter(s)}
                      style={{ padding: '5px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${bookingStatusFilter === s ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`, background: bookingStatusFilter === s ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)', color: bookingStatusFilter === s ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                      {s === 'ALL' ? `Semua (${bookings.length})` : s === 'PAID' ? `Lunas (${bookings.filter(b => b.status === 'PAID').length})` : s === 'PENDING' ? `Menunggu (${bookings.filter(b => b.status === 'PENDING').length})` : `Batal (${bookings.filter(b => b.status === 'CANCELLED').length})`}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => handleExportExcel()} disabled={isExporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(34,197,94,0.06)', color: '#4ade80', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i> Ekspor .xlsx
              </button>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner-border" style={{ color: '#FFD700', width: '28px', height: '28px' }} role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                <i className="fas fa-inbox" style={{ fontSize: '28px', display: 'block', marginBottom: '10px', opacity: 0.4 }}></i>
                Tidak ada data transaksi untuk filter ini.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['ID PESANAN', 'ACARA & TIKET', 'PEMBELI', 'KURSI', 'TOTAL', 'STATUS', 'AKSI'].map((h, i) => <th key={i} style={th(h, i >= 5 ? 'right' : 'left')}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        style={{ transition: 'background 0.15s' }}
                      >
                        <td style={tdBase}>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>#{b.id.substring(0, 8).toUpperCase()}</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{b.bookingDate || '-'}</div>
                        </td>
                        <td style={tdBase}>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{b.eventName}</div>
                          <div style={{ color: '#FFD700', fontSize: '11px' }}>{b.ticketCategoryName || 'General Pass'}</div>
                        </td>
                        <td style={tdBase}>
                          <div style={{ color: '#fff', fontSize: '12px' }}>{b.buyerName || 'Pembeli'}</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{b.buyerEmail || '-'}</div>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'center' }}>
                          <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{b.quantity}</span>
                        </td>
                        <td style={tdBase}><span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{formatRupiah(b.totalAmount)}</span></td>
                        <td style={tdBase}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', background: b.status === 'PAID' ? 'rgba(34,197,94,0.15)' : b.status === 'PENDING' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${b.status === 'PAID' ? 'rgba(34,197,94,0.3)' : b.status === 'PENDING' ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.12)'}`, color: b.status === 'PAID' ? '#4ade80' : b.status === 'PENDING' ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                            {b.status === 'PAID' ? 'LUNAS' : b.status === 'PENDING' ? 'MENUNGGU' : b.status}
                          </span>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {b.status === 'PENDING' && (
                              <button onClick={() => handleManualConfirm(b)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#4ade80', fontSize: '11px', cursor: 'pointer' }} title="Konfirmasi manual">
                                <i className="fas fa-check-double me-1"></i>Lunas
                              </button>
                            )}
                            {(b.status === 'PAID' || b.status === 'CHECKED_IN') && (
                              <button onClick={() => handleDownloadTicketPdf(b)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: '11px', cursor: 'pointer' }}>
                                <i className="fas fa-file-pdf me-1" style={{ color: '#f87171' }}></i>PDF
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

        {/* ── KELOLA PENGGUNA ─────────────────────────────────────────────────── */}
        {(activeTab === 'overview' || activeTab === 'users') && (
          <div className="luxury-glass-card anim-fade-in anim-delay-2" style={{ padding: '24px 28px', marginBottom: '24px' }}>
            <h3 className="kikk-title m-0" style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
              <i className="fas fa-users-gear me-2" style={{ color: '#60a5fa' }}></i>Manajemen Akun Pengguna &amp; Hak Akses
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 16px' }}>
              Promosi ke Penyelenggara hanya melalui kurasi KYC di tab <strong style={{ color: '#FFD700' }}>Verifikasi Mitra</strong>.
            </p>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner-border" style={{ color: '#FFD700', width: '28px', height: '28px' }} role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['PENGGUNA', 'EMAIL', 'KONTAK', 'PERAN', 'AKSI'].map((h, i) => <th key={i} style={th(h, i === 4 ? 'right' : 'left')}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        style={{ transition: 'background 0.15s' }}
                      >
                        <td style={tdBase}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                                {u.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ ...tdBase, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{u.email}</td>
                        <td style={{ ...tdBase, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{u.phone || '-'}</td>
                        <td style={tdBase}>
                          <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : u.role === 'ORGANIZER' ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.07)', border: `1px solid ${u.role === 'ADMIN' ? 'rgba(239,68,68,0.3)' : u.role === 'ORGANIZER' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.12)'}`, color: u.role === 'ADMIN' ? '#f87171' : u.role === 'ORGANIZER' ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {u.role === 'USER' && (
                              <button onClick={() => setActiveTab('partners')} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '11px', cursor: 'pointer' }} title="Cek pengajuan KYC mitra">
                                <i className="fas fa-id-card me-1"></i>Cek KYC
                              </button>
                            )}
                            {u.role === 'ORGANIZER' && (
                              <button onClick={() => handleUpdateRole(u, 'USER')} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '11px', cursor: 'pointer' }} title="Cabut status organizer">
                                <i className="fas fa-user-slash me-1"></i>Cabut
                              </button>
                            )}
                            {u.role !== 'ADMIN' && (
                              <button onClick={() => handleDeleteUser(u)} style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: '11px', cursor: 'pointer' }} title="Hapus pengguna">
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

        {/* ── KYC MITRA ──────────────────────────────────────────────────────── */}
        {(activeTab === 'overview' || activeTab === 'partners') && (
          <div className="luxury-glass-card anim-fade-in anim-delay-2" style={{ padding: '24px 28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 className="kikk-title m-0" style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
                  <i className="fas fa-id-card me-2" style={{ color: '#FFD700' }}></i>Verifikasi Kemitraan Penyelenggara (KYC)
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                  Kurasi berkas identitas &amp; rekening bank sebelum akun diaktifkan sebagai Organizer.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button key={st} onClick={() => setPartnerStatusFilter(st)}
                    style={{ padding: '5px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${partnerStatusFilter === st ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`, background: partnerStatusFilter === st ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)', color: partnerStatusFilter === st ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                    {st === 'ALL' ? `Semua (${partnerApplications.length})` : st === 'PENDING' ? `Menunggu (${partnerApplications.filter(p => p.status === 'PENDING').length})` : st === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                  </button>
                ))}
              </div>
            </div>

            {filteredPartners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                <i className="fas fa-clipboard-check" style={{ fontSize: '28px', display: 'block', marginBottom: '10px', opacity: 0.4 }}></i>
                {partnerStatusFilter === 'ALL' ? 'Belum ada pengajuan kemitraan.' : `Tidak ada berkas dengan status ${partnerStatusFilter}.`}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['ORGANISASI / PEMOHON', 'IDENTITAS (NIK)', 'REKENING', 'TANGGAL', 'STATUS', 'AKSI'].map((h, i) => <th key={i} style={th(h, i === 5 ? 'right' : 'left')}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredPartners.map((app) => (
                      <tr key={app.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        style={{ transition: 'background 0.15s' }}
                      >
                        <td style={tdBase}>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{app.organizationName}</div>
                          <div style={{ color: '#FFD700', fontSize: '11px' }}><i className="fas fa-user me-1"></i>{app.userName}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{app.userEmail}{app.userPhone ? ` · ${app.userPhone}` : ''}</div>
                          {app.reason && <div style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', fontSize: '11px', maxWidth: '260px', marginTop: '4px' }}>&ldquo;{app.reason}&rdquo;</div>}
                        </td>
                        <td style={tdBase}>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>{app.idCardNumber}</div>
                          {app.idCardImage ? (
                            <button onClick={() => handlePreviewKtp(app.idCardImage, app.organizationName)} style={{ marginTop: '4px', padding: '3px 10px', borderRadius: '7px', border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '10px', cursor: 'pointer' }}>
                              <i className="fas fa-image me-1"></i>Lihat KTP
                            </button>
                          ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Tanpa Foto</span>}
                        </td>
                        <td style={tdBase}>
                          <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', display: 'inline-block' }}>{app.bankName}</span>
                          <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>{app.bankAccountNumber}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>a.n {app.bankAccountHolder}</div>
                        </td>
                        <td style={{ ...tdBase, color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                          <div>{app.createdAt ? app.createdAt.substring(0, 10) : '-'}</div>
                          <div style={{ fontSize: '10px', opacity: 0.6 }}>{app.createdAt ? app.createdAt.substring(11, 16) : ''}</div>
                        </td>
                        <td style={tdBase}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: app.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' : app.status === 'PENDING' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.12)', border: `1px solid ${app.status === 'APPROVED' ? 'rgba(34,197,94,0.3)' : app.status === 'PENDING' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`, color: app.status === 'APPROVED' ? '#4ade80' : app.status === 'PENDING' ? '#fbbf24' : '#f87171' }}>
                            {app.status === 'APPROVED' ? 'DISETUJUI' : app.status === 'PENDING' ? 'MENUNGGU' : 'DITOLAK'}
                          </span>
                          {app.adminNotes && <div style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', maxWidth: '160px' }}>Note: {app.adminNotes}</div>}
                        </td>
                        <td style={{ ...tdBase, textAlign: 'right' }}>
                          {app.status === 'PENDING' ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button onClick={() => handleApprovePartner(app)} style={{ padding: '6px 14px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                <i className="fas fa-check me-1"></i>Setujui
                              </button>
                              <button onClick={() => handleRejectPartner(app)} style={{ padding: '6px 12px', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                                <i className="fas fa-times me-1"></i>Tolak
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: app.status === 'APPROVED' ? '#4ade80' : '#f87171', fontStyle: 'italic' }}>
                              <i className={`fas ${app.status === 'APPROVED' ? 'fa-check-double' : 'fa-ban'} me-1`}></i>
                              {app.status === 'APPROVED' ? 'Aktif sbg Organizer' : 'Ditolak'}
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

        {/* ── KATEGORI ─────────────────────────────────────────────────────── */}
        {(activeTab === 'overview' || activeTab === 'categories') && (
          <div className="luxury-glass-card anim-fade-in anim-delay-3" style={{ padding: '24px 28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 className="kikk-title m-0" style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
                  <i className="fas fa-layer-group me-2" style={{ color: '#FFD700' }}></i>Regulasi Kategori Acara
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Kategori yang dapat dipilih organizer saat membuat acara.</p>
              </div>
              <button onClick={() => setShowAddCatModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #FFD700, #d4a800)', color: '#0b0616', fontWeight: 700, fontSize: '12px' }}>
                <i className="fas fa-plus"></i> Tambah Kategori
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {categories.map((c) => (
                <div key={c.id} style={{ padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{c.description || 'Kategori resmi Eventease'}</div>
                  </div>
                  <span style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '8px', padding: '2px 10px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>AKTIF</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIT ACARA ────────────────────────────────────────────────────── */}
        {(activeTab === 'overview' || activeTab === 'events') && (
          <div className="luxury-glass-card anim-fade-in anim-delay-3" style={{ padding: '24px 28px' }}>
            <h3 className="kikk-title m-0" style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
              <i className="fas fa-server me-2" style={{ color: '#FFD700' }}></i>Audit Seluruh Acara Platform
              <span style={{ marginLeft: '10px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '8px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, verticalAlign: 'middle' }}>{events.length}</span>
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 16px' }}>Pantau seluruh acara yang diterbitkan oleh penyelenggara di platform.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['NAMA ACARA', 'KATEGORI', 'PENYELENGGARA', 'JADWAL', 'AKSI AUDIT'].map((h, i) => <th key={i} style={th(h, i === 4 ? 'right' : 'left')}>{h}</th>)}</tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}
                      onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      style={{ transition: 'background 0.15s' }}
                    >
                      <td style={tdBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={e.imageUrl || '/images/kikk_hero_stage.jpg'} alt={e.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }} />
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{e.name}</span>
                        </div>
                      </td>
                      <td style={tdBase}>
                        <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700', borderRadius: '6px', padding: '2px 10px', fontSize: '10px', fontWeight: 600 }}>
                          {e.categoryName || 'General'}
                        </span>
                      </td>
                      <td style={{ ...tdBase, color: '#FFD700', fontSize: '12px' }}>{e.organizerName || 'Eventease Official'}</td>
                      <td style={{ ...tdBase, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{e.date}</td>
                      <td style={{ ...tdBase, textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => handleExportExcel(e.id, e.name)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(34,197,94,0.05)', color: '#4ade80', fontSize: '11px', cursor: 'pointer' }}>
                            <i className="fas fa-file-excel me-1"></i>Excel
                          </button>
                          <Link to={`/events/${e.id}`} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.06)', color: '#FFD700', fontSize: '11px', textDecoration: 'none' }}>
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

      {/* ── MODAL TAMBAH KATEGORI ────────────────────────────────────────────── */}
      {showAddCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(5,2,14,0.85)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddCatModal(false); }}>
          <div className="anim-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'rgba(12,7,26,0.97)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '24px', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
              <div>
                <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  <i className="fas fa-layer-group me-1" style={{ fontSize: '9px' }}></i> Regulasi Platform
                </span>
                <h3 style={{ margin: 0, color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700 }}>Tambah Kategori Baru</h3>
              </div>
              <button onClick={() => setShowAddCatModal(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="fas fa-times" style={{ fontSize: '13px' }}></i>
              </button>
            </div>
            <form onSubmit={handleCreateCategorySubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.5px' }}>NAMA KATEGORI <span style={{ color: '#FFD700' }}>*</span></label>
                <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Contoh: E-Sport & Gaming, Workshop, Teater" style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>DESKRIPSI KATEGORI</label>
                <textarea rows={3} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Jelaskan cakupan acara untuk kategori ini..." style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setShowAddCatModal(false)} style={{ padding: '10px 22px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={isSubmittingCat} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 26px', borderRadius: '12px', border: 'none', cursor: isSubmittingCat ? 'not-allowed' : 'pointer', background: isSubmittingCat ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg, #FFD700 0%, #d4a800 100%)', color: '#0b0616', fontWeight: 700, fontSize: '13px' }}>
                  <i className={`fas ${isSubmittingCat ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  {isSubmittingCat ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
