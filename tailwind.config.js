/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        accent: '#2563EB',
        muted: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        bg: '#0B0E14',
        card: '#111318',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'h1': '28px',
        'h2': '22px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.2)',
        'md': '0 8px 24px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
