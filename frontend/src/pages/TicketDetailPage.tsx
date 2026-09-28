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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  // Auto-sync polling di latar belakang jika status masih PENDING
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
        text: 'Menyiapkan berkas PDF resmi tiket berstandar boarding pass...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await bookingService.downloadTicketPdf(ticket.id, ticket.eventName);

      Swal.fire({
        icon: 'success',
        title: 'E-Ticket Berhasil Diunduh!',
        text: 'Dokumen PDF tiket telah tersimpan di perangkat Anda.',
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

  const handleResendEmail = async () => {
    if (!ticket) return;
    setIsSendingEmail(true);
    try {
      Swal.fire({
        title: 'Mengirimkan E-Ticket...',
        text: `Menghubungi mail server untuk mengirim ke ${ticket.buyerEmail || 'email Anda'}...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await bookingService.resendTicketEmail(ticket.id);

      Swal.fire({
        icon: 'success',
        title: 'Email Terkirim!',
        text: `E-Ticket PDF resmi telah berhasil dikirimkan ke alamat ${ticket.buyerEmail || 'email Anda'}. Silakan periksa Kotak Masuk atau folder Spam.`,
        confirmButtonColor: '#FFD700',
      });
    } catch (err: any) {
      console.error('Gagal mengirim ulang email tiket:', err);
      Swal.fire({
        icon: 'error',
        title: 'Pengiriman Gagal',
        text: err.response?.data?.message || 'Gagal mengirim email e-ticket. Pastikan alamat email aktif.',
        confirmButtonColor: '#FFD700',
      });
    } finally {
      setIsSendingEmail(false);
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

  const handleCancelBooking = async () => {
    if (!ticket) return;
    const result = await Swal.fire({
      title: 'Batalkan Pesanan Ini?',
      text: `Pesanan tiket untuk "${ticket.eventName}" akan dibatalkan. Kuota kursi akan dikembalikan.`,
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
          timer: 1600,
          showConfirmButton: false,
        });
        navigate('/my-tickets');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan',
          text: err.response?.data?.message || 'Gagal membatalkan pesanan.',
          confirmButtonColor: '#FFD700',
        });
      }
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
      className="position-relative min-vh-100"
      style={{
        backgroundColor: '#0b0616',
        backgroundImage: "url('/images/user_dashboard_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        color: '#ffffff',
        paddingBottom: '140px', // Memberikan ruang lega agar tidak terpotong oleh floating dock
      }}
    >
      {/* Dark Ambient Gradient Overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 6, 22, 0.88) 0%, rgba(11, 6, 22, 0.97) 100%)',
          pointerEvents: 'none',
        }}
      ></div>

      <div className="container position-relative py-4" style={{ zIndex: 1 }}>
        {/* Navigation Breadcrumb */}
        <div className="d-flex align-items-center justify-content-between mb-4 anim-fade-in pt-2">
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
            <div className="col-12 col-xl-11">
              {/* Editorial Pass Container */}
              <div className="ticket-stub anim-fade-in shadow-lg overflow-hidden" style={{ border: '1px solid rgba(255, 215, 0, 0.25)' }}>
                <div className="row g-0 align-items-stretch">
                  {/* Left Column: Event & Holder Information */}
                  <div className="col-lg-7 p-4 p-md-4 d-flex flex-column justify-content-between" style={{ background: 'rgba(14, 8, 30, 0.75)' }}>
                    <div>
                      {/* Tier & ID Header */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <span className="gold-glow-badge" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          <i className="fas fa-award text-warning me-1"></i> {ticket.ticketCategoryName || 'GENERAL PASS'}
                        </span>
                        <div className="text-secondary small font-monospace" style={{ fontSize: '12px' }}>
                          <i className="fas fa-fingerprint me-1 text-warning"></i> ID: {ticket.id}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h1 className="kikk-title text-white mb-3" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', lineHeight: 1.25 }}>
                        {ticket.eventName}
                      </h1>

                      {/* Event Banner (Compact & Elegant) */}
                      {ticket.eventImageUrl && (
                        <div
                          className="mb-3 rounded-3 overflow-hidden position-relative"
                          style={{ height: '140px', border: '1px solid rgba(255, 215, 0, 0.2)' }}
                        >
                          <img
                            src={ticket.eventImageUrl}
                            alt={ticket.eventName}
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                          <div
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(11, 6, 22, 0.85) 100%)' }}
                          ></div>
                        </div>
                      )}

                      {/* Event Meta Details Grid */}
                      <div className="row g-2 mb-3">
                        <div className="col-sm-6">
                          <div
                            className="d-flex align-items-center gap-2 p-2 p-md-3 rounded-3"
                            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                          >
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                            >
                              <i className="far fa-calendar-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', letterSpacing: '0.5px' }}>JADWAL ACARA</div>
                              <div className="text-white fw-bold small">{ticket.eventDate || 'Akan diumumkan'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-6">
                          <div
                            className="d-flex align-items-center gap-2 p-2 p-md-3 rounded-3"
                            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                          >
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px', background: 'rgba(255, 215, 0, 0.1)', flexShrink: 0 }}
                            >
                              <i className="fas fa-map-marker-alt text-warning"></i>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', letterSpacing: '0.5px' }}>LOKASI VENUE</div>
                              <div className="text-white fw-bold small text-truncate" style={{ maxWidth: '170px' }} title={ticket.eventLocation}>
                                {ticket.eventLocation || 'Venue Utama'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Holder & Financial Summary Grid */}
                    <div
                      className="p-3 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3 mt-2"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 215, 0, 0.18)' }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>PEMEGANG TIKET</div>
                        <div className="text-white fw-bold small">
                          <i className="fas fa-user-check text-warning me-1"></i> {ticket.buyerName || 'Pembeli Resmi'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '11px' }}>{ticket.buyerEmail}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>JUMLAH TIKET</div>
                        <div className="text-warning fw-bold">
                          <i className="fas fa-users me-1"></i> {ticket.quantity} Kursi
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>TOTAL DIBAYAR</div>
                        <div className="text-white fw-bold fs-6">
                          {formatRupiah(ticket.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Prominent QR Code Pass & Action Hub */}
                  <div
                    className="col-lg-5 ticket-perforation p-4 d-flex flex-column justify-content-between align-items-center text-center"
                    style={{ background: 'rgba(10, 5, 25, 0.88)' }}
                  >
                    <div className="w-100">
                      {/* Ticket Status Badge */}
                      <div className="mb-2">
                        {ticket.status === 'PAID' ? (
                          <span
                            className="badge bg-success text-white py-2 px-3"
                            style={{ borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-circle-check me-1"></i> LUNAS (AKTIF)
                          </span>
                        ) : ticket.status === 'CHECKED_IN' ? (
                          <span
                            className="badge bg-info text-white py-2 px-3"
                            style={{ borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-check-double me-1"></i> SUDAH CHECK-IN
                          </span>
                        ) : ticket.status === 'PENDING' ? (
                          <span
                            className="badge bg-warning text-dark py-2 px-3"
                            style={{ borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            <i className="fas fa-hourglass-half me-1"></i> MENUNGGU PEMBAYARAN
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary text-white py-2 px-3"
                            style={{ borderRadius: '50px', fontSize: '11px', letterSpacing: '1px', fontWeight: 700 }}
                          >
                            {ticket.status}
                          </span>
                        )}
                      </div>

                      {/* Pass Code Gerbang */}
                      <div className="mb-2">
                        <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          PASS CODE GERBANG
                        </div>
                        <div
                          className="font-monospace fs-4 fw-bold"
                          style={{ color: 'var(--kikk-yellow)', letterSpacing: '3px' }}
                        >
                          {ticket.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>

                      {/* Interactive QR Code Display Container */}
                      <div className="my-2 d-flex justify-content-center">
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
                              size={170}
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
                              opacity: 0.8,
                            }}
                          >
                            <QRCodeSVG
                              value={ticket.id}
                              size={170}
                              level="H"
                              includeMargin={false}
                            />
                            <div
                              className="position-absolute top-50 start-50 translate-middle badge bg-dark text-warning p-2"
                              style={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #ffd700' }}
                            >
                              <i className="fas fa-check-double me-1"></i> TELAH CHECK-IN
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-3 rounded-3 d-flex flex-column align-items-center justify-content-center"
                            style={{
                              width: '190px',
                              height: '190px',
                              background: 'rgba(255, 215, 0, 0.05)',
                              border: '2px dashed rgba(255, 215, 0, 0.35)',
                            }}
                          >
                            <i className="fas fa-lock text-warning fa-3x mb-2"></i>
                            <div className="text-warning fw-bold small" style={{ letterSpacing: '0.5px' }}>QR TERKUNCI</div>
                            <div className="text-secondary mt-1" style={{ fontSize: '10.5px', maxWidth: '160px', lineHeight: 1.4 }}>
                              Selesaikan pembayaran agar QR Code gerbang masuk aktif otomatis.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gate Scanner Instructions */}
                      <p className="text-secondary small mt-1 mb-3 mx-auto" style={{ maxWidth: '270px', fontSize: '11px', lineHeight: 1.4 }}>
                        {ticket.status === 'PAID'
                          ? 'Tunjukkan QR Code ini kepada panitia saat memasuki gerbang acara untuk verifikasi.'
                          : ticket.status === 'CHECKED_IN'
                          ? 'Tiket ini telah divalidasi dan digunakan untuk masuk ke lokasi acara.'
                          : 'Setelah pembayaran terverifikasi, QR Code resmi akan aktif secara instan.'}
                      </p>
                    </div>

                    {/* Action Buttons Hub */}
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
                            disabled={isSendingEmail}
                            onClick={handleResendEmail}
                            className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                            style={{
                              fontSize: '12px',
                              borderRadius: '10px',
                              borderColor: 'rgba(255, 215, 0, 0.35)',
                              color: '#FFD700',
                            }}
                          >
                            <i className={`fas ${isSendingEmail ? 'fa-spinner fa-spin' : 'fa-envelope'}`}></i>
                            {isSendingEmail ? 'Mengirim ke Email...' : 'Kirim Ulang ke Email'}
                          </button>

                          <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-1"
                            style={{
                              fontSize: '11px',
                              borderRadius: '8px',
                              borderColor: 'rgba(255, 255, 255, 0.15)',
                              color: 'rgba(255, 255, 255, 0.65)',
                            }}
                          >
                            <i className="fas fa-print"></i> Cetak Pas Masuk
                          </button>
                        </>
                      ) : ticket.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            onClick={handlePayPendingTicket}
                            className="btn-kikk w-100 d-inline-flex align-items-center justify-content-center gap-2 py-3"
                            style={{ fontSize: '14px', borderRadius: '10px', fontWeight: 700 }}
                          >
                            <i className="fas fa-credit-card"></i> Selesaikan Pembayaran
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelBooking}
                            className="btn-kikk-outline w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2"
                            style={{
                              fontSize: '11px',
                              borderRadius: '8px',
                              borderColor: 'rgba(255, 255, 255, 0.15)',
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            <i className="fas fa-xmark"></i> Batalkan Pesanan Ini
                          </button>
                        </>
                      ) : (
                        <div className="text-secondary small py-2 px-3 rounded text-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                          <i className="fas fa-ban me-1 text-danger"></i> Pesanan Ini Telah Dibatalkan
                        </div>
                      )}
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
