/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        wood: {
          50: "#FCF1ED",
          100: "#F8DFD6",
          200: "#F0B5A4",
          300: "#EA8050",
          400: "#E16445",
          500: "#C74432",
          600: "#AD3527",
          700: "#892A22",
          800: "#63251F",
          900: "#421B18",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },

  plugins: [],
};
