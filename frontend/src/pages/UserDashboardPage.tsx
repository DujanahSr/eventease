import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, BookingResponseData } from '../services/bookingService';

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

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="section-padding container">
      {/* Header Profile Greeting */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
            DASHBOARD PENGGUNA
          </div>
          <h2 className="kikk-title m-0">Selamat Datang, {user?.name}!</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0' }}>
            {user?.email} | {user?.phone || '-'}
          </p>
        </div>
        <div className="mt-4 mt-md-0">
          <Link to="/events" className="btn-kikk">
            <i className="fas fa-ticket-alt me-2"></i> Cari Acara Lainnya
          </Link>
        </div>
      </div>

      {/* Ticket List */}
      <div className="mb-4">
        <h3 className="kikk-title mb-4" style={{ fontSize: '1.8rem' }}>
          Tiket & Riwayat Pemesanan Saya
        </h3>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="row g-4">
            {tickets.map((t) => (
              <div className="col-lg-6" key={t.id}>
                <div className="kikk-card p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span
                        className={`badge mb-2 ${
                          t.status === 'PAID'
                            ? 'bg-success'
                            : t.status === 'PENDING'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                        style={{ padding: '6px 14px', borderRadius: '50px' }}
                      >
                        {t.status === 'PAID' ? 'LUNAS (AKTIF)' : t.status}
                      </span>
                      <h4 className="kikk-title m-0 fs-5">{t.eventName}</h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>KODE BOOKING</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--kikk-yellow)' }}>
                        {t.id?.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <p className="card-text mb-1" style={{ fontSize: '0.9rem' }}>
                    <i className="far fa-calendar-alt text-warning me-2"></i>
                    <span>{t.eventDate || '-'}</span>
                  </p>
                  <p className="card-text mb-3" style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-map-marker-alt text-warning me-2"></i>
                    <span>{t.eventLocation || '-'}</span>
                  </p>

                  <div className="p-3 rounded-3 my-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Tier Tiket:</span>
                      <span className="fw-bold">{t.ticketCategoryName || 'General'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Jumlah:</span>
                      <span>{t.quantity} Tiket</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'var(--kikk-yellow)', fontWeight: 600 }}>Total Bayar:</span>
                      <span style={{ color: 'var(--kikk-yellow)', fontWeight: 700, fontSize: '1.1rem' }}>
                        {formatRupiah(t.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-2">
                    <a
                      href={`/api/bookings/${t.id}/ticket-pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-kikk-outline btn-sm"
                      style={{ fontSize: '13px', padding: '8px 18px' }}
                    >
                      <i className="fas fa-download me-1"></i> Unduh E-Ticket (PDF)
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="kikk-card text-center py-5">
            <i className="fas fa-ticket-alt mb-3" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)' }}></i>
            <h4 className="kikk-title mb-2">Belum Ada Tiket yang Dibeli</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '450px', margin: '0 auto 20px' }}>
              Anda belum memiliki tiket aktif. Jelajahi katalog acara kami dan dapatkan tiket acara favorit Anda sekarang!
            </p>
            <Link to="/events" className="btn-kikk">
              Jelajahi Acara Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
