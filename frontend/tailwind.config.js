/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Use system preference for dark mode
  theme: {
    extend: {
      colors: {
<<<<<<< HEAD
        // GreenChainz Brand Colors
        primary: {
          DEFAULT: '#21808D',      // Teal/Green - Main brand color
          dark: '#1A6873',         // Hover/active states
          light: '#32B8C6',        // Accents & highlights
=======
        // GreenChainz Brand Colors - Updated for premium feel
        primary: {
          DEFAULT: '#10b981', // Emerald-500 - Main brand green
          hover: '#059669',   // Emerald-600 - Darker on hover
          light: '#34d399',   // Emerald-400 - Lighter variant
          dark: '#047857',    // Emerald-700 - Dark variant
        },
        // Secondary accent colors
        accent: {
          emerald: '#10b981',
          teal: '#14b8a6',
          amber: '#f59e0b',
          purple: '#a855f7',
>>>>>>> c2cd445727aaaed874df2d05516ad7f6573cd95c
        },
        // Background Colors
        background: {
          DEFAULT: '#FCFCF9',      // Cream/Off-white
          dark: '#1F2121',         // Charcoal for dark sections
          white: '#FFFFFF',
        },
        // Text Colors
        foreground: {
          DEFAULT: '#13343B',      // Slate - Primary text
          secondary: '#626C71',    // Gray - Secondary text
          light: '#8E9BA0',        // Light gray - Muted text
        },
        // Accent & Semantic Colors
        accent: {
          brown: '#5E5240',        // Warm brown accent
        },
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        destructive: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
        },
        // Border Colors
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#374151',
        },
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#626C71',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.375' }],
        '3xl': ['1.875rem', { lineHeight: '1.375' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }],
        '5xl': ['3rem', { lineHeight: '1.25' }],
        '6xl': ['3.75rem', { lineHeight: '1.25' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'primary': '0 0 20px rgba(33, 128, 141, 0.3)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
