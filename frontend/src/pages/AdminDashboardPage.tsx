import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { EventSummary, Category } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                  <th className="text-end">AKSI</th>
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
                      <Link to={`/events/${e.id}`} className="btn-kikk btn-sm py-1 px-3" style={{ fontSize: '12px' }}>
                        Lihat
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
