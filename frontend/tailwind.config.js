/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Late-night screening room" palette
        reel: {
          950: "#0A0B10", // near-black backdrop
          900: "#12131C",
          800: "#1B1D2A",
          700: "#262838",
          600: "#3A3D53",
          400: "#8A8CA6",
          200: "#D6D6E4",
        },
        marquee: {
          DEFAULT: "#F2C14E", // marquee bulb amber - host / live accent
          dim: "#8A6B24",
        },
        signal: {
          teal: "#4FD1C5", // moderator accent
          violet: "#9B8CFF", // links / focus ring
          rose: "#F26D6D", // destructive / errors
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        marquee: "0 0 24px rgba(242, 193, 78, 0.35)",
      },
      backgroundImage: {
        "film-grain":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
