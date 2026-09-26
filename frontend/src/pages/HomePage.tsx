import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { EventSummary, Category, PagedResponse, ApiResponse } from '../types';
import { Search, Calendar, MapPin, Tag, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Ambil kategori
    api.get<ApiResponse<Category[]>>('/categories')
      .then((res) => setCategories(res.data.data))
      .catch((err) => console.error('Gagal mengambil kategori:', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { page: 0, size: 12 };
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.categoryId = selectedCategory;

    api.get<ApiResponse<PagedResponse<EventSummary>>>('/events', { params })
      .then((res) => {
        setEvents(res.data.data.content);
      })
      .catch((err) => console.error('Gagal mengambil katalog acara:', err))
      .finally(() => setLoading(false));
  }, [search, selectedCategory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 mb-12 border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Platform E-Commerce Tiket Resmi</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Eksplorasi Acara Terbaik & Pesan Tiket <span className="gradient-text">Tanpa Antre</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Platform modern dengan pemrosesan pembayaran instan Midtrans (QRIS & Virtual Account), e-tiket PDF dinamis, dan verifikasi kehadiran berbasis QR Code real-time.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-700/60 shadow-xl">
            <div className="flex items-center flex-1 w-full px-3">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Cari konser, seminar, festival..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategory === ''
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Memuat katalog acara dari Redis Cache...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Tidak Ada Acara Ditemukan</h3>
          <p className="text-slate-400 text-sm mb-6">Coba gunakan kata kunci pencarian atau kategori lain.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory(''); }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-indigo-400 text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group"
            >
              {/* Event Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                <img
                  src={event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {event.categoryName && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 flex items-center space-x-1">
                    <Tag className="w-3 h-3 mr-1" />
                    {event.categoryName}
                  </span>
                )}
              </div>

              {/* Event Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {event.name}
                  </h3>
                  <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-rose-400 mr-2 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mulai dari</span>
                    <span className="text-base font-extrabold text-white">
                      {event.startingPrice > 0 ? formatCurrency(event.startingPrice) : 'Gratis'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
