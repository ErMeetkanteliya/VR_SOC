import { describe, it, expect, vi } from "vitest";
import {
  validateTelemetryPayload,
  validateTelemetryBatch,
} from "@/lib/pipeline/validate";
import {
  parseTelemetryPayload,
} from "@/lib/pipeline/parse";
import {
  normalizePipelinePayload,
} from "@/lib/pipeline/normalize";
import {
  enrichPipelinePayload,
} from "@/lib/pipeline/enrich";
import {
  processTelemetryEvent,
  processTelemetryBatch,
} from "@/lib/pipeline/orchestrator";
import {
  PIPELINE_CONFIG,
  SUPPORTED_SOURCES,
  SUPPORTED_SOURCE_TYPES,
  SUPPORTED_CATEGORIES,
} from "@/lib/pipeline/config";
import type { PipelineIngestionInput } from "@vrsoc/validation";

// Mock Supabase client for orchestrator persistence and enrichment lookups
vi.mock("@/lib/supabase/server", () => {
  const createMockBuilder = (table: string) => {
    const builder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockImplementation(() => {
        if (table === "assets") {
          return Promise.resolve({
            data: { hostname: "srv-01", asset_type: "Server", criticality: "Critical", asset_groups: { name: "Production" } },
            error: null,
          });
        }
        if (table === "agents") {
          return Promise.resolve({
            data: { agent_version: "2.1.0", status: "online" },
            error: null,
          });
        }
        if (table === "soc_identities") {
          return Promise.resolve({
            data: { username: "admin_sec", domain: "CORP", account_type: "Service", is_privileged: true },
            error: null,
          });
        }
        if (table === "events") {
          return Promise.resolve({
            data: { id: "mock-event-uuid-1", created_at: new Date().toISOString() },
            error: null,
          });
        }
        if (table === "logs") {
          return Promise.resolve({
            data: { id: "mock-log-uuid-1", created_at: new Date().toISOString() },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      insert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: `mock-${table}-uuid`, created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      })),
    };
    return builder;
  };

  return {
    createServerSupabaseClient: vi.fn().mockImplementation(async () => ({
      from: vi.fn().mockImplementation((table: string) => createMockBuilder(table)),
    })),
  };
});

describe("Phase 13 — Log / Event Pipeline Unit & Integration Tests", () => {
  const sampleTenantId = "11111111-1111-1111-1111-111111111111";
  const sampleAssetId = "33333333-3333-3333-3333-333333333333";

  const sampleSyslogPayload: PipelineIngestionInput = {
    organizationId: sampleTenantId,
    source: "Syslog",
    sourceType: "Linux",
    category: "Authentication",
    eventType: "AUTH_FAILURE",
    severity: "High",
    logLevel: "ERROR",
    occurredAt: new Date().toISOString(),
    message: "Failed password for invalid user root from 192.168.1.50 port 45678 ssh2",
    rawLog: "Sep 16 12:00:00 srv-01 sshd[1234]: Failed password for invalid user root from 192.168.1.50 port 45678 ssh2",
    sourceHost: "srv-01",
    assetId: sampleAssetId,
    normalizedFields: {
      src_ip: "192.168.1.50",
      dst_ip: "10.0.0.1",
      user: "root",
    },
    tags: ["auth", "brute-force"],
  };

  const sampleWinEventPayload: PipelineIngestionInput = {
    organizationId: sampleTenantId,
    source: "Windows Event Log",
    sourceType: "Windows",
    category: "Execution",
    eventType: "PROCESS_CREATE",
    severity: "Critical",
    logLevel: "CRIT",
    occurredAt: new Date().toISOString(),
    message: "A new process has been created: powershell.exe",
    rawLog: "EventID 4688: A new process has been created. Process Name: powershell.exe",
    sourceHost: "win-workstation-04",
    assetId: sampleAssetId,
    normalizedFields: {
      process_name: "powershell.exe",
    },
    process: {
      name: "powershell.exe",
      executablePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      commandLine: "powershell.exe -enc JAB...",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      integrityLevel: "High",
    },
    tags: ["process", "powershell", "execution"],
  };

  const sampleEDRPayload: PipelineIngestionInput = {
    organizationId: sampleTenantId,
    source: "EDR Agent",
    sourceType: "Endpoint",
    category: "File",
    eventType: "FILE_WRITE",
    severity: "High",
    logLevel: "ERROR",
    occurredAt: new Date().toISOString(),
    message: "Suspicious file write: C:\\Windows\\Temp\\beacon.dll",
    sourceHost: "win-workstation-04",
    assetId: sampleAssetId,
    normalizedFields: {
      file_name: "beacon.dll",
    },
    file: {
      path: "C:\\Windows\\Temp\\beacon.dll",
      name: "beacon.dll",
      extension: "dll",
      sizeBytes: 45056,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      isExecutable: true,
      isHidden: false,
    },
    tags: ["edr", "file-creation", "malware"],
  };

  describe("Pipeline Configuration & Supported Matrix", () => {
    it("has valid default pipeline configuration limits", () => {
      expect(PIPELINE_CONFIG.maxBatchSize).toBe(100);
      expect(PIPELINE_CONFIG.enableEnrichment).toBe(true);
      expect(PIPELINE_CONFIG.enableDeduplication).toBe(true);
    });

    it("supports required enterprise sources and categories", () => {
      expect(SUPPORTED_SOURCES).toContain("Syslog");
      expect(SUPPORTED_SOURCES).toContain("Windows Event Log");
      expect(SUPPORTED_SOURCES).toContain("EDR Agent");
      expect(SUPPORTED_SOURCES).toContain("Zeek");

      expect(SUPPORTED_SOURCE_TYPES).toContain("Linux");
      expect(SUPPORTED_SOURCE_TYPES).toContain("Windows");
      expect(SUPPORTED_SOURCE_TYPES).toContain("Endpoint");
      expect(SUPPORTED_SOURCE_TYPES).toContain("Network");

      expect(SUPPORTED_CATEGORIES).toContain("Authentication");
      expect(SUPPORTED_CATEGORIES).toContain("Execution");
      expect(SUPPORTED_CATEGORIES).toContain("File");
      expect(SUPPORTED_CATEGORIES).toContain("Network");
    });
  });

  describe("Stage 1: Validation (validate.ts)", () => {
    it("successfully validates a well-formed Syslog payload", () => {
      const result = validateTelemetryPayload(sampleSyslogPayload);
      expect(result.valid).toBe(true);
      expect(result.stage).toBe("Validated");
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("rejects payload with invalid source type or missing mandatory fields", () => {
      const invalid = {
        organizationId: "not-a-uuid",
        source: "",
        category: "InvalidCategory",
      };
      const result = validateTelemetryPayload(invalid);
      expect(result.valid).toBe(false);
      expect(result.stage).toBe("Failed");
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it("rejects payload with timestamp more than 5 minutes in the future", () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const invalid = {
        ...sampleSyslogPayload,
        occurredAt: futureDate,
      };
      const result = validateTelemetryPayload(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("future"))).toBe(true);
    });

    it("rejects payload with null UUID organization", () => {
      const invalid = {
        ...sampleSyslogPayload,
        organizationId: "00000000-0000-0000-0000-000000000000",
      };
      const result = validateTelemetryPayload(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e) => e.includes("organizationId"))).toBe(true);
    });

    it("validates a batch of payloads with validateTelemetryBatch", () => {
      const batch = [
        sampleSyslogPayload,
        { ...sampleSyslogPayload, organizationId: "invalid-uuid" },
        sampleWinEventPayload,
      ];
      const results = validateTelemetryBatch(batch);
      expect(results.length).toBe(3);
      expect(results[0]?.valid).toBe(true);
      expect(results[1]?.valid).toBe(false);
      expect(results[2]?.valid).toBe(true);
    });
  });

  describe("Stage 2: Parsing & Interpretation (parse.ts)", () => {
    it("correctly parses Syslog auth failure message", () => {
      const parsed = parseTelemetryPayload(sampleSyslogPayload);
      expect(parsed.organizationId).toBe(sampleTenantId);
      expect(parsed.parserName).toBe("vrsoc-syslog-parser");
      expect(parsed.parseStatus).toBe("Parsed");
      expect(parsed.logLevel).toBe("ERROR");
      expect(parsed.rawLog).toContain("Failed password");
      expect(parsed.ingestionId).toBeDefined();
    });

    it("correctly parses Windows Event Log 4688 process creation", () => {
      const parsed = parseTelemetryPayload(sampleWinEventPayload);
      expect(parsed.parserName).toBe("vrsoc-winevtlog-parser");
      expect(parsed.parseStatus).toBe("Parsed");
      expect(parsed.logLevel).toBe("CRIT");
      expect(parsed.process?.name).toBe("powershell.exe");
    });

    it("parses EDR telemetry payload with file entity", () => {
      const parsed = parseTelemetryPayload(sampleEDRPayload);
      expect(parsed.parserName).toBe("vrsoc-edr-parser");
      expect(parsed.file?.name).toBe("beacon.dll");
    });
  });

  describe("Stage 3: Normalization (normalize.ts)", () => {
    it("normalizes parsed Syslog into canonical event & log records", () => {
      const parsed = parseTelemetryPayload(sampleSyslogPayload);
      const normalized = normalizePipelinePayload(parsed);

      expect(normalized.ingestionId).toBeDefined();
      expect(normalized.event.event_type).toBe("AUTH_FAILURE");
      expect(normalized.event.severity).toBe("High");
      expect(normalized.event.source).toBe("Syslog");
      expect(normalized.event.category).toBe("Authentication");
      expect(normalized.log.service_name).toBe("Syslog");
      expect(normalized.log.raw_log).toContain("Failed password");
    });

    it("normalizes process creation event with process auxiliary entity", () => {
      const parsed = parseTelemetryPayload(sampleWinEventPayload);
      const normalized = normalizePipelinePayload(parsed);

      expect(normalized.event.event_type).toBe("PROCESS_CREATE");
      expect(normalized.event.severity).toBe("Critical");
      expect(normalized.process).toBeDefined();
      expect(normalized.process?.name).toBe("powershell.exe");
      expect(normalized.process?.command_line).toContain("-enc");
    });

    it("normalizes file creation event with file auxiliary entity", () => {
      const parsed = parseTelemetryPayload(sampleEDRPayload);
      const normalized = normalizePipelinePayload(parsed);

      expect(normalized.event.event_type).toBe("FILE_WRITE");
      expect(normalized.file).toBeDefined();
      expect(normalized.file?.path).toContain("beacon.dll");
      expect(normalized.file?.sha256).toBeDefined();
    });
  });

  describe("Stage 4: Enrichment (enrich.ts)", () => {
    it("enriches normalized package with asset context", () => {
      const parsed = parseTelemetryPayload(sampleSyslogPayload);
      const normalized = normalizePipelinePayload(parsed);

      const enrichmentContext = {
        assetHostname: "srv-01",
        assetType: "Server",
        assetCriticality: "Critical",
        assetGroupName: "Production",
      };

      const enriched = enrichPipelinePayload(normalized, enrichmentContext);
      expect(enriched.enrichments).toContain("asset_hostname");
      expect(enriched.enrichments).toContain("asset_criticality");
      expect(enriched.enrichments).toContain("asset_group");
      expect(enriched.enrichmentContext.assetHostname).toBe("srv-01");
      expect(enriched.event.normalized_fields).toHaveProperty("asset_hostname", "srv-01");
      expect(enriched.event.normalized_fields).toHaveProperty("asset_criticality", "Critical");
    });

    it("handles enrichment gracefully when context is empty", () => {
      const parsed = parseTelemetryPayload(sampleSyslogPayload);
      const normalized = normalizePipelinePayload(parsed);
      const enriched = enrichPipelinePayload(normalized, {});

      expect(enriched.enrichments.length).toBe(0);
      expect(enriched.enrichmentContext).toEqual({});
    });
  });

  describe("Stage 5 & Pipeline Orchestration (orchestrator.ts)", () => {
    it("executes single payload end-to-end through the complete pipeline", async () => {
      const result = await processTelemetryEvent(sampleSyslogPayload, { skipDeduplication: true });

      expect(result.success).toBe(true);
      expect(result.stage).toBe("Stored");
      expect(result.ingestionId).toBeDefined();
      expect(result.processingDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("handles invalid payload gracefully at validation stage in orchestration", async () => {
      const invalidPayload = {
        ...sampleSyslogPayload,
        organizationId: "invalid-uuid",
      };

      const result = await processTelemetryEvent(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.stage).toBe("Failed");
      expect(result.failedStage).toBe("Validated");
      expect(result.error).toBeDefined();
    });

    it("executes batch processing of multiple payloads successfully", async () => {
      const batch = [
        sampleSyslogPayload,
        sampleWinEventPayload,
        sampleEDRPayload,
      ];

      const batchResult = await processTelemetryBatch(batch, { skipDeduplication: true });

      expect(batchResult.processed).toBe(3);
      expect(batchResult.succeeded).toBe(3);
      expect(batchResult.failed).toBe(0);
      expect(batchResult.results.length).toBe(3);
    });
  });
});
