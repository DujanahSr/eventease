import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { EventSummary } from '../types';

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
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
        <div className="d-flex gap-3 mt-4 mt-md-0">
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
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>ESTIMASI TIKET TERSEDIA</div>
            <h2 className="kikk-title my-2" style={{ fontSize: '2.5rem' }}>3,500+</h2>
            <div style={{ color: 'var(--kikk-yellow)', fontSize: '0.85rem' }}>
              <i className="fas fa-ticket-alt me-1"></i> Di semua tier tiket
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

      {/* Events Managed */}
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
                  <th className="text-end">AKSI</th>
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
                      <Link to={`/events/${e.id}`} className="btn-kikk btn-sm py-1 px-3" style={{ fontSize: '12px' }}>
                        Detail
                      </Link>
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
