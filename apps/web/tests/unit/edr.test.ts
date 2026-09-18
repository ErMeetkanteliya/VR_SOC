import { describe, it, expect } from "vitest";
import {
  buildProcessTree,
  analyzeProcessSuspicion,
  flattenProcessTree,
} from "@/lib/edr/process-tree";
import {
  generateScenarioPayloads,
} from "@/lib/edr/simulation-scenarios";
import { compileEndpointTimeline } from "@/lib/edr/investigation-service";
import {
  RegistryEventSchema,
  EndpointServiceEventSchema,
  ScheduledTaskEventSchema,
  StartupItemSchema,
  UsbDeviceEventSchema,
  SimulateEdrScenarioSchema,
} from "@vrsoc/validation";
import type { ProcessRecord } from "@vrsoc/types";

describe("Phase 17 — EDR Telemetry & Process Tree Engine", () => {
  const orgId = "00000000-0000-0000-0000-000000000001";
  const assetId = "00000000-0000-0000-0000-000000000002";
  const agentId = "00000000-0000-0000-0000-000000000003";

  describe("Validation Schemas", () => {
    it("validates registry event payloads", () => {
      const valid = {
        organization_id: orgId,
        asset_id: assetId,
        hive: "HKCU",
        key_path: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        value_name: "SecurityUpdate",
        value_data: "C:\\Users\\Public\\update.exe",
        action: "Created",
        occurred_at: new Date().toISOString(),
        metadata: {},
      };

      const parsed = RegistryEventSchema.safeParse(valid);
      expect(parsed.success).toBe(true);

      const invalidHive = { ...valid, hive: "HK_INVALID" };
      expect(RegistryEventSchema.safeParse(invalidHive).success).toBe(false);
    });

    it("validates endpoint service event payloads", () => {
      const valid = {
        organization_id: orgId,
        asset_id: assetId,
        service_name: "WindowsHealthSvc",
        executable_path: "C:\\Windows\\System32\\svchost.exe -k netsvcs",
        start_type: "Auto",
        status: "Running",
        action: "Installed",
        occurred_at: new Date().toISOString(),
        metadata: {},
      };

      const parsed = EndpointServiceEventSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates scheduled task event payloads", () => {
      const valid = {
        organization_id: orgId,
        asset_id: assetId,
        task_name: "DiskCleanTask",
        task_path: "\\Microsoft\\Windows\\",
        action: "Created",
        command: "powershell.exe",
        trigger_type: "Daily",
        occurred_at: new Date().toISOString(),
        metadata: {},
      };

      const parsed = ScheduledTaskEventSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates startup item payloads", () => {
      const valid = {
        organization_id: orgId,
        asset_id: assetId,
        name: "StartupApp",
        location_type: "RegistryRun",
        location_path: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        command: "C:\\Program Files\\App\\app.exe",
        action: "Added",
        occurred_at: new Date().toISOString(),
        metadata: {},
      };

      const parsed = StartupItemSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates USB device event payloads", () => {
      const valid = {
        organization_id: orgId,
        asset_id: assetId,
        device_name: "Kingston DataTraveler 3.0",
        serial_number: "K12345678",
        drive_letter: "F:",
        action: "Connected",
        occurred_at: new Date().toISOString(),
        metadata: {},
      };

      const parsed = UsbDeviceEventSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("validates EDR simulation trigger inputs", () => {
      const valid = {
        organizationId: orgId,
        assetId: assetId,
        scenarioType: "process_masquerading",
      };

      expect(SimulateEdrScenarioSchema.safeParse(valid).success).toBe(true);

      const invalidScenario = {
        ...valid,
        scenarioType: "invalid_scenario_name",
      };
      expect(SimulateEdrScenarioSchema.safeParse(invalidScenario).success).toBe(false);
    });
  });

  describe("Process Tree Construction & Lineage", () => {
    it("reconstructs a hierarchical parent-child process tree", () => {
      const mockProcesses: ProcessRecord[] = [
        {
          id: "p1",
          organization_id: orgId,
          asset_id: assetId,
          pid: 1000,
          ppid: 4,
          name: "explorer.exe",
          executable_path: "C:\\Windows\\explorer.exe",
          started_at: "2026-09-17T08:00:00Z",
          integrity_level: "Medium",
          metadata: {},
          created_at: "2026-09-17T08:00:00Z",
        },
        {
          id: "p2",
          organization_id: orgId,
          asset_id: assetId,
          pid: 2000,
          ppid: 1000,
          name: "cmd.exe",
          executable_path: "C:\\Windows\\System32\\cmd.exe",
          command_line: "cmd.exe /c whoami",
          started_at: "2026-09-17T08:01:00Z",
          integrity_level: "Medium",
          metadata: {},
          created_at: "2026-09-17T08:01:00Z",
        },
        {
          id: "p3",
          organization_id: orgId,
          asset_id: assetId,
          pid: 3000,
          ppid: 2000,
          name: "whoami.exe",
          executable_path: "C:\\Windows\\System32\\whoami.exe",
          started_at: "2026-09-17T08:01:05Z",
          integrity_level: "Medium",
          metadata: {},
          created_at: "2026-09-17T08:01:05Z",
        },
      ];

      const tree = buildProcessTree(mockProcesses);

      expect(tree).toHaveLength(1);
      expect(tree[0]!.pid).toBe(1000);
      expect(tree[0]!.children).toHaveLength(1);
      expect(tree[0]!.children[0]!.pid).toBe(2000);
      expect(tree[0]!.children[0]!.children).toHaveLength(1);
      expect(tree[0]!.children[0]!.children[0]!.pid).toBe(3000);
    });

    it("handles multiple roots and orphan processes gracefully", () => {
      const mockProcesses: ProcessRecord[] = [
        {
          id: "p1",
          organization_id: orgId,
          asset_id: assetId,
          pid: 500,
          ppid: 4,
          name: "services.exe",
          executable_path: "C:\\Windows\\System32\\services.exe",
          started_at: "2026-09-17T07:00:00Z",
          integrity_level: "System",
          metadata: {},
          created_at: "2026-09-17T07:00:00Z",
        },
        {
          id: "p2",
          organization_id: orgId,
          asset_id: assetId,
          pid: 9999,
          ppid: 8888, // Unrecorded parent PID
          name: "standalone.exe",
          executable_path: "C:\\Program Files\\App\\standalone.exe",
          started_at: "2026-09-17T07:05:00Z",
          integrity_level: "Medium",
          metadata: {},
          created_at: "2026-09-17T07:05:00Z",
        },
      ];

      const tree = buildProcessTree(mockProcesses);
      expect(tree).toHaveLength(2);
      expect(tree.map((t) => t.pid)).toContain(500);
      expect(tree.map((t) => t.pid)).toContain(9999);
    });

    it("prevents infinite recursion on circular process parent references", () => {
      const cyclicProcesses: ProcessRecord[] = [
        {
          id: "p1",
          organization_id: orgId,
          asset_id: assetId,
          pid: 100,
          ppid: 200,
          name: "proc1.exe",
          executable_path: "C:\\proc1.exe",
          started_at: "2026-09-17T08:00:00Z",
          metadata: {},
          created_at: "2026-09-17T08:00:00Z",
        },
        {
          id: "p2",
          organization_id: orgId,
          asset_id: assetId,
          pid: 200,
          ppid: 100, // Circular reference
          name: "proc2.exe",
          executable_path: "C:\\proc2.exe",
          started_at: "2026-09-17T08:00:01Z",
          metadata: {},
          created_at: "2026-09-17T08:00:01Z",
        },
      ];

      const tree = buildProcessTree(cyclicProcesses);
      expect(tree.length).toBeGreaterThan(0);
      const flattened = flattenProcessTree(tree);
      expect(flattened.length).toBe(2);
    });
  });

  describe("Heuristic Suspicion Tagging", () => {
    it("flags processes spawned from volatile directories", () => {
      const proc: ProcessRecord = {
        id: "p1",
        organization_id: orgId,
        asset_id: assetId,
        pid: 4000,
        name: "mal.exe",
        executable_path: "C:\\Users\\Public\\mal.exe",
        command_line: "C:\\Users\\Public\\mal.exe",
        started_at: "2026-09-17T08:00:00Z",
        metadata: {},
        created_at: "2026-09-17T08:00:00Z",
      };

      const result = analyzeProcessSuspicion(proc);
      expect(result.isSuspicious).toBe(true);
      expect(result.reasons.some((r) => r.toLowerCase().includes("users\\public"))).toBe(true);
    });

    it("flags encoded PowerShell commands", () => {
      const proc: ProcessRecord = {
        id: "p1",
        organization_id: orgId,
        asset_id: assetId,
        pid: 4001,
        name: "powershell.exe",
        executable_path: "C:\\Windows\\System32\\powershell.exe",
        command_line: "powershell.exe -NonInteractive -Enc JABhAD0AMQA=",
        started_at: "2026-09-17T08:00:00Z",
        metadata: {},
        created_at: "2026-09-17T08:00:00Z",
      };

      const result = analyzeProcessSuspicion(proc);
      expect(result.isSuspicious).toBe(true);
      expect(result.reasons.some((r) => r.includes("Base64"))).toBe(true);
    });

    it("flags anomalous parent-child relationships (powershell -> svchost)", () => {
      const proc: ProcessRecord = {
        id: "p1",
        organization_id: orgId,
        asset_id: assetId,
        pid: 4002,
        name: "svchost.exe",
        executable_path: "C:\\Windows\\System32\\svchost.exe",
        command_line: "svchost.exe -k netsvcs",
        started_at: "2026-09-17T08:00:00Z",
        metadata: {},
        created_at: "2026-09-17T08:00:00Z",
      };

      const result = analyzeProcessSuspicion(proc, "powershell.exe");
      expect(result.isSuspicious).toBe(true);
      expect(result.reasons.some((r) => r.includes("Anomalous parent"))).toBe(true);
    });
  });

  describe("Educational Simulation Scenarios", () => {
    it("generates structured telemetry payloads for all scenario types", () => {
      const scenarioTypes = [
        "process_masquerading",
        "registry_run_persistence",
        "suspicious_file_drop",
        "c2_network_beaconing",
        "malicious_service_install",
        "scheduled_task_creation",
        "startup_folder_hijack",
        "unauthorized_usb_insertion",
        "multi_stage_endpoint_attack",
      ] as const;

      for (const st of scenarioTypes) {
        const payloads = generateScenarioPayloads(st, {
          organizationId: orgId,
          assetId,
          agentId,
          hostname: "TEST-HOST-01",
        });

        expect(payloads.length).toBeGreaterThan(0);
        for (const p of payloads) {
          expect(p.organizationId).toBe(orgId);
          expect(p.assetId).toBe(assetId);
          expect(p.source).toBe("EDR Agent");
          expect(p.occurredAt).toBeDefined();
          expect(p.category).toBeDefined();
          expect(p.eventType).toBeDefined();
        }
      }
    });
  });

  describe("Forensic Timeline Compilation", () => {
    it("merges heterogeneous endpoint artifacts into chronological order", () => {
      const timeline = compileEndpointTimeline({
        processes: [
          {
            id: "p1",
            organization_id: orgId,
            asset_id: assetId,
            pid: 1234,
            name: "proc.exe",
            executable_path: "C:\\proc.exe",
            started_at: "2026-09-17T10:00:00Z",
            metadata: {},
            created_at: "2026-09-17T10:00:00Z",
          },
        ],
        files: [
          {
            id: "f1",
            organization_id: orgId,
            asset_id: assetId,
            path: "C:\\test.exe",
            name: "test.exe",
            size_bytes: 1024,
            is_signed: false,
            is_hidden: false,
            is_executable: true,
            created_at: "2026-09-17T10:05:00Z",
            updated_at: "2026-09-17T10:05:00Z",
            metadata: {},
          },
        ],
        networkConnections: [],
        registryEvents: [
          {
            id: "r1",
            organization_id: orgId,
            asset_id: assetId,
            hive: "HKLM",
            key_path: "Software\\Microsoft\\Windows",
            action: "Modified",
            occurred_at: "2026-09-17T10:02:00Z",
            metadata: {},
            created_at: "2026-09-17T10:02:00Z",
          },
        ],
        services: [],
        scheduledTasks: [],
        startupItems: [],
        usbEvents: [],
        relatedAlerts: [],
        relatedEvents: [],
      });

      expect(timeline).toHaveLength(3);
      // Descending order: 10:05 (file) -> 10:02 (reg) -> 10:00 (proc)
      expect(timeline[0]!.category).toBe("file");
      expect(timeline[1]!.category).toBe("registry");
      expect(timeline[2]!.category).toBe("process");
    });
  });
});
