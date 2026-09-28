import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { UserFloatingDock } from '../components/UserFloatingDock';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<BookingResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      {/* ═══ SECTION 1: INFORMATIONAL HERO BANNER ═══ */}
      <section className="position-relative overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Cinematic BG */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          backgroundImage: "url('/images/user_dashboard_bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.45) saturate(1.2)',
        }} />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'linear-gradient(180deg, rgba(10,5,20,0.2) 0%, rgba(10,5,20,0.92) 100%)',
        }} />

        <div className="container position-relative d-flex flex-column justify-content-center" style={{ zIndex: 1, paddingTop: '110px', paddingBottom: '60px' }}>
          {/* Greeting Badge */}
          <div className="mb-3">
            <span style={{
              fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase',
              color: '#FFD700', fontWeight: 600,
            }}>
              <i className="fas fa-hand-sparkles me-2" />
              Selamat datang kembali, {firstName}
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 700, lineHeight: 1.08,
            margin: 0, letterSpacing: '-1.5px',
            maxWidth: '700px',
          }}>
            Temukan Acara<br />
            <span style={{ color: '#FFD700', fontStyle: 'italic' }}>Terbaik</span> di Sekitar Anda
          </h1>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
            margin: '20px 0 28px', maxWidth: '540px', lineHeight: 1.7,
          }}>
            Jelajahi konser eksklusif, festival seni internasional, dan konferensi teknologi terdepan. Semua tiket dilindungi proteksi anti-calo dan pembayaran instan.
          </p>

          {/* CTA Buttons */}
          <div className="d-flex flex-wrap gap-3">
            <Link to="/events" className="btn-kikk py-3 px-5" style={{ borderRadius: '16px', fontSize: '14px' }}>
              <i className="fas fa-compass me-2" /> Jelajahi Katalog Acara
            </Link>
            <Link to="/my-tickets" className="btn-kikk-outline py-3 px-5" style={{ borderRadius: '16px', fontSize: '14px' }}>
              <i className="fas fa-ticket-alt me-2" style={{ color: '#FFD700' }} /> Tiket Saya ({stats.total})
            </Link>
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
          {/* Main: Next Event Spotlight */}
          <div className="col-lg-7">
            <div style={{
              position: 'relative', borderRadius: '28px', overflow: 'hidden',
              minHeight: '420px', display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', padding: 'clamp(24px, 4vw, 48px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
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
      <UserFloatingDock />
    </div>
  );
};
