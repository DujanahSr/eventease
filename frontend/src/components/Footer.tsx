import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-kikk">
      <div className="container text-center">
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '5px 20px',
            borderRadius: '50px',
            display: 'inline-block',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px',
            letterSpacing: '2px',
          }}
        >
          #EVTEASE26
        </div>
        <h2 className="kikk-title footer-title">FOLLOW US</h2>

        <div className="social-links my-4">
          <a href="#" className="mx-2" style={{ color: '#fff', fontSize: '20px' }}>
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="mx-2" style={{ color: '#fff', fontSize: '20px' }}>
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="mx-2" style={{ color: '#fff', fontSize: '20px' }}>
            <i className="fab fa-youtube"></i>
          </a>
          <a href="#" className="mx-2" style={{ color: '#fff', fontSize: '20px' }}>
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>

        <div className="footer-bottom d-flex justify-content-between align-items-center flex-wrap pt-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <span style={{ color: 'var(--kikk-yellow)', marginRight: '15px' }}>
              <i className="fas fa-ticket-alt me-1"></i> Eventease Platform
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            &copy; 2026 Eventease ASBL. &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Contact
            </a>{' '}
            &nbsp;&nbsp;|&nbsp;&nbsp;{' '}
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
