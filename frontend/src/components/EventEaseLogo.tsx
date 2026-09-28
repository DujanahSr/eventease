import React from 'react';

interface EventEaseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const EventEaseLogo: React.FC<EventEaseLogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: { width: 24, height: 24, fontSize: '1.25rem' },
    md: { width: 32, height: 32, fontSize: '1.65rem' },
    lg: { width: 44, height: 44, fontSize: '2.2rem' },
  };

  const currentSize = iconSizes[size];

  return (
    <div className="d-inline-flex align-items-center gap-2" style={{ textDecoration: 'none', userSelect: 'none' }}>
      {/* Luxury Geometric Diamond / Prism Vector Logo */}
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.4))' }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1B8" />
            <stop offset="40%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#997000" />
          </linearGradient>
          <linearGradient id="facetGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFEA85" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Outer Prism Hexagon */}
        <polygon
          points="50,6 92,28 92,72 50,94 8,72 8,28"
          stroke="url(#goldGradient)"
          strokeWidth="5"
          fill="rgba(20, 10, 35, 0.7)"
        />

        {/* Inner Geometric Star & Facets */}
        <polygon
          points="50,6 50,50 8,28"
          fill="url(#facetGradient)"
          opacity="0.35"
        />
        <polygon
          points="50,6 92,28 50,50"
          fill="url(#goldGradient)"
          opacity="0.6"
        />
        <polygon
          points="92,28 92,72 50,50"
          fill="url(#facetGradient)"
          opacity="0.4"
        />
        <polygon
          points="92,72 50,94 50,50"
          fill="url(#goldGradient)"
          opacity="0.75"
        />
        <polygon
          points="50,94 8,72 50,50"
          fill="url(#facetGradient)"
          opacity="0.5"
        />
        <polygon
          points="8,72 8,28 50,50"
          fill="url(#goldGradient)"
          opacity="0.3"
        />

        {/* Center Crystal Cut */}
        <circle cx="50" cy="50" r="7" fill="#FFF8DC" />
      </svg>

      {showText && (
        <span
          className="kikk-title text-lowercase"
          style={{
            fontSize: currentSize.fontSize,
            letterSpacing: '-0.5px',
            color: '#ffffff',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          eventease<span style={{ color: '#FFD700', fontSize: '1.2em' }}>.</span>
        </span>
      )}
    </div>
  );
};
