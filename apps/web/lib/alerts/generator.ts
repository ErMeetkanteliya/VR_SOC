/**
 * Phase 16: Alert Creation & Generation Service
 *
 * Authoritatively creates structured alerts from Phase 15 DetectionExecutionResults.
 * Guarantees:
 * - Deterministic alert transformation
 * - Prevention of duplicate alerts via dedup keys
 * - Preservation of matched telemetry references, MITRE tags, and explanations
 * - Auditable alert history logging
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateAlertDedupKey } from "./dedup";
import type {
  DetectionExecutionResult,
  DetectionRule,
  Alert,
  SeverityLevel,
} from "@vrsoc/types";

function calculateRiskScore(severity: SeverityLevel): number {
  const norm = severity.toLowerCase();
  switch (norm) {
    case "critical":
      return 95;
    case "high":
      return 80;
    case "medium":
      return 50;
    case "low":
      return 25;
    case "informational":
    default:
      return 10;
  }
}

function generateAlertCode(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `ALT-${year}-${randomHex}`;
}

export async function createAlertFromDetection(
  organizationId: string,
  detectionResult: DetectionExecutionResult,
  rule?: DetectionRule
): Promise<{ success: boolean; data?: Alert; isDuplicate?: boolean; error?: string }> {
  // Reject unmatched detections
  if (!detectionResult.matched) {
    return {
      success: false,
      error: "Detection condition not met. Unmatched detection results cannot generate alerts.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const dedupKey = generateAlertDedupKey(detectionResult, 30);

  // Check for existing alert with same dedup_key in active state
  const { data: existingAlert } = await supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("dedup_key", dedupKey)
    .not("status", "in", '("Closed","False Positive","closed","false_positive")')
    .maybeSingle();

  if (existingAlert) {
    // Append any new matched event IDs
    const existingEvents: string[] = (existingAlert.matched_event_ids as string[]) || [];
    const newEvents = detectionResult.matchedEventIds || [];
    const mergedEvents = Array.from(new Set([...existingEvents, ...newEvents]));

    const { data: updated, error: updateErr } = await supabase
      .from("alerts")
      .update({
        matched_event_ids: mergedEvents,
        occurred_at: detectionResult.evaluatedAt,
        explanation: detectionResult.explanation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAlert.id)
      .eq("organization_id", organizationId)
      .select("*")
      .single();

    if (updateErr) {
      console.error("[createAlertFromDetection] Update existing alert error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    return { success: true, data: updated as Alert, isDuplicate: true };
  }

  // Create new alert
  const alertCode = generateAlertCode();
  const riskScore = calculateRiskScore(detectionResult.severity);

  const mitreTactic =
    rule?.mitre_tactic ||
    (detectionResult.metadata?.mitre_tactic as string) ||
    null;
  const mitreTechniqueId =
    rule?.mitre_technique_id ||
    (detectionResult.metadata?.mitre_technique_id as string) ||
    null;
  const mitreTechniqueName =
    rule?.mitre_technique_name ||
    (detectionResult.metadata?.mitre_technique_name as string) ||
    null;

  const alertPayload = {
    organization_id: organizationId,
    rule_id: detectionResult.ruleId,
    alert_code: alertCode,
    title: `${detectionResult.ruleName} Detected`,
    description:
      rule?.description ||
      detectionResult.explanation.summary ||
      `Threat detection triggered by rule ${detectionResult.ruleName}.`,
    severity: detectionResult.severity,
    risk_score: riskScore,
    status: "Open",
    source: "Detection Engine",
    occurred_at: detectionResult.evaluatedAt,
    asset_id: detectionResult.primaryAssetId || null,
    identity_id: detectionResult.primaryIdentityId || null,
    matched_event_ids: detectionResult.matchedEventIds || [],
    mitre_tactic: mitreTactic,
    mitre_technique_id: mitreTechniqueId,
    mitre_technique_name: mitreTechniqueName,
    explanation: detectionResult.explanation,
    dedup_key: dedupKey,
    metadata: {
      evaluated_at: detectionResult.evaluatedAt,
      evaluation_window: detectionResult.evaluationWindow,
      rule_metadata: detectionResult.metadata || {},
    },
  };

  const { data: newAlert, error: insertErr } = await supabase
    .from("alerts")
    .insert(alertPayload)
    .select("*")
    .single();

  if (insertErr || !newAlert) {
    console.error("[createAlertFromDetection] Insert error:", insertErr);
    return { success: false, error: insertErr?.message || "Failed to create alert record." };
  }

  // Log creation in alert_history
  await supabase.from("alert_history").insert({
    organization_id: organizationId,
    alert_id: newAlert.id,
    action: "created",
    previous_status: null,
    new_status: "Open",
    note: `Alert automatically generated by Detection Engine (${detectionResult.ruleName}).`,
    metadata: {
      rule_id: detectionResult.ruleId,
      matched_count: detectionResult.explanation.matchedCount,
    },
  });

  return { success: true, data: newAlert as Alert, isDuplicate: false };
}
