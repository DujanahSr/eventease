import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EventDetail, TicketTier, BookingResponse, ApiResponse } from '../types';
import { Calendar, MapPin, Tag, User, ShieldCheck, Ticket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<ApiResponse<EventDetail>>(`/events/${id}`)
      .then((res) => {
        setEvent(res.data.data);
        if (res.data.data.ticketTiers && res.data.data.ticketTiers.length > 0) {
          setSelectedTier(res.data.data.ticketTiers[0]);
        }
      })
      .catch((err) => {
        console.error('Gagal mengambil detail acara:', err);
        setErrorMessage('Acara tidak ditemukan.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedTier) {
      setErrorMessage('Pilih kategori tiket terlebih dahulu.');
      return;
    }

    setBookingLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post<ApiResponse<BookingResponse>>('/bookings', {
        ticketCategoryId: selectedTier.id,
        quantity: quantity,
      });

      const bookingData = res.data.data;

      // Panggil popup Midtrans Snap
      if (bookingData.snapToken && window.snap) {
        window.snap.pay(bookingData.snapToken, {
          onSuccess: (result: any) => {
            console.log('Pembayaran Sukses:', result);
            navigate('/my-tickets');
          },
          onPending: (result: any) => {
            console.log('Menunggu Pembayaran:', result);
            navigate('/my-tickets');
          },
          onError: (result: any) => {
            console.error('Pembayaran Gagal:', result);
            setErrorMessage('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            navigate('/my-tickets');
          },
        });
      } else {
        navigate('/my-tickets');
      }
    } catch (err: any) {
      console.error('Gagal membuat pesanan:', err);
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan tiket.';
      setErrorMessage(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400">Memuat detail acara...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-32 text-center text-slate-300">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Acara Tidak Ditemukan</h2>
      </div>
    );
  }

  const totalPrice = (selectedTier?.price || 0) * quantity;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Banner Header */}
      <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden mb-8 border border-slate-700/60 shadow-2xl">
        <img
          src={event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80'}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {event.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3 backdrop-blur-md">
                <Tag className="w-3 h-3 mr-1.5" />
                {event.category.name}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {event.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Jadwal Acara</span>
                <span className="text-sm font-bold text-white">{event.date}</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Lokasi</span>
                <span className="text-sm font-bold text-white line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4">Deskripsi Acara</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Organizer Info */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center text-white font-bold text-lg">
                {event.organizer?.name ? event.organizer.name.charAt(0) : 'O'}
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Diselenggarakan oleh</span>
                <span className="text-base font-bold text-white">{event.organizer?.name || 'Eventease Official'}</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 mr-1" />
              <span>Verified Organizer</span>
            </span>
          </div>
        </div>

        {/* Right Column: Ticket Selection & Checkout */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-3xl p-6 border border-slate-700/60 sticky top-28 shadow-2xl">
            <h2 className="text-xl font-extrabold text-white mb-4 flex items-center">
              <Ticket className="w-5 h-5 text-indigo-400 mr-2" />
              Pilih Tiket
            </h2>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Ticket Tier List */}
            <div className="space-y-3 mb-6">
              {event.ticketTiers && event.ticketTiers.length > 0 ? (
                event.ticketTiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => {
                      setSelectedTier(tier);
                      setQuantity(1);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      selectedTier?.id === tier.id
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{tier.name}</span>
                      <span className="font-extrabold text-indigo-300 text-sm">
                        {formatCurrency(tier.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Sisa kuota: {tier.availableStock}</span>
                      {selectedTier?.id === tier.id && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Tidak ada tiket tersedia untuk acara ini.</p>
              )}
            </div>

            {/* Quantity Selector */}
            {selectedTier && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Jumlah Tiket</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold hover:bg-slate-600 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-white text-sm w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedTier.availableStock, quantity + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold hover:bg-slate-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total Calculation */}
            <div className="pt-4 border-t border-slate-700/50 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total Pembayaran</span>
                <span className="text-2xl font-black text-white">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={bookingLoading || !selectedTier || selectedTier.availableStock <= 0}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Menyiapkan Midtrans Snap...</span>
                </>
              ) : selectedTier && selectedTier.availableStock <= 0 ? (
                <span>Tiket Habis Terjual</span>
              ) : (
                <span>Beli Tiket Sekarang</span>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Didukung oleh Midtrans Payment Gateway (QRIS, GoPay, VA).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
