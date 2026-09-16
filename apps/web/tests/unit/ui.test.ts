import { describe, it, expect } from "vitest";
import { cn, VRSOC_DESIGN_TOKENS } from "@vrsoc/ui";

describe("VRSOC UI Design System Tokens & Utilities", () => {
  it("merges Tailwind classes correctly using cn()", () => {
    const result = cn("p-4 bg-red-500", "p-6", { "text-white": true, "text-black": false });
    expect(result).toContain("p-6");
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
    expect(result).not.toContain("p-4");
  });

  it("contains all Base44 theme colors in design tokens", () => {
    expect(VRSOC_DESIGN_TOKENS.colors.bg).toBe("#0A0A0A");
    expect(VRSOC_DESIGN_TOKENS.colors.card).toBe("#161616");
    expect(VRSOC_DESIGN_TOKENS.colors.burgundy).toBe("#5B0A0A");
    expect(VRSOC_DESIGN_TOKENS.colors.accent).toBe("#E53935");
  });

  it("contains complete severity badge color matrices", () => {
    expect(VRSOC_DESIGN_TOKENS.severity.critical.badge).toContain("bg-red-500/15");
    expect(VRSOC_DESIGN_TOKENS.severity.high.badge).toContain("bg-orange-500/15");
    expect(VRSOC_DESIGN_TOKENS.severity.medium.badge).toContain("bg-amber-500/15");
    expect(VRSOC_DESIGN_TOKENS.severity.low.badge).toContain("bg-blue-500/15");
  });

  it("contains complete agent status badge matrices", () => {
    expect(VRSOC_DESIGN_TOKENS.status.online.badge).toContain("bg-emerald-500/15");
    expect(VRSOC_DESIGN_TOKENS.status.warning.badge).toContain("bg-amber-500/15");
    expect(VRSOC_DESIGN_TOKENS.status.offline.badge).toContain("bg-gray-500/15");
  });
});
