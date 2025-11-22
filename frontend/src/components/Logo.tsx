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
        return '/brand/logo-icon.png';
      case 'white':
        return '/brand/logo-white.png';
      default:
        return '/brand/greenchainz-logo.png';
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
        // Fallback with brand color
        <div
          className="rounded-lg shadow-lg"
          style={{
            width: height,
            height: height,
            background: 'linear-gradient(135deg, #21808D 0%, #32B8C6 100%)',
            boxShadow: '0 0 20px rgba(33, 128, 141, 0.3)',
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
