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
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ success: boolean; data?: VerificationResult; error?: string } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Bersihkan kamera saat unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Gagal menghentikan scanner:', err);
      }

      try {
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Gagal membersihkan kontainer scanner:', err);
      }

      scannerRef.current = null;
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      await stopCamera();

      const scanner = new Html5Qrcode('camera-scanner-box');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText) => {
          console.log('[QR Scanner] QR Code terdeteksi:', decodedText);
          await stopCamera();
          handleVerify(decodedText);
        },
        () => {
          // ignore loop parse failure
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Gagal menyalakan kamera:', err);
      setIsCameraActive(false);
      const msg = String(err?.message || err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Izin akses kamera ditolak. Silakan izinkan browser menggunakan kamera.');
      } else {
        setCameraError('Kamera tidak terdeteksi atau sedang digunakan oleh aplikasi lain. Anda bisa beralih ke tab "Upload QR" atau "Input Manual".');
      }
    }
  };

  // Efek menyalakan kamera otomatis saat pertama kali tab Kamera aktif
  useEffect(() => {
    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [activeTab]);

  const handleTabChange = async (tab: 'camera' | 'upload' | 'manual') => {
    if (activeTab === tab) return;
    await stopCamera();
    setCameraError(null);
    setActiveTab(tab);
  };

  const handleVerify = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Kode Kosong',
        text: 'Silakan masukkan atau scan kode booking tiket.',
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
          <div style="text-align: left; font-size: 14px; margin-top: 10px; line-height: 1.6;">
            <div><b>Nama Pengunjung:</b> ${resultData.buyerName || '-'}</div>
            <div><b>Acara:</b> ${resultData.eventName || '-'}</div>
            <div><b>Kategori Tiket:</b> ${resultData.ticketTier || '-'} (${resultData.attendeeCount || 1} orang)</div>
            <div style="color: #22c55e; margin-top: 6px; font-weight: bold;">
              <i class="fas fa-check-circle me-1"></i> STATUS: CHECKED-IN (VALID)
            </div>
          </div>
        `,
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'Lanjutkan Scan Berikutnya',
      });
      setManualCode('');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.errors || 'Kode tiket tidak valid atau sudah pernah check-in sebelumnya.';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    try {
      const scanner = new Html5Qrcode('qr-temp-file-reader');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      await handleVerify(decodedText);
    } catch (err: any) {
      console.error('File scan error:', err);
      Swal.fire({
        icon: 'error',
        title: 'QR Code Tidak Ditemukan',
        text: 'File gambar tidak memuat QR Code yang jelas. Silakan coba gambar tiket yang lain.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsVerifying(false);
      e.target.value = '';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '135px', paddingBottom: '70px', position: 'relative', zIndex: 1 }}>
      {/* CSS untuk mematikan canvas ganda pada pemindai kamera */}
      <style>{`
        #camera-scanner-box {
          position: relative !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          background: #000 !important;
          border: 2px solid var(--kikk-yellow) !important;
        }
        #camera-scanner-box video {
          width: 100% !important;
          height: auto !important;
          max-height: 340px !important;
          object-fit: cover !important;
          display: block !important;
          margin: 0 auto !important;
        }
        #camera-scanner-box canvas {
          display: none !important;
        }
        #camera-scanner-box img {
          display: none !important;
        }
        #camera-scanner-box #qr-shaded-region {
          border-color: rgba(255, 215, 0, 0.4) !important;
        }
      `}</style>

      {/* Hidden container untuk decode file */}
      <div id="qr-temp-file-reader" style={{ display: 'none' }}></div>

      {/* Header Halaman */}
      <div className="text-center mb-4">
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
          GATE ENTRY VALIDATION
        </div>
        <h2 className="kikk-title m-0" style={{ fontSize: '2.2rem' }}>Pemindai Tiket Masuk</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
          Validasi tiket pengunjung di gerbang venue &bull; Real-time WebSocket terhubung
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="kikk-card p-4 p-md-5 shadow-lg" style={{ border: '1px solid rgba(255, 215, 0, 0.25)' }}>
            
            {/* 3 Tab Mode Switcher - Jelas & Mudah Diklik */}
            <div className="d-flex justify-content-center gap-2 mb-4 p-1 rounded-3" style={{ background: 'rgba(255,255,255,0.08)', position: 'relative', zIndex: 100 }}>
              <button
                type="button"
                onClick={() => handleTabChange('camera')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 flex-grow-1 ${
                  activeTab === 'camera' ? 'btn-warning text-dark shadow' : 'text-white'
                }`}
                style={{ cursor: 'pointer', fontSize: '13px' }}
              >
                <i className="fas fa-camera me-1"></i> Kamera QR
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('upload')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 flex-grow-1 ${
                  activeTab === 'upload' ? 'btn-warning text-dark shadow' : 'text-white'
                }`}
                style={{ cursor: 'pointer', fontSize: '13px' }}
              >
                <i className="fas fa-image me-1"></i> Upload QR
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('manual')}
                className={`btn btn-sm py-2 px-3 fw-bold rounded-2 flex-grow-1 ${
                  activeTab === 'manual' ? 'btn-warning text-dark shadow' : 'text-white'
                }`}
                style={{ cursor: 'pointer', fontSize: '13px' }}
              >
                <i className="fas fa-keyboard me-1"></i> Input Manual
              </button>
            </div>

            {/* TAB 1: KAMERA QR (1 GAMBAR TUNGGAL, TANPA CANVAS DUPLIKAT) */}
            {activeTab === 'camera' && (
              <div className="text-center">
                <div id="camera-scanner-box" style={{ width: '100%', maxWidth: '360px', margin: '0 auto', minHeight: '260px' }}></div>

                {cameraError ? (
                  <div className="alert alert-warning text-start p-3 mt-3 rounded-3" style={{ fontSize: '13px' }}>
                    <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                    {cameraError}
                  </div>
                ) : (
                  <div className="mt-3">
                    {isCameraActive ? (
                      <span className="text-success fw-bold" style={{ fontSize: '13px' }}>
                        <i className="fas fa-circle text-success me-1"></i> Kamera Aktif &bull; Arahkan QR Code tiket ke depan layar
                      </span>
                    ) : (
                      <span className="text-white-50" style={{ fontSize: '13px' }}>Menghubungkan ke kamera...</span>
                    )}
                  </div>
                )}

                <div className="d-flex justify-content-center gap-2 mt-3">
                  {isCameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn btn-outline-danger btn-sm py-2 px-3"
                      style={{ cursor: 'pointer', fontSize: '12px' }}
                    >
                      <i className="fas fa-stop me-1"></i> Matikan Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-kikk btn-sm py-2 px-3"
                      style={{ cursor: 'pointer', fontSize: '12px' }}
                    >
                      <i className="fas fa-video me-1"></i> Nyalakan Ulang Kamera
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD GAMBAR QR */}
            {activeTab === 'upload' && (
              <div className="text-center py-3">
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
                <h5 className="text-white mb-2">Unggah Foto / Screenshot QR Tiket</h5>
                <p className="text-white-50 mb-4" style={{ fontSize: '13px' }}>
                  Pilih file gambar QR code tiket dari galeri atau berkas komputer Anda
                </p>

                <label
                  className="btn-kikk py-3 px-4 d-inline-flex align-items-center justify-content-center"
                  style={{ cursor: 'pointer', minWidth: '220px' }}
                >
                  <i className={`fas ${isVerifying ? 'fa-spinner fa-spin' : 'fa-folder-open'} me-2`}></i>
                  {isVerifying ? 'MEMINDAI GAMBAR...' : 'Pilih Gambar QR'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {/* TAB 3: INPUT MANUAL KODE BOOKING */}
            {activeTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify(manualCode);
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
                  <h5 className="text-white mb-1">Ketik Kode Booking Tiket</h5>
                  <p className="text-white-50" style={{ fontSize: '13px' }}>
                    Masukkan atau tempel kode booking / UUID tiket pengunjung
                  </p>
                </div>

                <div className="mb-4">
                  <label className="kikk-form-label">KODE BOOKING / UUID TIKET</label>
                  <input
                    type="text"
                    className="kikk-form-control text-center fs-5 fw-bold"
                    placeholder="Contoh: bb8a87e8-2f17-4499-b802-014bbc49d9f9"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    style={{ letterSpacing: '1px' }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !manualCode.trim()}
                  className="btn-kikk w-100 justify-content-center py-3"
                  style={{
                    cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                    opacity: manualCode.trim() ? 1 : 0.6,
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

            {/* HASIL VALIDASI TERAKHIR */}
            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-3 text-center ${
                  lastResult.success ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'
                }`}
              >
                {lastResult.success ? (
                  <div className="text-success fw-bold" style={{ fontSize: '14px' }}>
                    <i className="fas fa-check-circle me-2"></i>
                    Check-In Berhasil: {lastResult.data?.buyerName} &bull; {lastResult.data?.eventName} ({lastResult.data?.ticketTier})
                  </div>
                ) : (
                  <div className="text-danger fw-bold" style={{ fontSize: '14px' }}>
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
