
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Removed @tailwindcss/forms for v4 compatibility
    // Form styles will be handled with standard Tailwind utilities
  ],
}
