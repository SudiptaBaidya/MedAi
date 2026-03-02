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
          DEFAULT: '#0ABFA3',
          light: '#2EDEC0',
          dark: '#07897A',
        },
        mint: '#E6FBF7',
        navy: {
          DEFAULT: '#0B1F2E',
          mid: '#122636',
        },
        slate: {
          DEFAULT: '#1E3A4A',
          light: '#2E5060',
        },
        sky: '#A8DFEC',
        white: '#F8FFFE',
        gray: {
          100: '#EFF7F6',
          200: '#C8DDDA',
          400: '#8AABAA',
          600: '#4D7070',
        },
        text: {
          body: '#1A3340',
          muted: '#527080',
        },
        danger: '#E8715A',
        warn: '#F5B942',
        success: '#0ABFA3',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(11,31,46,0.08), 0 1px 4px rgba(11,31,46,0.04)',
        float: '0 16px 48px rgba(10,191,163,0.15), 0 4px 16px rgba(11,31,46,0.10)',
      }
    },
  },
  plugins: [],
}
