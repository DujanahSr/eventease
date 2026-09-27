import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { EventDetail, TicketTier } from '../types';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await eventService.getEventById(id);
        setEvent(data);
        if (data.ticketTiers && data.ticketTiers.length > 0) {
          setSelectedTier(data.ticketTiers[0]);
        }
      } catch (err) {
        console.error('Failed to load event detail', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'USER') {
      Swal.fire({
        icon: 'info',
        title: 'Perhatian',
        text: 'Hanya akun bertipe USER yang dapat membeli tiket.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    if (!selectedTier) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Tiket',
        text: 'Silakan pilih kategori tiket terlebih dahulu.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await bookingService.createBooking({
        ticketCategoryId: selectedTier.id,
        quantity: quantity,
      });

      if (res.snapToken && window.snap) {
        window.snap.pay(res.snapToken, {
          onSuccess: function (result: any) {
            Swal.fire({
              icon: 'success',
              title: 'Pembayaran Berhasil!',
              text: 'Tiket resmi Anda telah diterbitkan.',
              confirmButtonColor: '#FFD700',
            }).then(() => {
              navigate('/home-user');
            });
          },
          onPending: function (result: any) {
            Swal.fire({
              icon: 'info',
              title: 'Menunggu Pembayaran',
              text: 'Selesaikan pembayaran Anda sesuai instruksi.',
              confirmButtonColor: '#FFD700',
            }).then(() => {
              navigate('/home-user');
            });
          },
          onError: function (result: any) {
            Swal.fire({
              icon: 'error',
              title: 'Pembayaran Gagal',
              text: 'Silakan coba lagi.',
              confirmButtonColor: '#FFD700',
            });
          },
          onClose: function () {
            navigate('/home-user');
          },
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Pesanan Berhasil Dibuat',
          text: `Kode Booking: ${res.bookingCode || res.id}`,
          confirmButtonColor: '#FFD700',
        }).then(() => {
          navigate('/home-user');
        });
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        Swal.fire({
          icon: 'warning',
          title: 'Proteksi Anti-Bot & Calo Aktif',
          text: err.response?.data?.message || 'Batas transaksi tercapai. Anda hanya dapat melakukan 5 permintaan pemesanan tiket per menit untuk mencegah bot/calo tiket.',
          confirmButtonColor: '#FFD700',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memesan Tiket',
          text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
          confirmButtonColor: '#FFD700',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-5 text-center">
        <h2 className="kikk-title">Acara Tidak Ditemukan</h2>
        <Link to="/events" className="btn-kikk mt-3">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const organizerName = event.organizer?.name || 'Eventease Official';
  const organizerInitial = organizerName ? organizerName.charAt(0).toUpperCase() : 'E';

  return (
    <div>
      {/* Hero Detail */}
      <div
        className="hero-detail kikk-animate fade-in-only"
        style={{
          backgroundImage: `url(${event.imageUrl || '/images/kikk_hero_stage.jpg'})`,
        }}
      >
        <div className="hero-overlay-dark"></div>
        <div className="container detail-content-area">
          <div className="row">
            <div className="col-lg-8 kikk-animate stagger-1">
              {event.category && (
                <div
                  style={{
                    fontSize: '14px',
                    letterSpacing: '2px',
                    color: 'var(--kikk-yellow)',
                    marginBottom: '15px',
                    fontWeight: 600,
                  }}
                >
                  {event.category.name}
                </div>
              )}
              <h1
                className="kikk-title"
                style={{
                  fontSize: 'clamp(3rem, 7vw, 6rem)',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                }}
              >
                {event.name}
              </h1>

              <div className="d-flex flex-wrap gap-4 mt-4" style={{ fontSize: '1.1rem', color: '#fff' }}>
                <div>
                  <i className="far fa-calendar-alt" style={{ color: 'var(--kikk-yellow)' }}></i>{' '}
                  <span className="ms-2">{event.date}</span>
                </div>
                <div>
                  <i className="fas fa-map-marker-alt" style={{ color: 'var(--kikk-yellow)' }}></i>{' '}
                  <span className="ms-2">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container section-padding-sm position-relative">
        <div className="row position-relative z-1">
          {/* Left Column: Editorial & Organizer */}
          <div className="col-lg-7 kikk-animate stagger-2">
            <h3 className="kikk-title mb-4">The Experience</h3>
            <p className="editorial-description drop-cap mb-5">{event.description}</p>

            <hr style={{ borderColor: 'var(--glass-border)', margin: '50px 0' }} />

            {/* Organizer Info */}
            <div className="d-flex align-items-center gap-4 mb-5">
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  background: 'var(--kikk-yellow)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontFamily: "'Playfair Display', serif",
                  color: '#000',
                  fontWeight: 700,
                }}
              >
                <span>{organizerInitial}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>
                  PRESENTED BY
                </div>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', margin: 0 }}>
                  {organizerName}
                </h4>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket Purchase Glass Box */}
          <div className="col-lg-5 mt-5 mt-lg-0 kikk-animate stagger-3">
            <div className="ticket-purchase-box shadow-lg">
              <h3 className="kikk-title text-center mb-4" style={{ fontSize: '2rem' }}>
                Secure Your Spot
              </h3>

              {!event.ticketTiers || event.ticketTiers.length === 0 ? (
                <div className="text-center">
                  <div className="badge bg-danger p-2 px-3 rounded-pill mb-3">SOLD OUT</div>
                  <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Maaf, tiket untuk acara ini belum tersedia atau sudah habis terjual.
                  </p>
                </div>
              ) : (
                <div>
                  {event.ticketTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`ticket-cat-item p-3 mb-2 rounded-3 cursor-pointer ${selectedTier?.id === tier.id ? 'border border-warning' : ''}`}
                      style={{
                        background: selectedTier?.id === tier.id ? 'rgba(255,215,0,0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 style={{ margin: 0, fontWeight: 600, letterSpacing: '1px' }}>{tier.name}</h5>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            Sisa: <span>{tier.availableStock}</span> tiket
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.3rem',
                            color: 'var(--kikk-yellow)',
                            fontWeight: 700,
                          }}
                        >
                          {formatRupiah(tier.price)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Quantity selector */}
                  <div className="d-flex align-items-center justify-content-between my-3 pt-3 border-top" style={{ borderColor: 'var(--glass-border)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Jumlah Tiket:</span>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="fw-bold px-2">{quantity}</span>
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => setQuantity(Math.min(5, quantity + 1))}
                        disabled={quantity >= 5}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-3 text-center border-top" style={{ borderColor: 'var(--glass-border)' }}>
                    {isAuthenticated ? (
                      user?.role === 'USER' ? (
                        <button
                          onClick={handleBooking}
                          disabled={isProcessing}
                          className="btn-kikk w-100 justify-content-center py-3"
                        >
                          {isProcessing ? (
                            'MEMPROSES PESANAN...'
                          ) : (
                            <>
                              PESAN TIKET SEKARANG <i className="fas fa-arrow-right ms-2"></i>
                            </>
                          )}
                        </button>
                      ) : (
                        <p style={{ color: 'var(--kikk-yellow)', fontSize: '0.9rem', margin: 0 }}>
                          <i className="fas fa-info-circle me-1"></i>Hanya akun User yang dapat memesan tiket.
                        </p>
                      )
                    ) : (
                      <Link to="/login" className="btn-kikk w-100 justify-content-center text-center">
                        Masuk untuk Membeli
                      </Link>
                    )}
                    <p
                      className="mt-3 mb-0"
                      style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}
                    >
                      <i className="fas fa-shield-alt text-success me-1"></i> PEMBAYARAN AMAN VIA MIDTRANS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
