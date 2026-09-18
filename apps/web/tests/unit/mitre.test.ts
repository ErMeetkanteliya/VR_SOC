import { describe, it, expect } from "vitest";
import {
  MitreTacticSchema,
  MitreTechniqueSchema,
  MitreTechniqueFilterSchema,
} from "@vrsoc/validation";
import {
  getMitreTactics,
  getMitreTechniques,
  getMitreTechniqueById,
  getMitreCoverage,
  resolveMitreMetadata,
} from "@/lib/mitre/mitre-service";
import { CANONICAL_MITRE_TECHNIQUES } from "@/lib/mitre/catalog";

describe("Phase 19: MITRE ATT&CK Intelligence Layer", () => {
  describe("1. Schema & Contract Validation", () => {
    it("validates canonical tactic structure", () => {
      const sampleTactic = {
        id: "tac-initial-access",
        external_id: "TA0001",
        name: "Initial Access",
        description: "The adversary is trying to get into your network.",
        order_index: 3,
        technique_count: 5,
      };

      const parsed = MitreTacticSchema.parse(sampleTactic);
      expect(parsed.external_id).toBe("TA0001");
      expect(parsed.order_index).toBe(3);
    });

    it("validates canonical technique structure with mitigations and examples", () => {
      const sampleTechnique = {
        id: "tech-t1059-001",
        external_id: "T1059.001",
        name: "PowerShell",
        description: "Adversaries may abuse PowerShell for execution.",
        tactic_external_id: "TA0002",
        tactic_name: "Execution",
        is_subtechnique: true,
        parent_technique_id: "T1059",
        platforms: ["Windows"],
        data_sources: ["Process Creation"],
        detection_guidance: "Monitor for -enc flags",
        examples: [
          {
            source_or_actor: "Wizard Spider",
            description: "Executed PowerShell download cradles.",
          },
        ],
        mitigations: [
          {
            external_id: "M1054",
            name: "Software Configuration",
            description: "Enable Script Block Logging.",
          },
        ],
      };

      const parsed = MitreTechniqueSchema.parse(sampleTechnique);
      expect(parsed.external_id).toBe("T1059.001");
      expect(parsed.is_subtechnique).toBe(true);
      expect(parsed.parent_technique_id).toBe("T1059");
      expect(parsed.examples).toHaveLength(1);
      expect(parsed.mitigations).toHaveLength(1);
    });

    it("validates technique filter parameters with default pagination", () => {
      const filter = {
        tactic_id: "TA0002",
        search: "powershell",
        coverage_status: "covered" as const,
      };

      const parsed = MitreTechniqueFilterSchema.parse(filter);
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(50);
      expect(parsed.coverage_status).toBe("covered");
    });
  });

  describe("2. Tactics Catalog & Ordering", () => {
    it("returns all 14 enterprise tactics in canonical progression order", async () => {
      const tactics = await getMitreTactics();
      expect(tactics).toHaveLength(14);
      expect(tactics[0]?.external_id).toBe("TA0043"); // Reconnaissance
      expect(tactics[tactics.length - 1]?.external_id).toBe("TA0040"); // Impact

      // Verify each tactic has technique counts populated
      for (const tac of tactics) {
        expect(tac.technique_count).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("3. Technique Lookups & Sub-technique Relationships", () => {
    it("retrieves a parent technique with its child sub-techniques", async () => {
      const detail = await getMitreTechniqueById("T1059");
      expect(detail).not.toBeNull();
      expect(detail?.external_id).toBe("T1059");
      expect(detail?.name).toBe("Command and Scripting Interpreter");
      expect(detail?.is_subtechnique).toBe(false);
      expect(detail?.sub_techniques.length).toBeGreaterThanOrEqual(2);

      const subIds = detail?.sub_techniques.map((s) => s.external_id);
      expect(subIds).toContain("T1059.001"); // PowerShell
      expect(subIds).toContain("T1059.003"); // Windows Command Shell
    });

    it("retrieves a sub-technique by external ID and links to parent", async () => {
      const detail = await getMitreTechniqueById("T1059.001");
      expect(detail).not.toBeNull();
      expect(detail?.external_id).toBe("T1059.001");
      expect(detail?.name).toBe("PowerShell");
      expect(detail?.is_subtechnique).toBe(true);
      expect(detail?.parent_technique_id).toBe("T1059");
    });

    it("returns null for non-existent technique IDs", async () => {
      const detail = await getMitreTechniqueById("T9999.999");
      expect(detail).toBeNull();
    });
  });

  describe("4. Detection Rule Mapping & Coverage Resolution", () => {
    it("maps Phase 15 baseline rules to canonical MITRE technique entities", async () => {
      // T1059.001 is mapped to rule-powershell-encoded-exec
      const psDetail = await getMitreTechniqueById("T1059.001");
      expect(psDetail?.coverage_status).toBe("covered");
      expect(psDetail?.mapped_detection_rules.length).toBeGreaterThanOrEqual(1);
      expect(psDetail?.mapped_detection_rules.some((r) => r.id === "rule-powershell-encoded-exec")).toBe(true);

      // T1110.001 is mapped to rule-brute-force-auth
      const bfDetail = await getMitreTechniqueById("T1110.001");
      expect(bfDetail?.coverage_status).toBe("covered");
      expect(bfDetail?.mapped_detection_rules.some((r) => r.id === "rule-brute-force-auth")).toBe(true);

      // T1490 is mapped to rule-ransomware-vssadmin-deletion
      const vssDetail = await getMitreTechniqueById("T1490");
      expect(vssDetail?.coverage_status).toBe("covered");
      expect(vssDetail?.mapped_detection_rules.some((r) => r.id === "rule-ransomware-vssadmin-deletion")).toBe(true);
    });

    it("calculates deterministic, mathematical coverage metrics", async () => {
      const stats = await getMitreCoverage();
      expect(stats.total_techniques).toBeGreaterThan(0);
      expect(stats.covered_techniques).toBeGreaterThan(0);
      expect(stats.uncovered_techniques).toBe(stats.total_techniques - stats.covered_techniques);
      expect(stats.coverage_percentage).toBe(
        Math.round((stats.covered_techniques / stats.total_techniques) * 100)
      );
      expect(stats.total_rules_mapped).toBeGreaterThanOrEqual(7);

      // Verify tactic breakdown completeness
      expect(Object.keys(stats.tactic_breakdown)).toHaveLength(14);
      expect(stats.tactic_breakdown["TA0002"]?.covered_techniques).toBeGreaterThanOrEqual(1); // Execution
      expect(stats.tactic_breakdown["TA0040"]?.covered_techniques).toBeGreaterThanOrEqual(1); // Impact
    });
  });

  describe("5. Search & Filtering Engine", () => {
    it("filters techniques by tactic", async () => {
      const execResult = await getMitreTechniques({ tactic_id: "TA0002" });
      expect(execResult.techniques.length).toBeGreaterThan(0);
      for (const t of execResult.techniques) {
        expect(t.tactic_external_id).toBe("TA0002");
      }
    });

    it("searches techniques by keywords across ID, Name, Description, and Data Sources", async () => {
      const searchResult = await getMitreTechniques({ search: "powershell" });
      expect(searchResult.total).toBeGreaterThanOrEqual(1);
      expect(searchResult.techniques.some((t) => t.external_id === "T1059.001")).toBe(true);
    });

    it("filters by coverage status (covered only vs gaps only)", async () => {
      const coveredResult = await getMitreTechniques({ coverage_status: "covered" });
      const uncoveredResult = await getMitreTechniques({ coverage_status: "uncovered" });

      expect(coveredResult.total).toBeGreaterThan(0);
      expect(uncoveredResult.total).toBeGreaterThan(0);
      expect(coveredResult.total + uncoveredResult.total).toBe(CANONICAL_MITRE_TECHNIQUES.length);
    });

    it("filters by platform compatibility", async () => {
      const windowsResult = await getMitreTechniques({ platform: "Windows" });
      expect(windowsResult.techniques.length).toBeGreaterThan(0);
      for (const t of windowsResult.techniques) {
        expect(t.platforms).toContain("Windows");
      }
    });

    it("handles pagination cleanly", async () => {
      const page1 = await getMitreTechniques({ page: 1, pageSize: 5 });
      const page2 = await getMitreTechniques({ page: 2, pageSize: 5 });

      expect(page1.techniques).toHaveLength(5);
      expect(page2.techniques).toHaveLength(5);
      expect(page1.techniques[0]?.id).not.toBe(page2.techniques[0]?.id);
      expect(page1.totalPages).toBe(Math.ceil(page1.total / 5));
    });
  });

  describe("6. Cross-Platform Metadata Resolver Helper", () => {
    it("resolves external technique ID to shared metadata object", () => {
      const meta = resolveMitreMetadata("T1059.001");
      expect(meta).not.toBeNull();
      expect(meta?.techniqueId).toBe("T1059.001");
      expect(meta?.name).toBe("PowerShell");
      expect(meta?.tactic).toBe("Execution");

      const nullMeta = resolveMitreMetadata(null);
      expect(nullMeta).toBeNull();
    });
  });
});
