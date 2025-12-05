import { Link } from 'react-router-dom';
import { useState } from 'react';

interface LogoProps {
  height?: number;
  showText?: boolean;
  variant?: 'main' | 'icon' | 'white';
  className?: string;
}

export default function Logo({ height = 40, showText = true, variant = 'main', className = '' }: LogoProps) {
  const [imgOk, setImgOk] = useState(true);

  // Determine logo file based on variant
  const getLogoSrc = () => {
    switch (variant) {
      case 'icon':
        return '/assets/logo/greenchainz-logo-icon.png';
      case 'white':
        return '/assets/logo/greenchainz-logo-white.png';
      default:
        return '/assets/logo/greenchainz-logo-full.png';
    }
  };

  return (
    <Link to="/" className={`flex items-center gap-3 ${className}`} aria-label="GreenChainz Home">
      {imgOk ? (
        <img
          src={getLogoSrc()}
          alt="GreenChainz - Verified Sustainable Sourcing"
          style={{ height }}
          className="object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        // Fallback with GreenChainz brand colors
        <div
          className="rounded-lg shadow-lg"
          style={{
            width: height,
            height: height,
            background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)',
          }}
          aria-hidden
        />
      )}
      {showText && (
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          GreenChainz
        </span>
      )}
    </Link>
  );
}
