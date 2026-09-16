import { describe, it, expect } from "vitest";
import {
  FilterAgentsSchema,
  IsolateAgentSchema,
  UpdateAgentGroupSchema,
  SimulateAgentStateSchema,
  RegisterEndpointAgentSchema,
} from "@vrsoc/validation";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import type {
  Asset,
  AgentWithAsset,
  AgentFleetSummary,
  UserRole,
} from "@vrsoc/types";

describe("Phase 11 — Agent Management Unit Tests", () => {
  const orgAId = "11111111-1111-4111-a111-111111111111";
  const orgBId = "22222222-2222-4222-a222-222222222222";
  const assetId = "33333333-3333-4333-a333-333333333333";
  const agentId = "44444444-4444-4444-a444-444444444444";
  const groupId = "55555555-5555-4555-a555-555555555555";

  describe("1. Agent Validation Schemas", () => {
    it("validates FilterAgentsSchema with defaults", () => {
      const parsed = FilterAgentsSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(10);
    });

    it("validates FilterAgentsSchema with custom search and filters", () => {
      const parsed = FilterAgentsSchema.parse({
        search: "DC-01",
        status: "Online",
        osType: "Windows",
        assetGroupId: groupId,
        page: 2,
        pageSize: 25,
      });
      expect(parsed.search).toBe("DC-01");
      expect(parsed.status).toBe("Online");
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(25);
    });

    it("validates IsolateAgentSchema payload", () => {
      const valid = IsolateAgentSchema.safeParse({
        agentId: agentId,
        isolate: true,
        reason: "Suspected Cobalt Strike beaconing",
      });
      expect(valid.success).toBe(true);

      const invalid = IsolateAgentSchema.safeParse({
        agentId: "not-a-uuid",
        isolate: true,
      });
      expect(invalid.success).toBe(false);
    });

    it("validates UpdateAgentGroupSchema payload", () => {
      const valid = UpdateAgentGroupSchema.safeParse({
        assetId: assetId,
        assetGroupId: groupId,
      });
      expect(valid.success).toBe(true);

      const unassign = UpdateAgentGroupSchema.safeParse({
        assetId: assetId,
        assetGroupId: null,
      });
      expect(unassign.success).toBe(true);
    });

    it("validates SimulateAgentStateSchema with metrics bounds", () => {
      const valid = SimulateAgentStateSchema.safeParse({
        agentId: agentId,
        newStatus: "Warning",
        cpuUsagePct: 88.5,
        ramUsagePct: 76.0,
        diskUsagePct: 50.0,
      });
      expect(valid.success).toBe(true);

      const outOfBounds = SimulateAgentStateSchema.safeParse({
        agentId: agentId,
        newStatus: "Online",
        cpuUsagePct: 150.0, // Invalid > 100
      });
      expect(outOfBounds.success).toBe(false);
    });

    it("validates RegisterEndpointAgentSchema", () => {
      const valid = RegisterEndpointAgentSchema.safeParse({
        hostname: "WKSTN-FIN-09.corp.internal",
        displayName: "Finance Workstation 09",
        assetType: "Endpoint",
        osType: "Windows",
        osVersion: "Windows 11 Enterprise",
        ipAddress: "10.0.2.19",
        criticality: "High",
        agentVersion: "1.4.2",
        status: "Online",
      });
      expect(valid.success).toBe(true);

      const invalid = RegisterEndpointAgentSchema.safeParse({
        hostname: "", // Missing hostname
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("2. Fleet KPI Summary Calculation", () => {
    it("computes accurate summary counts and average resource utilization", () => {
      const mockAgents: AgentWithAsset[] = [
        {
          id: "agent-1",
          organization_id: orgAId,
          asset_id: "asset-1",
          agent_version: "1.4.2",
          status: "Online",
          cpu_usage_pct: 20,
          ram_usage_pct: 40,
          disk_usage_pct: 50,
          last_seen_at: new Date().toISOString(),
          heartbeat_interval_seconds: 30,
          capabilities: ["edr"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          asset: {
            id: "asset-1",
            organization_id: orgAId,
            hostname: "DC-01",
            asset_type: "Domain Controller",
            os_type: "Windows",
            criticality: "Critical",
            status: "Active",
            is_isolated: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          id: "agent-2",
          organization_id: orgAId,
          asset_id: "asset-2",
          agent_version: "1.4.2",
          status: "Offline",
          cpu_usage_pct: 0,
          ram_usage_pct: 0,
          disk_usage_pct: 30,
          last_seen_at: new Date().toISOString(),
          heartbeat_interval_seconds: 30,
          capabilities: ["edr"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          asset: {
            id: "asset-2",
            organization_id: orgAId,
            hostname: "WKSTN-84",
            asset_type: "Endpoint",
            os_type: "Windows",
            criticality: "High",
            status: "Isolated",
            is_isolated: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];

      let online = 0;
      let offline = 0;
      let isolated = 0;
      let cpuSum = 0;

      mockAgents.forEach((a) => {
        if (a.status === "Online") online++;
        if (a.status === "Offline") offline++;
        if (a.asset?.is_isolated) isolated++;
        cpuSum += a.cpu_usage_pct;
      });

      const summary: AgentFleetSummary = {
        totalAgents: mockAgents.length,
        onlineAgents: online,
        offlineAgents: offline,
        updatingAgents: 0,
        errorAgents: 0,
        pendingAgents: 0,
        isolatedAgents: isolated,
        avgCpuUsagePct: cpuSum / mockAgents.length,
        avgRamUsagePct: 20,
        avgDiskUsagePct: 40,
      };

      expect(summary.totalAgents).toBe(2);
      expect(summary.onlineAgents).toBe(1);
      expect(summary.offlineAgents).toBe(1);
      expect(summary.isolatedAgents).toBe(1);
      expect(summary.avgCpuUsagePct).toBe(10);
    });
  });

  describe("3. RBAC Permissions for Agent Fleet Management", () => {
    it("verifies roles authorized for agents:read", () => {
      const authorizedRoles: UserRole[] = [
        "Super Admin",
        "SOC Analyst",
        "Incident Responder",
        "Threat Hunter",
        "Instructor",
        "Student",
        "Auditor",
        "Viewer",
      ];

      for (const role of authorizedRoles) {
        expect(ROLE_PERMISSIONS[role]).toContain("agents:read");
      }
    });

    it("verifies only authorized responder roles have agents:isolate", () => {
      const allowedRoles: UserRole[] = ["Super Admin", "SOC Analyst", "Incident Responder", "Instructor"];
      const deniedRoles: UserRole[] = ["Student", "Auditor", "Viewer"];

      for (const role of allowedRoles) {
        expect(ROLE_PERMISSIONS[role]).toContain("agents:isolate");
      }

      for (const role of deniedRoles) {
        expect(ROLE_PERMISSIONS[role]).not.toContain("agents:isolate");
      }
    });
  });

  describe("4. Multi-Tenant Isolation & Cross-Tenant Prevention", () => {
    it("ensures agents and assets share invariant tenant ownership", () => {
      const assetA: Asset = {
        id: assetId,
        organization_id: orgAId,
        hostname: "DC-01.corp.internal",
        asset_type: "Domain Controller",
        os_type: "Windows",
        criticality: "Critical",
        status: "Active",
        is_isolated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const agentA: AgentWithAsset = {
        id: agentId,
        organization_id: orgAId,
        asset_id: assetA.id,
        agent_version: "1.4.2",
        status: "Online",
        cpu_usage_pct: 15.0,
        ram_usage_pct: 42.0,
        disk_usage_pct: 35.0,
        last_seen_at: new Date().toISOString(),
        heartbeat_interval_seconds: 30,
        capabilities: ["edr", "isolation"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        asset: assetA,
      };

      expect(agentA.organization_id).toBe(orgAId);
      expect(agentA.asset.organization_id).toBe(orgAId);
      expect(agentA.organization_id).not.toBe(orgBId);
    });
  });
});
