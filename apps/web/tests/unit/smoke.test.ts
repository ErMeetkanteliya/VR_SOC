import { describe, it, expect } from "vitest";
import { VRSOC_CONFIG } from "@vrsoc/config";
import { LoginSchema, HostIsolationSchema } from "@vrsoc/validation";
import type { Organization, SeverityLevel } from "@vrsoc/types";

describe("VRSOC Monorepo Foundation Smoke Tests", () => {
  it("loads shared configuration constants", () => {
    expect(VRSOC_CONFIG.appName).toContain("VRSOC");
    expect(VRSOC_CONFIG.defaultTheme).toBe("dark");
  });

  it("validates types and severity levels", () => {
    const testOrg: Organization = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Cyber Defense Academy",
      slug: "cda",
      billing_tier: "enterprise",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const testSeverity: SeverityLevel = "Critical";

    expect(testOrg.name).toBe("Cyber Defense Academy");
    expect(testSeverity).toBe("Critical");
  });

  it("validates Zod authentication schemas", () => {
    const validLogin = LoginSchema.safeParse({
      email: "analyst@vrsoc.app",
      password: "SecurePassword123!",
    });
    expect(validLogin.success).toBe(true);

    const invalidLogin = LoginSchema.safeParse({
      email: "not-an-email",
      password: "short",
    });
    expect(invalidLogin.success).toBe(false);
  });

  it("validates Zod host containment schema", () => {
    const validIsolation = HostIsolationSchema.safeParse({
      assetId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "Suspicious lateral movement detected",
    });
    expect(validIsolation.success).toBe(true);
  });
});
