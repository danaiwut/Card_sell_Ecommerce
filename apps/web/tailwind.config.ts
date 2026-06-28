import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf8f3",
        ink: {
          DEFAULT: "#0f1b2d",
          900: "#0b1422",
          700: "#1e2a3d",
        },
        gold: {
          DEFAULT: "#c8961e",
          light: "#e0b54a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 27, 45, 0.08), 0 1px 2px rgba(15, 27, 45, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
