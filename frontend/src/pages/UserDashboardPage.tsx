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

  const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Ukuran Terlalu Besar', text: 'Batas maksimal foto profil adalah 5 MB.' });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      Swal.fire({ title: 'Mengunggah Foto Profil...', text: 'Menyimpan ke Cloud Storage...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await mediaService.uploadImage(file, 'avatars');
      await updateProfile({ profilePicture: res.url });
      Swal.fire({ icon: 'success', title: 'Foto Profil Diperbarui', timer: 1800, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Mengunggah', text: err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditProfile = async () => {
    const { value: v } = await Swal.fire({
      title: 'Pengaturan Profil', width: 560,
      html: `
        <div style="text-align:left;font-size:14px;margin-top:15px">
          <div style="margin-bottom:16px;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.15);border-radius:10px;display:flex;justify-content:space-between;align-items:center">
            <div><div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.5px">EMAIL</div><div style="color:#fff;font-weight:600;font-size:13px">${user?.email || '-'}</div></div>
            <span style="background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:3px 8px;border-radius:6px;font-size:11px"><i class="fas fa-shield-alt"></i> Terverifikasi</span>
          </div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-user me-2"></i>Nama Lengkap</label><input id="swal-input-name" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${user?.name || ''}" placeholder="Nama lengkap"></div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fab fa-whatsapp me-2"></i>WhatsApp</label><input id="swal-input-phone" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${user?.phone || ''}" placeholder="081234567890"></div>
          <div style="margin-bottom:14px"><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-map-marker-alt me-2"></i>Kota</label><input id="swal-input-city" class="swal2-input" style="width:100%;margin:0;box-sizing:border-box" value="${userCity}" placeholder="Jakarta, Indonesia"></div>
          <div><label style="display:block;margin-bottom:6px;font-weight:600;color:#FFD700;font-size:13px"><i class="fas fa-quote-left me-2"></i>Bio Singkat</label><textarea id="swal-input-bio" class="swal2-textarea" style="width:100%;margin:0;box-sizing:border-box;height:75px;resize:none" placeholder="Minat acara Anda...">${userBio}</textarea></div>
        </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: '<i class="fas fa-save me-1"></i> Simpan',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Batal',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-input-phone') as HTMLInputElement).value;
        const city = (document.getElementById('swal-input-city') as HTMLInputElement).value;
        const bio = (document.getElementById('swal-input-bio') as HTMLTextAreaElement).value;
        if (!name.trim()) { Swal.showValidationMessage('Nama tidak boleh kosong'); return false; }
        return { name: name.trim(), phone: phone.trim(), city: city.trim(), bio: bio.trim() };
      },
    });
    if (v) {
      try {
        await updateProfile({ name: v.name, phone: v.phone });
        setUserCity(v.city); setUserBio(v.bio);
        localStorage.setItem('user_city', v.city); localStorage.setItem('user_bio', v.bio);
        Swal.fire({ icon: 'success', title: 'Profil Diperbarui', timer: 1800, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Terjadi kesalahan.' });
      }
    }
  };

  const stats = useMemo(() => {
    const paid = tickets.filter((t) => t.status === 'PAID');
    const pending = tickets.filter((t) => t.status === 'PENDING');
    return {
      total: tickets.length,
      paid: paid.length,
      pending: pending.length,
      spent: paid.reduce((a, c) => a + (c.totalAmount || 0), 0),
      next: paid[0] || null,
    };
  }, [tickets]);

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="position-relative min-vh-100" style={{ backgroundColor: '#0a0514', color: '#fff' }}>
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />

      {/* ═══ SECTION 1: EDITORIAL HERO PROFILE BANNER ═══ */}
      <section className="position-relative overflow-hidden" style={{ minHeight: '420px' }}>
        {/* Cinematic BG */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundImage: "url('/images/user_dashboard_bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.4) saturate(1.2)',
        }} />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'linear-gradient(180deg, rgba(10,5,20,0.3) 0%, rgba(10,5,20,0.95) 100%)',
        }} />

        <div className="container position-relative" style={{ zIndex: 1, paddingTop: '80px', paddingBottom: '60px' }}>
          <div className="row align-items-end g-4">
            {/* Left: Avatar + Identity */}
            <div className="col-lg-7">
              <div className="d-flex align-items-end gap-4">
                {/* Avatar */}
                <div
                  className="position-relative flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                  title="Ganti foto profil"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture} alt={user.name}
                      style={{
                        width: '130px', height: '130px', objectFit: 'cover',
                        borderRadius: '24px', border: '3px solid rgba(255,215,0,0.4)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '130px', height: '130px', borderRadius: '24px',
                      background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 100%)',
                      border: '3px solid rgba(255,215,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '3.2rem', fontWeight: 700, color: '#FFD700',
                      fontFamily: "'Playfair Display', serif",
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    }}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: '-6px', right: '-6px',
                    width: '36px', height: '36px', borderRadius: '12px',
                    background: '#FFD700', color: '#0a0514',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', boxShadow: '0 4px 12px rgba(255,215,0,0.4)',
                  }}>
                    <i className={`fas ${isUploadingAvatar ? 'fa-spinner fa-spin' : 'fa-camera'}`} />
                  </div>
                </div>

                {/* Identity Text */}
                <div style={{ paddingBottom: '4px' }}>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <span style={{
                      fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                      color: '#FFD700', fontWeight: 600,
                    }}>
                      <i className="fas fa-gem me-1" /> VERIFIED ATTENDEE
                    </span>
                    <span style={{
                      fontSize: '10px', letterSpacing: '1px',
                      color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                    }}>
                      <i className="fas fa-map-pin me-1" /> {userCity}
                    </span>
                  </div>

                  <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                    fontWeight: 700, lineHeight: 1.05,
                    margin: 0, letterSpacing: '-1px',
                  }}>
                    {user?.name}
                  </h1>

                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', margin: '10px 0 0', maxWidth: '420px', lineHeight: 1.6 }}>
                    <i className="fas fa-quote-left me-1" style={{ color: 'rgba(255,215,0,0.4)', fontSize: '0.7rem' }} />
                    {userBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="col-lg-5">
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                <button onClick={handleEditProfile} className="btn-kikk-outline px-4 py-2" style={{ fontSize: '13px', borderRadius: '14px' }}>
                  <i className="fas fa-pen-to-square me-2" style={{ color: '#FFD700' }} /> Edit Profil
                </button>
                <Link to="/my-tickets" className="btn-kikk px-4 py-2" style={{ fontSize: '13px', borderRadius: '14px' }}>
                  <i className="fas fa-ticket-alt me-2" /> Tiket Saya
                </Link>
              </div>

              {/* Contact Info - subtle */}
              <div className="d-flex flex-wrap gap-3 mt-3 justify-content-lg-end" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                <span><i className="far fa-envelope me-1" style={{ color: 'rgba(255,215,0,0.5)' }} />{user?.email}</span>
                <span><i className="fab fa-whatsapp me-1" style={{ color: 'rgba(34,197,94,0.6)' }} />{user?.phone || 'Belum diatur'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: EDITORIAL METRICS DIVIDER ═══ */}
      <section style={{
        borderTop: '1px solid rgba(255,215,0,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(10,5,20,0.6)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="container">
          <div className="d-flex justify-content-center align-items-stretch flex-wrap" style={{ minHeight: '100px' }}>
            {[
              { label: 'Total Koleksi', value: `${stats.total}`, sub: 'Tiket', icon: 'fa-layer-group', color: '#FFD700' },
              { label: 'Siap Digunakan', value: `${stats.paid}`, sub: 'Lunas', icon: 'fa-circle-check', color: '#4ade80' },
              { label: 'Menunggu Bayar', value: `${stats.pending}`, sub: 'Tagihan', icon: 'fa-clock', color: '#fbbf24' },
              { label: 'Total Investasi', value: fmt(stats.spent), sub: '', icon: 'fa-gem', color: '#60a5fa' },
            ].map((m, i, arr) => (
              <div key={i} className="d-flex align-items-center" style={{ padding: '28px 32px' }}>
                <div className="text-center">
                  <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontWeight: 600 }}>
                    <i className={`fas ${m.icon} me-1`} style={{ color: m.color, fontSize: '10px' }} />
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: m.sub ? '2rem' : '1.3rem',
                    fontWeight: 700, color: '#fff', lineHeight: 1,
                  }}>
                    {m.value}
                  </div>
                  {m.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{m.sub}</div>}
                </div>
                {i < arr.length - 1 && (
                  <div style={{
                    width: '1px', height: '50px', marginLeft: '32px',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(255,215,0,0.2) 50%, transparent 100%)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: ASYMMETRIC BENTO — NEXT EVENT + DISCOVER ═══ */}
      <section className="container" style={{ padding: '60px 0 80px' }}>
        <div className="row g-4">
          {/* Main: Next Event Spotlight (Monarque "Orchestrer l'inoubliable" style) */}
          <div className="col-lg-7">
            <div style={{
              position: 'relative', borderRadius: '28px', overflow: 'hidden',
              minHeight: '420px', display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', padding: 'clamp(24px, 4vw, 48px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* BG: Event image or default */}
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                backgroundImage: stats.next?.eventImageUrl
                  ? `url(${stats.next.eventImageUrl})`
                  : "url('/images/user_dashboard_bg.jpg')",
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'brightness(0.35) saturate(1.3)',
              }} />
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                background: 'linear-gradient(0deg, rgba(10,5,20,0.95) 0%, rgba(10,5,20,0.2) 50%, rgba(10,5,20,0.4) 100%)',
              }} />

              <div className="position-relative" style={{ zIndex: 1 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span style={{
                    fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase',
                    color: '#FFD700', fontWeight: 700,
                    borderBottom: '2px solid #FFD700', paddingBottom: '4px',
                  }}>
                    <i className="fas fa-star me-1" /> RESERVASI UTAMA
                  </span>
                  <Link to="/my-tickets" style={{
                    fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none', transition: 'color 0.3s',
                  }} className="hover-gold">
                    Semua Tiket ({stats.total}) <i className="fas fa-arrow-right ms-1" />
                  </Link>
                </div>

                {stats.next ? (
                  <>
                    <h2 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                      fontWeight: 700, lineHeight: 1.1,
                      margin: '0 0 20px', letterSpacing: '-0.5px',
                    }}>
                      {stats.next.eventName}
                    </h2>

                    {/* Event meta — horizontal editorial style */}
                    <div className="d-flex flex-wrap gap-4 mb-4" style={{ fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>Tanggal</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}><i className="far fa-calendar me-1" style={{ color: '#FFD700' }} />{stats.next.eventDate || '-'}</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }} />
                      <div>
                        <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>Venue</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}><i className="fas fa-map-pin me-1" style={{ color: '#FFD700' }} />{stats.next.eventLocation || '-'}</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }} />
                      <div>
                        <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>Tier</div>
                        <div style={{ color: '#FFD700', fontWeight: 600 }}>{stats.next.ticketCategoryName || 'General'}</div>
                      </div>
                    </div>

                    {/* Booking ribbon */}
                    <div className="d-flex flex-wrap align-items-center gap-3 mb-4" style={{
                      padding: '14px 20px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span className="font-monospace" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        <i className="fas fa-barcode me-1" /> {stats.next.id?.substring(0, 8).toUpperCase()}
                      </span>
                      <span style={{
                        background: 'rgba(34,197,94,0.12)', color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.25)',
                        padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      }}>
                        <i className="fas fa-circle-check me-1" /> TIKET AKTIF
                      </span>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <a href={`/api/bookings/${stats.next.id}/ticket-pdf`} target="_blank" rel="noreferrer"
                        className="btn-kikk py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px' }}>
                        <i className="fas fa-file-pdf me-1" /> Unduh E-Ticket
                      </a>
                      <Link to="/my-tickets" className="btn-kikk-outline py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px' }}>
                        Kelola Tiket
                      </Link>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <i className="fas fa-compass" style={{ fontSize: '3rem', color: 'rgba(255,215,0,0.15)', marginBottom: '16px', display: 'block' }} />
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
                      Mulai Petualangan Anda
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 20px' }}>
                      Temukan konser spektakuler, festival seni, dan pengalaman eksklusif yang menanti Anda.
                    </p>
                    <Link to="/events" className="btn-kikk py-2 px-5" style={{ borderRadius: '14px', fontSize: '13px' }}>
                      <i className="fas fa-compass me-2" /> Jelajahi Acara
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Stacked Cards */}
          <div className="col-lg-5 d-flex flex-column gap-4">
            {/* Card A: Curated Experience */}
            <div style={{
              flex: 1, borderRadius: '28px', overflow: 'hidden',
              position: 'relative', minHeight: '200px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: 'clamp(24px, 3vw, 36px)',
              background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0520 100%)',
              border: '1px solid rgba(255,215,0,0.08)',
            }}>
              {/* Decorative accent line */}
              <div style={{
                position: 'absolute', top: 0, left: '30px', right: '30px', height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
                opacity: 0.3,
              }} />
              <span style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#FFD700', fontWeight: 700, marginBottom: '12px', display: 'block' }}>
                <i className="fas fa-wand-magic-sparkles me-1" /> KURASI MINGGU INI
              </span>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.15, marginBottom: '12px' }}>
                Temukan Pengalaman<br />
                <span style={{ color: '#FFD700', fontStyle: 'italic' }}>Tak Terlupakan</span>
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                Akses tiket konser eksklusif dengan proteksi anti-calo dan pembayaran instan via Midtrans.
              </p>
              <Link to="/events" className="btn-kikk py-2 px-4" style={{ borderRadius: '14px', fontSize: '13px', alignSelf: 'flex-start' }}>
                <i className="fas fa-arrow-right me-2" /> Eksplorasi Sekarang
              </Link>
            </div>

            {/* Card B: Quick Stats Summary */}
            <div style={{
              borderRadius: '28px', padding: 'clamp(24px, 3vw, 32px)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                  <i className="fas fa-chart-simple me-1" style={{ color: '#FFD700' }} /> RINGKASAN AKUN
                </span>
                <Link to="/my-tickets" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }} className="hover-gold">
                  Detail <i className="fas fa-chevron-right ms-1" style={{ fontSize: '9px' }} />
                </Link>
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', fontWeight: 700, lineHeight: 1, color: '#fff' }}>
                    {stats.total}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                    Total tiket terdaftar
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div className="text-center">
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80' }}>{stats.paid}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Lunas</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
                  <div className="text-center">
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24' }}>{stats.pending}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock onOpenSettings={handleEditProfile} />
    </div>
  );
};
