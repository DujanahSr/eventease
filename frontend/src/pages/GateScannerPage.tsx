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
  const [activeTab, setActiveTab] = useState<'manual' | 'camera' | 'file'>('manual');
  const [bookingCode, setBookingCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; data?: VerificationResult; error?: string } | null>(null);

  // Camera states
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);

  // File upload state
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Sample tickets for 1-click test
  const sampleTickets = [
    { code: 'bb8a87e8-2f17-4499-b802-014bbc49d9f9', label: 'Tiket #1 (PAID - Siap Check-In)', status: 'PAID' },
    { code: '0c15500a-7037-4f29-a9c0-ff00f3a2910d', label: 'Tiket #2 (PAID - Siap Check-In)', status: 'PAID' },
    { code: '9895deb6-be62-43c7-ac84-d7db09347535', label: 'Tiket #3 (Sudah Check-In)', status: 'USED' },
  ];

  // Cleanup camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCameraSilently();
    };
  }, []);

  const stopCameraSilently = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (e) {
        console.warn('Silent stop error:', e);
      }
      scannerInstanceRef.current = null;
      setIsCameraRunning(false);
    }
  };

  const handleTabChange = async (tab: 'manual' | 'camera' | 'file') => {
    if (activeTab === 'camera' && tab !== 'camera') {
      await stopCameraSilently();
    }
    setActiveTab(tab);
    setCameraError(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const container = document.getElementById('qr-reader-live');
      if (!container) {
        throw new Error('Elemen kamera tidak ditemukan di halaman.');
      }

      await stopCameraSilently();

      const scanner = new Html5Qrcode('qr-reader-live');
      scannerInstanceRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText) => {
          console.log('✅ QR Code terdeteksi:', decodedText);
          await stopCameraSilently();
          handleVerifyTicket(decodedText);
        },
        () => {
          // Frame scanner parse - ignore frame errors
        }
      );

      setIsCameraRunning(true);
    } catch (err: any) {
      console.error('Kamera gagal dinyalakan:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('Izin akses kamera ditolak. Izinkan browser mengakses kamera Anda.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('Kamera/webcam tidak terdeteksi pada perangkat ini. Gunakan mode Input Manual atau Upload QR.');
      } else {
        setCameraError(`Kamera belum dapat dibuka: ${errMsg}. Anda dapat menggunakan mode Input Manual atau Upload QR.`);
      }
      setIsCameraRunning(false);
    }
  };

  const handleVerifyTicket = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Kosong',
        text: 'Silakan masukkan kode booking tiket atau klik tombol contoh tiket.',
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
            <p style="margin: 4px 0;"><b>Peserta:</b> ${resultData.buyerName || 'Pengunjung'}</p>
            <p style="margin: 4px 0;"><b>Acara:</b> ${resultData.eventName || '-'}</p>
            <p style="margin: 4px 0;"><b>Kategori:</b> ${resultData.ticketTier || '-'} (${resultData.attendeeCount || 1} orang)</p>
            <p style="margin: 6px 0 0 0; color: #22c55e;"><b>Status:</b> CHECKED-IN (Valid)</p>
          </div>
        `,
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'Tutup',
      });
      setBookingCode('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors || 'Kode tiket tidak valid atau sudah check-in.';
      setLastResult({ success: false, error: String(errorMsg) });

      Swal.fire({
        icon: 'error',
        title: 'Tiket Tidak Valid',
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

    setUploadedPreview(URL.createObjectURL(file));
    setIsVerifying(true);

    try {
      const tempScanner = new Html5Qrcode('qr-reader-hidden-file');
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      console.log('✅ File QR terdeteksi:', decodedText);
      await handleVerifyTicket(decodedText);
    } catch (err: any) {
      console.error('Gagal membaca gambar QR:', err);
      Swal.fire({
        icon: 'error',
        title: 'QR Code Tidak Terbaca',
        text: 'Pastikan file gambar memuat QR Code tiket yang jelas dan tidak buram.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsVerifying(false);
      e.target.value = '';
    }
  };

  return (
    <div className="section-padding container" style={{ position: 'relative', zIndex: 1 }}>
      {/* Hidden container for file decoding */}
      <div id="qr-reader-hidden-file" style={{ display: 'none' }}></div>

      {/* Header */}
      <div className="text-center mb-5">
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '10px' }}>
          GATE ENTRY VALIDATION
        </div>
        <h2 className="kikk-title">Pemindai Tiket Masuk</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '540px', margin: '0 auto' }}>
          Validasi tiket pengunjung di pintu gerbang venue secara instan dengan notifikasi real-time via WebSocket.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="kikk-card p-4 p-md-5">
            {/* Mode Switcher Tabs */}
            <div className="d-flex justify-content-center gap-2 mb-4 p-1 rounded-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => handleTabChange('manual')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'manual' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-keyboard me-2"></i> Input Manual
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('camera')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'camera' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-camera me-2"></i> Kamera Scanner
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('file')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 ${
                  activeTab === 'file' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <i className="fas fa-image me-2"></i> Upload QR
              </button>
            </div>

            {/* TAB 1: INPUT MANUAL */}
            {activeTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyTicket(bookingCode);
                }}
              >
                <div className="text-center mb-4">
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      margin: '0 auto 15px',
                      background: 'rgba(255,215,0,0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: 'var(--kikk-yellow)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <i className="fas fa-barcode"></i>
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
                    placeholder="Contoh: bb8a87e8-2f17-4499-b802-014bbc49d9f9"
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
                  style={{
                    cursor: bookingCode.trim() ? 'pointer' : 'not-allowed',
                    opacity: bookingCode.trim() ? 1 : 0.6,
                  }}
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

            {/* TAB 2: KAMERA SCANNER */}
            <div style={{ display: activeTab === 'camera' ? 'block' : 'none' }}>
              <div className="text-center mb-4">
                <div
                  id="qr-reader-live"
                  style={{
                    width: '100%',
                    maxWidth: '380px',
                    margin: '0 auto 15px',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '2px dashed var(--kikk-yellow)',
                    background: 'rgba(0,0,0,0.5)',
                    minHeight: '260px',
                  }}
                ></div>

                {cameraError && (
                  <div className="alert alert-warning text-start p-3 rounded-3" style={{ fontSize: '13px' }}>
                    <i className="fas fa-info-circle me-2 text-warning"></i>
                    {cameraError}
                  </div>
                )}

                <div className="d-flex justify-content-center gap-3 mt-3">
                  {!isCameraRunning ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-kikk py-2 px-4"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-video me-2"></i> Nyalakan Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraSilently}
                      className="btn btn-outline-danger py-2 px-4 rounded-3"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-stop me-2"></i> Matikan Kamera
                    </button>
                  )}
                </div>
                <small className="d-block mt-3 text-white-50" style={{ fontSize: '12px' }}>
                  Arahkan QR Code tiket ke depan kamera untuk memvalidasi secara otomatis
                </small>
              </div>
            </div>

            {/* TAB 3: UPLOAD FILE QR */}
            {activeTab === 'file' && (
              <div className="text-center py-4">
                <div className="mb-4">
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      margin: '0 auto 15px',
                      background: 'rgba(255,215,0,0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: 'var(--kikk-yellow)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <i className="fas fa-cloud-upload-alt"></i>
                  </div>
                  <h4 className="kikk-title mb-1" style={{ fontSize: '1.4rem' }}>Unggah Gambar QR Code</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Pilih file foto atau screenshot QR Code tiket dari komputer / HP Anda
                  </p>
                </div>

                {uploadedPreview && (
                  <div className="mb-3">
                    <img
                      src={uploadedPreview}
                      alt="Preview QR"
                      style={{ maxWidth: '180px', maxHeight: '180px', borderRadius: '12px', border: '2px solid var(--kikk-yellow)' }}
                    />
                  </div>
                )}

                <label
                  className="btn-kikk py-3 px-4 d-inline-flex align-items-center justify-content-center"
                  style={{ cursor: 'pointer', minWidth: '220px' }}
                >
                  <i className={`fas ${isVerifying ? 'fa-spinner fa-spin' : 'fa-folder-open'} me-2`}></i>
                  {isVerifying ? 'MEMPROSES GAMBAR...' : 'Pilih Gambar QR'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileScan}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {/* ONE-CLICK TEST SAMPLES CHIPS */}
            <div className="pt-4 mt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-warning fw-bold" style={{ fontSize: '13px' }}>
                  <i className="fas fa-magic me-1"></i> Klik 1x untuk Langsung Uji Coba:
                </span>
                <span className="badge bg-dark border border-secondary" style={{ fontSize: '10px' }}>1-Click Test</span>
              </div>
              <div className="d-flex flex-column gap-2">
                {sampleTickets.map((t) => (
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
                      <span className={`badge ${t.status === 'USED' ? 'bg-secondary' : 'bg-success'} me-2`}>
                        {t.status}
                      </span>
                      <span className="font-monospace text-warning">{t.code.slice(0, 18)}...</span>
                    </div>
                    <span className="text-white-50">{t.label} &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RESULT MESSAGE BANNER */}
            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-3 text-center ${
                  lastResult.success ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'
                }`}
              >
                {lastResult.success ? (
                  <div className="text-success fw-bold">
                    <i className="fas fa-check-circle me-2"></i>
                    Check-In Berhasil: {lastResult.data?.buyerName} &bull; {lastResult.data?.eventName} ({lastResult.data?.ticketTier})
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
