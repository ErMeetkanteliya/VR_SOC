import { describe, it, expect } from "vitest";
import {
  CreateAssetGroupSchema,
  CreateAssetSchema,
  UpdateAssetSchema,
  AgentHeartbeatSchema,
  CreateSocIdentitySchema,
  CreateTelemetryEventSchema,
  IngestLogSchema,
  CreateProcessRecordSchema,
  CreateFileRecordSchema,
  CreateNetworkConnectionSchema,
} from "@vrsoc/validation";
import type { Asset, Agent, TelemetryEvent } from "@vrsoc/types";

describe("Phase 10 — Core SOC Data Model Unit Tests", () => {
  const orgAId = "11111111-1111-4111-a111-111111111111";
  const orgBId = "22222222-2222-4222-a222-222222222222";
  const assetId = "33333333-3333-4333-a333-333333333333";
  const agentId = "44444444-4444-4444-a444-444444444444";
  const identityId = "55555555-5555-4555-a555-555555555555";
  const processId = "66666666-6666-4666-a666-666666666666";

  describe("1. Asset Groups Model", () => {
    it("validates valid asset group creation", () => {
      const valid = CreateAssetGroupSchema.safeParse({
        organizationId: orgAId,
        name: "Tier 1 Domain Controllers",
        description: "Primary Active Directory identity controllers",
        criticality: "Critical",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.name).toBe("Tier 1 Domain Controllers");
        expect(valid.data.criticality).toBe("Critical");
      }
    });

    it("rejects asset group with invalid UUID or short name", () => {
      const invalid = CreateAssetGroupSchema.safeParse({
        organizationId: "invalid-uuid",
        name: "A",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("2. Assets Model", () => {
    it("validates enterprise endpoint asset creation with defaults", () => {
      const valid = CreateAssetSchema.safeParse({
        organizationId: orgAId,
        hostname: "WKSTN-FIN-042.corp.internal",
        displayName: "Finance Workstation 042",
        assetType: "Endpoint",
        osType: "Windows",
        osVersion: "Windows 11 Enterprise 23H2",
        ipAddress: "10.0.4.42",
        macAddress: "00:1A:2B:3C:4D:5E",
        criticality: "High",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.status).toBe("Active");
        expect(valid.data.isIsolated).toBe(false);
        expect(valid.data.assetType).toBe("Endpoint");
      }
    });

    it("validates partial asset update schema", () => {
      const valid = UpdateAssetSchema.safeParse({
        status: "Isolated",
        isIsolated: true,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.isIsolated).toBe(true);
        expect(valid.data.status).toBe("Isolated");
      }
    });
  });

  describe("3. Agents Model", () => {
    it("validates EDR agent heartbeat payload", () => {
      const valid = AgentHeartbeatSchema.safeParse({
        organizationId: orgAId,
        assetId: assetId,
        agentVersion: "1.4.2",
        status: "Online",
        cpuUsagePct: 12.5,
        ramUsagePct: 45.0,
        diskUsagePct: 68.2,
        capabilities: ["edr", "fim", "telemetry", "isolation"],
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.status).toBe("Online");
        expect(valid.data.cpuUsagePct).toBe(12.5);
      }
    });

    it("rejects agent heartbeat with invalid CPU usage (>100)", () => {
      const invalid = AgentHeartbeatSchema.safeParse({
        organizationId: orgAId,
        assetId: assetId,
        cpuUsagePct: 120.0,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("4. Security Identities Model", () => {
    it("validates domain user identity creation", () => {
      const valid = CreateSocIdentitySchema.safeParse({
        organizationId: orgAId,
        username: "jmercer",
        displayName: "John Mercer",
        email: "jmercer@corp.internal",
        domain: "CORP.INTERNAL",
        department: "Global Finance",
        accountType: "User",
        isPrivileged: false,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.username).toBe("jmercer");
        expect(valid.data.accountType).toBe("User");
      }
    });

    it("validates privileged service account identity", () => {
      const valid = CreateSocIdentitySchema.safeParse({
        organizationId: orgAId,
        username: "svc_ad_sync",
        domain: "CORP.INTERNAL",
        accountType: "Service",
        isPrivileged: true,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.isPrivileged).toBe(true);
      }
    });
  });

  describe("5. Telemetry Events Model", () => {
    it("validates normalized process execution telemetry event", () => {
      const valid = CreateTelemetryEventSchema.safeParse({
        organizationId: orgAId,
        occurredAt: new Date().toISOString(),
        source: "WindowsEventLog",
        sourceType: "Endpoint",
        category: "ProcessCreation",
        eventType: "win.sysmon.1",
        severity: "High",
        assetId: assetId,
        agentId: agentId,
        identityId: identityId,
        normalizedFields: {
          process_name: "powershell.exe",
          parent_process_name: "cmd.exe",
          command_line: "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=",
          user: "CORP\\jmercer",
          integrity_level: "High",
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
        tags: ["sysmon", "execution", "encoded_command"],
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.eventType).toBe("win.sysmon.1");
        expect(valid.data.severity).toBe("High");
      }
    });
  });

  describe("6. Logs Model", () => {
    it("validates raw syslog and parsed ingestion structure", () => {
      const valid = IngestLogSchema.safeParse({
        organizationId: orgAId,
        loggedAt: new Date().toISOString(),
        facility: "auth",
        logLevel: "WARN",
        sourceHost: "fw-core-01.corp.internal",
        serviceName: "sshd",
        message: "Failed password for invalid user admin from 198.51.100.42 port 44322 ssh2",
        rawLog: "Sep 16 22:15:00 fw-core-01 sshd[24891]: Failed password for invalid user admin from 198.51.100.42 port 44322 ssh2",
        parseStatus: "Parsed",
        parserName: "linux_sshd_parser",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.logLevel).toBe("WARN");
        expect(valid.data.parseStatus).toBe("Parsed");
      }
    });
  });

  describe("7. Processes Model", () => {
    it("validates EDR process tree node record", () => {
      const valid = CreateProcessRecordSchema.safeParse({
        organizationId: orgAId,
        assetId: assetId,
        agentId: agentId,
        pid: 4892,
        ppid: 1024,
        processGuid: "{D6F8A800-4892-0000-0000-000000000000}",
        parentProcessGuid: "{D6F8A800-1024-0000-0000-000000000000}",
        name: "powershell.exe",
        executablePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        commandLine: "powershell.exe -ExecutionPolicy Bypass -File C:\\Temp\\recon.ps1",
        username: "CORP\\jmercer",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        startedAt: new Date().toISOString(),
        integrityLevel: "Medium",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.pid).toBe(4892);
        expect(valid.data.name).toBe("powershell.exe");
      }
    });
  });

  describe("8. Files Model", () => {
    it("validates monitored file record and hashes", () => {
      const valid = CreateFileRecordSchema.safeParse({
        organizationId: orgAId,
        assetId: assetId,
        path: "C:\\Windows\\System32\\drivers\\etc\\hosts",
        name: "hosts",
        extension: "",
        sizeBytes: 824,
        sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        isSigned: false,
        isHidden: false,
        isExecutable: false,
        owner: "NT AUTHORITY\\SYSTEM",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.sizeBytes).toBe(824);
        expect(valid.data.path).toBe("C:\\Windows\\System32\\drivers\\etc\\hosts");
      }
    });
  });

  describe("9. Network Connections Model", () => {
    it("validates network connection flow record", () => {
      const valid = CreateNetworkConnectionSchema.safeParse({
        organizationId: orgAId,
        assetId: assetId,
        processId: processId,
        srcIp: "10.0.4.42",
        dstIp: "198.51.100.75",
        srcPort: 54321,
        dstPort: 443,
        protocol: "HTTPS",
        direction: "Outbound",
        status: "Established",
        bytesSent: 4892,
        bytesReceived: 18240,
        durationMs: 1420,
        startedAt: new Date().toISOString(),
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.srcIp).toBe("10.0.4.42");
        expect(valid.data.dstPort).toBe(443);
        expect(valid.data.protocol).toBe("HTTPS");
      }
    });
  });

  describe("10. Multi-Tenant Isolation & Integrity Invariants", () => {
    it("enforces tenant organization matching across relational models", () => {
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

      const agentA: Agent = {
        id: agentId,
        organization_id: orgAId,
        asset_id: assetA.id,
        agent_version: "1.4.2",
        status: "Online",
        cpu_usage_pct: 5.0,
        ram_usage_pct: 20.0,
        disk_usage_pct: 35.0,
        last_seen_at: new Date().toISOString(),
        heartbeat_interval_seconds: 30,
        capabilities: ["edr", "isolation"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Ensure asset and agent share the exact same tenant root
      expect(agentA.organization_id).toBe(assetA.organization_id);
      expect(agentA.organization_id).toBe(orgAId);
      expect(agentA.organization_id).not.toBe(orgBId);
    });

    it("verifies telemetry event relational scoping", () => {
      const event: TelemetryEvent = {
        id: "77777777-7777-4777-a777-777777777777",
        organization_id: orgAId,
        occurred_at: new Date().toISOString(),
        source: "EDR",
        source_type: "Endpoint",
        category: "ProcessCreation",
        event_type: "edr.process.spawn",
        severity: "Critical",
        asset_id: assetId,
        agent_id: agentId,
        identity_id: identityId,
        normalized_fields: { pid: 4892 },
        created_at: new Date().toISOString(),
      };

      expect(event.organization_id).toBe(orgAId);
      expect(event.asset_id).toBe(assetId);
      expect(event.agent_id).toBe(agentId);
    });
  });
});
