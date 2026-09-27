import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { websocketService, CheckInNotification } from '../services/websocketService';
import { EventSummary } from '../types';
import Swal from 'sweetalert2';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInNotification[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);

  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      setIsLoading(true);
      try {
        const res = await eventService.getEvents('', '', 0, 10);
        setEvents(res.content || []);
      } catch (err) {
        console.error('Failed to load organizer events', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrganizerEvents();

    // Inisialisasi koneksi WebSocket STOMP untuk real-time check-in
    websocketService.connect(() => {
      setIsWsConnected(true);
    });

    const unsubscribe = websocketService.subscribeToCheckIn((notification) => {
      setRecentCheckIns((prev) => [notification, ...prev.slice(0, 9)]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengumpulkan data penjualan tiket dan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Penjualan_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Penjualan_Semua_Acara_${Date.now()}.xlsx`;

      triggerFileDownload(blob, filename);

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: `File ${filename} berhasil diunduh.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Gagal mengekspor laporan Excel:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Ekspor Excel',
        text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="section-padding container">
      {/* Header Greeting */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
            ORGANIZER PORTAL
          </div>
          <h2 className="kikk-title m-0">{user?.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0' }}>
            Penyelenggara Resmi Eventease | {user?.email}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-4 mt-md-0">
          <button
            onClick={() => handleExportExcel()}
            disabled={isExporting}
            className="btn-kikk-outline"
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
            title="Ekspor seluruh laporan penjualan tiket ke format Excel (.xlsx)"
          >
            <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} me-2`}></i>
            Ekspor Excel (.xlsx)
          </button>
          <Link to="/scan" className="btn-kikk-outline">
            <i className="fas fa-qrcode me-2"></i> Buka Scanner
          </Link>
          <Link to="/wallet" className="btn-kikk-outline">
            <i className="fas fa-wallet me-2"></i> Dompet
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>TOTAL ACARA AKTIF</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>{events.length}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>
              <i className="fas fa-calendar-check me-1"></i> Terpublikasi di platform
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>STATUS WEBSOCKET GATE</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2rem', color: isWsConnected ? '#22c55e' : '#eab308' }}>
              <i className={`fas fa-circle me-2 ${isWsConnected ? 'text-success' : 'text-warning'}`} style={{ fontSize: '1rem' }}></i>
              {isWsConnected ? 'LIVE AKTIF' : 'MENGHUBUNGKAN'}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              <i className="fas fa-broadcast-tower me-1"></i> STOMP Realtime Check-In Gate
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>SALDO PENDAPATAN (WALLET)</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.2rem' }}>{formatRupiah(user?.saldo || 0)}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>
              <i className="fas fa-coins me-1"></i> Siap dicairkan ke rekening
            </div>
          </div>
        </div>
      </div>

      {/* Live Gate Check-In Stream Widget */}
      <div className="kikk-card p-4 mb-5" style={{ borderLeft: '4px solid #22c55e' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success py-1 px-2" style={{ fontSize: '11px' }}>
              <i className="fas fa-satellite-dish me-1"></i> LIVE FEED
            </span>
            <h4 className="kikk-title m-0" style={{ fontSize: '1.25rem' }}>
              Aktivitas Check-In Gate Realtime (WebSocket STOMP)
            </h4>
          </div>
          <small style={{ color: 'rgba(255,255,255,0.5)' }}>
            Notifikasi pop-up otomatis muncul saat tiket discan di pintu masuk
          </small>
        </div>

        {recentCheckIns.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            <i className="fas fa-qrcode fa-2x mb-2 d-block text-secondary"></i>
            Belum ada aktivitas check-in di gate saat ini. Buka halaman <Link to="/scan" className="text-warning">Scanner QR</Link> untuk memvalidasi tiket masuk.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {recentCheckIns.map((ci) => (
              <div
                key={ci.bookingId + '-' + (ci.timestamp || Math.random())}
                className="d-flex justify-content-between align-items-center p-3 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2 bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-white">{ci.attendeeName} ({ci.attendeeEmail || 'Peserta'})</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Acara: <span className="text-warning">{ci.eventName}</span> &bull; Tier: <span className="badge bg-primary">{ci.ticketTier}</span> ({ci.attendeeCount} tiket)
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge bg-success mb-1">CHECKED-IN</span>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Total Hadir: {ci.totalCheckedIn}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events Managed Table */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="kikk-title m-0" style={{ fontSize: '1.8rem' }}>Daftar Acara Diselenggarakan</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--kikk-yellow)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="kikk-table table-responsive">
            <table className="table m-0">
              <thead>
                <tr>
                  <th>NAMA ACARA</th>
                  <th>KATEGORI</th>
                  <th>TANGGAL</th>
                  <th>LOKASI</th>
                  <th className="text-end">AKSI & LAPORAN</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="fw-bold text-white">{e.name}</td>
                    <td><span className="badge bg-secondary">{e.categoryName || 'General'}</span></td>
                    <td>{e.date}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{e.location}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => handleExportExcel(e.id, e.name)}
                          className="btn-kikk-outline btn-sm py-1 px-2"
                          style={{ fontSize: '11px', borderColor: '#22c55e', color: '#22c55e' }}
                          title="Unduh laporan penjualan acara ini (.xlsx)"
                        >
                          <i className="fas fa-file-excel me-1"></i> Excel
                        </button>
                        <Link to={`/events/${e.id}`} className="btn-kikk btn-sm py-1 px-3" style={{ fontSize: '12px' }}>
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
