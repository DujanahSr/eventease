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

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>
        <img src="/images/kikk_floating_element.jpg" alt="Float 1" className="floating-element float-1" />
        <img
          src="/images/kikk_floating_element.jpg"
          alt="Float 2"
          className="floating-element float-2"
          style={{ filter: 'hue-rotate(90deg)' }}
        />

        <div className="container hero-content">
          <div
            style={{
              fontSize: '14px',
              letterSpacing: '3px',
              color: 'var(--kikk-yellow)',
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            TICKETING PLATFORM MASA DEPAN
          </div>
          <h1
            className="hero-title kikk-title"
            style={{
              fontSize: 'clamp(3rem, 6vw, 6rem)',
              marginBottom: '30px',
              textTransform: 'uppercase',
            }}
          >
            Temukan Momen
            <br />
            <span style={{ color: 'var(--kikk-yellow)', fontStyle: 'italic' }}>Paling Berkesan</span>
          </h1>
          <p className="hero-subtitle">
            Jelajahi konser, festival, seminar, dan acara eksklusif lainnya. Rasakan pengalaman pemesanan tiket
            yang seamless, aman, dan premium.
          </p>

          <div>
            <form onSubmit={handleSearch} className="search-glass">
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama artis, acara, atau festival..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="search-divider d-none d-md-block"></div>
              <select
                className="search-category d-none d-md-block"
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
              <button type="submit" className="btn-search">
                <i className="fas fa-search me-2"></i> CARI
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Events Catalog Section */}
      <section className="py-5" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container py-5">
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '10px' }}>
                EKSPLORASI
              </div>
              <h2 className="kikk-title m-0">Acara Mendatang</h2>
            </div>
            <Link
              to="/events"
              className="btn-kikk-outline d-none d-md-flex align-items-center gap-2"
              style={{ padding: '10px 25px', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Lihat Semua <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {events.length > 0 ? (
                events.map((event) => (
                  <div className="col-lg-4 col-md-6" key={event.id}>
                    <div
                      className="kikk-card event-card position-relative p-0 overflow-hidden"
                      onClick={() => navigate(`/events/${event.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        className="event-card-img"
                        src={event.imageUrl || '/images/kikk_hero_stage.jpg'}
                        alt={event.name}
                      />

                      <div className="event-badge">
                        <i className="fas fa-crown me-1"></i> {event.categoryName || 'Unggulan'}
                      </div>
                      <div className="event-date">
                        <span style={{ fontSize: '1rem' }}>{event.date}</span>
                      </div>

                      <div className="card-body p-4 d-flex flex-column">
                        <h4 className="kikk-title mb-2 text-truncate fs-4">{event.name}</h4>
                        <p style={{ color: 'var(--kikk-yellow)', fontSize: '0.9rem' }} className="mb-3">
                          <i className="fas fa-map-marker-alt me-2"></i>
                          <span>{event.location}</span>
                        </p>
                        <p
                          className="mb-4"
                          style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.6' }}
                        >
                          {event.description?.length > 80
                            ? event.description.substring(0, 80) + '...'
                            : event.description}
                        </p>

                        <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div
                              className="d-flex align-items-center"
                              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}
                            >
                              <i className="fas fa-building me-2"></i>
                              <span className="text-truncate" style={{ maxWidth: '120px' }}>
                                {event.organizerName || 'Eventease'}
                              </span>
                            </div>
                            <Link
                              to={`/events/${event.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="btn-kikk py-2 px-4"
                              style={{ fontSize: '0.85rem' }}
                            >
                              Beli Tiket
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5 kikk-card mt-4">
                  <div style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                    <i className="fas fa-search"></i>
                  </div>
                  <h4 className="kikk-title mb-3">Acara Tidak Ditemukan</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Coba gunakan kata kunci lain untuk mencari acara yang Anda inginkan.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-5 d-block d-md-none">
            <Link to="/events" className="btn-kikk-outline w-100 justify-content-center">
              Lihat Semua Acara
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
