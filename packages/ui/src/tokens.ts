export const VRSOC_DESIGN_TOKENS = {
  colors: {
    bg: "#0A0A0A",
    card: "#161616",
    cardHover: "#1C1C1C",
    panel: "#121212",
    burgundy: "#5B0A0A",
    crimson: "#B71C1C",
    accent: "#E53935",
    accentHover: "#D32F2F",
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.05)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.4)",
  },
  severity: {
    critical: {
      color: "#EF4444",
      badge: "bg-red-500/15 text-red-400 border border-red-500/30",
      dot: "bg-red-500",
      glow: "shadow-red-500/20",
    },
    high: {
      color: "#F97316",
      badge: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
      dot: "bg-orange-500",
      glow: "shadow-orange-500/20",
    },
    medium: {
      color: "#F59E0B",
      badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      dot: "bg-amber-500",
      glow: "shadow-amber-500/20",
    },
    low: {
      color: "#3B82F6",
      badge: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      dot: "bg-blue-500",
      glow: "shadow-blue-500/20",
    },
    informational: {
      color: "#06B6D4",
      badge: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
      dot: "bg-cyan-500",
      glow: "shadow-cyan-500/20",
    },
  },
  status: {
    online: {
      badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      dot: "bg-emerald-500",
    },
    warning: {
      badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      dot: "bg-amber-500",
    },
    critical: {
      badge: "bg-red-500/15 text-red-400 border border-red-500/30",
      dot: "bg-red-500",
    },
    offline: {
      badge: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
      dot: "bg-gray-500",
    },
    updating: {
      badge: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      dot: "bg-blue-500",
    },
    pending: {
      badge: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      dot: "bg-purple-500",
    },
  },
} as const;
