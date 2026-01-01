import React from 'react';

interface GreenChainzLogoProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const GreenChainzLogo: React.FC<GreenChainzLogoProps> = ({
  width = 400,
  height = 400,
  className,
  ...props
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="maneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1a7473', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#32b8c6', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2db648', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#32b8c6', stopOpacity: 1 }} />
        </linearGradient>

        <style>
          {`
            @keyframes crownGlow {
              0%, 100% { filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.6)); }
              50% { filter: drop-shadow(0 0 15px rgba(212, 175, 55, 1)); }
            }
            @keyframes leafSway {
              0%, 100% { transform: rotate(-2deg); }
              50% { transform: rotate(2deg); }
            }
            .crown { animation: crownGlow 2s ease-in-out infinite; }
            .leaf { animation: leafSway 3s ease-in-out infinite; transform-origin: top center; }
          `}
        </style>
      </defs>

      {/* BACKGROUND CIRCLE (optional) */}
      <circle
        cx="200"
        cy="200"
        r="190"
        fill="rgba(252, 252, 249, 0.1)"
        stroke="#218a8d"
        strokeWidth="2"
        opacity="0.5"
      />

      {/* MANE (Large circle with gradient) */}
      <circle cx="200" cy="200" r="140" fill="url(#maneGrad)" opacity="0.4" />

      {/* MANE ACCENT CIRCLES (Radiating) */}
      <circle cx="120" cy="140" r="40" fill="url(#maneGrad)" opacity="0.3" />
      <circle cx="280" cy="140" r="40" fill="url(#maneGrad)" opacity="0.3" />
      <circle cx="100" cy="200" r="35" fill="url(#maneGrad)" opacity="0.3" />
      <circle cx="300" cy="200" r="35" fill="url(#maneGrad)" opacity="0.3" />

      {/* HEAD (Main yellow circle) */}
      <circle cx="200" cy="220" r="80" fill="#F4D03F" />

      {/* LEFT EYE */}
      <circle cx="175" cy="205" r="10" fill="#000" />
      <circle cx="177" cy="202" r="3" fill="#fff" />

      {/* RIGHT EYE */}
      <circle cx="225" cy="205" r="10" fill="#000" />
      <circle cx="227" cy="202" r="3" fill="#fff" />

      {/* NOSE */}
      <ellipse cx="200" cy="235" rx="8" ry="12" fill="#000" />

      {/* MOUTH (Simple smile) */}
      <path
        d="M 200 235 Q 185 250 170 240"
        stroke="#000"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 200 235 Q 215 250 230 240"
        stroke="#000"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ============================================ */}
      {/* INTEGRATED LEAF (Emerging from top of head) */}
      {/* ============================================ */}

      <g className="leaf" transform="translate(200, 100)">
        {/* Leaf stem */}
        <line x1="0" y1="0" x2="0" y2="40" stroke="#2d8a8a" strokeWidth="2" />

        {/* Leaf shape (botanical) */}
        <ellipse cx="0" cy="50" rx="20" ry="35" fill="url(#leafGrad)" />

        {/* Leaf vein */}
        <line
          x1="0"
          y1="20"
          x2="0"
          y2="70"
          stroke="#1a7473"
          strokeWidth="1"
          opacity="0.5"
        />
      </g>

      {/* ============================================ */}
      {/* CHAIN CROWN */}
      {/* ============================================ */}

      <g className="crown">
        {/* Crown band (arch) */}
        <path
          d="M 130 120 Q 200 80 270 120"
          stroke="#D4AF37"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Chain links (5 links) */}
        {/* Link 1 (left) */}
        <ellipse
          cx="130"
          cy="120"
          rx="12"
          ry="16"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="6"
        />

        {/* Link 2 */}
        <ellipse
          cx="165"
          cy="95"
          rx="12"
          ry="16"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="6"
        />

        {/* Link 3 (center/tallest) */}
        <ellipse cx="200" cy="70" rx="14" ry="20" fill="#D4AF37" />

        {/* Link 4 */}
        <ellipse
          cx="235"
          cy="95"
          rx="12"
          ry="16"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="6"
        />

        {/* Link 5 (right) */}
        <ellipse
          cx="270"
          cy="120"
          rx="12"
          ry="16"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="6"
        />

        {/* Jewels on crown */}
        <circle cx="200" cy="45" r="5" fill="#FF6B6B" />
        <circle cx="165" cy="85" r="3" fill="#4ECDC4" />
        <circle cx="235" cy="85" r="3" fill="#4ECDC4" />
      </g>

      {/* DECORATIVE CHAIN LINKS (Below) */}
      <g opacity="0.3" transform="translate(0, 320)">
        <ellipse
          cx="100"
          cy="50"
          rx="15"
          ry="20"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="5"
        />
        <ellipse
          cx="160"
          cy="50"
          rx="15"
          ry="20"
          fill="none"
          stroke="#218a8d"
          strokeWidth="5"
        />
        <ellipse
          cx="220"
          cy="50"
          rx="15"
          ry="20"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="5"
        />
        <ellipse
          cx="280"
          cy="50"
          rx="15"
          ry="20"
          fill="none"
          stroke="#218a8d"
          strokeWidth="5"
        />
        <ellipse
          cx="340"
          cy="50"
          rx="15"
          ry="20"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="5"
        />
      </g>

      {/* TEXT: KING OF THE GREEN CHAIN */}
      <text
        x="200"
        y="360"
        fontFamily="FKGroteskNeue, Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        fill="#218a8d"
        letterSpacing="2"
      >
        KING OF THE GREEN CHAIN
      </text>
    </svg>
  );
};
