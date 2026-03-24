/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(16, 185, 129, 0.18)"
      }
    }
  },
  plugins: []
};
