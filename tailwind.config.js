/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#0369a1',
        accent: '#f97316',
        ocean: '#0F4C81',
        navy: '#082032',
        aqua: '#00C2FF',
        slate: {
          250: '#e2e8f0',
          350: '#cbd5e1',
          355: '#cbd5e1',
          550: '#64748b',
          650: '#475569',
          655: '#475569',
          850: '#1e293b',
          905: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
