/**
 * Phase 15: Detection Rules Service
 *
 * Provides database operations for tenant-scoped detection rules with:
 * - Deterministic CRUD operations
 * - Separation between tenant-owned custom rules and built-in system rules
 * - Organization isolation and RLS safety
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "./system-rules";
import type {
  DetectionRule,
  CreateDetectionRuleInput,
  UpdateDetectionRuleInput,
} from "@vrsoc/types";

export interface DetectionRuleFilter {
  category?: string;
  severity?: string;
  isEnabled?: boolean;
  query?: string;
}

/**
 * Retrieves all detection rules applicable to an organization.
 * Merges built-in system detection rules with tenant-specific custom rules.
 */
export async function getDetectionRules(
  organizationId: string,
  filter?: DetectionRuleFilter
): Promise<DetectionRule[]> {
  const supabase = await createServerSupabaseClient();

  let dbQuery = supabase
    .from("detection_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filter?.category) {
    dbQuery = dbQuery.eq("category", filter.category);
  }
  if (filter?.severity) {
    dbQuery = dbQuery.eq("severity", filter.severity);
  }
  if (filter?.isEnabled !== undefined) {
    dbQuery = dbQuery.eq("is_enabled", filter.isEnabled);
  }

  const { data: tenantRules, error } = await dbQuery;

  if (error) {
    console.error("[getDetectionRules] Database query error:", error);
    throw new Error(`Failed to load detection rules: ${error.message}`);
  }

  // Filter canonical system rules if matching filters
  let filteredSystemRules = CANONICAL_SYSTEM_DETECTION_RULES;
  if (filter?.category) {
    filteredSystemRules = filteredSystemRules.filter(
      (r) => r.category === filter.category
    );
  }
  if (filter?.severity) {
    filteredSystemRules = filteredSystemRules.filter(
      (r) => r.severity === filter.severity
    );
  }
  if (filter?.isEnabled !== undefined) {
    filteredSystemRules = filteredSystemRules.filter(
      (r) => r.is_enabled === filter.isEnabled
    );
  }

  const allRules: DetectionRule[] = [
    ...filteredSystemRules,
    ...((tenantRules as DetectionRule[]) || []),
  ];

  // Optional textual search
  if (filter?.query && filter.query.trim().length > 0) {
    const q = filter.query.toLowerCase().trim();
    return allRules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.mitre_technique_id && r.mitre_technique_id.toLowerCase().includes(q)) ||
        (r.mitre_technique_name && r.mitre_technique_name.toLowerCase().includes(q))
    );
  }

  return allRules;
}

/**
 * Retrieves a single detection rule by ID (either system or tenant-owned).
 */
export async function getDetectionRuleById(
  organizationId: string,
  ruleId: string
): Promise<DetectionRule | null> {
  // Check system rules first
  const systemRule = CANONICAL_SYSTEM_DETECTION_RULES.find((r) => r.id === ruleId);
  if (systemRule) {
    return systemRule;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("detection_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("[getDetectionRuleById] Error fetching rule:", error);
    return null;
  }

  return (data as DetectionRule) || null;
}

/**
 * Creates a new custom detection rule in the tenant's workspace.
 */
export async function createDetectionRule(
  organizationId: string,
  userId: string | null,
  input: CreateDetectionRuleInput
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const record = {
    organization_id: organizationId,
    name: input.name,
    description: input.description || null,
    severity: input.severity,
    category: input.category,
    rule_type: input.rule_type,
    is_enabled: input.is_enabled ?? true,
    conditions: input.conditions,
    threshold_count: input.threshold_count || 1,
    evaluation_window_minutes: input.evaluation_window_minutes || 15,
    mitre_tactic: input.mitre_tactic || null,
    mitre_technique_id: input.mitre_technique_id || null,
    mitre_technique_name: input.mitre_technique_name || null,
    tags: input.tags || [],
    is_system: false,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("detection_rules")
    .insert(record)
    .select("*")
    .single();

  if (error) {
    console.error("[createDetectionRule] Insert error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DetectionRule };
}

/**
 * Updates an existing tenant-owned detection rule.
 */
export async function updateDetectionRule(
  organizationId: string,
  input: UpdateDetectionRuleInput
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  // Disallow modifying system rules directly
  if (CANONICAL_SYSTEM_DETECTION_RULES.some((r) => r.id === input.id)) {
    return {
      success: false,
      error: "System baseline rules cannot be modified directly.",
    };
  }

  const supabase = await createServerSupabaseClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.severity !== undefined) updatePayload.severity = input.severity;
  if (input.category !== undefined) updatePayload.category = input.category;
  if (input.rule_type !== undefined) updatePayload.rule_type = input.rule_type;
  if (input.is_enabled !== undefined) updatePayload.is_enabled = input.is_enabled;
  if (input.conditions !== undefined) updatePayload.conditions = input.conditions;
  if (input.threshold_count !== undefined) updatePayload.threshold_count = input.threshold_count;
  if (input.evaluation_window_minutes !== undefined)
    updatePayload.evaluation_window_minutes = input.evaluation_window_minutes;
  if (input.mitre_tactic !== undefined) updatePayload.mitre_tactic = input.mitre_tactic;
  if (input.mitre_technique_id !== undefined)
    updatePayload.mitre_technique_id = input.mitre_technique_id;
  if (input.mitre_technique_name !== undefined)
    updatePayload.mitre_technique_name = input.mitre_technique_name;
  if (input.tags !== undefined) updatePayload.tags = input.tags;

  const { data, error } = await supabase
    .from("detection_rules")
    .update(updatePayload)
    .eq("id", input.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    console.error("[updateDetectionRule] Update error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DetectionRule };
}

/**
 * Deletes a tenant-owned detection rule.
 */
export async function deleteDetectionRule(
  organizationId: string,
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  // Protect system rules
  if (CANONICAL_SYSTEM_DETECTION_RULES.some((r) => r.id === ruleId)) {
    return { success: false, error: "System baseline rules cannot be deleted." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("detection_rules")
    .delete()
    .eq("id", ruleId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[deleteDetectionRule] Delete error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Toggles a detection rule's enabled state.
 */
export async function toggleDetectionRule(
  organizationId: string,
  ruleId: string,
  isEnabled: boolean
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  const systemRule = CANONICAL_SYSTEM_DETECTION_RULES.find((r) => r.id === ruleId);
  if (systemRule) {
    // In-memory toggle representation for system rules
    systemRule.is_enabled = isEnabled;
    return { success: true, data: systemRule };
  }

  return updateDetectionRule(organizationId, { id: ruleId, is_enabled: isEnabled });
}
