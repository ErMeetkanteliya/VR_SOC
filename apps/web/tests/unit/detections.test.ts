import { describe, it, expect, vi } from "vitest";
import {
  CreateDetectionRuleSchema,
  FieldConditionSchema,
  LogicalConditionGroupSchema,
} from "@vrsoc/validation";
import {
  evaluateCondition,
  evaluateFieldCondition,
  extractField,
} from "@/lib/detections/evaluator";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "@/lib/detections/system-rules";
import { evaluateDetectionRule } from "@/lib/detections/engine";
import {
  getDetectionRules,
  deleteDetectionRule,
} from "@/lib/detections/rules-service";
import type {
  TelemetryEvent,
  DetectionRule,
  LogicalConditionGroup,
} from "@vrsoc/types";

// Mock Supabase
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

const createMockEvent = (overrides?: Partial<TelemetryEvent>): TelemetryEvent => ({
  id: "evt-001",
  organization_id: tenantA,
  occurred_at: new Date().toISOString(),
  source: "EDR",
  source_type: "windows_events",
  category: "process",
  event_type: "process_spawned",
  severity: "High",
  asset_id: "asset-001",
  agent_id: "agent-001",
  identity_id: "user-001",
  raw_payload: {
    command: "powershell.exe -enc SQBFAFgA",
    process_id: 1044,
  },
  normalized_fields: {
    process_name: "powershell.exe",
    command_line: "powershell.exe -enc SQBFAFgA",
    parent_process_name: "cmd.exe",
    user: "SYSTEM",
  },
  tags: ["edr", "powershell"],
  pipeline_status: "Stored",
  ingestion_id: "batch-001",
  source_host: "ws-win10-01",
  created_at: new Date().toISOString(),
  asset: { id: "asset-001", hostname: "ws-win10-01", asset_type: "Endpoint" } as any,
  identity: {
    id: "user-001",
    organization_id: tenantA,
    username: "SYSTEM",
    domain: "WORKGROUP",
    account_type: "User",
    is_privileged: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any,
  ...overrides,
});

describe("Phase 15: Detection & Correlation Rules Engine", () => {
  describe("Zod Validation Schemas", () => {
    it("validates a valid FieldCondition", () => {
      const cond = {
        field: "process_name",
        operator: "equals",
        value: "powershell.exe",
      };
      const result = FieldConditionSchema.safeParse(cond);
      expect(result.success).toBe(true);
    });

    it("validates a valid LogicalConditionGroup", () => {
      const group = {
        operator: "AND",
        conditions: [
          { field: "event_type", operator: "equals", value: "process_spawned" },
          { field: "command_line", operator: "contains", value: "-enc" },
        ],
      };
      const result = LogicalConditionGroupSchema.safeParse(group);
      expect(result.success).toBe(true);
    });

    it("rejects invalid operator", () => {
      const cond = {
        field: "process_name",
        operator: "invalid_operator",
        value: "test",
      };
      const result = FieldConditionSchema.safeParse(cond);
      expect(result.success).toBe(false);
    });

    it("validates CreateDetectionRuleSchema with full payload", () => {
      const input = {
        name: "Test Rule",
        description: "Test description",
        severity: "High",
        category: "process_execution",
        rule_type: "single_event",
        is_enabled: true,
        conditions: {
          field: "process_name",
          operator: "equals",
          value: "powershell.exe",
        },
        threshold_count: 1,
        evaluation_window_minutes: 15,
        mitre_tactic: "Execution",
        mitre_technique_id: "T1059.001",
        mitre_technique_name: "PowerShell",
        tags: ["powershell", "test"],
      };
      const result = CreateDetectionRuleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects CreateDetectionRuleSchema with empty name", () => {
      const input = {
        name: "",
        severity: "High",
        category: "process_execution",
        rule_type: "single_event",
        conditions: {
          field: "process_name",
          operator: "equals",
          value: "powershell.exe",
        },
      };
      const result = CreateDetectionRuleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Condition Evaluator & Field Extraction", () => {
    it("extracts direct top-level fields", () => {
      const event = createMockEvent({ event_type: "auth_failed" });
      expect(extractField(event, "event_type")).toBe("auth_failed");
    });

    it("extracts normalized_fields nested properties", () => {
      const event = createMockEvent();
      expect(extractField(event, "process_name")).toBe("powershell.exe");
      expect(extractField(event, "command_line")).toBe(
        "powershell.exe -enc SQBFAFgA"
      );
    });

    it("extracts raw_payload nested paths with dot notation", () => {
      const event = createMockEvent();
      expect(extractField(event, "raw_payload.process_id")).toBe(1044);
    });

    it("correctly evaluates comparison operators", () => {
      const event = createMockEvent();

      // equals
      expect(
        evaluateFieldCondition(
          { field: "process_name", operator: "equals", value: "powershell.exe" },
          event
        )
      ).toBe(true);
      expect(
        evaluateFieldCondition(
          { field: "process_name", operator: "equals", value: "cmd.exe" },
          event
        )
      ).toBe(false);

      // not_equals
      expect(
        evaluateFieldCondition(
          { field: "process_name", operator: "not_equals", value: "cmd.exe" },
          event
        )
      ).toBe(true);

      // contains (case-insensitive)
      expect(
        evaluateFieldCondition(
          { field: "command_line", operator: "contains", value: "-ENC" },
          event
        )
      ).toBe(true);

      // starts_with
      expect(
        evaluateFieldCondition(
          { field: "process_name", operator: "starts_with", value: "power" },
          event
        )
      ).toBe(true);

      // ends_with
      expect(
        evaluateFieldCondition(
          { field: "process_name", operator: "ends_with", value: ".exe" },
          event
        )
      ).toBe(true);

      // in set
      expect(
        evaluateFieldCondition(
          {
            field: "process_name",
            operator: "in",
            value: "cmd.exe, powershell.exe, bash",
          },
          event
        )
      ).toBe(true);

      // regex
      expect(
        evaluateFieldCondition(
          {
            field: "command_line",
            operator: "regex",
            value: "-enc|-encodedcommand",
          },
          event
        )
      ).toBe(true);
    });

    it("evaluates complex logical groups (AND / OR / NOT)", () => {
      const event = createMockEvent();

      const andGroup: LogicalConditionGroup = {
        operator: "AND",
        conditions: [
          { field: "process_name", operator: "equals", value: "powershell.exe" },
          { field: "command_line", operator: "contains", value: "-enc" },
        ],
      };
      expect(evaluateCondition(andGroup, event)).toBe(true);

      const orGroup: LogicalConditionGroup = {
        operator: "OR",
        conditions: [
          { field: "process_name", operator: "equals", value: "nonexistent.exe" },
          { field: "command_line", operator: "contains", value: "-enc" },
        ],
      };
      expect(evaluateCondition(orGroup, event)).toBe(true);

      const notGroup: LogicalConditionGroup = {
        operator: "NOT",
        conditions: [
          { field: "process_name", operator: "equals", value: "cmd.exe" },
        ],
      };
      expect(evaluateCondition(notGroup, event)).toBe(true);
    });
  });

  describe("Canonical System Baseline Rules", () => {
    it("contains exactly 7 baseline detection rules matching educational scenarios", () => {
      expect(CANONICAL_SYSTEM_DETECTION_RULES.length).toBe(7);
      const ruleIds = CANONICAL_SYSTEM_DETECTION_RULES.map((r) => r.id);
      expect(ruleIds).toContain("rule-brute-force-auth");
      expect(ruleIds).toContain("rule-powershell-encoded-exec");
      expect(ruleIds).toContain("rule-scheduled-task-persistence");
      expect(ruleIds).toContain("rule-ransomware-vssadmin-deletion");
      expect(ruleIds).toContain("rule-network-port-scan");
      expect(ruleIds).toContain("rule-usb-unauthorized-hardware");
      expect(ruleIds).toContain("rule-canary-file-modification");
    });

    it("PowerShell encoded execution rule triggers on suspicious event", () => {
      const rule = CANONICAL_SYSTEM_DETECTION_RULES.find(
        (r) => r.id === "rule-powershell-encoded-exec"
      )!;
      const event = createMockEvent({
        normalized_fields: {
          process_name: "powershell.exe",
          command_line: "powershell.exe -NonInteractive -enc SQBFAFgA",
        },
      });

      const explanation: string[] = [];
      const isMatch = evaluateCondition(rule.conditions, event, explanation);
      expect(isMatch).toBe(true);
      expect(explanation.length).toBeGreaterThan(0);
    });

    it("Ransomware shadow copy deletion rule triggers on vssadmin execution", () => {
      const rule = CANONICAL_SYSTEM_DETECTION_RULES.find(
        (r) => r.id === "rule-ransomware-vssadmin-deletion"
      )!;
      const event = createMockEvent({
        event_type: "process_spawned",
        normalized_fields: {
          process_name: "vssadmin.exe",
          command_line: "vssadmin.exe delete shadows /all /quiet",
        },
      });

      expect(evaluateCondition(rule.conditions, event)).toBe(true);
    });

    it("Unauthorized USB rule triggers on hardware connection event", () => {
      const rule = CANONICAL_SYSTEM_DETECTION_RULES.find(
        (r) => r.id === "rule-usb-unauthorized-hardware"
      )!;
      const event = createMockEvent({
        event_type: "usb_connected",
        normalized_fields: {
          device_vendor: "Generic USB Flash Disk",
        },
      });

      expect(evaluateCondition(rule.conditions, event)).toBe(true);
    });
  });

  describe("Detection Engine Execution & Attribution", () => {
    it("evaluates single_event rule deterministically", async () => {
      const event = createMockEvent();
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [event],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const rule = CANONICAL_SYSTEM_DETECTION_RULES.find(
        (r) => r.id === "rule-powershell-encoded-exec"
      )!;

      const result = await evaluateDetectionRule(rule, tenantA, {
        timeWindowMinutes: 15,
      });

      expect(result.matched).toBe(true);
      expect(result.matchedEventIds).toContain("evt-001");
      expect(result.primaryAssetId).toBe("asset-001");
      expect(result.primaryIdentityId).toBe("user-001");
      expect(result.explanation.matchedCount).toBe(1);
      expect(result.explanation.summary).toContain("Rule matched");
    });

    it("evaluates threshold rule correctly when below and above threshold", async () => {
      const bruteForceRule: DetectionRule = {
        id: "rule-threshold-test",
        name: "Threshold Test Rule",
        severity: "High",
        category: "authentication",
        rule_type: "threshold",
        is_enabled: true,
        conditions: {
          field: "event_type",
          operator: "equals",
          value: "auth_failed",
        },
        threshold_count: 3,
        evaluation_window_minutes: 15,
        is_system: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Case 1: 2 events (below threshold of 3)
      const eventsBelow = [
        createMockEvent({ id: "e1", event_type: "auth_failed" }),
        createMockEvent({ id: "e2", event_type: "auth_failed" }),
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: eventsBelow,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const resBelow = await evaluateDetectionRule(bruteForceRule, tenantA);
      expect(resBelow.matched).toBe(false);
      expect(resBelow.explanation.matchedCount).toBe(2);

      // Case 2: 3 events (meets threshold of 3)
      const eventsMet = [
        ...eventsBelow,
        createMockEvent({ id: "e3", event_type: "auth_failed" }),
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: eventsMet,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const resMet = await evaluateDetectionRule(bruteForceRule, tenantA);
      expect(resMet.matched).toBe(true);
      expect(resMet.explanation.matchedCount).toBe(3);
    });
  });

  describe("Rules Service & Multi-Tenancy", () => {
    it("merges system baseline rules with custom tenant rules", async () => {
      const customRule: DetectionRule = {
        id: "custom-rule-01",
        organization_id: tenantA,
        name: "Custom Canary Rule",
        severity: "Low",
        category: "file_integrity",
        rule_type: "single_event",
        is_enabled: true,
        conditions: { field: "event_type", operator: "equals", value: "file_read" },
        is_system: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [customRule],
              error: null,
            }),
          }),
        }),
      });

      const rules = await getDetectionRules(tenantA);
      expect(rules.length).toBe(CANONICAL_SYSTEM_DETECTION_RULES.length + 1);
      expect(rules.some((r) => r.id === "custom-rule-01")).toBe(true);
    });

    it("prevents deleting built-in system baseline rules", async () => {
      const res = await deleteDetectionRule(tenantA, "rule-brute-force-auth");
      expect(res.success).toBe(false);
      expect(res.error).toContain("System baseline rules cannot be deleted");
    });
  });
});
