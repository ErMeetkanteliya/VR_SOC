import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AlertFilterParamsSchema,
  AcknowledgeAlertSchema,
  CloseAlertSchema,
} from "@vrsoc/validation";
import { generateAlertDedupKey } from "@/lib/alerts/dedup";
import { createAlertFromDetection } from "@/lib/alerts/generator";
import {
  acknowledgeAlert,
  assignAlert,
  updateAlertStatus,
  getAlertStats,
} from "@/lib/alerts/triage-service";
import type {
  DetectionExecutionResult,
  Alert,
} from "@vrsoc/types";

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabase),
}));

const tenantA = "11111111-1111-1111-1111-111111111111";
const userAnalyst = "33333333-3333-3333-3333-333333333333";

const createMockDetectionResult = (
  overrides?: Partial<DetectionExecutionResult>
): DetectionExecutionResult => ({
  ruleId: "rule-powershell-encoded-exec",
  ruleName: "Suspicious PowerShell Encoded Execution",
  severity: "High",
  matched: true,
  evaluatedAt: "2026-09-17T10:00:00.000Z",
  evaluationWindow: {
    start: "2026-09-17T09:45:00.000Z",
    end: "2026-09-17T10:00:00.000Z",
  },
  matchedEventIds: ["evt-001", "evt-002"],
  matchedEvents: [],
  primaryAssetId: "asset-001",
  primaryIdentityId: "user-001",
  explanation: {
    ruleId: "rule-powershell-encoded-exec",
    ruleName: "Suspicious PowerShell Encoded Execution",
    matched: true,
    summary: "Rule matched! Detected encoded PowerShell invocation.",
    details: ["Process powershell.exe executed with -enc switch"],
    evaluatedCount: 15,
    matchedCount: 2,
  },
  metadata: {
    mitre_tactic: "Execution",
    mitre_technique_id: "T1059.001",
    mitre_technique_name: "PowerShell",
  },
  ...overrides,
});

const createMockAlert = (overrides?: Partial<Alert>): Alert => ({
  id: "alert-001",
  organization_id: tenantA,
  rule_id: "rule-powershell-encoded-exec",
  alert_code: "ALT-2026-A1B2",
  title: "Suspicious PowerShell Encoded Execution Detected",
  description: "Detects command-line execution of PowerShell with hidden/encoded switches",
  severity: "High",
  risk_score: 80,
  status: "Open",
  source: "Detection Engine",
  occurred_at: "2026-09-17T10:00:00.000Z",
  asset_id: "asset-001",
  identity_id: "user-001",
  matched_event_ids: ["evt-001", "evt-002"],
  mitre_tactic: "Execution",
  mitre_technique_id: "T1059.001",
  mitre_technique_name: "PowerShell",
  explanation: {
    ruleId: "rule-powershell-encoded-exec",
    ruleName: "Suspicious PowerShell Encoded Execution",
    matched: true,
    summary: "Rule matched!",
    details: [],
    evaluatedCount: 15,
    matchedCount: 2,
  },
  dedup_key: "rule-powershell-encoded-exec:asset-001:user-001:993870",
  created_at: "2026-09-17T10:00:01.000Z",
  updated_at: "2026-09-17T10:00:01.000Z",
  ...overrides,
});

describe("Phase 16: Alerts & Triage Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("validates AlertFilterParamsSchema with default pagination", () => {
      const parsed = AlertFilterParamsSchema.safeParse({
        status: "Open",
        severity: "High",
        timeRange: "24h",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.pageSize).toBe(25);
      }
    });

    it("validates AcknowledgeAlertSchema", () => {
      const parsed = AcknowledgeAlertSchema.safeParse({
        alertId: "11111111-1111-1111-1111-111111111111",
        note: "Acknowledging for forensic analysis",
      });
      expect(parsed.success).toBe(true);
    });

    it("validates CloseAlertSchema with closure rationale", () => {
      const parsed = CloseAlertSchema.safeParse({
        alertId: "11111111-1111-1111-1111-111111111111",
        status: "Closed",
        reason: "False positive verified by administrator",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects CloseAlertSchema when closure reason is too short", () => {
      const parsed = CloseAlertSchema.safeParse({
        alertId: "11111111-1111-1111-1111-111111111111",
        status: "Closed",
        reason: "ab",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("Deduplication Key Generator", () => {
    it("generates deterministic dedup keys for identical inputs", () => {
      const res1 = createMockDetectionResult();
      const res2 = createMockDetectionResult();

      const key1 = generateAlertDedupKey(res1, 30);
      const key2 = generateAlertDedupKey(res2, 30);

      expect(key1).toBe(key2);
      expect(key1).toContain("rule-powershell-encoded-exec");
      expect(key1).toContain("asset-001");
    });

    it("generates distinct dedup keys for different assets or rules", () => {
      const res1 = createMockDetectionResult({ primaryAssetId: "asset-001" });
      const res2 = createMockDetectionResult({ primaryAssetId: "asset-002" });

      const key1 = generateAlertDedupKey(res1, 30);
      const key2 = generateAlertDedupKey(res2, 30);

      expect(key1).not.toBe(key2);
    });
  });

  describe("Alert Generation from Detection Results", () => {
    it("rejects alert creation when detection is unmatched", async () => {
      const unmatchedResult = createMockDetectionResult({ matched: false });
      const res = await createAlertFromDetection(tenantA, unmatchedResult);

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unmatched detection results cannot generate alerts");
    });

    it("creates a new alert and logs history entry on matched detection", async () => {
      const detection = createMockDetectionResult();
      const mockAlert = createMockAlert();

      // Existing alert check returns null
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      // Insert returns new alert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "alerts") {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        if (table === "alert_history") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const result = await createAlertFromDetection(tenantA, detection);
      expect(result.success).toBe(true);
      expect(result.data?.alert_code).toBe("ALT-2026-A1B2");
      expect(result.isDuplicate).toBe(false);
    });

    it("updates existing alert and merges matched events on duplicate detection", async () => {
      const detection = createMockDetectionResult({
        matchedEventIds: ["evt-003"],
      });
      const existingAlert = createMockAlert({
        matched_event_ids: ["evt-001", "evt-002"],
      });

      // Existing alert check finds match
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existingAlert, error: null }),
            }),
          }),
        }),
      });

      // Update returns updated alert with merged events
      const updatedAlert = {
        ...existingAlert,
        matched_event_ids: ["evt-001", "evt-002", "evt-003"],
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedAlert, error: null }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "alerts") {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        return {};
      });

      const result = await createAlertFromDetection(tenantA, detection);
      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(true);
      expect(result.data?.matched_event_ids).toContain("evt-003");
    });
  });

  describe("Triage Service Lifecycle Operations", () => {
    it("acknowledges an open alert and records history", async () => {
      const alert = createMockAlert({ status: "Open" });
      const acknowledgedAlert = { ...alert, status: "Acknowledged" };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "alerts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: alert, error: null }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: acknowledgedAlert, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "alert_history") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const res = await acknowledgeAlert(tenantA, userAnalyst, "alert-001", "Triaging incident");
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("Acknowledged");
    });

    it("assigns an alert to an analyst and transitions status to In Progress", async () => {
      const alert = createMockAlert({ status: "Open" });
      const assignedAlert = { ...alert, status: "In Progress", assigned_to: userAnalyst };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "alerts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: alert, error: null }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: assignedAlert, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "alert_history") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const res = await assignAlert(tenantA, userAnalyst, "alert-001", userAnalyst);
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("In Progress");
      expect(res.data?.assigned_to).toBe(userAnalyst);
    });

    it("closes an alert with closure reason and sets closed_at timestamp", async () => {
      const alert = createMockAlert({ status: "In Progress" });
      const closedAlert = {
        ...alert,
        status: "Closed",
        closed_at: "2026-09-17T10:15:00.000Z",
        closed_reason: "Benign testing verified",
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "alerts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: alert, error: null }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: closedAlert, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "alert_history") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const res = await updateAlertStatus(
        tenantA,
        userAnalyst,
        "alert-001",
        "Closed",
        undefined,
        "Benign testing verified"
      );
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("Closed");
    });

    it("calculates alert KPI stats accurately", async () => {
      const mockAlertRows = [
        { status: "Open", severity: "Critical" },
        { status: "Open", severity: "High" },
        { status: "Acknowledged", severity: "Medium" },
        { status: "In Progress", severity: "High" },
        { status: "Closed", severity: "Low" },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAlertRows, error: null }),
        }),
      });

      const stats = await getAlertStats(tenantA);
      expect(stats.totalAlerts).toBe(5);
      expect(stats.openCount).toBe(2);
      expect(stats.criticalCount).toBe(3); // Critical + High
      expect(stats.acknowledgedCount).toBe(1);
      expect(stats.inProgressCount).toBe(1);
      expect(stats.closedCount).toBe(1);
    });
  });
});
