import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { UserFloatingDock } from '../components/UserFloatingDock';
import Swal from 'sweetalert2';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<BookingResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'EVENT_DATE' | 'PRICE_HIGH'>('NEWEST');

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const handlePayPendingTicket = async (ticket: BookingResponseData) => {
    try {
      Swal.fire({
        title: 'Menyiapkan Pembayaran...',
        text: 'Menghubungkan ke Gateway Pembayaran Midtrans Snap...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await bookingService.payBooking(ticket.id);

      if (res.snapToken && (window as any).snap) {
        Swal.close();
        (window as any).snap.pay(res.snapToken, {
          onSuccess: function () {
            Swal.fire({
              icon: 'success',
              title: 'Pembayaran Berhasil!',
              text: 'Tiket resmi Anda telah aktif dan siap digunakan.',
              confirmButtonColor: '#FFD700',
            }).then(() => {
              fetchTickets();
            });
          },
          onPending: function () {
            Swal.fire({
              icon: 'info',
              title: 'Menunggu Pembayaran',
              text: 'Silakan selesaikan pembayaran sesuai instruksi Midtrans.',
              confirmButtonColor: '#FFD700',
            }).then(() => {
              fetchTickets();
            });
          },
          onError: function () {
            Swal.fire({
              icon: 'error',
              title: 'Pembayaran Gagal',
              text: 'Terjadi kendala saat pembayaran. Silakan coba kembali.',
              confirmButtonColor: '#FFD700',
            });
          },
          onClose: function () {
            fetchTickets();
          },
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Gateway Tidak Siap',
          text: 'Midtrans Snap gateway tidak dapat dimuat saat ini.',
          confirmButtonColor: '#FFD700',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses',
        text: err.response?.data?.message || 'Gagal memulai sesi pembayaran Midtrans.',
        confirmButtonColor: '#FFD700',
      });
    }
  };

  const handleCancelBooking = async (ticket: BookingResponseData) => {
    const result = await Swal.fire({
      title: 'Batalkan Pesanan Ini?',
      text: `Pesanan untuk "${ticket.eventName}" akan dibatalkan dan kuota kursi dikembalikan.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
    });

    if (result.isConfirmed) {
      try {
        await bookingService.cancelBooking(ticket.id);
        Swal.fire({
          icon: 'success',
          title: 'Pesanan Dibatalkan',
          text: 'Pesanan tiket Anda telah berhasil dibatalkan.',
          timer: 1600,
          showConfirmButton: false,
        });
        fetchTickets();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan',
          text: err.response?.data?.message || 'Terjadi kesalahan saat membatalkan pesanan.',
          confirmButtonColor: '#FFD700',
        });
      }
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter & Sort Computation
  const processedTickets = useMemo(() => {
    let result = [...tickets];

    // Filter Status
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Sort By
    if (sortBy === 'NEWEST') {
      result.reverse();
    } else if (sortBy === 'PRICE_HIGH') {
      result.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === 'EVENT_DATE') {
      result.sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));
    }

    return result;
  }, [tickets, statusFilter, sortBy]);

  const paidCount = tickets.filter((t) => t.status === 'PAID').length;
  const pendingCount = tickets.filter((t) => t.status === 'PENDING').length;

  return (
    <div
      className="position-relative min-vh-100 pb-5"
      style={{
        backgroundColor: '#0b0616',
        backgroundImage: "url('/images/editorial_luxury_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        color: '#ffffff',
      }}
    >
      {/* Dark Ambient Overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 6, 22, 0.78) 0%, rgba(11, 6, 22, 0.95) 100%)',
          pointerEvents: 'none',
        }}
      ></div>

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        {/* Editorial Page Header */}
        <div className="text-center max-w-700 mx-auto mb-5 anim-fade-in pt-3">
          <div className="d-inline-flex align-items-center gap-2 gold-glow-badge mb-3">
            <i className="fas fa-ticket text-warning"></i>
            <span>PASSPORT & RESERVASI ELEKTRONIK</span>
          </div>

          <h1
            className="kikk-title text-uppercase m-0"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-1px' }}
          >
            Koleksi Tiket Saya
          </h1>

          <p className="text-secondary mx-auto mt-3" style={{ maxWidth: '580px', fontSize: '15px', lineHeight: 1.6 }}>
            Seluruh pas masuk acara dan festival yang telah Anda amankan. Dilengkapi QR Code digital resmi untuk verifikasi gerbang kedatangan.
          </p>
        </div>

        {/* Filter & Sort Bar (Editorial Toolbar) */}
        <div
          className="luxury-glass-card p-3 p-md-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 anim-fade-in anim-delay-1"
        >
          {/* Status Filter Tabs */}
          <div className="d-flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`category-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <i className="fas fa-layer-group"></i> Semua ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`category-pill ${statusFilter === 'PAID' ? 'active' : ''}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <i className="fas fa-circle-check text-success"></i> Aktif ({paidCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`category-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <i className="fas fa-hourglass-half text-warning"></i> Menunggu Bayar ({pendingCount})
            </button>
          </div>

          {/* Sort Dropdown Selector */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-medium" style={{ whiteSpace: 'nowrap' }}>
              <i className="fas fa-arrow-down-short-wide text-warning me-1"></i> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select form-select-sm bg-dark text-white border-secondary"
              style={{
                borderRadius: '10px',
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 215, 0, 0.25)',
                fontSize: '13px',
              }}
            >
              <option value="NEWEST">Terbaru Dipesan</option>
              <option value="EVENT_DATE">Jadwal Acara Terdekat</option>
              <option value="PRICE_HIGH">Total Bayar Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-secondary mt-3">Sinkronisasi tiket konser Anda...</p>
          </div>
        ) : processedTickets.length > 0 ? (
          <div className="d-flex flex-column gap-4">
            {processedTickets.map((t, idx) => (
              <div
                key={t.id}
                className={`ticket-stub anim-fade-in anim-delay-${(idx % 4) + 1}`}
              >
                <div className="row g-0">
                  {/* Left Pass Body */}
                  <div className="col-lg-8 p-4 p-md-5 d-flex flex-column justify-content-between">
                    <div>
                      {/* Ticket Tier Header */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <span className="gold-glow-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          <i className="fas fa-award text-warning me-1"></i> {t.ticketCategoryName || 'GENERAL PASS'}
                        </span>
                        <div className="text-secondary small font-monospace">
                          <i className="fas fa-fingerprint me-1 text-warning"></i> BOOKING ID: {t.id}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h2 className="kikk-title text-white mb-3" style={{ fontSize: '1.75rem' }}>
                        {t.eventName}
                      </h2>

                      {/* Event Meta */}
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-2 text-secondary small">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px', background: 'rgba(255, 215, 0, 0.1)' }}
                            >
                              <i className="far fa-calendar-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>JADWAL ACARA</div>
                              <div className="text-white fw-semibold">{t.eventDate || 'Akan diumumkan segera'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-2 text-secondary small">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px', background: 'rgba(255, 215, 0, 0.1)' }}
                            >
                              <i className="fas fa-map-marker-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>LOKASI VENUE</div>
                              <div className="text-white fw-semibold">{t.eventLocation || 'Venue Utama'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Holder & Ticket Meta */}
                    <div
                      className="p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>PEMEGANG TIKET</div>
                        <div className="text-white fw-bold">
                          <i className="fas fa-user text-warning me-1"></i> {user?.name}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>JUMLAH TIKET</div>
                        <div className="text-warning fw-bold">
                          <i className="fas fa-users me-1"></i> {t.quantity} Kursi
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>VERIFIKASI GERBANG</div>
                        <div className="text-white small">
                          <i className="fas fa-qrcode text-warning me-1"></i> QR Code Terenkripsi
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Perforated Boarding Stub */}
                  <div
                    className="col-lg-4 ticket-perforation p-4 p-md-5 d-flex flex-column justify-content-between align-items-center text-center"
                    style={{ background: 'rgba(10, 5, 25, 0.65)' }}
                  >
                    <div className="w-100">
                      <div className="mb-2">
                        {t.status === 'PAID' ? (
                          <span
                            className="badge bg-success text-white"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-circle-check me-1"></i> LUNAS (AKTIF)
                          </span>
                        ) : t.status === 'PENDING' ? (
                          <span
                            className="badge bg-warning text-dark"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-hourglass-half me-1"></i> MENUNGGU PEMBAYARAN
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary text-white"
                            style={{ padding: '7px 18px', borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            {t.status}
                          </span>
                        )}
                      </div>

                      <div className="my-3">
                        <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          PASS CODE
                        </div>
                        <div
                          className="font-monospace fs-4 fw-bold"
                          style={{ color: 'var(--kikk-yellow)', letterSpacing: '3px' }}
                        >
                          {t.id?.substring(0, 8).toUpperCase()}
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div
                        className="p-2 rounded mb-4"
                        style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                      >
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>TOTAL TRANSAKSI</div>
                        <div className="fs-5 fw-bold text-white">
                          {formatRupiah(t.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="w-100">
                      {t.status === 'PAID' ? (
                        <a
                          href={`/api/bookings/${t.id}/ticket-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                          style={{ fontSize: '13px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-file-pdf"></i> Unduh E-Ticket (PDF)
                        </a>
                      ) : t.status === 'PENDING' ? (
                        <div className="d-flex flex-column gap-2 w-100">
                          <button
                            type="button"
                            onClick={() => handlePayPendingTicket(t)}
                            className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ fontSize: '13px', borderRadius: '10px' }}
                          >
                            <i className="fas fa-credit-card"></i> Selesaikan Pesanan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(t)}
                            className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1"
                            style={{
                              fontSize: '11px',
                              borderRadius: '8px',
                              borderColor: 'rgba(255, 255, 255, 0.15)',
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            <i className="fas fa-xmark"></i> Batalkan Pesanan
                          </button>
                        </div>
                      ) : (
                        <div
                          className="text-secondary small py-2 px-3 rounded"
                          style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                        >
                          <i className="fas fa-ban me-1 text-danger"></i> Pesanan Telah Dibatalkan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                border: '1px solid rgba(255, 215, 0, 0.25)',
              }}
            >
              <i className="fas fa-ticket-alt" style={{ fontSize: '32px', color: 'var(--kikk-yellow)' }}></i>
            </div>
            <h3 className="kikk-title mb-2 fs-4">Tidak Ada Tiket dalam Kategori Ini</h3>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '460px', fontSize: '14px' }}>
              Anda belum memiliki tiket untuk filter status yang dipilih. Jelajahi katalog acara dan pesan tiket resmi Anda sekarang.
            </p>
            <Link to="/events" className="btn-kikk px-4 py-2" style={{ borderRadius: '12px', fontSize: '13px' }}>
              <i className="fas fa-compass me-2"></i> Jelajahi Katalog Acara
            </Link>
          </div>
        )}
      </div>

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock />
    </div>
  );
};
