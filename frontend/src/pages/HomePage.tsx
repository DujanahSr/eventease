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
            <i className="fas fa-sparkles text-warning"></i>
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

          {/* 4 Constellation Metrics — Orbital Nodes */}
          <div className="anim-fade-in anim-delay-4" style={{ marginTop: '48px' }}>
            {/* SVG Connector Lines (desktop only) */}
            <svg
              className="d-none d-lg-block"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                width: '100%',
                height: '2px',
                marginTop: '55px',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <line x1="12.5%" y1="1" x2="37.5%" y2="1" stroke="url(#constellationGrad)" strokeWidth="1" strokeDasharray="6 4" opacity="0.5">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="37.5%" y1="1" x2="62.5%" y2="1" stroke="url(#constellationGrad)" strokeWidth="1" strokeDasharray="6 4" opacity="0.5">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="62.5%" y1="1" x2="87.5%" y2="1" stroke="url(#constellationGrad)" strokeWidth="1" strokeDasharray="6 4" opacity="0.5">
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
              </line>
              <defs>
                <linearGradient id="constellationGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ffd700" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="row g-0 justify-content-center position-relative" style={{ zIndex: 1 }}>
              {[
                { value: '50.000+', label: 'Tiket Terdistribusi', icon: 'fa-ticket-alt', color: '#ffd700', bg: 'rgba(255,215,0,0.08)', ring: 'rgba(255,215,0,0.25)' },
                { value: '< 1 Dtk', label: 'Scan Gate In Live', icon: 'fa-bolt', color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', ring: 'rgba(59,130,246,0.25)' },
                { value: 'Anti-Scalp', label: 'Token Bucket Redis', icon: 'fa-shield-alt', color: '#c084fc', bg: 'rgba(168,85,247,0.08)', ring: 'rgba(168,85,247,0.25)' },
                { value: 'Excel POI', label: 'Ekspor Laporan Instan', icon: 'fa-file-invoice', color: '#4ade80', bg: 'rgba(34,197,94,0.08)', ring: 'rgba(34,197,94,0.25)' },
              ].map((stat, idx) => (
                <div className="col-6 col-lg-3" key={idx}>
                  <div
                    className="constellation-node"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '28px 12px',
                      position: 'relative',
                    }}
                  >
                    {/* Orbital Ring */}
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        border: `2px solid ${stat.ring}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        marginBottom: '18px',
                        background: stat.bg,
                        animation: `orbitPulse 3s ease-in-out ${idx * 0.4}s infinite`,
                      }}
                    >
                      {/* Orbiting dot */}
                      <div
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: stat.color,
                          boxShadow: `0 0 12px ${stat.color}`,
                          top: '-4px',
                          left: '50%',
                          marginLeft: '-4px',
                          animation: `orbitDot 4s linear ${idx * 0.6}s infinite`,
                          transformOrigin: '4px 48px',
                        }}
                      />
                      <i className={`fas ${stat.icon}`} style={{ fontSize: '1.6rem', color: stat.color }} />
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '6px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Orbital Category Selector */}
      <section
        style={{
          padding: '32px 0',
          background: 'linear-gradient(180deg, rgba(11,6,22,0.85) 0%, rgba(15,10,30,0.6) 100%)',
          borderTop: '1px solid rgba(255,215,0,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow behind categories */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,215,0,0.06) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-3 py-1">
            {/* "All" orbital tag */}
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className="orbital-category-tag"
              style={{
                background: selectedCategory === '' ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.02)',
                border: selectedCategory === '' ? '1.5px solid rgba(255,215,0,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                borderRadius: '50px',
                padding: '10px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                color: selectedCategory === '' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: '0.88rem',
                fontWeight: selectedCategory === '' ? 600 : 400,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: selectedCategory === '' ? '0 0 20px rgba(255,215,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: selectedCategory === '' ? '#ffd700' : 'rgba(255,255,255,0.2)',
                  boxShadow: selectedCategory === '' ? '0 0 8px #ffd700' : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              />
              <span>Semua Acara</span>
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const iconClass = getCategoryIcon(cat.name);
              // Extract color from icon class
              const colorMap: Record<string, string> = {
                'text-warning': '#fbbf24',
                'text-info': '#22d3ee',
                'text-danger': '#f87171',
                'text-success': '#4ade80',
                'text-primary': '#60a5fa',
              };
              const colorKey = iconClass.split(' ').find((c: string) => c.startsWith('text-')) || 'text-warning';
              const dotColor = colorMap[colorKey] || '#fbbf24';
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                  className="orbital-category-tag"
                  style={{
                    background: isActive ? `${dotColor}14` : 'rgba(255,255,255,0.02)',
                    border: isActive ? `1.5px solid ${dotColor}80` : '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '50px',
                    padding: '10px 24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 400,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isActive ? `0 0 20px ${dotColor}1a, inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isActive ? dotColor : 'rgba(255,255,255,0.2)',
                      boxShadow: isActive ? `0 0 8px ${dotColor}` : 'none',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                    }}
                  />
                  <i className={`fas ${iconClass.split(' ')[0]}`} style={{ fontSize: '0.82rem', color: isActive ? dotColor : 'rgba(255,255,255,0.35)' }} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
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
