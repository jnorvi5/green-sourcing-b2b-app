// frontend/src/components/products/VerifiedBadge.tsx
import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface VerifiedBadgeProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    wrapper: 'px-2 py-0.5 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    wrapper: 'px-2.5 py-1 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    wrapper: 'px-3 py-1.5 text-base',
    icon: 'w-5 h-5',
  },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const { wrapper, icon } = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-semibold
        bg-[var(--color-primary)] text-white ${wrapper} ${className}`}
      title="GreenChainz Verified"
    >
      <CheckBadgeIcon className={icon} />
      {showText && <span>GreenChainz Verified</span>}
    </div>
  );
};

export default VerifiedBadge;
