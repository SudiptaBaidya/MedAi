/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0D9488',
          light: '#2DD4BF',
          dark: '#0F766E',
        },
        mint: '#F0FDF8',
        navy: {
          DEFAULT: '#0B1F2E',
          mid: '#122636',
        },
        slate: {
          DEFAULT: '#1E3A4A',
          light: '#2E5060',
        },
        sky: '#A8DFEC',
        white: '#FFFFFF',
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
        },
        text: {
          body: '#0F172A',
          muted: '#64748B',
        },
        danger: '#EF4444',
        warn: '#F59E0B',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', '"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        display: ['Inter', 'Syne', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        card: '0 10px 40px -10px rgba(11,31,46,0.08), 0 2px 10px -2px rgba(11,31,46,0.04)',
        float: '0 20px 50px -10px rgba(13,148,136,0.2), 0 10px 20px -5px rgba(11,31,46,0.1)',
      }
    },
  },
  plugins: [],
}
