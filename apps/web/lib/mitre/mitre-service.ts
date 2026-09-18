/**
 * Phase 19: MITRE ATT&CK Intelligence & Entity Layer Service
 *
 * Core service providing authoritative MITRE entity lookups, search, filtering,
 * detection rule mapping resolution, and deterministic coverage calculations.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "@/lib/detections/system-rules";
import {
  CANONICAL_MITRE_TACTICS,
  CANONICAL_MITRE_TECHNIQUES,
} from "./catalog";
import type {
  MitreTactic,
  MitreTechnique,
  MitreTechniqueDetail,
  MitreCoverageStats,
  MitreTacticCoverage,
  MitreTechniqueFilter,
  DetectionRule,
} from "@vrsoc/types";

/**
 * Retrieve all 14 MITRE ATT&CK Tactics sorted by canonical progression order.
 */
export async function getMitreTactics(): Promise<MitreTactic[]> {
  return CANONICAL_MITRE_TACTICS.map((tac) => {
    const techCount = CANONICAL_MITRE_TECHNIQUES.filter(
      (t) => t.tactic_external_id === tac.external_id && !t.is_subtechnique
    ).length;
    return {
      ...tac,
      technique_count: techCount,
    };
  });
}

/**
 * Helper to fetch all active detection rules for a tenant (including system baseline rules).
 */
export async function getActiveDetectionRules(organizationId?: string): Promise<DetectionRule[]> {
  const activeRules: DetectionRule[] = [...CANONICAL_SYSTEM_DETECTION_RULES.filter((r) => r.is_enabled)];

  if (organizationId) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("detection_rules")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_enabled", true);

      if (!error && data && data.length > 0) {
        // Merge without duplicating system rules
        for (const customRule of data as DetectionRule[]) {
          if (!activeRules.some((r) => r.id === customRule.id)) {
            activeRules.push(customRule);
          }
        }
      }
    } catch {
      // Return system baseline rules if database query fails or offline
    }
  }

  return activeRules;
}

/**
 * Deterministic MITRE ATT&CK coverage calculation.
 * Coverage is defined as having at least one active, enabled detection rule
 * mapped to the technique ID or one of its child sub-techniques.
 */
export async function getMitreCoverage(organizationId?: string): Promise<MitreCoverageStats> {
  const rules = await getActiveDetectionRules(organizationId);
  const coveredTechniqueIds = new Set<string>();
  let totalRulesMapped = 0;

  for (const rule of rules) {
    if (rule.mitre_technique_id) {
      coveredTechniqueIds.add(rule.mitre_technique_id.trim().toUpperCase());
      totalRulesMapped++;
    }
  }

  const parentTechniques = CANONICAL_MITRE_TECHNIQUES.filter((t) => !t.is_subtechnique);
  const subTechniques = CANONICAL_MITRE_TECHNIQUES.filter((t) => t.is_subtechnique);

  // Check sub-technique coverage
  let coveredSubCount = 0;
  for (const sub of subTechniques) {
    const subExtId = sub.external_id.trim().toUpperCase();
    if (coveredTechniqueIds.has(subExtId)) {
      coveredSubCount++;
      // If a sub-technique is covered, mark parent technique as covered as well
      if (sub.parent_technique_id) {
        coveredTechniqueIds.add(sub.parent_technique_id.trim().toUpperCase());
      }
    }
  }

  // Tactic breakdown
  const tacticBreakdown: Record<string, MitreTacticCoverage> = {};

  for (const tactic of CANONICAL_MITRE_TACTICS) {
    const tacticTechs = parentTechniques.filter((t) => t.tactic_external_id === tactic.external_id);
    let tacticCoveredCount = 0;
    let tacticMappedRules = 0;

    for (const tech of tacticTechs) {
      const techExtId = tech.external_id.trim().toUpperCase();
      const isCovered =
        coveredTechniqueIds.has(techExtId) ||
        subTechniques.some(
          (s) => s.parent_technique_id?.toUpperCase() === techExtId && coveredTechniqueIds.has(s.external_id.toUpperCase())
        );

      if (isCovered) {
        tacticCoveredCount++;
      }

      tacticMappedRules += rules.filter(
        (r) =>
          r.mitre_technique_id?.trim().toUpperCase() === techExtId ||
          subTechniques.some(
            (s) =>
              s.parent_technique_id?.toUpperCase() === techExtId &&
              r.mitre_technique_id?.trim().toUpperCase() === s.external_id.toUpperCase()
          )
      ).length;
    }

    const tacticPct = tacticTechs.length > 0 ? Math.round((tacticCoveredCount / tacticTechs.length) * 100) : 0;

    tacticBreakdown[tactic.external_id] = {
      tactic_id: tactic.external_id,
      tactic_name: tactic.name,
      total_techniques: tacticTechs.length,
      covered_techniques: tacticCoveredCount,
      coverage_percentage: tacticPct,
      mapped_rules_count: tacticMappedRules,
    };
  }

  // Calculate overall parent technique coverage
  let coveredParentCount = 0;
  for (const parent of parentTechniques) {
    const pId = parent.external_id.trim().toUpperCase();
    const isCovered =
      coveredTechniqueIds.has(pId) ||
      subTechniques.some(
        (s) => s.parent_technique_id?.toUpperCase() === pId && coveredTechniqueIds.has(s.external_id.toUpperCase())
      );
    if (isCovered) {
      coveredParentCount++;
    }
  }

  const overallCoveragePct =
    parentTechniques.length > 0 ? Math.round((coveredParentCount / parentTechniques.length) * 100) : 0;

  const subCoveragePct =
    subTechniques.length > 0 ? Math.round((coveredSubCount / subTechniques.length) * 100) : 0;

  return {
    total_techniques: parentTechniques.length,
    covered_techniques: coveredParentCount,
    uncovered_techniques: parentTechniques.length - coveredParentCount,
    coverage_percentage: overallCoveragePct,
    total_rules_mapped: totalRulesMapped,
    tactic_breakdown: tacticBreakdown,
    subtechnique_coverage: {
      total: subTechniques.length,
      covered: coveredSubCount,
      percentage: subCoveragePct,
    },
  };
}

/**
 * Retrieve paginated and filtered MITRE techniques & sub-techniques.
 */
export async function getMitreTechniques(
  filters: MitreTechniqueFilter = {},
  organizationId?: string
): Promise<{
  techniques: MitreTechnique[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const rules = await getActiveDetectionRules(organizationId);
  const coveredIds = new Set(rules.map((r) => r.mitre_technique_id?.trim().toUpperCase()).filter(Boolean));

  let results = [...CANONICAL_MITRE_TECHNIQUES];

  // 1. Filter by Tactic
  if (filters.tactic_id && filters.tactic_id !== "ALL") {
    results = results.filter(
      (t) =>
        t.tactic_external_id.toUpperCase() === filters.tactic_id?.toUpperCase() ||
        t.tactic_name.toLowerCase() === filters.tactic_id?.toLowerCase()
    );
  }

  // 2. Filter by is_subtechnique
  if (filters.is_subtechnique !== undefined) {
    results = results.filter((t) => t.is_subtechnique === filters.is_subtechnique);
  }

  // 3. Filter by Platform
  if (filters.platform && filters.platform !== "ALL") {
    results = results.filter((t) =>
      t.platforms.some((p) => p.toLowerCase() === filters.platform?.toLowerCase())
    );
  }

  // 4. Filter by Search Query
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      (t) =>
        t.external_id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tactic_name.toLowerCase().includes(q) ||
        t.data_sources.some((ds) => ds.toLowerCase().includes(q))
    );
  }

  // 5. Filter by Coverage Status
  if (filters.coverage_status && filters.coverage_status !== "all") {
    if (filters.coverage_status === "covered") {
      results = results.filter((t) => {
        const extId = t.external_id.trim().toUpperCase();
        return (
          coveredIds.has(extId) ||
          CANONICAL_MITRE_TECHNIQUES.some(
            (sub) => sub.parent_technique_id?.toUpperCase() === extId && coveredIds.has(sub.external_id.toUpperCase())
          )
        );
      });
    } else if (filters.coverage_status === "uncovered") {
      results = results.filter((t) => {
        const extId = t.external_id.trim().toUpperCase();
        const isCovered =
          coveredIds.has(extId) ||
          CANONICAL_MITRE_TECHNIQUES.some(
            (sub) => sub.parent_technique_id?.toUpperCase() === extId && coveredIds.has(sub.external_id.toUpperCase())
          );
        return !isCovered;
      });
    }
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50;
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedResults = results.slice(startIndex, startIndex + pageSize);

  return {
    techniques: paginatedResults,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieve comprehensive detail for a single MITRE Technique by ID or External ID (e.g. 'T1059' or 'T1059.001').
 */
export async function getMitreTechniqueById(
  idOrExternalId: string,
  organizationId?: string
): Promise<MitreTechniqueDetail | null> {
  const normId = idOrExternalId.trim().toUpperCase();
  const base = CANONICAL_MITRE_TECHNIQUES.find(
    (t) => t.id === idOrExternalId || t.external_id.toUpperCase() === normId
  );

  if (!base) return null;

  const extId = base.external_id.toUpperCase();

  // Find sub-techniques if parent
  const subTechniques = CANONICAL_MITRE_TECHNIQUES.filter(
    (t) => t.is_subtechnique && t.parent_technique_id?.toUpperCase() === extId
  );

  // Find mapped detection rules
  const allRules = await getActiveDetectionRules(organizationId);
  const mappedRules = allRules.filter(
    (r) =>
      r.mitre_technique_id?.trim().toUpperCase() === extId ||
      subTechniques.some((sub) => sub.external_id.toUpperCase() === r.mitre_technique_id?.trim().toUpperCase())
  );

  const isCovered = mappedRules.length > 0;

  return {
    ...base,
    sub_techniques: subTechniques,
    mapped_detection_rules: mappedRules,
    coverage_status: isCovered ? "covered" : "uncovered",
    mapped_rules_count: mappedRules.length,
  };
}

/**
 * Lookup helper to enrich any object containing mitre_technique_id with shared name and tactic.
 */
export function resolveMitreMetadata(techniqueId?: string | null): {
  techniqueId: string;
  name: string;
  tactic: string;
  description: string;
} | null {
  if (!techniqueId) return null;
  const norm = techniqueId.trim().toUpperCase();
  const tech = CANONICAL_MITRE_TECHNIQUES.find((t) => t.external_id.toUpperCase() === norm);
  if (!tech) return null;
  return {
    techniqueId: tech.external_id,
    name: tech.name,
    tactic: tech.tactic_name,
    description: tech.description,
  };
}
