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
        const res = await eventService.getEvents(search, categoryParam, 0, 20);
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

  return (
    <div>
      {/* Header Search */}
      <div
        className="section-padding pb-5 kikk-animate fade-in-only"
        style={{
          background: "url('/images/kikk_hero_stage.jpg') center/cover no-repeat",
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(11, 6, 22, 0.8)',
        }}
      >
        <div className="container text-center position-relative z-1">
          <div
            style={{
              fontSize: '14px',
              letterSpacing: '2px',
              color: 'var(--kikk-yellow)',
              marginBottom: '10px',
              fontWeight: 600,
            }}
          >
            FIND YOUR NEXT EXPERIENCE
          </div>
          <h1
            className="kikk-title"
            style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              marginBottom: '40px',
              textTransform: 'uppercase',
            }}
          >
            Explore Events
          </h1>

          <form
            onSubmit={handleSearchSubmit}
            className="d-flex justify-content-center mx-auto mb-4"
            style={{ maxWidth: '700px' }}
          >
            <div
              className="input-group shadow-lg"
              style={{
                borderRadius: '50px',
                overflow: 'hidden',
                border: '1px solid var(--kikk-yellow)',
              }}
            >
              <span
                className="input-group-text border-0"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  color: 'var(--kikk-yellow)',
                  paddingLeft: '25px',
                }}
              >
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 search-input"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '15px 20px' }}
                placeholder="Cari nama acara, artis, atau lokasi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button
                className="btn btn-kikk border-0 btn-search"
                type="submit"
                style={{ borderRadius: 0, margin: 0, padding: '0 40px' }}
              >
                SEARCH
              </button>
            </div>
          </form>

          {/* Category Filters */}
          <div className="d-flex flex-wrap justify-content-center gap-3 mt-5">
            <button
              onClick={() => handleCategoryClick('')}
              className={selectedCategory === '' ? 'btn-kikk' : 'btn-kikk-outline'}
              style={{ border: 'none' }}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={selectedCategory === cat.id ? 'btn-kikk' : 'btn-kikk-outline'}
                style={{ border: 'none' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="section-padding container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 kikk-animate stagger-1 gap-3">
          <h3 className="kikk-title" style={{ fontSize: '2.5rem' }}>
            Katalog Acara
          </h3>
          <div className="d-flex gap-3 align-items-center">
            <button
              onClick={() => handleCategoryClick('')}
              className="btn-kikk-outline"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              Semua
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4 mb-5">
            {events.length > 0 ? (
              events.map((event) => (
                <div className="col-lg-4 col-md-6 kikk-animate stagger-2" key={event.id}>
                  <Link to={`/events/${event.id}`} className="kikk-image-card">
                    <div className="position-relative">
                      {event.categoryName && (
                        <div className="position-absolute top-0 start-0 m-3 z-1">
                          <span className="badge-kikk">{event.categoryName}</span>
                        </div>
                      )}
                      <img
                        className="card-img-top"
                        src={event.imageUrl || '/images/kikk_hero_stage.jpg'}
                        alt={event.name}
                      />
                    </div>
                    <div className="card-body">
                      <h4 className="card-title">{event.name}</h4>
                      <p className="card-text">
                        <i className="far fa-calendar-alt text-warning me-2"></i>
                        <span>{event.date}</span>
                      </p>
                      <p className="card-text">
                        <i className="fas fa-map-marker-alt text-warning me-2"></i>
                        <span>{event.location}</span>
                      </p>
                      <p className="card-text mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {event.description?.length > 100
                          ? event.description.substring(0, 100) + '...'
                          : event.description}
                      </p>

                      <div className="mt-auto pt-4 d-flex justify-content-between align-items-center">
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '8px 15px',
                            borderRadius: '5px',
                          }}
                        >
                          Tersedia Tiket
                        </span>
                        <span
                          style={{
                            color: 'var(--kikk-yellow)',
                            fontWeight: 600,
                            fontSize: '14px',
                          }}
                        >
                          DETAIL <i className="fas fa-arrow-right ms-1"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5 kikk-animate stagger-2">
                <i
                  className="fas fa-search-minus mb-3"
                  style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)' }}
                ></i>
                <h4 style={{ color: 'rgba(255,255,255,0.6)' }}>Tidak ada acara yang ditemukan</h4>
                <p className="text-muted">Coba gunakan kata kunci pencarian atau kategori lain.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
