/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0F17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151'
        },
        brand: {
          purple: '#6366F1',
          indigo: '#4F46E5',
          cyan: '#06B6D4'
        }
      }
    },
  },
  plugins: [],
}
