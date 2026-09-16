import { describe, it, expect } from "vitest";
import {
  LaunchSimulationSchema,
  CancelSimulationSchema,
  FilterTelemetryEventsSchema,
} from "@vrsoc/validation";
import { CANONICAL_SIMULATION_SCENARIOS } from "@/lib/simulation/scenarios";
import { normalizeTelemetryPayload } from "@/lib/telemetry/contracts";
import { hasPermission } from "@/lib/rbac/permissions";
import type { UserRole } from "@vrsoc/types";

describe("Phase 12 — Telemetry Engine & Simulation Pipeline Unit Tests", () => {
  describe("Simulation Schema Validation", () => {
    it("validates LaunchSimulationSchema with valid input", () => {
      const valid = {
        scenarioId: "brute-force-auth",
        targetAssetId: "33333333-3333-3333-3333-333333333333",
        parameters: { speed: "fast" },
      };
      const parsed = LaunchSimulationSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("rejects LaunchSimulationSchema with empty scenario ID", () => {
      const invalid = { scenarioId: "" };
      const parsed = LaunchSimulationSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("validates CancelSimulationSchema", () => {
      const valid = {
        simulationRunId: "run-123456789",
        reason: "User aborted test scenario",
      };
      const parsed = CancelSimulationSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates FilterTelemetryEventsSchema with defaults", () => {
      const parsed = FilterTelemetryEventsSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
    });
  });

  describe("Canonical Simulation Scenarios Invariants", () => {
    it("contains all 6 required canonical attack simulation scenarios", () => {
      const slugs = CANONICAL_SIMULATION_SCENARIOS.map((s) => s.slug);
      expect(slugs).toContain("brute-force-auth");
      expect(slugs).toContain("powershell-encoded-exec");
      expect(slugs).toContain("scheduled-task-persistence");
      expect(slugs).toContain("ransomware-precursor");
      expect(slugs).toContain("network-port-scan");
      expect(slugs).toContain("usb-unauthorized-hardware");
    });

    it("ensures every scenario has non-empty event sequence and educational learning outcomes", () => {
      for (const scen of CANONICAL_SIMULATION_SCENARIOS) {
        expect(scen.event_sequence.length).toBeGreaterThan(0);
        expect(scen.learning_outcome.length).toBeGreaterThan(15);
        expect(scen.mitre_tactics.length).toBeGreaterThan(0);
        expect(scen.duration_seconds).toBeGreaterThan(0);
        expect(scen.is_system).toBe(true);
      }
    });

    it("verifies steps within scenarios are strictly sequential and positive", () => {
      for (const scen of CANONICAL_SIMULATION_SCENARIOS) {
        scen.event_sequence.forEach((step, idx) => {
          expect(step.step).toBe(idx + 1);
          expect(step.delay_ms).toBeGreaterThanOrEqual(0);
          expect(step.log_message.length).toBeGreaterThan(5);
        });
      }
    });
  });

  describe("Telemetry Normalization (Event vs Log Contracts)", () => {
    it("normalizes a raw authentication payload into structured event and raw log", () => {
      const orgId = "11111111-1111-1111-1111-111111111111";
      const assetId = "22222222-2222-2222-2222-222222222222";

      const normalized = normalizeTelemetryPayload(
        orgId,
        {
          source: "Windows Security Log",
          sourceType: "Authentication",
          category: "Authentication",
          eventType: "AUTH_FAILED",
          severity: "Medium",
          message: "Account login failed for admin_svc",
          normalizedFields: { attempt: 5, user: "admin_svc" },
        },
        {
          assetId,
          sourceHost: "DC-01.corp.internal",
        }
      );

      // Event checks
      expect(normalized.event.organization_id).toBe(orgId);
      expect(normalized.event.asset_id).toBe(assetId);
      expect(normalized.event.category).toBe("Authentication");
      expect(normalized.event.event_type).toBe("AUTH_FAILED");
      expect(normalized.event.severity).toBe("Medium");
      expect(normalized.event.normalized_fields.user).toBe("admin_svc");

      // Log checks
      expect(normalized.log.organization_id).toBe(orgId);
      expect(normalized.log.source_host).toBe("DC-01.corp.internal");
      expect(normalized.log.log_level).toBe("WARN");
      expect(normalized.log.message).toBe("Account login failed for admin_svc");
      expect(normalized.log.parse_status).toBe("Parsed");
    });

    it("generates process and network records when provided in payload", () => {
      const orgId = "11111111-1111-1111-1111-111111111111";
      const assetId = "22222222-2222-2222-2222-222222222222";

      const normalized = normalizeTelemetryPayload(
        orgId,
        {
          source: "Sysmon",
          sourceType: "Endpoint",
          category: "Process",
          eventType: "PROCESS_CREATE",
          severity: "Critical",
          message: "Suspicious powershell execution",
          process: {
            name: "powershell.exe",
            executablePath: "C:\\Windows\\System32\\powershell.exe",
            commandLine: "powershell.exe -Exec Bypass",
          },
          network: {
            srcIp: "10.0.4.84",
            dstIp: "45.142.214.19",
            srcPort: 49812,
            dstPort: 8080,
          },
        },
        { assetId }
      );

      expect(normalized.process).toBeDefined();
      expect(normalized.process?.name).toBe("powershell.exe");
      expect(normalized.process?.organization_id).toBe(orgId);

      expect(normalized.network).toBeDefined();
      expect(normalized.network?.dst_ip).toBe("45.142.214.19");
      expect(normalized.network?.dst_port).toBe(8080);
    });
  });

  describe("RBAC Permissions for Simulation Operations", () => {
    it("authorizes Super Admin and SOC Analyst for simulation scenario launching", () => {
      expect(hasPermission("Super Admin" as UserRole, "simulation:scenarios:launch")).toBe(true);
      expect(hasPermission("SOC Analyst" as UserRole, "simulation:scenarios:launch")).toBe(true);
      expect(hasPermission("Incident Responder" as UserRole, "simulation:scenarios:launch")).toBe(true);
      expect(hasPermission("Instructor" as UserRole, "simulation:scenarios:launch")).toBe(true);
    });

    it("denies Viewer role from launching simulations", () => {
      expect(hasPermission("Viewer" as UserRole, "simulation:scenarios:launch")).toBe(false);
      expect(hasPermission("Auditor" as UserRole, "simulation:scenarios:launch")).toBe(false);
    });

    it("allows Student, SOC Analyst, and Auditor appropriate telemetry and scenario permissions", () => {
      expect(hasPermission("Student" as UserRole, "simulation:scenarios:read")).toBe(true);
      expect(hasPermission("SOC Analyst" as UserRole, "telemetry:read")).toBe(true);
      expect(hasPermission("Auditor" as UserRole, "telemetry:read")).toBe(true);
      expect(hasPermission("Viewer" as UserRole, "agents:read")).toBe(true);
    });
  });
});
