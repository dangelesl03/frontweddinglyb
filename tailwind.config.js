/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aqua': {
          50: '#faf8f5',   // Crema suave
          100: '#f0e9e1',  // Arena muy claro
          200: '#e0d3c6',  // Arena intermedio
          300: '#c8b39c',  // Marrón claro
          400: '#ab8f70',  // Marrón medio claro
          500: '#8E7051',  // Marrón medio principal (Boda L & B)
          600: '#775c40',  // Marrón medio oscuro
          700: '#604b34',  // Marrón oscuro
          800: '#4a3a28',  // Marrón muy oscuro
          900: '#33281b',  // Café oscuro
        },
      },
    },
  },
  plugins: [],
}
