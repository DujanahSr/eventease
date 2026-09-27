import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';

interface VerificationResult {
  valid: boolean;
  message: string;
  bookingId?: string;
  eventName?: string;
  ticketTier?: string;
  attendeeCount?: number;
  buyerName?: string;
  buyerEmail?: string;
  checkedInAt?: string;
}

export const GateScannerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'file'>('manual');
  const [bookingCode, setBookingCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; data?: VerificationResult; error?: string } | null>(null);

  // Camera Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Sample tickets for 1-click test
  const sampleTickets = [
    { code: 'bb8a87e8-2f17-4499-b802-014bbc49d9f9', label: 'Tiket #1 (PAID - Siap Check-In)', buyer: 'Admin / Pengunjung' },
    { code: '0c15500a-7037-4f29-a9c0-ff00f3a2910d', label: 'Tiket #2 (PAID - Siap Check-In)', buyer: 'Admin / Pengunjung' },
    { code: '9895deb6-be62-43c7-ac84-d7db09347535', label: 'Tiket #3 (Sudah Check-In)', buyer: 'Uji Tiket Hangus' },
  ];

  // Stop camera when unmounting or switching tab
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Gagal mematikan kamera:', err);
      }
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log('QR Code terdeteksi:', decodedText);
          handleVerifyTicket(decodedText);
          stopCamera();
        },
        () => {
          // Frame error (no QR found in frame), abaikan
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Kamera gagal dinyalakan:', err);
      setCameraError(err?.message || 'Izin akses kamera ditolak atau perangkat kamera tidak ditemukan.');
      setIsCameraActive(false);
    }
  };

  const handleVerifyTicket = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Kosong',
        text: 'Silakan masukkan atau pindai kode booking tiket.',
        confirmButtonColor: '#FFD700',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post('/scanner/validate', { bookingId: cleanCode });
      const resultData: VerificationResult = res.data.data;

      setLastResult({ success: true, data: resultData });

      Swal.fire({
        icon: 'success',
        title: 'Check-In Berhasil!',
        html: `
          <div style="text-align: left; font-size: 14px; margin-top: 10px;">
            <p><b>Peserta:</b> ${resultData.buyerName || 'Pengunjung'}</p>
            <p><b>Acara:</b> ${resultData.eventName || '-'}</p>
            <p><b>Kategori:</b> ${resultData.ticketTier || '-'} (${resultData.attendeeCount || 1} tiket)</p>
            <p style="color: #22c55e;"><b>Status:</b> CHECKED-IN (Valid)</p>
          </div>
        `,
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'OK, Selesai',
      });
      setBookingCode('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors || 'Kode tiket tidak valid atau sudah check-in.';
      setLastResult({ success: false, error: String(errorMsg) });

      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        text: String(errorMsg),
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    try {
      const scanner = new Html5Qrcode('qr-reader-temp');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      console.log('File QR terdeteksi:', decodedText);
      await handleVerifyTicket(decodedText);
    } catch (err: any) {
      console.error('Gagal membaca gambar QR:', err);
      Swal.fire({
        icon: 'error',
        title: 'QR Code Tidak Ditemukan',
        text: 'Pastikan gambar yang Anda unggah memuat QR Code tiket yang jelas.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsVerifying(false);
      e.target.value = '';
    }
  };

  return (
    <div className="section-padding container" style={{ position: 'relative', zIndex: 10 }}>
      {/* Hidden container for temp file scanning */}
      <div id="qr-reader-temp" style={{ display: 'none' }}></div>

      <div className="text-center mb-5">
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '10px' }}>
          GATE ENTRY VALIDATION
        </div>
        <h2 className="kikk-title">Pemindai Tiket Masuk</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '540px', margin: '0 auto' }}>
          Pindai QR Code tiket menggunakan kamera, unggah gambar QR, atau masukkan kode booking secara langsung.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="kikk-card p-4 p-md-5" style={{ position: 'relative', zIndex: 20 }}>
            {/* Mode Tabs */}
            <div className="d-flex justify-content-center gap-2 mb-4 p-1 rounded-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('manual');
                }}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'manual' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-keyboard me-2"></i> Input Manual
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  startCamera();
                }}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'camera' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-camera me-2"></i> Kamera Scanner
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('file');
                }}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'file' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-image me-2"></i> Upload QR
              </button>
            </div>

            {/* TAB 1: CAMERA SCANNER */}
            {activeTab === 'camera' && (
              <div className="text-center mb-4">
                <div
                  id="qr-reader-container"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '2px solid var(--kikk-yellow)',
                    background: '#000',
                    minHeight: '280px',
                  }}
                ></div>

                {cameraError && (
                  <div className="alert alert-danger mt-3" style={{ fontSize: '13px' }}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {cameraError}
                  </div>
                )}

                <div className="d-flex justify-content-center gap-3 mt-3">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-kikk btn-sm py-2 px-4"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-video me-2"></i> Nyalakan Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn btn-outline-danger btn-sm py-2 px-4"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-stop me-2"></i> Hentikan Kamera
                    </button>
                  )}
                </div>
                <small className="d-block mt-2 text-white-50" style={{ fontSize: '12px' }}>
                  Arahkan QR Code tiket ke dalam kotak pemindai kamera
                </small>
              </div>
            )}

            {/* TAB 2: MANUAL INPUT */}
            {activeTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyTicket(bookingCode);
                }}
              >
                <div className="text-center mb-4">
                  <div
                    onClick={() => {
                      setActiveTab('camera');
                      startCamera();
                    }}
                    title="Klik untuk membuka pemindai kamera"
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 15px',
                      background: 'rgba(255,215,0,0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: 'var(--kikk-yellow)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <i className="fas fa-qrcode"></i>
                  </div>
                  <h4 className="kikk-title mb-1" style={{ fontSize: '1.4rem' }}>Validasi Kode Booking</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Ketik kode tiket atau klik salah satu tiket sampel di bawah
                  </p>
                </div>

                <div className="mb-4">
                  <label className="kikk-form-label">KODE BOOKING / UUID TIKET</label>
                  <input
                    type="text"
                    className="kikk-form-control text-center fs-5 fw-bold"
                    placeholder="Masukkan atau tempel kode tiket..."
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value)}
                    style={{ letterSpacing: '1px', cursor: 'text' }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !bookingCode.trim()}
                  className="btn-kikk w-100 justify-content-center py-3 mb-4"
                  style={{ cursor: bookingCode.trim() ? 'pointer' : 'not-allowed', opacity: bookingCode.trim() ? 1 : 0.6 }}
                >
                  {isVerifying ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i> MEMVERIFIKASI...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i> VERIFIKASI SEKARANG
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: FILE UPLOAD QR */}
            {activeTab === 'file' && (
              <div className="text-center py-4">
                <div className="mb-4">
                  <i className="fas fa-cloud-upload-alt fa-3x text-warning mb-3 d-block"></i>
                  <h5 className="text-white">Pilih Foto atau Screenshot QR Tiket</h5>
                  <p className="text-white-50" style={{ fontSize: '13px' }}>
                    Format yang didukung: PNG, JPG, JPEG, WebP
                  </p>
                </div>
                <label className="btn-kikk py-3 px-4 d-inline-block" style={{ cursor: 'pointer' }}>
                  <i className="fas fa-folder-open me-2"></i> Pilih File Gambar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileScan}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {/* ONE-CLICK TEST SAMPLES */}
            <div className="pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <small className="text-warning fw-bold">
                  <i className="fas fa-magic me-1"></i> Klik Langsung untuk Uji Coba:
                </small>
                <small className="text-white-50">1-Click Test</small>
              </div>
              <div className="d-flex flex-column gap-2">
                {sampleTickets.map((t, idx) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => {
                      setBookingCode(t.code);
                      handleVerifyTicket(t.code);
                    }}
                    disabled={isVerifying}
                    className="btn text-start p-2 rounded-2 d-flex justify-content-between align-items-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <span className={`badge ${idx === 2 ? 'bg-secondary' : 'bg-success'} me-2`}>
                        {idx === 2 ? 'USED' : 'PAID'}
                      </span>
                      <span className="font-monospace text-warning">{t.code.slice(0, 16)}...</span>
                    </div>
                    <span className="text-white-50">{t.label} &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VERIFICATION RESULT BANNER */}
            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-3 text-center ${
                  lastResult.success ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'
                }`}
              >
                {lastResult.success ? (
                  <div className="text-success fw-bold">
                    <i className="fas fa-check-circle me-2"></i>
                    Check-In Berhasil: {lastResult.data?.buyerName} ({lastResult.data?.ticketTier})
                  </div>
                ) : (
                  <div className="text-danger fw-bold">
                    <i className="fas fa-times-circle me-2"></i>
                    {lastResult.error}
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
