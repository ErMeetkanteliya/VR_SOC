import { describe, it, expect } from "vitest";
import {
  HuntTypeSchema,
  HuntSessionStatusSchema,
  HuntEvidenceTargetTypeSchema,
  HuntQueryInputSchema,
  CreateHuntEvidenceInputSchema,
  CreateHuntNoteInputSchema,
} from "@vrsoc/validation";
import {
  executeHuntQuery,
  getHuntSessions,
  createHuntSession,
  getHuntEvidence,
  createHuntEvidence,
  deleteHuntEvidence,
  getHuntNotes,
  createHuntNote,
  deleteHuntNote,
} from "@/lib/threat-hunting/hunting-service";
import { CANONICAL_HUNT_TEMPLATES } from "@/lib/threat-hunting/catalog";
import { hasPermission } from "@/lib/rbac/permissions";
import type { HuntSession } from "@vrsoc/types";

describe("Phase 21 — Threat Hunting & Investigation Unit Tests", () => {
  describe("1. Schema & Contract Validation", () => {
    it("validates all supported HuntType values", () => {
      const validTypes = ["all", "ioc", "ip", "hash", "user", "host", "process", "registry", "dns"];
      for (const t of validTypes) {
        expect(HuntTypeSchema.parse(t)).toBe(t);
      }
      expect(() => HuntTypeSchema.parse("invalid_type")).toThrow();
    });

    it("validates HuntSessionStatus values", () => {
      const validStatuses = ["active", "completed", "saved", "archived"];
      for (const s of validStatuses) {
        expect(HuntSessionStatusSchema.parse(s)).toBe(s);
      }
      expect(() => HuntSessionStatusSchema.parse("unknown")).toThrow();
    });

    it("validates HuntEvidenceTargetType values", () => {
      const validTargets = ["event", "alert", "ioc", "process", "socket", "registry"];
      for (const t of validTargets) {
        expect(HuntEvidenceTargetTypeSchema.parse(t)).toBe(t);
      }
      expect(() => HuntEvidenceTargetTypeSchema.parse("incident")).toThrow();
    });

    it("validates HuntQueryInput and bounds limit", () => {
      const valid = HuntQueryInputSchema.parse({
        query: "185.220.101.5",
        hunt_type: "ioc",
        time_range: "24h",
      });
      expect(valid.query).toBe("185.220.101.5");
      expect(valid.hunt_type).toBe("ioc");
      expect(valid.limit).toBe(50); // Default bounded limit

      // Rejects empty query
      expect(() => HuntQueryInputSchema.parse({ query: "" })).toThrow();
      // Rejects unbounded limit (> 200)
      expect(() => HuntQueryInputSchema.parse({ query: "test", limit: 500 })).toThrow();
    });

    it("validates CreateHuntEvidenceInputSchema", () => {
      const valid = CreateHuntEvidenceInputSchema.parse({
        target_type: "ioc",
        target_id: "ioc-ip-001",
        summary: "Cobalt Strike C2 IP sighting",
        confidence: 95,
      });
      expect(valid.target_type).toBe("ioc");
      expect(valid.confidence).toBe(95);

      // Rejects missing summary
      expect(() =>
        CreateHuntEvidenceInputSchema.parse({
          target_type: "ioc",
          target_id: "ioc-ip-001",
          summary: "",
        })
      ).toThrow();
    });

    it("validates CreateHuntNoteInputSchema", () => {
      const valid = CreateHuntNoteInputSchema.parse({
        content: "Host isolation completed for WKSTN-FIN-004.",
        tags: ["Containment", "Isolation"],
      });
      expect(valid.content).toContain("Host isolation");
      expect(valid.tags).toHaveLength(2);

      // Rejects empty note content
      expect(() => CreateHuntNoteInputSchema.parse({ content: "" })).toThrow();
    });
  });

  describe("2. Query Execution & Correlation Engine", () => {
    it("executes default query and returns structured investigation output", async () => {
      const result = await executeHuntQuery({
        query: "185.220.101.5",
        hunt_type: "ioc",
        time_range: "24h",
      });

      expect(result.query).toBe("185.220.101.5");
      expect(result.hunt_type).toBe("ioc");
      expect(result.total_matches).toBeGreaterThan(0);
      expect(result.timeline).toBeDefined();
      expect(result.attack_path).toBeDefined();
      expect(result.graph).toBeDefined();
      expect(result.related_alerts.length).toBeGreaterThan(0);
      expect(result.related_iocs.length).toBeGreaterThan(0);
    });

    it("filters timeline and correlates processes for process hunt", async () => {
      const result = await executeHuntQuery({
        query: "powershell.exe",
        hunt_type: "process",
      });

      expect(result.timeline.some((t) => t.entity_value === "powershell.exe")).toBe(true);
      expect(result.matched_processes_count).toBeGreaterThan(0);
    });

    it("reconstructs chronological timeline ordering", async () => {
      const result = await executeHuntQuery({
        query: "*",
        hunt_type: "all",
      });

      expect(result.timeline.length).toBeGreaterThan(0);
      for (const item of result.timeline) {
        expect(item.occurred_at).toBeDefined();
        expect(new Date(item.occurred_at).getTime()).not.toBeNaN();
        expect(item.source_type).toBeDefined();
      }
    });

    it("builds multi-step attack path with ATT&CK causality", async () => {
      const result = await executeHuntQuery({
        query: "185.220.101.5",
        hunt_type: "ioc",
      });

      expect(result.attack_path.length).toBeGreaterThanOrEqual(3);
      const step1 = result.attack_path[0]!;
      expect(step1.step_number).toBe(1);
      expect(step1.phase).toBe("Initial Access");
      expect(step1.tactic_id).toBe("TA0001");
      expect(step1.technique_id).toBe("T1566.001");
      expect(step1.confidence).toBeGreaterThan(80);
    });

    it("constructs node-edge investigation topology graph", async () => {
      const result = await executeHuntQuery({
        query: "185.220.101.5",
        hunt_type: "ioc",
      });

      expect(result.graph.nodes.length).toBeGreaterThan(0);
      expect(result.graph.edges.length).toBeGreaterThan(0);

      // Verify node attributes
      const hostNode = result.graph.nodes.find((n) => n.type === "host");
      expect(hostNode).toBeDefined();

      // Verify edge relationships
      const edge = result.graph.edges[0]!;
      expect(edge.source).toBeDefined();
      expect(edge.target).toBeDefined();
      expect(edge.label).toBeDefined();
    });

    it("matches all canonical hypothesis templates", () => {
      expect(CANONICAL_HUNT_TEMPLATES).toHaveLength(5);
      for (const tmpl of CANONICAL_HUNT_TEMPLATES) {
        expect(tmpl.id).toMatch(/^HUNT-\d{3}$/);
        expect(tmpl.default_query).toBeTruthy();
        expect(tmpl.target_entities.length).toBeGreaterThan(0);
        expect(tmpl.mitre_techniques.length).toBeGreaterThan(0);
      }
    });
  });

  describe("3. Evidence & Analyst Notes Management", () => {
    it("creates, retrieves, and deletes hunt evidence references", async () => {
      const initialEvidence = await getHuntEvidence();
      const initialCount = initialEvidence.length;

      const created = await createHuntEvidence(
        {
          target_type: "process",
          target_id: "PID-9999",
          summary: "Suspicious cmd.exe spawning whoami.exe",
          confidence: 88,
        },
        "00000000-0000-0000-0000-000000000001",
        "Test Hunter"
      );

      expect(created.id).toBeDefined();
      expect(created.target_id).toBe("PID-9999");
      expect(created.added_by).toBe("Test Hunter");

      const afterCreate = await getHuntEvidence();
      expect(afterCreate.length).toBe(initialCount + 1);

      // Delete
      const deleted = await deleteHuntEvidence(created.id);
      expect(deleted).toBe(true);

      const afterDelete = await getHuntEvidence();
      expect(afterDelete.length).toBe(initialCount);
    });

    it("creates, retrieves, and deletes analyst notes", async () => {
      const initialNotes = await getHuntNotes();
      const initialCount = initialNotes.length;

      const created = await createHuntNote(
        {
          content: "Hypothesis confirmed: Initial delivery via weaponized spearphishing attachment.",
          tags: ["Confirmed", "InitialAccess"],
        },
        "00000000-0000-0000-0000-000000000001",
        "Lead Hunter"
      );

      expect(created.id).toBeDefined();
      expect(created.content).toContain("Hypothesis confirmed");
      expect(created.author_name).toBe("Lead Hunter");

      const afterCreate = await getHuntNotes();
      expect(afterCreate.length).toBe(initialCount + 1);

      // Delete
      const deleted = await deleteHuntNote(created.id);
      expect(deleted).toBe(true);

      const afterDelete = await getHuntNotes();
      expect(afterDelete.length).toBe(initialCount);
    });

    it("creates and retrieves saved hunt sessions", async () => {
      const session = await createHuntSession({
        title: "Active Investigation: Lateral Movement via SMB",
        query: "admin_svc",
        hunt_type: "user",
      });

      expect(session.id).toBeDefined();
      expect(session.title).toContain("Lateral Movement");

      const sessions = await getHuntSessions();
      expect(sessions.some((s: HuntSession) => s.id === session.id)).toBe(true);
    });
  });

  describe("4. RBAC Permission Checks", () => {
    it("evaluates Threat Hunter and SOC Analyst permissions", () => {
      expect(hasPermission("Threat Hunter", "threat_hunting:read")).toBe(true);
      expect(hasPermission("Threat Hunter", "threat_hunting:execute")).toBe(true);
      expect(hasPermission("Threat Hunter", "threat_hunting:save")).toBe(true);
      expect(hasPermission("Threat Hunter", "threat_hunting:evidence")).toBe(true);
      expect(hasPermission("Threat Hunter", "threat_hunting:note")).toBe(true);

      expect(hasPermission("SOC Analyst", "threat_hunting:execute")).toBe(true);
      expect(hasPermission("Super Admin", "threat_hunting:execute")).toBe(true);
      expect(hasPermission("Student", "threat_hunting:execute")).toBe(true);
      expect(hasPermission("Student", "threat_hunting:save")).toBe(false);

      expect(hasPermission("Auditor", "threat_hunting:read")).toBe(true);
      expect(hasPermission("Auditor", "threat_hunting:execute")).toBe(false);

      expect(hasPermission("Viewer", "threat_hunting:read")).toBe(false);
      expect(hasPermission("Viewer", "threat_hunting:execute")).toBe(false);
    });
  });
});
