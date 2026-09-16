import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VRSOC_DESIGN_TOKENS = {
  colors: {
    bg: "#0A0A0A",
    card: "#161616",
    panel: "#121212",
    burgundy: "#5B0A0A",
    crimson: "#B71C1C",
    accent: "#E53935",
    border: "rgba(255, 255, 255, 0.08)",
  },
  severity: {
    critical: {
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      dot: "bg-red-500",
    },
    high: {
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      dot: "bg-orange-500",
    },
    medium: {
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      dot: "bg-amber-500",
    },
    low: {
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      dot: "bg-blue-500",
    },
  },
} as const;
