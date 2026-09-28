import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { bookingService, BookingResponseData } from '../services/bookingService';
import { UserFloatingDock } from '../components/UserFloatingDock';
import Swal from 'sweetalert2';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<BookingResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fetchTicketDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await bookingService.getBookingById(id);
      setTicket(data);
    } catch (err: any) {
      console.error('Gagal mengambil detail tiket:', err);
      Swal.fire({
        icon: 'error',
        title: 'Tiket Tidak Ditemukan',
        text: err.response?.data?.message || 'Data tiket tidak ditemukan atau akses ditolak.',
        confirmButtonColor: '#FFD700',
      }).then(() => {
        navigate('/my-tickets');
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  // Auto-sync polling jika status masih PENDING
  useEffect(() => {
    if (!ticket || ticket.status !== 'PENDING') return;

    const interval = setInterval(async () => {
      try {
        if (!id) return;
        const fresh = await bookingService.getBookingById(id);
        if (fresh && fresh.status !== ticket.status) {
          setTicket(fresh);
        }
      } catch (e) {
        // silent polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [ticket, id]);

  const handleDownloadPdf = async () => {
    if (!ticket) return;
    setIsDownloadingPdf(true);
    try {
      Swal.fire({
        title: 'Mengunduh E-Ticket...',
        text: 'Menyiapkan dokumen PDF resmi tiket dengan enkripsi QR...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await bookingService.downloadTicketPdf(ticket.id, ticket.eventName);

      Swal.fire({
        icon: 'success',
        title: 'E-Ticket Berhasil Diunduh!',
        text: 'Dokumen PDF tiket telah disimpan di perangkat Anda.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error('Gagal mengunduh PDF tiket:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh',
        text: err.response?.data?.message || 'Terjadi kendala saat menghasilkan dokumen PDF e-ticket.',
        confirmButtonColor: '#FFD700',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePayPendingTicket = async () => {
    if (!ticket) return;
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
          onSuccess: async function (result: any) {
            try {
              await bookingService.verifyPayment(ticket.id, result);
            } catch (err) {
              console.error('Auto verify error:', err);
            }
            fetchTicketDetail();
            Swal.fire({
              icon: 'success',
              title: 'Pembayaran Berhasil!',
              text: 'Tiket resmi Anda telah aktif dan QR Gate siap digunakan.',
              confirmButtonColor: '#FFD700',
            });
          },
          onPending: async function (result: any) {
            try {
              await bookingService.verifyPayment(ticket.id, result);
            } catch (err) {
              console.error('Auto verify pending error:', err);
            }
            fetchTicketDetail();
            Swal.fire({
              icon: 'info',
              title: 'Menunggu Pembayaran',
              text: 'Silakan selesaikan pembayaran sesuai instruksi Midtrans.',
              confirmButtonColor: '#FFD700',
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
            bookingService.verifyPayment(ticket.id, { forceVerify: false }).catch(() => {});
            fetchTicketDetail();
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

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div
      className="position-relative min-vh-100 pb-5"
      style={{
        backgroundColor: '#0b0616',
        backgroundImage: "url('/images/user_dashboard_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        color: '#ffffff',
      }}
    >
      {/* Dark Ambient Gradient Overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 6, 22, 0.85) 0%, rgba(11, 6, 22, 0.96) 100%)',
          pointerEvents: 'none',
        }}
      ></div>

      <div className="container position-relative py-5" style={{ zIndex: 1 }}>
        {/* Navigation Breadcrumb */}
        <div className="d-flex align-items-center justify-content-between mb-4 anim-fade-in pt-3">
          <Link
            to="/my-tickets"
            className="btn-kikk-outline btn-sm d-inline-flex align-items-center gap-2 py-2 px-3"
            style={{ borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}
          >
            <i className="fas fa-arrow-left"></i> Kembali ke Koleksi Tiket
          </Link>

          <span className="gold-glow-badge" style={{ fontSize: '11px' }}>
            <i className="fas fa-qrcode text-warning me-1"></i> PASSPORT ELEKTRONIK GERBANG RESMI
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" style={{ width: '3.5rem', height: '3.5rem' }} role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-secondary mt-3">Mengambil data pas masuk dan enkripsi QR Code...</p>
          </div>
        ) : ticket ? (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              {/* Editorial Pass Container */}
              <div className="ticket-stub anim-fade-in shadow-lg overflow-hidden">
                <div className="row g-0">
                  {/* Left Column: Event & Holder Information */}
                  <div className="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-between">
                    <div>
                      {/* Tier & ID Header */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <span className="gold-glow-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          <i className="fas fa-award text-warning me-1"></i> {ticket.ticketCategoryName || 'GENERAL PASS'}
                        </span>
                        <div className="text-secondary small font-monospace">
                          <i className="fas fa-fingerprint me-1 text-warning"></i> BOOKING ID: {ticket.id}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h1 className="kikk-title text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)' }}>
                        {ticket.eventName}
                      </h1>

                      {/* Event Banner if available */}
                      {ticket.eventImageUrl && (
                        <div className="mb-4 rounded-3 overflow-hidden" style={{ maxHeight: '200px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                          <img
                            src={ticket.eventImageUrl}
                            alt={ticket.eventName}
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* Event Meta Details */}
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '42px', height: '42px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                            >
                              <i className="far fa-calendar-alt text-warning fs-5"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', letterSpacing: '0.5px' }}>JADWAL ACARA</div>
                              <div className="text-white fw-bold">{ticket.eventDate || 'Akan diumumkan'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '42px', height: '42px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                            >
                              <i className="fas fa-map-marker-alt text-warning fs-5"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', letterSpacing: '0.5px' }}>LOKASI VENUE</div>
                              <div className="text-white fw-bold">{ticket.eventLocation || 'Venue Utama'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Holder & Financial Summary Grid */}
                    <div
                      className="p-3 p-md-4 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4"
                      style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 215, 0, 0.2)' }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>PEMEGANG TIKET</div>
                        <div className="text-white fw-bold fs-6">
                          <i className="fas fa-user-check text-warning me-1"></i> {ticket.buyerName || 'Pembeli Resmi'}
                        </div>
                        <div className="text-secondary small">{ticket.buyerEmail}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>JUMLAH TIKET</div>
                        <div className="text-warning fw-bold fs-5">
                          <i className="fas fa-users me-1"></i> {ticket.quantity} Kursi
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>TOTAL DIBAYAR</div>
                        <div className="text-white fw-bold fs-5">
                          {formatRupiah(ticket.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Prominent QR Code Pass & Gate Scanner Section */}
                  <div
                    className="col-lg-5 ticket-perforation p-4 p-md-5 d-flex flex-column justify-content-between align-items-center text-center"
                    style={{ background: 'rgba(10, 5, 25, 0.75)' }}
                  >
                    <div className="w-100">
                      {/* Ticket Status Badge */}
                      <div className="mb-3">
                        {ticket.status === 'PAID' ? (
                          <span
                            className="badge bg-success text-white py-2 px-4"
                            style={{ borderRadius: '50px', fontSize: '12px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-circle-check me-1"></i> LUNAS (AKTIF)
                          </span>
                        ) : ticket.status === 'CHECKED_IN' ? (
                          <span
                            className="badge bg-info text-dark py-2 px-4"
                            style={{ borderRadius: '50px', fontSize: '12px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-check-double me-1"></i> SUDAH CHECK-IN
                          </span>
                        ) : ticket.status === 'PENDING' ? (
                          <span
                            className="badge bg-warning text-dark py-2 px-4"
                            style={{ borderRadius: '50px', fontSize: '12px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-hourglass-half me-1"></i> MENUNGGU PEMBAYARAN
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary text-white py-2 px-4"
                            style={{ borderRadius: '50px', fontSize: '12px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            {ticket.status}
                          </span>
                        )}
                      </div>

                      {/* Pass Code */}
                      <div className="mb-3">
                        <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          PASS CODE GERBANG
                        </div>
                        <div
                          className="font-monospace fs-3 fw-bold"
                          style={{ color: 'var(--kikk-yellow)', letterSpacing: '4px' }}
                        >
                          {ticket.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>

                      {/* Interactive QR Code Display Container */}
                      <div className="my-3 d-flex justify-content-center">
                        {ticket.status === 'PAID' ? (
                          <div
                            className="p-3 bg-white rounded-3 shadow-lg position-relative"
                            style={{
                              display: 'inline-block',
                              border: '3px solid var(--kikk-yellow)',
                            }}
                          >
                            <QRCodeSVG
                              value={ticket.id}
                              size={200}
                              level="H"
                              includeMargin={false}
                            />
                            <div className="text-dark small fw-bold mt-2 font-monospace" style={{ fontSize: '10px' }}>
                              SCAN AT EVENT GATE
                            </div>
                          </div>
                        ) : ticket.status === 'CHECKED_IN' ? (
                          <div
                            className="p-3 bg-white rounded-3 shadow-lg position-relative"
                            style={{
                              display: 'inline-block',
                              border: '3px solid #06b6d4',
                              opacity: 0.75,
                            }}
                          >
                            <QRCodeSVG
                              value={ticket.id}
                              size={200}
                              level="H"
                              includeMargin={false}
                            />
                            <div
                              className="position-absolute top-50 start-50 translate-middle badge bg-dark text-warning p-2"
                              style={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #ffd700' }}
                            >
                              <i className="fas fa-check-double me-1"></i> CHECKED-IN
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-4 rounded-3 d-flex flex-column align-items-center justify-content-center"
                            style={{
                              width: '224px',
                              height: '224px',
                              background: 'rgba(255, 215, 0, 0.05)',
                              border: '2px dashed rgba(255, 215, 0, 0.3)',
                            }}
                          >
                            <i className="fas fa-lock text-warning fa-3x mb-2"></i>
                            <div className="text-warning fw-bold small">QR CODE TERKUNCI</div>
                            <div className="text-secondary mt-1" style={{ fontSize: '11px', maxWidth: '170px' }}>
                              Selesaikan pembayaran untuk memunculkan QR Code gerbang masuk.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gate Scanner Instructions */}
                      <p className="text-secondary small mt-2 mb-4 mx-auto" style={{ maxWidth: '280px', fontSize: '12px', lineHeight: 1.5 }}>
                        {ticket.status === 'PAID'
                          ? 'Tunjukkan QR Code ini kepada panitia/petugas saat memasuki gerbang acara untuk divalidasi dengan Scanner STOMP.'
                          : ticket.status === 'CHECKED_IN'
                          ? 'Tiket ini telah berhasil divalidasi di gerbang masuk pada hari acara.'
                          : 'Setelah pembayaran terverifikasi, QR Code resmi akan aktif secara otomatis.'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-100 d-flex flex-column gap-2">
                      {ticket.status === 'PAID' || ticket.status === 'CHECKED_IN' ? (
                        <>
                          <button
                            type="button"
                            disabled={isDownloadingPdf}
                            onClick={handleDownloadPdf}
                            className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ fontSize: '13px', borderRadius: '10px' }}
                          >
                            <i className={`fas ${isDownloadingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                            {isDownloadingPdf ? 'Mengunduh Dokumen...' : 'Unduh E-Ticket (PDF)'}
                          </button>
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ fontSize: '12px', borderRadius: '10px' }}
                          >
                            <i className="fas fa-print"></i> Cetak Pas Masuk
                          </button>
                        </>
                      ) : ticket.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={handlePayPendingTicket}
                          className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                          style={{ fontSize: '13px', borderRadius: '10px' }}
                        >
                          <i className="fas fa-credit-card"></i> Selesaikan Pembayaran
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Floating Island Navigation Dock */}
      <UserFloatingDock />
    </div>
  );
};
