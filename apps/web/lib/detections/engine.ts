/**
 * Phase 15: Detection & Correlation Rules — Core Detection Engine
 *
 * Provides authoritative server-side rule evaluation against canonical
 * telemetry events stored in PostgreSQL (public.events).
 *
 * Implements:
 * - Deterministic condition evaluation
 * - Support for single_event, threshold, and correlation rule types
 * - Structured match explanations with matched event attribution
 * - Multi-tenant isolation via organization_id
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateCondition } from "./evaluator";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "./system-rules";
import type {
  DetectionRule,
  DetectionExecutionResult,
  TelemetryEvent,
} from "@vrsoc/types";

/**
 * Evaluates a single detection rule against canonical telemetry in PostgreSQL.
 */
export async function evaluateDetectionRule(
  rule: DetectionRule,
  organizationId: string,
  options?: { timeWindowMinutes?: number }
): Promise<DetectionExecutionResult> {
  const evaluatedAt = new Date().toISOString();
  const windowMinutes = options?.timeWindowMinutes || rule.evaluation_window_minutes || 15;
  const windowMs = windowMinutes * 60 * 1000;
  const startISO = new Date(Date.now() - windowMs).toISOString();
  const endISO = evaluatedAt;

  const supabase = await createServerSupabaseClient();

  // Retrieve candidate events within the evaluation window
  const { data: eventsData, error } = await supabase
    .from("events")
    .select(
      `
      id,
      organization_id,
      occurred_at,
      source,
      source_type,
      category,
      event_type,
      severity,
      asset_id,
      agent_id,
      identity_id,
      raw_payload,
      normalized_fields,
      tags,
      pipeline_status,
      ingestion_id,
      source_host,
      created_at,
      asset:assets(id, hostname, asset_type),
      identity:soc_identities(id, username)
    `
    )
    .eq("organization_id", organizationId)
    .gte("occurred_at", startISO)
    .lte("occurred_at", endISO)
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (error || !eventsData) {
    console.error("[evaluateDetectionRule] Error fetching events:", error);
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      matched: false,
      evaluatedAt,
      evaluationWindow: { start: startISO, end: endISO },
      matchedEventIds: [],
      matchedEvents: [],
      explanation: {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: false,
        summary: `Query failed: ${error?.message || "No telemetry records found"}`,
        details: [],
        evaluatedCount: 0,
        matchedCount: 0,
      },
    };
  }

  const candidateEvents = eventsData as unknown as TelemetryEvent[];
  const matchedEvents: TelemetryEvent[] = [];
  const explanationDetails: string[] = [];

  // Evaluate conditions on each event
  for (const event of candidateEvents) {
    const stepExplanations: string[] = [];
    const isMatch = evaluateCondition(rule.conditions, event, stepExplanations);

    if (isMatch) {
      matchedEvents.push(event);
      if (stepExplanations.length > 0) {
        explanationDetails.push(
          `Event [${event.event_type} @ ${event.occurred_at.substring(11, 19)}]: ${stepExplanations.join(" AND ")}`
        );
      }
    }
  }

  // Determine rule match based on rule type & threshold
  let matched = false;
  let summary = "";

  if (rule.rule_type === "single_event") {
    matched = matchedEvents.length >= 1;
    summary = matched
      ? `Rule matched! Found ${matchedEvents.length} event(s) meeting signature criteria.`
      : `No matching events detected in the last ${windowMinutes} minutes.`;
  } else if (rule.rule_type === "threshold") {
    const required = rule.threshold_count || 1;
    matched = matchedEvents.length >= required;
    summary = matched
      ? `Threshold exceeded! Detected ${matchedEvents.length} matching events (required threshold: >= ${required}) within ${windowMinutes}m.`
      : `Threshold not met: Found ${matchedEvents.length} matching events (requires >= ${required}) in last ${windowMinutes}m.`;
  } else if (rule.rule_type === "correlation") {
    // Group by asset or identity
    const assetClusters = new Map<string, TelemetryEvent[]>();
    for (const ev of matchedEvents) {
      const key = ev.asset_id || "global";
      const list = assetClusters.get(key) || [];
      list.push(ev);
      assetClusters.set(key, list);
    }

    const required = rule.threshold_count || 2;
    const maxClusterSize = Math.max(
      0,
      ...Array.from(assetClusters.values()).map((v) => v.length)
    );
    matched = maxClusterSize >= required;
    summary = matched
      ? `Correlation threshold reached: Host cluster generated ${maxClusterSize} correlated events (>= ${required}) within ${windowMinutes}m.`
      : `Correlation criteria not met (max host cluster: ${maxClusterSize}, requires >= ${required}).`;
  } else if (rule.rule_type === "sequence") {
    matched = matchedEvents.length >= (rule.threshold_count || 2);
    summary = matched
      ? `Sequence matched! Identified ${matchedEvents.length} sequential operations.`
      : `Sequence criteria not met.`;
  }

  const primaryAssetId = matchedEvents[0]?.asset_id || null;
  const primaryIdentityId = matchedEvents[0]?.identity_id || null;

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    severity: rule.severity,
    matched,
    evaluatedAt,
    evaluationWindow: { start: startISO, end: endISO },
    matchedEventIds: matchedEvents.map((e) => e.id),
    matchedEvents,
    primaryAssetId,
    primaryIdentityId,
    explanation: {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      summary,
      details: explanationDetails.slice(0, 10),
      evaluatedCount: candidateEvents.length,
      matchedCount: matchedEvents.length,
    },
    metadata: {
      mitre_tactic: rule.mitre_tactic,
      mitre_technique_id: rule.mitre_technique_id,
      mitre_technique_name: rule.mitre_technique_name,
    },
  };
}

/**
 * Evaluates all active detection rules for an organization.
 */
export async function evaluateAllActiveDetectionRules(
  organizationId: string,
  options?: { timeWindowMinutes?: number; category?: string }
): Promise<DetectionExecutionResult[]> {
  const supabase = await createServerSupabaseClient();

  // Load custom tenant rules from DB
  let query = supabase
    .from("detection_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_enabled", true);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data: tenantRules } = await query;

  // Combine system rules and tenant rules
  const allRules: DetectionRule[] = [
    ...CANONICAL_SYSTEM_DETECTION_RULES.filter((r) => r.is_enabled),
    ...((tenantRules as DetectionRule[]) || []),
  ];

  if (options?.category) {
    const filtered = allRules.filter((r) => r.category === options.category);
    return Promise.all(
      filtered.map((r) => evaluateDetectionRule(r, organizationId, options))
    );
  }

  return Promise.all(
    allRules.map((r) => evaluateDetectionRule(r, organizationId, options))
  );
}
