import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { EventSummary, Category } from '../types';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catData = await eventService.getCategories();
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await eventService.getEvents(search, categoryParam, 0, 24);
        setEvents(res.content || []);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [search, categoryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (catId) params.set('category', catId);
    setSearchParams(params);
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('musik') || lower.includes('music') || lower.includes('konser')) return 'fa-music';
    if (lower.includes('teknologi') || lower.includes('tech') || lower.includes('ai')) return 'fa-microchip';
    if (lower.includes('seni') || lower.includes('art') || lower.includes('desain')) return 'fa-palette';
    if (lower.includes('bisnis') || lower.includes('business') || lower.includes('startup')) return 'fa-chart-line';
    if (lower.includes('olahraga') || lower.includes('sport')) return 'fa-running';
    if (lower.includes('kuliner') || lower.includes('food')) return 'fa-utensils';
    return 'fa-star';
  };

  return (
    <div className="position-relative min-vh-100" style={{ backgroundColor: '#0b0616', color: '#fff' }}>
      {/* Background Geometric Grid Pattern */}
      <div className="pattern-geometric-overlay" style={{ opacity: 0.25 }}></div>

      {/* Hero Header Section */}
      <div
        className="position-relative py-5 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(11, 6, 22, 0.4) 0%, rgba(11, 6, 22, 0.95) 100%), url('/images/kikk_hero_stage.jpg') center/cover no-repeat",
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
        }}
      >
        <div className="container py-5 text-center position-relative anim-fade-in" style={{ zIndex: 2 }}>
          <div className="d-inline-flex align-items-center gap-2 mb-3">
            <span className="gold-glow-badge" style={{ fontSize: '11px', letterSpacing: '2px' }}>
              <i className="fas fa-sparkles text-warning me-1"></i> CURATED EXPERIENCES • 2026
            </span>
          </div>

          <h1
            className="kikk-title mb-3"
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
              textTransform: 'uppercase',
              letterSpacing: '-1px',
            }}
          >
            Katalog Acara Eksklusif
          </h1>

          <p
            className="text-secondary mx-auto mb-4"
            style={{ maxWidth: '620px', fontSize: '1.05rem', lineHeight: 1.6 }}
          >
            Temukan tiket resmi festival musik dunia, konferensi teknologi masa depan, dan pameran seni interaktif berkelas internasional.
          </p>

          {/* Luxury Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mb-4"
            style={{ maxWidth: '720px' }}
          >
            <div
              className="d-flex align-items-center p-2 rounded-pill shadow-lg"
              style={{
                background: 'rgba(15, 10, 30, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.1)',
              }}
            >
              <div className="ps-3 text-warning">
                <i className="fas fa-search fs-5"></i>
              </div>
              <input
                type="text"
                className="form-control border-0 bg-transparent text-white px-3 shadow-none"
                style={{ fontSize: '15px' }}
                placeholder="Cari konser, festival, pembicara, atau kota..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button
                className="btn-kikk py-2 px-4"
                type="submit"
                style={{ borderRadius: '50px', fontSize: '13px', letterSpacing: '1px' }}
              >
                CARI
              </button>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
            <button
              onClick={() => handleCategoryClick('')}
              className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
            >
              <i className="fas fa-border-all"></i> Semua Acara
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                <i className={`fas ${getCategoryIcon(cat.name)}`}></i> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid Section */}
      <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="kikk-title m-0" style={{ fontSize: '1.8rem' }}>
              Daftar Acara ({events.length})
            </h2>
            <p className="text-secondary small m-0 mt-1">
              Pilih acara favorit Anda dan lakukan pemesanan secara instan dengan proteksi calo terintegrasi.
            </p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick('')}
              className="btn-kikk-outline btn-sm py-1 px-3"
              style={{ fontSize: '12px' }}
            >
              <i className="fas fa-times me-1"></i> Reset Kategori
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)', width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-3">Memuat katalog acara eksklusif...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="row g-4">
            {events.map((event, idx) => (
              <div className="col-lg-4 col-md-6" key={event.id}>
                <Link
                  to={`/events/${event.id}`}
                  className="kikk-image-card anim-fade-in d-flex flex-column h-100"
                  style={{
                    animationDelay: `${(idx % 6) * 0.08}s`,
                    textDecoration: 'none',
                  }}
                >
                  <div className="position-relative overflow-hidden" style={{ height: '230px' }}>
                    <img
                      className="card-img-top w-100 h-100"
                      src={event.imageUrl || '/images/kikk_hero_stage.jpg'}
                      alt={event.name}
                      style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    />
                    <div
                      className="position-absolute top-0 start-0 m-3"
                      style={{ zIndex: 2 }}
                    >
                      <span className="gold-glow-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                        <i className="fas fa-crown text-warning me-1"></i> {event.categoryName || 'Eksklusif'}
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-4 d-flex flex-column flex-grow-1 justify-content-between">
                    <div>
                      <h4 className="card-title text-white mb-2 fs-5 fw-bold" style={{ lineHeight: 1.3 }}>
                        {event.name}
                      </h4>
                      <p className="card-text mb-1 text-secondary small">
                        <i className="far fa-calendar-alt text-warning me-2"></i>
                        <span>{event.date}</span>
                      </p>
                      <p className="card-text mb-3 text-secondary small">
                        <i className="fas fa-map-marker-alt text-warning me-2"></i>
                        <span>{event.location}</span>
                      </p>
                      <p className="card-text text-secondary small" style={{ lineHeight: 1.5, opacity: 0.75 }}>
                        {event.description?.length > 95
                          ? event.description.substring(0, 95) + '...'
                          : event.description}
                      </p>
                    </div>

                    <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(34, 197, 94, 0.12)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <i className="fas fa-ticket-alt me-1"></i> Tiket Tersedia
                      </span>
                      <span
                        className="text-warning fw-semibold small d-inline-flex align-items-center gap-1"
                      >
                        Pesan Tiket <i className="fas fa-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="luxury-glass-card text-center py-5 px-4 anim-fade-in my-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '80px',
                height: '80px',
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <i className="fas fa-search-minus" style={{ fontSize: '32px', color: 'var(--kikk-yellow)' }}></i>
            </div>
            <h3 className="kikk-title mb-2 fs-4">Tidak Ada Acara Ditemukan</h3>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '450px', fontSize: '14px' }}>
              Tidak ditemukan acara dengan kata kunci atau kategori yang Anda pilih. Coba atur ulang pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchInput('');
                setSelectedCategory('');
                setSearchParams({});
              }}
              className="btn-kikk px-4 py-2"
              style={{ borderRadius: '12px', fontSize: '13px' }}
            >
              Tampilkan Semua Acara
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
