import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { mediaService } from '../services/mediaService';
import { UserFloatingDock } from '../components/UserFloatingDock';
import Swal from 'sweetalert2';

export const UserDashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [tickets, setTickets] = useState<BookingResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata profil pengguna
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
        title: 'Foto Profil Diperbarui',
        text: `Foto profil Anda telah diperbarui.`,
        timer: 1800,
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
    const paidTickets = tickets.filter((t) => t.status === 'PAID');
    const pendingTickets = tickets.filter((t) => t.status === 'PENDING');
    const totalSpent = paidTickets.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    return {
      totalCount,
      paidCount: paidTickets.length,
      pendingCount: pendingTickets.length,
      totalSpent,
      nextTicket: paidTickets[0] || null,
    };
  }, [tickets]);

  return (
    <div
      className="position-relative min-vh-100 pb-5"
      style={{
        backgroundColor: '#0b0616',
        backgroundImage: "url('/images/editorial_luxury_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        color: '#ffffff',
      }}
    >
      {/* Dark Ambient Vignette Overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 6, 22, 0.75) 0%, rgba(11, 6, 22, 0.95) 100%)',
          pointerEvents: 'none',
        }}
      ></div>

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        {/* Editorial Top Profile Card */}
        <div className="luxury-glass-card p-4 p-md-5 mb-5 anim-fade-in">
          <div className="row align-items-center g-4">
            {/* Left: Avatar with Gold Ring & Info */}
            <div className="col-lg-8">
              <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
                <div
                  className="position-relative cursor-pointer align-self-start align-self-sm-center"
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk mengubah foto profil"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="rounded-circle shadow-lg"
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        border: '3px solid #FFD700',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.35)',
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-lg"
                      style={{
                        width: '100px',
                        height: '100px',
                        fontSize: '2.5rem',
                        background: 'linear-gradient(135deg, #2b1055, #7597de)',
                        color: '#FFD700',
                        border: '3px solid #FFD700',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.35)',
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div
                    className="position-absolute bottom-0 end-0 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow"
                    style={{ width: '32px', height: '32px', fontSize: '13px', border: '2px solid #0b0616' }}
                  >
                    <i className={`fas ${isUploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                  </div>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <span className="gold-glow-badge" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      <i className="fas fa-certificate text-warning me-1"></i> VERIFIED ATTENDEE
                    </span>
                    <span className="status-indicator-badge">
                      <i className="fas fa-shield-alt"></i> Akun Terverifikasi
                    </span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                      <i className="fas fa-map-marker-alt me-1 text-warning"></i> {userCity}
                    </span>
                  </div>

                  <h1 className="kikk-title m-0" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.5px' }}>
                    {user?.name}
                  </h1>

                  <p className="text-secondary m-0 mt-1" style={{ fontSize: '14px' }}>
                    <i className="far fa-envelope me-1 text-warning"></i> {user?.email}
                    <span className="mx-2">|</span>
                    <i className="fab fa-whatsapp me-1 text-success"></i> {user?.phone || 'Nomor WhatsApp belum diatur'}
                  </p>

                  <p className="m-0 mt-2 small" style={{ color: 'rgba(255, 255, 255, 0.65)', fontStyle: 'italic', maxWidth: '520px' }}>
                    <i className="fas fa-quote-left text-warning me-1"></i> {userBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="col-lg-4 text-lg-end">
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                <button
                  onClick={handleEditProfile}
                  className="btn-kikk-outline px-4 py-2"
                  style={{ fontSize: '13px', borderRadius: '12px' }}
                >
                  <i className="fas fa-user-gear me-2 text-warning"></i> Edit Profil
                </button>
                <Link
                  to="/my-tickets"
                  className="btn-kikk px-4 py-2"
                  style={{ fontSize: '13px', borderRadius: '12px' }}
                >
                  <i className="fas fa-ticket-alt me-2"></i> Tiket Saya ({tickets.length})
                </Link>
              </div>
            </div>
          </div>

          {/* Minimalist Editorial Metrics Strip */}
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
                  <div className="fs-4 fw-bold text-white">{stats.pendingCount} Tagihan</div>
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
                  <div className="text-secondary small fw-medium">Total Nilai Investasi</div>
                  <div className="fs-5 fw-bold text-warning">{formatRupiah(stats.totalSpent)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Next Upcoming Event Highlight (Monarque Editorial Card) */}
        <div className="row g-4 mb-5">
          <div className="col-lg-8">
            <div className="luxury-glass-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between anim-fade-in anim-delay-1">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="gold-glow-badge" style={{ fontSize: '11px' }}>
                    <i className="fas fa-star text-warning me-1"></i> RESERVASI UTAMA
                  </span>
                  <Link to="/my-tickets" className="text-warning small text-decoration-none fw-semibold">
                    Semua Tiket ({tickets.length}) <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>

                {stats.nextTicket ? (
                  <div>
                    <h2 className="kikk-title text-white mb-3" style={{ fontSize: '1.8rem' }}>
                      {stats.nextTicket.eventName}
                    </h2>
                    <div className="row g-3 mb-4">
                      <div className="col-sm-6">
                        <div className="d-flex align-items-center gap-2 text-secondary small">
                          <i className="far fa-calendar-alt text-warning fs-5"></i>
                          <div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>TANGGAL ACARA</div>
                            <div className="text-white fw-semibold">{stats.nextTicket.eventDate || '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="d-flex align-items-center gap-2 text-secondary small">
                          <i className="fas fa-map-marker-alt text-warning fs-5"></i>
                          <div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>VENUE</div>
                            <div className="text-white fw-semibold">{stats.nextTicket.eventLocation || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>TIER TIKET</div>
                        <div className="text-warning fw-bold">{stats.nextTicket.ticketCategoryName || 'General'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>BOOKING ID</div>
                        <div className="font-monospace text-white fw-semibold">{stats.nextTicket.id?.substring(0, 8).toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="badge bg-success text-white py-2 px-3 rounded-pill">
                          <i className="fas fa-circle-check me-1"></i> TIKET LUNAS (AKTIF)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-ticket-alt text-secondary mb-3" style={{ fontSize: '42px', opacity: 0.5 }}></i>
                    <h3 className="kikk-title fs-5 mb-2">Belum Ada Tiket yang Dimiliki</h3>
                    <p className="text-secondary small mx-auto mb-4" style={{ maxWidth: '420px' }}>
                      Amankan tiket festival musik dunia dan pameran seni interaktif favorit Anda sebelum kehabisan.
                    </p>
                  </div>
                )}
              </div>

              <div>
                {stats.nextTicket ? (
                  <div className="d-flex flex-wrap gap-2">
                    <a
                      href={`/api/bookings/${stats.nextTicket.id}/ticket-pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-kikk btn-sm py-2 px-4"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="fas fa-file-pdf me-1"></i> Unduh E-Ticket PDF
                    </a>
                    <Link
                      to="/my-tickets"
                      className="btn-kikk-outline btn-sm py-2 px-4"
                      style={{ borderRadius: '10px' }}
                    >
                      Kelola di Halaman Tiket
                    </Link>
                  </div>
                ) : (
                  <Link to="/events" className="btn-kikk btn-sm py-2 px-4" style={{ borderRadius: '10px' }}>
                    <i className="fas fa-compass me-1"></i> Jelajahi Katalog Acara
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right: Curated Experience Showcase Card */}
          <div className="col-lg-4">
            <div
              className="luxury-glass-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between anim-fade-in anim-delay-2 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(20, 10, 35, 0.7) 0%, rgba(10, 5, 20, 0.95) 100%), url('/images/kikk_hero_stage.jpg') center/cover no-repeat",
              }}
            >
              <div>
                <span className="gold-glow-badge mb-3" style={{ fontSize: '10px' }}>
                  <i className="fas fa-sparkles text-warning me-1"></i> KURASI MINGGU INI
                </span>
                <h3 className="kikk-title text-white mb-2" style={{ fontSize: '1.5rem' }}>
                  Festival Musik & Seni Digital 2026
                </h3>
                <p className="text-secondary small mb-4" style={{ lineHeight: 1.6 }}>
                  Akses instan ribuan tiket konser eksklusif dengan proteksi anti-calo Token Bucket & pembayaran Midtrans Snap otomatis.
                </p>
              </div>

              <div>
                <Link
                  to="/events"
                  className="btn-kikk w-100 text-center py-2"
                  style={{ borderRadius: '10px', fontSize: '13px' }}
                >
                  <i className="fas fa-compass me-2"></i> Cari Acara Favorit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock onOpenSettings={handleEditProfile} />
    </div>
  );
};
