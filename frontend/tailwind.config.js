/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080D1A",
        surface: "#0F172A",
        "surface-card": "#131D31",
        "surface-border": "#1E293B",
        "surface-hover": "#1A263D",
        primary: {
          DEFAULT: "#0D9488", // Deep teal
          hover: "#0F766E",
          light: "#2DD4BF",
          glow: "rgba(13, 148, 136, 0.25)"
        },
        mountain: {
          DEFAULT: "#10B981", // Mountain Emerald Green
          hover: "#059669",
          light: "#34D399"
        },
        amber: {
          DEFAULT: "#F59E0B", // Restrained warm amber
          light: "#FBBF24",
          warm: "#D97706"
        },
        ivory: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          dark: "#64748B"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 25px rgba(13, 148, 136, 0.35)",
        "glow-amber": "0 0 25px rgba(245, 158, 11, 0.25)"
      }
    },
  },
  plugins: [],
}
