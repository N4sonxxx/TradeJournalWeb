/** @type {import('tailwindcss').Config} */
module.exports = {
  // This line is essential for dark mode
  darkMode: 'class',
  
  // This tells Tailwind where to look for its class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}