/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          hover: '#4338CA',   // Indigo 700
          light: '#EEF2FF',   // Indigo 50
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'blob-bounce': 'blobBounce 20s infinite alternate',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blobBounce: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
