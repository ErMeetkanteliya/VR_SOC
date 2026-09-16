import { describe, it, expect, vi } from "vitest";
import { hasPermission, getPermissionsForRole, ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { authorizePermission, requirePermission } from "@/lib/rbac/server";
import { ALL_USER_ROLES, type UserRole } from "@vrsoc/types";
import { UpdateMemberRoleSchema, RemoveMemberSchema, CheckPermissionSchema } from "@vrsoc/validation";

describe("Phase 08 — RBAC Authorization & Permissions Engine", () => {
  describe("1. Canonical 8-Role Permissions Matrix", () => {
    it("verifies all 8 canonical roles are defined in ROLE_PERMISSIONS", () => {
      expect(ALL_USER_ROLES).toHaveLength(8);
      ALL_USER_ROLES.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it("evaluates Super Admin holds all platform permissions", () => {
      const superAdminPerms = getPermissionsForRole("Super Admin");
      expect(superAdminPerms).toContain("org:members:invite");
      expect(superAdminPerms).toContain("org:members:remove");
      expect(superAdminPerms).toContain("org:members:update_role");
      expect(superAdminPerms).toContain("agents:isolate");
      expect(superAdminPerms).toContain("detections:delete");
      expect(superAdminPerms).toContain("incidents:close");
      expect(superAdminPerms).toContain("audit:read");
      expect(superAdminPerms).toContain("compliance:update_controls");
    });

    it("evaluates Instructor educational and lab management permissions", () => {
      expect(hasPermission("Instructor", "simulation:scenarios:create")).toBe(true);
      expect(hasPermission("Instructor", "training:cohorts:manage")).toBe(true);
      expect(hasPermission("Instructor", "training:submissions:grade")).toBe(true);
      expect(hasPermission("Instructor", "agents:isolate")).toBe(true);
      // Denials:
      expect(hasPermission("Instructor", "org:members:update_role")).toBe(false);
      expect(hasPermission("Instructor", "org:settings:manage")).toBe(false);
      expect(hasPermission("Instructor", "audit:read")).toBe(false);
    });

    it("evaluates Student defensive trainee permissions", () => {
      expect(hasPermission("Student", "alerts:read")).toBe(true);
      expect(hasPermission("Student", "alerts:triage")).toBe(true);
      expect(hasPermission("Student", "cases:add_evidence")).toBe(true);
      expect(hasPermission("Student", "training:quizzes:take")).toBe(true);
      expect(hasPermission("Student", "simulation:scenarios:launch")).toBe(true);
      // Denials:
      expect(hasPermission("Student", "agents:isolate")).toBe(false);
      expect(hasPermission("Student", "detections:create")).toBe(false);
      expect(hasPermission("Student", "detections:delete")).toBe(false);
      expect(hasPermission("Student", "incidents:create")).toBe(false);
      expect(hasPermission("Student", "soar:playbooks:create")).toBe(false);
      expect(hasPermission("Student", "org:members:invite")).toBe(false);
    });

    it("evaluates SOC Analyst frontline triage permissions", () => {
      expect(hasPermission("SOC Analyst", "alerts:read")).toBe(true);
      expect(hasPermission("SOC Analyst", "alerts:triage")).toBe(true);
      expect(hasPermission("SOC Analyst", "alerts:escalate")).toBe(true);
      expect(hasPermission("SOC Analyst", "incidents:create")).toBe(true);
      expect(hasPermission("SOC Analyst", "agents:isolate")).toBe(true);
      expect(hasPermission("SOC Analyst", "soar:actions:execute")).toBe(true);
      // Denials:
      expect(hasPermission("SOC Analyst", "detections:create")).toBe(false);
      expect(hasPermission("SOC Analyst", "detections:delete")).toBe(false);
      expect(hasPermission("SOC Analyst", "incidents:close")).toBe(false);
      expect(hasPermission("SOC Analyst", "org:members:update_role")).toBe(false);
    });

    it("evaluates Incident Responder containment and dossier permissions", () => {
      expect(hasPermission("Incident Responder", "incidents:update_status")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:close")).toBe(true);
      expect(hasPermission("Incident Responder", "cases:close")).toBe(true);
      expect(hasPermission("Incident Responder", "agents:isolate")).toBe(true);
      expect(hasPermission("Incident Responder", "soar:approvals:manage")).toBe(true);
      // Denials:
      expect(hasPermission("Incident Responder", "org:members:invite")).toBe(false);
      expect(hasPermission("Incident Responder", "training:submissions:grade")).toBe(false);
    });

    it("evaluates Threat Hunter detection engineering and hunting permissions", () => {
      expect(hasPermission("Threat Hunter", "detections:create")).toBe(true);
      expect(hasPermission("Threat Hunter", "detections:update")).toBe(true);
      expect(hasPermission("Threat Hunter", "detections:delete")).toBe(true);
      expect(hasPermission("Threat Hunter", "detections:test")).toBe(true);
      expect(hasPermission("Threat Hunter", "telemetry:query")).toBe(true);
      // Denials:
      expect(hasPermission("Threat Hunter", "org:members:invite")).toBe(false);
      expect(hasPermission("Threat Hunter", "org:members:update_role")).toBe(false);
      expect(hasPermission("Threat Hunter", "incidents:close")).toBe(false);
    });

    it("evaluates Auditor GRC and immutable audit permissions", () => {
      expect(hasPermission("Auditor", "audit:read")).toBe(true);
      expect(hasPermission("Auditor", "compliance:read")).toBe(true);
      expect(hasPermission("Auditor", "compliance:update_controls")).toBe(true);
      expect(hasPermission("Auditor", "compliance:export")).toBe(true);
      expect(hasPermission("Auditor", "alerts:read")).toBe(true);
      // Denials:
      expect(hasPermission("Auditor", "alerts:triage")).toBe(false);
      expect(hasPermission("Auditor", "incidents:create")).toBe(false);
      expect(hasPermission("Auditor", "agents:isolate")).toBe(false);
      expect(hasPermission("Auditor", "detections:delete")).toBe(false);
    });

    it("evaluates Viewer read-only dashboard permissions", () => {
      expect(hasPermission("Viewer", "agents:read")).toBe(true);
      expect(hasPermission("Viewer", "alerts:read")).toBe(true);
      expect(hasPermission("Viewer", "reports:generate")).toBe(true);
      // Denials (Zero write/mutation):
      expect(hasPermission("Viewer", "alerts:triage")).toBe(false);
      expect(hasPermission("Viewer", "alerts:comment")).toBe(false);
      expect(hasPermission("Viewer", "incidents:create")).toBe(false);
      expect(hasPermission("Viewer", "agents:isolate")).toBe(false);
      expect(hasPermission("Viewer", "detections:create")).toBe(false);
      expect(hasPermission("Viewer", "audit:read")).toBe(false);
    });
  });

  describe("2. Negative Security & Edge Case Denials", () => {
    it("rejects undefined, null, or empty roles", () => {
      expect(hasPermission(undefined, "alerts:read")).toBe(false);
      expect(hasPermission(null, "alerts:read")).toBe(false);
      expect(hasPermission("", "alerts:read")).toBe(false);
      expect(hasPermission("UnknownRole" as unknown as UserRole, "alerts:read")).toBe(false);
    });

    it("rejects privilege escalation: Student executing containment action", () => {
      expect(hasPermission("Student", "agents:isolate")).toBe(false);
    });

    it("rejects privilege escalation: Viewer attempting detection rule creation", () => {
      expect(hasPermission("Viewer", "detections:create")).toBe(false);
    });

    it("rejects privilege escalation: Auditor modifying incident status", () => {
      expect(hasPermission("Auditor", "incidents:update_status")).toBe(false);
    });

    it("rejects privilege escalation: Threat Hunter inviting organization members", () => {
      expect(hasPermission("Threat Hunter", "org:members:invite")).toBe(false);
    });
  });

  describe("3. Server Authorization Guard (`authorizePermission`)", () => {
    const orgId = "11111111-1111-1111-1111-111111111111";
    const userId = "22222222-2222-2222-2222-222222222222";

    it("rejects unauthenticated caller with 401 status", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      } as any;

      const res = await authorizePermission({
        organizationId: orgId,
        permission: "alerts:read",
        supabase: mockSupabase,
      });

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.statusCode).toBe(401);
        expect(res.error).toContain("Authentication required");
      }
    });

    it("rejects user with no membership in target organization with 403 status", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as any;

      const res = await authorizePermission({
        organizationId: orgId,
        permission: "alerts:read",
        supabase: mockSupabase,
      });

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.statusCode).toBe(403);
        expect(res.error).toContain("does not hold membership");
      }
    });

    it("rejects revoked membership immediately with 403 status", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "mem-1",
                    organization_id: orgId,
                    user_id: userId,
                    role: "Super Admin",
                    status: "revoked",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const res = await authorizePermission({
        organizationId: orgId,
        permission: "alerts:read",
        supabase: mockSupabase,
      });

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.statusCode).toBe(403);
        expect(res.error).toContain("revoked");
      }
    });

    it("rejects active member when their role lacks the requested permission", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "mem-1",
                    organization_id: orgId,
                    user_id: userId,
                    role: "Student",
                    status: "active",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const res = await authorizePermission({
        organizationId: orgId,
        permission: "agents:isolate",
        supabase: mockSupabase,
      });

      expect(res.authorized).toBe(false);
      if (!res.authorized) {
        expect(res.statusCode).toBe(403);
        expect(res.error).toContain("lacks permission 'agents:isolate'");
      }
    });

    it("authorizes valid active member with matching permission", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "mem-1",
                    organization_id: orgId,
                    user_id: userId,
                    role: "SOC Analyst",
                    status: "active",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const res = await authorizePermission({
        organizationId: orgId,
        permission: "agents:isolate",
        supabase: mockSupabase,
      });

      expect(res.authorized).toBe(true);
      if (res.authorized) {
        expect(res.role).toBe("SOC Analyst");
        expect(res.userId).toBe(userId);
        expect(res.organizationId).toBe(orgId);
      }
    });

    it("throws structured Error in requirePermission when unauthorized", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      } as any;

      await expect(
        requirePermission({
          organizationId: orgId,
          permission: "alerts:read",
          supabase: mockSupabase,
        })
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("4. RBAC Validation Schemas", () => {
    const validUuid1 = "11111111-1111-1111-1111-111111111111";
    const validUuid2 = "22222222-2222-2222-2222-222222222222";

    it("validates UpdateMemberRoleSchema correctly", () => {
      const valid = UpdateMemberRoleSchema.safeParse({
        organizationId: validUuid1,
        targetUserId: validUuid2,
        newRole: "Threat Hunter",
      });
      expect(valid.success).toBe(true);

      const invalidRole = UpdateMemberRoleSchema.safeParse({
        organizationId: validUuid1,
        targetUserId: validUuid2,
        newRole: "Hacker",
      });
      expect(invalidRole.success).toBe(false);

      const invalidUuid = UpdateMemberRoleSchema.safeParse({
        organizationId: "not-a-uuid",
        targetUserId: validUuid2,
        newRole: "Super Admin",
      });
      expect(invalidUuid.success).toBe(false);
    });

    it("validates RemoveMemberSchema correctly", () => {
      const valid = RemoveMemberSchema.safeParse({
        organizationId: validUuid1,
        targetUserId: validUuid2,
      });
      expect(valid.success).toBe(true);

      const invalid = RemoveMemberSchema.safeParse({
        organizationId: "bad-id",
        targetUserId: validUuid2,
      });
      expect(invalid.success).toBe(false);
    });

    it("validates CheckPermissionSchema correctly", () => {
      const valid = CheckPermissionSchema.safeParse({
        organizationId: validUuid1,
        permission: "org:members:update_role",
      });
      expect(valid.success).toBe(true);

      const invalid = CheckPermissionSchema.safeParse({
        organizationId: validUuid1,
        permission: "non_existent_perm",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
