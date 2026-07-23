import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#ffffff",
        surface: "#F0F0F0",
        ink: {
          DEFAULT: "#000000",
          900: "#000000",
          700: "#1a1a1a",
        },
        gold: {
          DEFAULT: "#000000",
          light: "#333333",
        },
        muted: "#666666",
      },
      fontFamily: {
        display: ["var(--font-sans)", "Roboto", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Roboto", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06)",
        soft: "0 4px 24px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
