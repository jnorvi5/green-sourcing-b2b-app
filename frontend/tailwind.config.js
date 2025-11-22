/** @type {import('tailwindcss').Config} */
export default {
  content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        },
        // System Colors (for UI consistency)
        background: 'hsl(0, 0%, 100%)',        // White
        foreground: 'hsl(222.2, 84%, 4.9%)',   // Near-black for text
        muted: {
          DEFAULT: 'hsl(210, 40%, 96.1%)',     // Light gray backgrounds
          foreground: 'hsl(215.4, 16.3%, 46.9%)', // Muted text
        },
        border: 'hsl(214.3, 31.8%, 91.4%)',    // Subtle borders
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',     // Red for errors
          foreground: 'hsl(0, 0%, 100%)',      // White text on red
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Clean, modern font
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
