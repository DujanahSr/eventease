import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { mediaService } from '../services/mediaService';
import Swal from 'sweetalert2';

export const UserDashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [tickets, setTickets] = useState<BookingResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata profil tambahan (disimpan di localStorage untuk melengkapi data pengguna)
  const [userBio, setUserBio] = useState<string>(() => localStorage.getItem('user_bio') || 'Event Enthusiast & Music Lover');
  const [userCity, setUserCity] = useState<string>(() => localStorage.getItem('user_city') || 'Jakarta, Indonesia');

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const data = await bookingService.getMyTickets();
        setTickets(data || []);
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Batas maksimal foto profil adalah 5 MB.',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      Swal.fire({
        title: 'Mengunggah Foto Profil...',
        text: 'Menyimpan berkas ke Cloud Storage (Cloudinary CDN)...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const uploadResult = await mediaService.uploadImage(file, 'avatars');
      await updateProfile({ profilePicture: uploadResult.url });

      Swal.fire({
        icon: 'success',
        title: 'Foto Profil Diperbarui!',
        text: `Foto tersimpan via ${uploadResult.provider === 'CLOUDINARY' ? 'Cloudinary CDN' : 'Local Storage'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah foto profil.',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditProfile = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Pengaturan Profil Pengguna',
      width: 560,
      html: `
        <div style="text-align: left; font-size: 14px; margin-top: 15px;">
          <!-- Readonly Email Status -->
          <div style="margin-bottom: 16px; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 215, 0, 0.15); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 0.5px;">ALAMAT EMAIL (TERDAFTAR)</div>
              <div style="color: #fff; font-weight: 600; font-size: 13px;">${user?.email || '-'}</div>
            </div>
            <span style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 3px 8px; border-radius: 6px; font-size: 11px;">
              <i class="fas fa-shield-alt"></i> Terverifikasi
            </span>
          </div>

          <!-- Nama Lengkap -->
          <div style="margin-bottom: 14px;">
            <label style="display:block; margin-bottom: 6px; font-weight: 600; color: #FFD700; font-size: 13px;">
              <i class="fas fa-user me-2"></i> Nama Lengkap
            </label>
            <input id="swal-input-name" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box;" value="${user?.name || ''}" placeholder="Masukkan nama lengkap Anda">
          </div>

          <!-- Nomor WhatsApp / HP -->
          <div style="margin-bottom: 14px;">
            <label style="display:block; margin-bottom: 6px; font-weight: 600; color: #FFD700; font-size: 13px;">
              <i class="fab fa-whatsapp me-2"></i> Nomor WhatsApp / Kontak Aktif
            </label>
            <input id="swal-input-phone" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box;" value="${user?.phone || ''}" placeholder="Contoh: 081234567890">
          </div>

          <!-- Kota Domisili -->
          <div style="margin-bottom: 14px;">
            <label style="display:block; margin-bottom: 6px; font-weight: 600; color: #FFD700; font-size: 13px;">
              <i class="fas fa-map-marker-alt me-2"></i> Kota Domisili
            </label>
            <input id="swal-input-city" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box;" value="${userCity}" placeholder="Contoh: Jakarta, Indonesia">
          </div>

          <!-- Bio Profil Singkat -->
          <div>
            <label style="display:block; margin-bottom: 6px; font-weight: 600; color: #FFD700; font-size: 13px;">
              <i class="fas fa-quote-left me-2"></i> Bio Singkat / Preferensi Acara
            </label>
            <textarea id="swal-input-bio" class="swal2-textarea" style="width: 100%; margin: 0; box-sizing: border-box; height: 75px; resize: none;" placeholder="Ceritakan singkat minat acara Anda...">${userBio}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-save me-1"></i> Simpan Perubahan',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Batal',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-input-phone') as HTMLInputElement).value;
        const city = (document.getElementById('swal-input-city') as HTMLInputElement).value;
        const bio = (document.getElementById('swal-input-bio') as HTMLTextAreaElement).value;

        if (!name.trim()) {
          Swal.showValidationMessage('Nama lengkap tidak boleh kosong');
          return false;
        }
        return { name: name.trim(), phone: phone.trim(), city: city.trim(), bio: bio.trim() };
      },
    });

    if (formValues) {
      try {
        await updateProfile({ name: formValues.name, phone: formValues.phone });
        setUserCity(formValues.city);
        setUserBio(formValues.bio);
        localStorage.setItem('user_city', formValues.city);
        localStorage.setItem('user_bio', formValues.bio);

        Swal.fire({
          icon: 'success',
          title: 'Profil Berhasil Diperbarui',
          text: 'Data identitas dan preferensi Anda telah disimpan.',
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memperbarui Profil',
          text: err.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil.',
        });
      }
    }
  };

  // Metrics computation
  const stats = useMemo(() => {
    const totalCount = tickets.length;
    const paidCount = tickets.filter((t) => t.status === 'PAID').length;
    const pendingCount = tickets.filter((t) => t.status === 'PENDING').length;
    const totalSpent = tickets
      .filter((t) => t.status === 'PAID')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    return { totalCount, paidCount, pendingCount, totalSpent };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  return (
    <div className="position-relative py-5 min-vh-100" style={{ backgroundColor: '#0b0616', color: '#fff' }}>
      {/* Background Geometric Grid Pattern */}
      <div className="pattern-geometric-overlay" style={{ opacity: 0.2 }}></div>

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      <div className="container position-relative" style={{ zIndex: 1 }}>
        {/* Header Profile Greeting Card */}
        <div className="luxury-glass-card p-4 p-md-5 mb-5 anim-fade-in">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
            <div className="d-flex align-items-center gap-4">
              {/* Avatar with Gold Glow & Upload Trigger */}
              <div
                className="position-relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Klik untuk mengubah foto profil (Cloudinary)"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="rounded-circle shadow-lg"
                    style={{
                      width: '95px',
                      height: '95px',
                      objectFit: 'cover',
                      border: '3px solid var(--kikk-yellow)',
                      boxShadow: '0 0 25px rgba(255, 215, 0, 0.35)',
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-lg"
                    style={{
                      width: '95px',
                      height: '95px',
                      fontSize: '2.4rem',
                      background: 'linear-gradient(135deg, #2b1055, #7597de)',
                      color: 'var(--kikk-yellow)',
                      border: '3px solid var(--kikk-yellow)',
                      boxShadow: '0 0 25px rgba(255, 215, 0, 0.35)',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div
                  className="position-absolute bottom-0 end-0 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{
                    width: '32px',
                    height: '32px',
                    fontSize: '13px',
                    border: '2px solid #0b0616',
                    cursor: 'pointer',
                  }}
                  title="Ganti foto profil"
                >
                  <i className={`fas ${isUploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                </div>
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="gold-glow-badge" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                    <i className="fas fa-crown text-warning me-1"></i> VERIFIED ATTENDEE
                  </span>
                  <span className="status-indicator-badge">
                    <i className="fas fa-shield-alt"></i> Akun Aktif
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    <i className="fas fa-map-pin me-1 text-danger"></i> {userCity}
                  </span>
                </div>
                <h1 className="kikk-title m-0" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                  {user?.name}
                </h1>
                <p className="text-secondary m-0 mt-1" style={{ fontSize: '14px' }}>
                  <i className="far fa-envelope me-1 text-warning"></i> {user?.email}
                  <span className="mx-2">&bull;</span>
                  <i className="fab fa-whatsapp me-1 text-success"></i> {user?.phone || 'Nomor WhatsApp belum diatur'}
                </p>
                <p className="m-0 mt-1 small" style={{ color: 'rgba(255, 255, 255, 0.55)', fontStyle: 'italic' }}>
                  <i className="fas fa-quote-left text-warning me-1"></i> {userBio}
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="d-flex flex-wrap gap-2">
              <button
                onClick={handleEditProfile}
                className="btn-kikk-outline px-4 py-2"
                style={{ fontSize: '14px', borderRadius: '12px' }}
                title="Perbarui biodata profil lengkap"
              >
                <i className="fas fa-user-gear me-2 text-warning"></i> Edit Profil
              </button>
              <Link
                to="/events"
                className="btn-kikk px-4 py-2"
                style={{ fontSize: '14px', borderRadius: '12px' }}
              >
                <i className="fas fa-compass me-2"></i> Jelajahi Acara
              </Link>
            </div>
          </div>

          {/* Symmetrical 4-Column Metrics Bar */}
          <div className="row g-3 mt-4 pt-4 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="stat-box-luxury h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                >
                  <i className="fas fa-ticket-alt text-warning fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small fw-medium">Total Koleksi</div>
                  <div className="fs-4 fw-bold text-white">{stats.totalCount} Tiket</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="stat-box-luxury h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', flexShrink: 0 }}
                >
                  <i className="fas fa-circle-check text-success fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small fw-medium">Siap Digunakan</div>
                  <div className="fs-4 fw-bold text-white">{stats.paidCount} Lunas</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="stat-box-luxury h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px', background: 'rgba(234, 179, 8, 0.1)', flexShrink: 0 }}
                >
                  <i className="fas fa-hourglass-half text-warning fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small fw-medium">Menunggu Bayar</div>
                  <div className="fs-4 fw-bold text-white">{stats.pendingCount} Transaksi</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="stat-box-luxury h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', flexShrink: 0 }}
                >
                  <i className="fas fa-receipt text-info fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small fw-medium">Total Investasi Acara</div>
                  <div className="fs-5 fw-bold text-warning">{formatRupiah(stats.totalSpent)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header & Filters */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="kikk-title m-0" style={{ fontSize: '1.8rem' }}>
              <i className="fas fa-ticket-alt text-warning me-2"></i> Tiket & Riwayat Pemesanan
            </h2>
            <p className="text-secondary small m-0 mt-1">
              Boarding pass digital resmi dilengkapi QR Code terenkripsi untuk check-in di gerbang acara.
            </p>
          </div>

          {/* Filter Pills with Specific Icons */}
          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`category-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            >
              <i className="fas fa-layer-group"></i> Semua ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`category-pill ${statusFilter === 'PAID' ? 'active' : ''}`}
            >
              <i className="fas fa-circle-check text-success"></i> Aktif / Lunas ({stats.paidCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`category-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
            >
              <i className="fas fa-hourglass-half text-warning"></i> Menunggu ({stats.pendingCount})
            </button>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)', width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-3">Sinkronisasi tiket konser Anda...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="d-flex flex-column gap-4">
            {filteredTickets.map((t, idx) => (
              <div
                key={t.id}
                className={`ticket-stub anim-fade-in anim-delay-${(idx % 4) + 1}`}
              >
                <div className="row g-0">
                  {/* Left Ticket Pass Body */}
                  <div className="col-lg-8 p-4 p-md-5 d-flex flex-column justify-content-between">
                    <div>
                      {/* Top Header of Ticket */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <span className="gold-glow-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          <i className="fas fa-crown text-warning me-1"></i> {t.ticketCategoryName || 'VIP PASS'}
                        </span>
                        <div className="text-secondary small font-monospace">
                          <i className="fas fa-fingerprint me-1 text-warning"></i> REF ID: {t.id}
                        </div>
                      </div>

                      {/* Event Name */}
                      <h3 className="kikk-title text-white mb-3" style={{ fontSize: '1.6rem' }}>
                        {t.eventName}
                      </h3>

                      {/* Event Date & Location */}
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-2 text-secondary small">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '34px', height: '34px', background: 'rgba(255, 215, 0, 0.1)' }}
                            >
                              <i className="far fa-calendar-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>JADWAL ACARA</div>
                              <div className="text-white fw-semibold">{t.eventDate || 'Jadwal diumumkan segera'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-2 text-secondary small">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '34px', height: '34px', background: 'rgba(255, 215, 0, 0.1)' }}
                            >
                              <i className="fas fa-map-marker-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>LOKASI VENUE</div>
                              <div className="text-white fw-semibold">{t.eventLocation || 'Venue Utama'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Holder & Quantity Meta */}
                    <div
                      className="p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>PEMEGANG TIKET</div>
                        <div className="text-white fw-bold">
                          <i className="fas fa-user text-warning me-1"></i> {user?.name}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>KUOTA KURSI</div>
                        <div className="text-warning fw-bold">
                          <i className="fas fa-users me-1"></i> {t.quantity} Tiket
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>STATUS CHECK-IN</div>
                        <div className="text-white small">
                          <i className="fas fa-qrcode text-warning me-1"></i> QR Siap Scan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Perforated Stub (Boarding Pass Stub) */}
                  <div className="col-lg-4 ticket-perforation p-4 p-md-5 d-flex flex-column justify-content-between align-items-center text-center" style={{ background: 'rgba(10, 5, 25, 0.5)' }}>
                    {/* Top Status */}
                    <div className="w-100">
                      <div className="mb-2">
                        {t.status === 'PAID' ? (
                          <span
                            className="badge bg-success text-white"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-circle-check me-1"></i> TIKET LUNAS (AKTIF)
                          </span>
                        ) : t.status === 'PENDING' ? (
                          <span
                            className="badge bg-warning text-dark"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-hourglass-half me-1"></i> MENUNGGU PEMBAYARAN
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary text-white"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            {t.status}
                          </span>
                        )}
                      </div>

                      <div className="my-3">
                        <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          BOOKING CODE
                        </div>
                        <div
                          className="font-monospace fs-4 fw-bold"
                          style={{ color: 'var(--kikk-yellow)', letterSpacing: '3px' }}
                        >
                          {t.id?.substring(0, 8).toUpperCase()}
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="p-2 rounded mb-4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>TOTAL TRANSAKSI</div>
                        <div className="fs-5 fw-bold text-white">
                          {formatRupiah(t.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Download / Action Button */}
                    <div className="w-100">
                      {t.status === 'PAID' ? (
                        <a
                          href={`/api/bookings/${t.id}/ticket-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                          style={{ fontSize: '13px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-file-pdf"></i> Unduh E-Ticket (PDF)
                        </a>
                      ) : (
                        <Link
                          to={`/events`}
                          className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                          style={{ fontSize: '13px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-credit-card"></i> Selesaikan Pesanan
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="luxury-glass-card text-center py-5 px-4 anim-fade-in">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
              style={{
                width: '90px',
                height: '90px',
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.25)',
              }}
            >
              <i className="fas fa-ticket-alt" style={{ fontSize: '38px', color: 'var(--kikk-yellow)' }}></i>
            </div>
            <h3 className="kikk-title mb-2" style={{ fontSize: '1.8rem' }}>
              Belum Ada Tiket yang Dimiliki
            </h3>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '480px', fontSize: '14px', lineHeight: 1.6 }}>
              Anda belum memiliki tiket untuk kategori ini. Jelajahi festival musik, konferensi teknologi, dan pameran seni spektakuler di EventEase.
            </p>
            <Link to="/events" className="btn-kikk px-4 py-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
              <i className="fas fa-compass me-2"></i> Jelajahi Acara Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
