import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isDevAuthAllowed,
  validateDevCredentials,
  getDevAdminUser,
  getDevAdminOrganization,
  getDevAdminMemberships,
  hasActiveDevSession,
  DEV_SESSION_COOKIE,
  DEV_ORG_ID,
  DEV_ADMIN_USER_ID,
} from "@/lib/auth/dev-auth";
import { hasPermission } from "@/lib/rbac/permissions";
import { authorizePermission } from "@/lib/rbac/server";
import { getActiveOrganization, listUserOrganizationsAction } from "@/lib/tenant/actions";
import { loginAction, logoutAction } from "@/lib/auth/actions";
import type { Permission } from "@vrsoc/types";

// Mock next/headers
const mockCookiesStore = new Map<string, any>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookiesStore.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string | { name: string; value: string }, value?: string) => {
      if (typeof name === "object") {
        mockCookiesStore.set(name.name, name.value);
      } else {
        mockCookiesStore.set(name, value);
      }
    },
    delete: (name: string) => {
      mockCookiesStore.delete(name);
    },
  }),
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

describe("DEV-ONLY Super Admin Authentication Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesStore.clear();
    (process.env as Record<string, string | undefined>) = {
      ...originalEnv,
      NODE_ENV: "development",
      DEV_ADMIN_EMAIL: "dev-admin@vrsoc.local",
      DEV_ADMIN_PASSWORD: "VRSOC_DevAdmin_2026_Secure!",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Environment & Security Guards", () => {
    it("allows dev auth in development mode when credentials are configured", () => {
      (process.env as any).NODE_ENV = "development";
      expect(isDevAuthAllowed()).toBe(true);
    });

    it("STRICTLY prohibits dev auth when NODE_ENV === 'production'", () => {
      (process.env as any).NODE_ENV = "production";
      expect(isDevAuthAllowed()).toBe(false);
      expect(validateDevCredentials("dev-admin@vrsoc.local", "VRSOC_DevAdmin_2026_Secure!")).toBe(false);
    });

    it("prohibits dev auth if DEV_ADMIN_EMAIL is missing", () => {
      delete process.env.DEV_ADMIN_EMAIL;
      expect(isDevAuthAllowed()).toBe(false);
    });

    it("prohibits dev auth if DEV_ADMIN_PASSWORD is missing", () => {
      delete process.env.DEV_ADMIN_PASSWORD;
      expect(isDevAuthAllowed()).toBe(false);
    });
  });

  describe("2. Credentials Validation Logic", () => {
    it("validates correct DEV_ADMIN credentials successfully", () => {
      expect(validateDevCredentials("dev-admin@vrsoc.local", "VRSOC_DevAdmin_2026_Secure!")).toBe(true);
    });

    it("handles case-insensitive email matching with whitespace trimming", () => {
      expect(validateDevCredentials("  DEV-ADMIN@VRSOC.LOCAL  ", "VRSOC_DevAdmin_2026_Secure!")).toBe(true);
    });

    it("rejects incorrect password for dev admin email", () => {
      expect(validateDevCredentials("dev-admin@vrsoc.local", "WrongPassword123!")).toBe(false);
    });

    it("rejects non-dev email address", () => {
      expect(validateDevCredentials("random-user@example.com", "VRSOC_DevAdmin_2026_Secure!")).toBe(false);
    });

    it("rejects empty password", () => {
      expect(validateDevCredentials("dev-admin@vrsoc.local", "")).toBe(false);
    });
  });

  describe("3. Dev Super Admin Identity & Organization Resolution", () => {
    it("generates deterministic Super Admin user identity", () => {
      const user = getDevAdminUser();
      expect(user.id).toBe(DEV_ADMIN_USER_ID);
      expect(user.email).toBe("dev-admin@vrsoc.local");
      expect(user.user_metadata.role).toBe("Super Admin");
      expect(user.app_metadata.role).toBe("Super Admin");
    });

    it("generates valid development active organization context", () => {
      const org = getDevAdminOrganization();
      expect(org.id).toBe(DEV_ORG_ID);
      expect(org.name).toBe("Cyber Defense Academy");
      expect(org.status).toBe("active");
    });

    it("generates development memberships with Super Admin role", () => {
      const memberships = getDevAdminMemberships();
      expect(memberships.length).toBeGreaterThanOrEqual(1);
      const primary = memberships[0];
      expect(primary).toBeDefined();
      expect(primary?.role).toBe("Super Admin");
      expect(primary?.organization_id).toBe(DEV_ORG_ID);
      expect(primary?.status).toBe("active");
    });
  });

  describe("4. Login Action with DEV Credentials", () => {
    it("authenticates via loginAction and sets session cookies in development", async () => {
      const res = await loginAction({
        email: "dev-admin@vrsoc.local",
        password: "VRSOC_DevAdmin_2026_Secure!",
      });

      expect(res.success).toBe(true);
      expect(res.data?.user?.email).toBe("dev-admin@vrsoc.local");
      expect(mockCookiesStore.get(DEV_SESSION_COOKIE)).toBe("vrsoc-dev-superadmin-token");
      expect(mockCookiesStore.get("vrsoc_active_org")).toBe(DEV_ORG_ID);
    });

    it("returns error for invalid dev password without exposing secrets", async () => {
      const res = await loginAction({
        email: "dev-admin@vrsoc.local",
        password: "IncorrectPassword123!",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid email or password");
      expect(mockCookiesStore.has(DEV_SESSION_COOKIE)).toBe(false);
    });
  });

  describe("5. Active Organization and RBAC Authorization", () => {
    beforeEach(() => {
      mockCookiesStore.set(DEV_SESSION_COOKIE, "vrsoc-dev-superadmin-token");
    });

    it("resolves active development organization when dev session is present", async () => {
      const { organization, role } = await getActiveOrganization();
      expect(organization).not.toBeNull();
      expect(organization?.id).toBe(DEV_ORG_ID);
      expect(role).toBe("Super Admin");
    });

    it("lists organizations for dev session with Super Admin role", async () => {
      const result = await listUserOrganizationsAction();
      expect(result.success).toBe(true);
      expect(result.data?.[0]?.role).toBe("Super Admin");
    });

    it("authorizes Super Admin for all critical permissions", async () => {
      const criticalPermissions: Permission[] = [
        "telemetry:query",
        "alerts:triage",
        "detections:create",
        "agents:isolate",
        "threat_hunting:execute",
        "threat_intel:create",
        "incidents:create",
        "incidents:stage",
        "incidents:playbook",
        "org:members:update_role",
      ];

      for (const perm of criticalPermissions) {
        const authResult = await authorizePermission({
          organizationId: DEV_ORG_ID,
          permission: perm,
        });

        expect(authResult.authorized).toBe(true);
        if (authResult.authorized) {
          expect(authResult.role).toBe("Super Admin");
          expect(authResult.userId).toBe(DEV_ADMIN_USER_ID);
        }
      }
    });

    it("verifies Super Admin role holds all permissions in RBAC matrix", () => {
      const permissions: Permission[] = [
        "simulation:scenarios:launch",
        "alerts:escalate",
        "incidents:close",
        "threat_intel:delete",
        "threat_hunting:evidence",
        "mitre:read",
      ];

      for (const perm of permissions) {
        expect(hasPermission("Super Admin", perm)).toBe(true);
      }
    });
  });

  describe("6. Session Termination & Logout Behavior", () => {
    it("clears all dev and tenant session cookies upon logout", async () => {
      mockCookiesStore.set(DEV_SESSION_COOKIE, "vrsoc-dev-superadmin-token");
      mockCookiesStore.set("vrsoc_active_org", DEV_ORG_ID);

      await logoutAction();

      expect(mockRedirect).toHaveBeenCalledWith("/login");
      expect(hasActiveDevSession()).toBe(false);
    });
  });
});
