import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export const GateScannerPage: React.FC = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) return;

    setIsVerifying(true);
    try {
      const res = await api.post(`/scanner/validate?code=${encodeURIComponent(bookingCode.trim())}`);
      setLastResult({ success: true, data: res.data });
      Swal.fire({
        icon: 'success',
        title: 'Check-In Berhasil!',
        text: `Tiket valid untuk ${res.data?.data?.buyerName || 'Pengunjung'}. Selamat menikmati acara!`,
        confirmButtonColor: '#FFD700',
      });
      setBookingCode('');
    } catch (err: any) {
      setLastResult({ success: false, error: err.response?.data?.message || 'Kode tiket tidak valid atau sudah digunakan.' });
      Swal.fire({
        icon: 'error',
        title: 'Tiket Tidak Valid',
        text: err.response?.data?.message || 'Kode tiket tidak ditemukan atau sudah check-in.',
        confirmButtonColor: '#FFD700',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="section-padding container">
      <div className="text-center mb-5">
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '10px' }}>
          GATE ENTRY VALIDATION
        </div>
        <h2 className="kikk-title">Pemindai Tiket Masuk</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>
          Masukkan kode booking unik atau pindai QR Code pengunjung di pintu gerbang venue.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="kikk-card p-5">
            <div className="text-center mb-4">
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  margin: '0 auto 20px',
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  color: 'var(--kikk-yellow)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <i className="fas fa-qrcode"></i>
              </div>
              <h4 className="kikk-title mb-1">Validasi Tiket Cepat</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                Koneksi WebSocket real-time aktif
              </p>
            </div>

            <form onSubmit={handleManualCheckIn}>
              <div className="mb-4">
                <label className="kikk-form-label">Kode Booking / ID Tiket</label>
                <input
                  type="text"
                  className="kikk-form-control text-center fs-5 fw-bold"
                  placeholder="Contoh: BK-9X82LA atau UUID"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  style={{ letterSpacing: '2px' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="btn-kikk w-100 justify-content-center py-3"
              >
                {isVerifying ? (
                  'MEMVERIFIKASI...'
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i> VERIFIKASI SEKARANG
                  </>
                )}
              </button>
            </form>

            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-3 text-center ${
                  lastResult.success ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'
                }`}
              >
                {lastResult.success ? (
                  <div className="text-success fw-bold">
                    <i className="fas fa-check me-2"></i> Tiket Terverifikasi & Check-In Sukses
                  </div>
                ) : (
                  <div className="text-danger fw-bold">
                    <i className="fas fa-times me-2"></i> {lastResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
