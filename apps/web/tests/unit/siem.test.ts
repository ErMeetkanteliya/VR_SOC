import { describe, it, expect, vi } from "vitest";
import {
  SiemQuerySchema,
  SiemTimeRangeSchema,
  SiemCorrelationQuerySchema,
  SiemTimelineQuerySchema,
  CreateSavedQuerySchema,
  UpdateSavedQuerySchema,
  DeleteSavedQuerySchema,
} from "@vrsoc/validation";
import {
  calculateTimeWindow,
  executeSiemEventsQuery,
  executeSiemLogsQuery,
  getSiemEventDetails,
} from "@/lib/siem/query";
import {
  correlateByAsset,
  correlateByIdentity,
  correlateByIngestionBatch,
  getEventCorrelations,
} from "@/lib/siem/correlate";
import { buildSiemTimeline } from "@/lib/siem/timeline";
import {
  getSavedQueries,
  createSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
} from "@/lib/siem/saved-queries";

// Mock Supabase client
const sampleTenantA = "11111111-1111-1111-1111-111111111111";
const sampleTenantB = "22222222-2222-2222-2222-222222222222";
const sampleAssetId = "33333333-3333-3333-3333-333333333333";
const sampleIdentityId = "44444444-4444-4444-4444-444444444444";
const sampleEventId = "55555555-5555-5555-5555-555555555555";

const mockEventRow = {
  id: sampleEventId,
  organization_id: sampleTenantA,
  occurred_at: "2026-09-17T09:00:00.000Z",
  source: "Syslog",
  source_type: "Linux",
  category: "Authentication",
  event_type: "AUTH_FAILURE",
  severity: "High",
  asset_id: sampleAssetId,
  agent_id: null,
  identity_id: sampleIdentityId,
  raw_payload: { attempts: 5 },
  normalized_fields: { user: "admin", message: "Failed SSH login" },
  tags: ["auth", "ssh"],
  pipeline_status: "Stored",
  ingestion_id: "ing-batch-001",
  source_host: "srv-linux-01",
  created_at: "2026-09-17T09:00:01.000Z",
  asset: { id: sampleAssetId, hostname: "srv-linux-01", asset_type: "Server", criticality: "Critical" },
  identity: { id: sampleIdentityId, username: "admin", domain: "CORP", account_type: "User", is_privileged: true },
};

const mockLogRow = {
  id: "66666666-6666-6666-6666-666666666666",
  organization_id: sampleTenantA,
  event_id: sampleEventId,
  logged_at: "2026-09-17T09:00:00.500Z",
  facility: "auth",
  log_level: "ERROR",
  source_host: "srv-linux-01",
  service_name: "sshd",
  message: "Failed password for invalid user admin",
  raw_log: "Sep 17 09:00:00 srv-linux-01 sshd[102]: Failed password for invalid user admin",
  parse_status: "Parsed",
  parser_name: "vrsoc-syslog-parser",
  created_at: "2026-09-17T09:00:01.200Z",
};

const mockSavedQueryRow = {
  id: "77777777-7777-7777-7777-777777777777",
  organization_id: sampleTenantA,
  user_id: "user-123",
  name: "Critical Auth Failures",
  description: "SSH brute force monitoring",
  query_type: "events",
  filters: { severity: "High", category: "Authentication" },
  is_pinned: true,
  created_at: "2026-09-17T08:00:00.000Z",
  updated_at: "2026-09-17T08:00:00.000Z",
};

vi.mock("@/lib/supabase/server", () => {
  const createMockQueryBuilder = (table: string) => {
    let filterOrgId: string | null = null;

    const builder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((col: string, val: string) => {
        if (col === "organization_id") {
          filterOrgId = val;
        }
        return builder;
      }),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => {
        if (filterOrgId && filterOrgId !== sampleTenantA) {
          return Promise.resolve({ data: null, error: null });
        }
        if (table === "events") return Promise.resolve({ data: mockEventRow, error: null });
        if (table === "logs") return Promise.resolve({ data: mockLogRow, error: null });
        if (table === "assets") return Promise.resolve({ data: mockEventRow.asset, error: null });
        if (table === "soc_identities") return Promise.resolve({ data: mockEventRow.identity, error: null });
        if (table === "saved_queries") return Promise.resolve({ data: mockSavedQueryRow, error: null });
        return Promise.resolve({ data: null, error: null });
      }),
      insert: vi.fn().mockImplementation((payload: any) => ({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "new-saved-query-id", ...payload, created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      })),
      update: vi.fn().mockImplementation((updates: any) => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { ...mockSavedQueryRow, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      })),
      delete: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })),
      then: (resolve: any) => {
        if (filterOrgId && filterOrgId !== sampleTenantA) {
          return resolve({ data: [], count: 0, error: null });
        }
        if (table === "events") return resolve({ data: [mockEventRow], count: 1, error: null });
        if (table === "logs") return resolve({ data: [mockLogRow], count: 1, error: null });
        if (table === "saved_queries") return resolve({ data: [mockSavedQueryRow], error: null });
        return resolve({ data: [], count: 0, error: null });
      },
    };
    return builder;
  };

  return {
    createServerSupabaseClient: vi.fn().mockImplementation(async () => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => createMockQueryBuilder(table)),
    })),
  };
});

describe("Phase 14 — SIEM Core Unit & Integration Tests", () => {
  describe("1. Validation Schemas (SiemQuerySchema, SavedQuerySchema)", () => {
    it("validates SiemQuerySchema with valid filter parameters", () => {
      const valid = {
        organizationId: sampleTenantA,
        filters: {
          query: "powershell",
          timeRange: "1h",
          severity: "Critical",
          source: "Windows Event Log",
          category: "Execution",
          page: 1,
          pageSize: 25,
          sortBy: "occurred_at",
          sortDirection: "desc",
        },
      };
      const parsed = SiemQuerySchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("rejects SiemQuerySchema with invalid organization UUID", () => {
      const invalid = {
        organizationId: "not-a-uuid",
        filters: {},
      };
      const parsed = SiemQuerySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("validates SiemTimeRangeSchema with allowed time range values", () => {
      expect(SiemTimeRangeSchema.safeParse("15m").success).toBe(true);
      expect(SiemTimeRangeSchema.safeParse("1h").success).toBe(true);
      expect(SiemTimeRangeSchema.safeParse("24h").success).toBe(true);
      expect(SiemTimeRangeSchema.safeParse("7d").success).toBe(true);
      expect(SiemTimeRangeSchema.safeParse("all").success).toBe(true);
      expect(SiemTimeRangeSchema.safeParse("invalid_range").success).toBe(false);
    });

    it("validates SiemCorrelationQuerySchema and SiemTimelineQuerySchema", () => {
      const corrValid = {
        organizationId: sampleTenantA,
        eventId: sampleEventId,
        correlationType: "asset",
        timeWindowMinutes: 45,
      };
      expect(SiemCorrelationQuerySchema.safeParse(corrValid).success).toBe(true);

      const timelineValid = {
        organizationId: sampleTenantA,
        assetId: sampleAssetId,
        limit: 30,
      };
      expect(SiemTimelineQuerySchema.safeParse(timelineValid).success).toBe(true);
    });

    it("validates UpdateSavedQuerySchema and DeleteSavedQuerySchema", () => {
      const updateValid = {
        id: "77777777-7777-7777-7777-777777777777",
        organizationId: sampleTenantA,
        name: "Updated Search Name",
        isPinned: true,
      };
      expect(UpdateSavedQuerySchema.safeParse(updateValid).success).toBe(true);

      const deleteValid = {
        id: "77777777-7777-7777-7777-777777777777",
        organizationId: sampleTenantA,
      };
      expect(DeleteSavedQuerySchema.safeParse(deleteValid).success).toBe(true);
    });

    it("validates CreateSavedQuerySchema and ensures queryType defaults to events", () => {
      const valid = {
        organizationId: sampleTenantA,
        name: "Test Saved Search",
        filters: { severity: "High" },
        isPinned: true,
      };
      const parsed = CreateSavedQuerySchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.queryType).toBe("events");
      }
    });

    it("rejects CreateSavedQuerySchema with empty or too short name", () => {
      const invalid = {
        organizationId: sampleTenantA,
        name: "A",
        filters: {},
      };
      const parsed = CreateSavedQuerySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("2. Time Window Calculation (calculateTimeWindow)", () => {
    it("calculates 15m time window correctly in UTC", () => {
      const { startISO, endISO } = calculateTimeWindow("15m");
      expect(startISO).toBeDefined();
      expect(endISO).toBeDefined();
      const diffMs = new Date(endISO!).getTime() - new Date(startISO!).getTime();
      expect(diffMs).toBeCloseTo(15 * 60 * 1000, -3);
    });

    it("calculates 24h time window correctly in UTC", () => {
      const { startISO, endISO } = calculateTimeWindow("24h");
      expect(startISO).toBeDefined();
      expect(endISO).toBeDefined();
      const diffMs = new Date(endISO!).getTime() - new Date(startISO!).getTime();
      expect(diffMs).toBeCloseTo(24 * 60 * 60 * 1000, -3);
    });

    it("returns null bounds for 'all' timeRange", () => {
      const { startISO, endISO } = calculateTimeWindow("all");
      expect(startISO).toBeNull();
      expect(endISO).toBeNull();
    });

    it("handles custom start and end timestamps", () => {
      const start = "2026-09-01T00:00:00.000Z";
      const end = "2026-09-02T00:00:00.000Z";
      const { startISO, endISO } = calculateTimeWindow("custom", start, end);
      expect(startISO).toBe(start);
      expect(endISO).toBe(end);
    });
  });

  describe("3. Query Engine (executeSiemEventsQuery, executeSiemLogsQuery)", () => {
    it("executes SIEM events query with deterministic pagination and time filtering", async () => {
      const result = await executeSiemEventsQuery(sampleTenantA, {
        severity: "High",
        timeRange: "1h",
        page: 1,
        pageSize: 25,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.page).toBe(1);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.items[0]?.event_type).toBe("AUTH_FAILURE");
    });

    it("executes SIEM logs query successfully", async () => {
      const result = await executeSiemLogsQuery(sampleTenantA, {
        timeRange: "24h",
        page: 1,
        pageSize: 25,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.log_level).toBe("ERROR");
      expect(result.items[0]?.service_name).toBe("sshd");
    });

    it("retrieves deep event details including linked auxiliary entities", async () => {
      const details = await getSiemEventDetails(sampleTenantA, sampleEventId);
      expect(details).toBeDefined();
      expect(details?.event.id).toBe(sampleEventId);
      expect(details?.event.severity).toBe("High");
      expect(details?.log?.service_name).toBe("sshd");
    });
  });

  describe("4. Foundational Correlation Engine (correlateByAsset, correlateByIdentity, correlateByIngestionBatch)", () => {
    it("correlates events on the same asset within a time window", async () => {
      const group = await correlateByAsset(
        sampleTenantA,
        sampleAssetId,
        "2026-09-17T09:00:00.000Z",
        30
      );

      expect(group).toBeDefined();
      expect(group?.correlationType).toBe("asset");
      expect(group?.correlationKey).toBe(sampleAssetId);
      expect(group?.label).toContain("srv-linux-01");
      expect(group?.events.length).toBeGreaterThan(0);
    });

    it("correlates events for the same identity", async () => {
      const group = await correlateByIdentity(sampleTenantA, sampleIdentityId);
      expect(group).toBeDefined();
      expect(group?.correlationType).toBe("identity");
      expect(group?.label).toContain("admin");
    });

    it("correlates events from the same synthetic ingestion batch", async () => {
      const group = await correlateByIngestionBatch(sampleTenantA, "ing-batch-001");
      expect(group).toBeDefined();
      expect(group?.correlationType).toBe("ingestion_batch");
      expect(group?.events.length).toBeGreaterThan(0);
    });

    it("runs multi-factor correlation across an event using getEventCorrelations", async () => {
      const correlations = await getEventCorrelations(sampleTenantA, sampleEventId, 30);
      expect(Array.isArray(correlations)).toBe(true);
    });
  });

  describe("5. Chronological Timeline (buildSiemTimeline)", () => {
    it("merges events and logs into unified chronological timeline items", async () => {
      const timeline = await buildSiemTimeline(sampleTenantA, {
        organizationId: sampleTenantA,
        limit: 50,
      });

      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0]?.occurredAt).toBeDefined();
      expect(timeline[0]?.severity).toBe("High");
      expect(timeline[0]?.title).toContain("Authentication");
    });
  });

  describe("6. Saved Queries (getSavedQueries, createSavedQuery, updateSavedQuery, deleteSavedQuery)", () => {
    it("lists tenant-scoped saved queries", async () => {
      const queries = await getSavedQueries(sampleTenantA);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]?.name).toBe("Critical Auth Failures");
      expect(queries[0]?.is_pinned).toBe(true);
    });

    it("creates a new saved query preset successfully", async () => {
      const result = await createSavedQuery(sampleTenantA, "user-123", {
        name: "New Threat Search",
        description: "PowerShell anomalies",
        queryType: "events",
        filters: { severity: "Critical" },
        isPinned: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("New Threat Search");
    });

    it("updates a saved query name and pinned state", async () => {
      const result = await updateSavedQuery(sampleTenantA, {
        id: "77777777-7777-7777-7777-777777777777",
        organizationId: sampleTenantA,
        name: "Renamed Search",
        isPinned: false,
      });

      expect(result.success).toBe(true);
    });

    it("deletes a saved query scoped to organization", async () => {
      const result = await deleteSavedQuery(sampleTenantA, "77777777-7777-7777-7777-777777777777");
      expect(result.success).toBe(true);
    });
  });

  describe("7. Multi-Tenant Isolation Verification", () => {
    it("blocks cross-tenant data leakage when querying with another organization ID", async () => {
      const result = await executeSiemEventsQuery(sampleTenantB, {
        severity: "High",
        timeRange: "24h",
      });

      // Tenant B gets 0 items from Tenant A's dataset
      expect(result.items.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
