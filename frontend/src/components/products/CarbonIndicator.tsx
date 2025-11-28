// frontend/src/components/products/CarbonIndicator.tsx
import React from 'react';

interface CarbonIndicatorProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Determines the carbon level category and returns corresponding color
 * Low: 0-30 kgCO₂e (green)
 * Medium: 31-100 kgCO₂e (yellow)
 * High: >100 kgCO₂e (red)
 */
function getCarbonLevel(value: number): { level: 'low' | 'medium' | 'high'; color: string; bgColor: string; label: string } {
  if (value <= 30) {
    return {
      level: 'low',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      label: 'Low Carbon',
    };
  }
  if (value <= 100) {
    return {
      level: 'medium',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      label: 'Medium Carbon',
    };
  }
  return {
    level: 'high',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'High Carbon',
  };
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const CarbonIndicator: React.FC<CarbonIndicatorProps> = ({
  value,
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { color, bgColor, label } = getCarbonLevel(value);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center font-semibold rounded-full ${bgColor} ${color} ${sizeClasses[size]}`}
      >
        <span className="font-bold">{value}</span>
        <span className="ml-1 font-normal">kgCO₂e</span>
      </span>
      {showLabel && (
        <span className={`${color} text-xs font-medium`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default CarbonIndicator;
