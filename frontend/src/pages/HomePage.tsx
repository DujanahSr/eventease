import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { EventSummary, Category } from '../types';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventsData, catData] = await Promise.all([
          eventService.getEvents(searchQuery, selectedCategory, 0, 6),
          eventService.getCategories(),
        ]);
        setEvents(eventsData.content || []);
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/events?search=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`);
  };

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('musik') || lower.includes('konser')) return 'fa-music text-warning';
    if (lower.includes('tekno') || lower.includes('ai') || lower.includes('cloud')) return 'fa-laptop-code text-info';
    if (lower.includes('seni') || lower.includes('art') || lower.includes('desain')) return 'fa-palette text-danger';
    if (lower.includes('bisnis') || lower.includes('startup') || lower.includes('summit')) return 'fa-chart-line text-success';
    if (lower.includes('olahraga') || lower.includes('marathon') || lower.includes('sport')) return 'fa-running text-primary';
    if (lower.includes('kuliner') || lower.includes('food')) return 'fa-utensils text-warning';
    return 'fa-calendar-alt text-warning';
  };

  return (
    <div className="pattern-geometric-overlay">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>

        <div className="container hero-content py-5">
          {/* Live Platform Badge */}
          <div className="d-inline-flex align-items-center gap-2 gold-glow-badge mb-4 anim-fade-in">
            <span className="live-pulse-dot"></span>
            <span>PLATFORM TIKET MASA DEPAN &bull; 2026 EDITION</span>
          </div>

          {/* Main Hero Title */}
          <h1
            className="hero-title kikk-title anim-fade-in anim-delay-1"
            style={{
              fontSize: 'clamp(2.8rem, 6.2vw, 5.8rem)',
              marginBottom: '25px',
              textTransform: 'uppercase',
              letterSpacing: '-1.5px',
            }}
          >
            Temukan Momen
            <br />
            <span
              style={{
                color: 'var(--kikk-yellow)',
                fontStyle: 'italic',
                textShadow: '0 0 35px rgba(255, 215, 0, 0.35)',
              }}
            >
              Paling Berkesan
            </span>
          </h1>

          <p
            className="hero-subtitle anim-fade-in anim-delay-2"
            style={{
              lineHeight: '1.8',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            Jelajahi konser spektakuler, festival internasional, dan konferensi eksklusif.
            Dilengkapi proteksi anti-calo <span className="text-warning fw-semibold">Token Bucket</span> dan
            validasi gerbang realtime <span className="text-warning fw-semibold">WebSocket STOMP</span>.
          </p>

          {/* Interactive Search Bar Glassmorphism */}
          <div className="anim-fade-in anim-delay-3">
            <form onSubmit={handleSearch} className="search-glass">
              <i className="fas fa-search ms-3 me-2" style={{ color: 'var(--kikk-yellow)', fontSize: '1.1rem' }}></i>
              <input
                type="text"
                className="search-input"
                placeholder="Cari artis, festival, atau nama acara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="search-divider d-none d-md-block"></div>
              <div className="d-none d-md-flex align-items-center ps-2 pe-3">
                <i className="fas fa-filter text-secondary me-2"></i>
                <select
                  className="search-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-search d-flex align-items-center justify-content-center gap-2">
                <span>EKSPLORASI</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>

          {/* 4 Trust & Metrics Strips */}
          <div className="row g-3 mt-4 pt-3 justify-content-center text-start anim-fade-in anim-delay-4">
            <div className="col-6 col-lg-3">
              <div className="stat-box-luxury">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '44px', height: '44px', background: 'rgba(255,215,0,0.12)', color: 'var(--kikk-yellow)', fontSize: '1.2rem' }}
                >
                  <i className="fas fa-ticket-alt"></i>
                </div>
                <div>
                  <div className="fw-bold text-white fs-5 lh-1">50.000+</div>
                  <div className="text-secondary small mt-1">Tiket Terdistribusi</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-box-luxury">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '44px', height: '44px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '1.2rem' }}
                >
                  <i className="fas fa-qrcode"></i>
                </div>
                <div>
                  <div className="fw-bold text-white fs-5 lh-1">&lt; 1 Detik</div>
                  <div className="text-secondary small mt-1">Scan Gate In Live</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-box-luxury">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '44px', height: '44px', background: 'rgba(168,85,247,0.12)', color: '#c084fc', fontSize: '1.2rem' }}
                >
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <div className="fw-bold text-white fs-5 lh-1">Anti-Scalper</div>
                  <div className="text-secondary small mt-1">Token Bucket Redis</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-box-luxury">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '44px', height: '44px', background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '1.2rem' }}
                >
                  <i className="fas fa-file-excel"></i>
                </div>
                <div>
                  <div className="fw-bold text-white fs-5 lh-1">Excel 5.3</div>
                  <div className="text-secondary small mt-1">Ekspor Laporan Cepat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Quick Pills Strip */}
      <section className="py-4 border-top border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(11, 6, 22, 0.7)' }}>
        <div className="container">
          <div className="d-flex align-items-center gap-2 overflow-auto py-2 no-scrollbar">
            <span className="text-secondary small text-uppercase fw-semibold me-2 d-none d-md-inline" style={{ letterSpacing: '1px' }}>
              <i className="fas fa-compass me-1 text-warning"></i> Kategori:
            </span>
            <button
              type="button"
              className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              <i className="fas fa-layer-group"></i>
              <span>Semua Acara</span>
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              >
                <i className={`fas ${getCategoryIcon(cat.name)}`}></i>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Events Catalog Section */}
      <section className="section-padding" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <div className="gold-glow-badge mb-2">
                <i className="fas fa-fire me-1"></i> EKSPLORASI TIKET
              </div>
              <h2 className="kikk-title m-0" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                Acara Mendatang
              </h2>
            </div>
            <Link
              to="/events"
              className="btn-kikk-outline d-none d-md-flex align-items-center gap-2"
              style={{ padding: '12px 28px', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <span>Lihat Semua Katalog</span>
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--kikk-yellow)', width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-3">Menghubungkan ke katalog acara...</p>
            </div>
          ) : (
            <div className="row g-4">
              {events.length > 0 ? (
                events.map((event) => (
                  <div className="col-lg-4 col-md-6" key={event.id}>
                    <div
                      className="luxury-glass-card event-card position-relative p-0 overflow-hidden h-100"
                      onClick={() => navigate(`/events/${event.id}`)}
                      style={{ cursor: 'pointer', borderTop: '2px solid rgba(255,215,0,0.2)' }}
                    >
                      <div className="position-relative overflow-hidden" style={{ height: '230px' }}>
                        <img
                          className="w-100 h-100"
                          style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }}
                          src={event.imageUrl || '/images/kikk_hero_stage.jpg'}
                          alt={event.name}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(11,6,22,0.9) 0%, transparent 60%)',
                          }}
                        ></div>
                      </div>

                      {/* Floating Badges */}
                      <div className="event-badge">
                        <i className="fas fa-crown me-1"></i> {event.categoryName || 'Unggulan'}
                      </div>
                      <div className="event-date d-flex flex-column align-items-center justify-content-center">
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{event.date}</span>
                      </div>

                      <div className="card-body p-4 d-flex flex-column">
                        <h4 className="kikk-title mb-2 text-truncate fs-5" title={event.name}>
                          {event.name}
                        </h4>

                        <div className="d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--kikk-yellow)', fontSize: '0.88rem' }}>
                          <i className="fas fa-map-marker-alt"></i>
                          <span className="text-truncate">{event.location}</span>
                        </div>

                        <p
                          className="mb-4"
                          style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: '1.6' }}
                        >
                          {event.description?.length > 85
                            ? event.description.substring(0, 85) + '...'
                            : event.description}
                        </p>

                        <div className="mt-auto pt-3 d-flex justify-content-between align-items-center border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="d-flex align-items-center gap-2"
                            style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}
                          >
                            <i className="fas fa-building text-secondary"></i>
                            <span className="text-truncate" style={{ maxWidth: '120px' }}>
                              {event.organizerName || 'Eventease'}
                            </span>
                          </div>
                          <Link
                            to={`/events/${event.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="btn-kikk py-2 px-3"
                            style={{ fontSize: '0.82rem', borderRadius: '25px' }}
                          >
                            <span>Pesan Tiket</span>
                            <i className="fas fa-arrow-right small"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5 luxury-glass-card mt-3">
                  <div style={{ fontSize: '3.5rem', color: 'rgba(255,215,0,0.2)', marginBottom: '15px' }}>
                    <i className="fas fa-search"></i>
                  </div>
                  <h4 className="kikk-title mb-2">Acara Belum Ditemukan</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Coba gunakan kata kunci lain atau pilih kategori acara yang berbeda.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-5 d-block d-md-none">
            <Link to="/events" className="btn-kikk-outline w-100 justify-content-center">
              Lihat Semua Katalog Acara
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Enterprise Architecture Features Showcase */}
      <section className="py-5" style={{ background: 'rgba(6, 3, 12, 0.75)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <div className="gold-glow-badge mb-3">
              <i className="fas fa-microchip me-1"></i> STANDAR TEKNOLOGI ENTERPRISE
            </div>
            <h2 className="kikk-title" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)' }}>
              Mengapa Memilih Eventease?
            </h2>
            <p className="text-secondary mx-auto mt-2" style={{ maxWidth: '650px', fontSize: '1rem' }}>
              Infrastruktur teruji untuk kelancaran *ticket war*, verifikasi pintu masuk tanpa antrean, dan transparansi finansial akurat.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="luxury-glass-card p-4 h-100 pattern-wireframe-card">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center mb-4"
                  style={{ width: '56px', height: '56px', background: 'rgba(255,215,0,0.12)', color: 'var(--kikk-yellow)', fontSize: '1.5rem', border: '1px solid rgba(255,215,0,0.25)' }}
                >
                  <i className="fas fa-user-shield"></i>
                </div>
                <h4 className="text-white fs-5 fw-bold mb-2">Anti-Bot & Calo</h4>
                <p className="text-secondary small mb-0" style={{ lineHeight: '1.7' }}>
                  Dilindungi algoritma Token Bucket (Bucket4j + Redis) membatasi checkout massal oleh bot/skrip calo secara otomatis.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="luxury-glass-card p-4 h-100 pattern-wireframe-card">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center mb-4"
                  style={{ width: '56px', height: '56px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '1.5rem', border: '1px solid rgba(59,130,246,0.25)' }}
                >
                  <i className="fas fa-broadcast-tower"></i>
                </div>
                <h4 className="text-white fs-5 fw-bold mb-2">Realtime Gate STOMP</h4>
                <p className="text-secondary small mb-0" style={{ lineHeight: '1.7' }}>
                  Scan QR code tiket via kamera ponsel dengan notifikasi kehadiran pop-up instan ke dashboard panitia tanpa refresh.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="luxury-glass-card p-4 h-100 pattern-wireframe-card">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center mb-4"
                  style={{ width: '56px', height: '56px', background: 'rgba(168,85,247,0.12)', color: '#c084fc', fontSize: '1.5rem', border: '1px solid rgba(168,85,247,0.25)' }}
                >
                  <i className="fas fa-credit-card"></i>
                </div>
                <h4 className="text-white fs-5 fw-bold mb-2">Midtrans Snap Pay</h4>
                <p className="text-secondary small mb-0" style={{ lineHeight: '1.7' }}>
                  Transaksi instan dengan QRIS, Virtual Account bank, dan kartu kredit disertai webhook callback otomatis aman.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="luxury-glass-card p-4 h-100 pattern-wireframe-card">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center mb-4"
                  style={{ width: '56px', height: '56px', background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '1.5rem', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <h4 className="text-white fs-5 fw-bold mb-2">Laporan Excel POI</h4>
                <p className="text-secondary small mb-0" style={{ lineHeight: '1.7' }}>
                  Download rekap data penjualan tiket ke format spreadsheet (.xlsx) lengkap dengan formula akuntansi dan format rupiah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action (Organizer Invitation) */}
      <section className="section-padding">
        <div className="container">
          <div
            className="luxury-glass-card p-5 text-center position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(15,10,30,0.85) 60%)',
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            <div className="gold-glow-badge mb-3">
              <i className="fas fa-star me-1"></i> GABUNG SEBAGAI PENYELENGGARA
            </div>
            <h2 className="kikk-title mb-3" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>
              Punya Acara Menarik?
            </h2>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '1.05rem', lineHeight: '1.7' }}>
              Publikasikan konser, pameran, atau festival Anda sekarang. Dapatkan kontrol kuota tiket berlapis, gate scanner live, dan pencairan dana langsung ke rekening Anda.
            </p>
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              <Link to="/register" className="btn-kikk py-3 px-5">
                <i className="fas fa-rocket me-2"></i>
                <span>Mulai Buat Acara Gratis</span>
              </Link>
              <Link to="/events" className="btn-kikk-outline py-3 px-4">
                <span>Eksplorasi Contoh Acara</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
