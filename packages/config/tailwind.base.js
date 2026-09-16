/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Base44 VRSOC Design System Tokens
        vrsoc: {
          bg: "#0A0A0A",
          card: "#161616",
          panel: "#121212",
          border: "rgba(255, 255, 255, 0.08)",
          burgundy: "#5B0A0A",
          crimson: "#B71C1C",
          accent: "#E53935",
          muted: "rgba(255, 255, 255, 0.6)",
          subtle: "rgba(255, 255, 255, 0.3)",
        },
        severity: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#F59E0B",
          low: "#3B82F6",
          info: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
};
