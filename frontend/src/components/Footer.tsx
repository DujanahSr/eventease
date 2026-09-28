import React from 'react';
import { Link } from 'react-router-dom';
import { EventEaseLogo } from './EventEaseLogo';

export const Footer: React.FC = () => {
  return (
    <footer
      className="position-relative pt-5 pb-4 border-top"
      style={{
        backgroundColor: '#07030e',
        borderColor: 'rgba(255, 215, 0, 0.1)',
        color: '#ffffff',
      }}
    >
      <div className="container">
        <div className="row g-4 mb-5">
          {/* Col 1: Brand & Philosophy */}
          <div className="col-lg-5">
            <div className="mb-3">
              <EventEaseLogo size="md" />
            </div>
            <p className="text-secondary small" style={{ maxWidth: '420px', lineHeight: 1.7 }}>
              Platform kurasi dan ticketing digital terdepan di Indonesia. Mengintegrasikan proteksi anti-calo Token Bucket, gateway pembayaran Midtrans Snap, dan validasi gerbang konser real-time WebSocket STOMP.
            </p>
            <div className="d-flex align-items-center gap-2 mt-3">
              <span className="gold-glow-badge" style={{ fontSize: '10px' }}>
                <i className="fas fa-shield-alt text-warning me-1"></i> ISO 27001 SECURED ARCHITECTURE
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="col-6 col-lg-3 offset-lg-1">
            <div style={{ fontSize: '12px', letterSpacing: '1.5px', color: '#FFD700', fontWeight: 700, marginBottom: '16px' }}>
              NAVIGASI UTAMA
            </div>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/" className="text-secondary text-decoration-none hover-gold transition-all">
                  <i className="fas fa-chevron-right text-warning me-2" style={{ fontSize: '10px' }}></i> Beranda
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-secondary text-decoration-none hover-gold transition-all">
                  <i className="fas fa-chevron-right text-warning me-2" style={{ fontSize: '10px' }}></i> Katalog Acara
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="text-secondary text-decoration-none hover-gold transition-all">
                  <i className="fas fa-chevron-right text-warning me-2" style={{ fontSize: '10px' }}></i> Tiket & Reservasi
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-secondary text-decoration-none hover-gold transition-all">
                  <i className="fas fa-chevron-right text-warning me-2" style={{ fontSize: '10px' }}></i> Daftar Penyelenggara
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology & Social */}
          <div className="col-6 col-lg-3">
            <div style={{ fontSize: '12px', letterSpacing: '1.5px', color: '#FFD700', fontWeight: 700, marginBottom: '16px' }}>
              JARINGAN RESMI
            </div>
            <div className="d-flex gap-2 mb-3">
              <a
                href="#"
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="#"
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="GitHub"
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="#"
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
            </div>
            <div className="text-secondary small">
              Jakarta, Indonesia
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-2" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div className="text-secondary small">
            &copy; 2026 Eventease Enterprise Platform. Hak cipta dilindungi undang-undang.
          </div>
          <div className="text-secondary small d-flex gap-3">
            <a href="#" className="text-secondary text-decoration-none hover-gold">Privasi</a>
            <span>&bull;</span>
            <a href="#" className="text-secondary text-decoration-none hover-gold">Ketentuan Layanan</a>
            <span>&bull;</span>
            <a href="#" className="text-secondary text-decoration-none hover-gold">Dokumentasi API</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
