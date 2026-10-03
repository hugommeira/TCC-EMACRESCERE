import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        ink: {
          50:  "#f4f7fb",
          100: "#e6ecf4",
          200: "#c6d3e2",
          300: "#a3b2c6",
          400: "#7a8ca4", // só decorativo/ícones: 3,4:1 no branco, abaixo do AA pra texto
          500: "#56677f", // texto secundário no branco (~5,6:1)
          600: "#3a4b66",
          700: "#26354f",
          800: "#172033",
          900: "#0d1424",
          950: "#070b18",
        },
        success: {
          50:  "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50:  "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          50:  "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)",   "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif",  "Georgia", "serif"],
        mono:    ["var(--font-mono)",    "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        // Sequência de entrada do hero da página inicial
        rise: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        draw: {
          from: { strokeDashoffset: "1" },
          to:   { strokeDashoffset: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        rise:            "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        draw:            "draw 1.6s cubic-bezier(0.65,0,0.35,1) both",
        "scale-in":      "scale-in 0.9s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":       "fade-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        pulse:           "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
