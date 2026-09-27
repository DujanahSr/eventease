import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { bookingService, triggerFileDownload } from '../services/bookingService';
import { EventSummary, Category } from '../types';
import Swal from 'sweetalert2';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [eventData, catData] = await Promise.all([
          eventService.getEvents('', '', 0, 20),
          eventService.getCategories(),
        ]);
        setEvents(eventData.content || []);
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleExportExcel = async (eventId?: string, eventName?: string) => {
    setIsExporting(true);
    try {
      Swal.fire({
        title: 'Mempersiapkan Dokumen Excel...',
        text: 'Mengonsolidasikan transaksi tiket dengan format Apache POI...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const blob = await bookingService.exportBookingsExcel(eventId);
      const filename = eventName
        ? `Laporan_Admin_${eventName.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_Konsolidasi_Penjualan_Platform_${Date.now()}.xlsx`;

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
        text: 'Terjadi kesalahan saat mengekspor laporan penjualan tiket platform.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="section-padding container">
      {/* Header Profile Greeting */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--glass-border)' }}>
        <div>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: 'var(--kikk-yellow)', marginBottom: '8px' }}>
            SUPER ADMINISTRATOR CONSOLE
          </div>
          <h2 className="kikk-title m-0">Panel Pengelola Platform</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0' }}>
            Login sebagai: {user?.name} ({user?.email})
          </p>
        </div>
        <div className="d-flex gap-3 mt-4 mt-md-0">
          <button
            onClick={() => handleExportExcel()}
            disabled={isExporting}
            className="btn-kikk-outline"
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
            title="Unduh laporan penjualan konsolidasi seluruh platform (.xlsx)"
          >
            <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-excel'} me-2`}></i>
            Unduh Laporan Konsolidasi (.xlsx)
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px' }}>TOTAL ACARA</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>{events.length}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>Terdaftar di Database</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px' }}>KATEGORI RESMI</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>{categories.length}</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>Kategori Aktif</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px' }}>ROLE SYSTEM</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>3</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>ADMIN, ORGANIZER, USER</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kikk-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px' }}>GATEWAY PEMBAYARAN</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '1.8rem', color: '#22c55e' }}>ONLINE</h2>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Midtrans Snap Sandbox</div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="mb-4">
        <h3 className="kikk-title mb-4" style={{ fontSize: '1.8rem' }}>Semua Acara Terdaftar</h3>
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
                  <th>ORGANIZER</th>
                  <th className="text-end">AKSI & LAPORAN</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="fw-bold text-white">{e.name}</td>
                    <td><span className="badge bg-secondary">{e.categoryName || 'General'}</span></td>
                    <td>{e.date}</td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{e.organizerName || 'Eventease Official'}</td>
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
                          Lihat
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
