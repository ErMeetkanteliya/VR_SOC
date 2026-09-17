/**
 * Phase 16: Alert Triage & Management Service
 *
 * Provides database operations for tenant-scoped alert queue filtering,
 * status transitions, analyst assignment, note taking, and historical auditing.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Alert,
  AlertHistory,
  AlertFilterParams,
  AlertStatus,
  TelemetryEvent,
} from "@vrsoc/types";

export interface AlertQueryResult {
  items: Alert[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AlertDetailPackage {
  alert: Alert;
  matchedEvents: TelemetryEvent[];
  history: AlertHistory[];
}

export interface AlertKpiStats {
  totalAlerts: number;
  openCount: number;
  criticalCount: number;
  acknowledgedCount: number;
  inProgressCount: number;
  closedCount: number;
}

/**
 * Lists and filters alerts for an organization.
 */
export async function getAlerts(
  organizationId: string,
  params: AlertFilterParams = {}
): Promise<AlertQueryResult> {
  const supabase = await createServerSupabaseClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let query = supabase
    .from("alerts")
    .select(
      `
      *,
      asset:assets(id, hostname, asset_type),
      identity:soc_identities(id, username)
    `,
      { count: "exact" }
    )
    .eq("organization_id", organizationId);

  // Status Filter
  if (params.status && params.status !== "ALL") {
    query = query.ilike("status", params.status);
  }

  // Severity Filter
  if (params.severity && params.severity !== "ALL") {
    query = query.ilike("severity", params.severity);
  }

  // Rule ID Filter
  if (params.ruleId) {
    query = query.eq("rule_id", params.ruleId);
  }

  // Asset ID Filter
  if (params.assetId) {
    query = query.eq("asset_id", params.assetId);
  }

  // Identity ID Filter
  if (params.identityId) {
    query = query.eq("identity_id", params.identityId);
  }

  // MITRE Technique Filter
  if (params.mitreTechniqueId) {
    query = query.eq("mitre_technique_id", params.mitreTechniqueId);
  }

  // Time Range Filter
  if (params.timeRange && params.timeRange !== "all") {
    const now = Date.now();
    let msOffset = 24 * 60 * 60 * 1000;
    if (params.timeRange === "1h") msOffset = 60 * 60 * 1000;
    else if (params.timeRange === "6h") msOffset = 6 * 60 * 60 * 1000;
    else if (params.timeRange === "24h") msOffset = 24 * 60 * 60 * 1000;
    else if (params.timeRange === "7d") msOffset = 7 * 24 * 60 * 60 * 1000;
    else if (params.timeRange === "30d") msOffset = 30 * 24 * 60 * 60 * 1000;

    const startISO = new Date(now - msOffset).toISOString();
    query = query.gte("occurred_at", startISO);
  }

  // Search Query
  if (params.query && params.query.trim()) {
    const q = params.query.trim();
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,alert_code.ilike.%${q}%,mitre_technique_id.ilike.%${q}%`
    );
  }

  // Sorting & Pagination
  const sortBy = params.sortBy || "occurred_at";
  const ascending = params.sortDirection === "asc";
  query = query.order(sortBy, { ascending }).range(fromIndex, toIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getAlerts] Query error:", error);
    throw new Error(`Failed to query alerts: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    items: (data as Alert[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves deep inspection details for a single alert, including matched events and history.
 */
export async function getAlertById(
  organizationId: string,
  alertId: string
): Promise<AlertDetailPackage | null> {
  const supabase = await createServerSupabaseClient();

  const { data: alert, error } = await supabase
    .from("alerts")
    .select(
      `
      *,
      asset:assets(id, hostname, asset_type, criticality, ip_address),
      identity:soc_identities(id, username, domain, account_type, is_privileged)
    `
    )
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !alert) {
    console.error("[getAlertById] Error fetching alert:", error);
    return null;
  }

  // Load matched events
  const matchedEventIds: string[] = (alert.matched_event_ids as string[]) || [];
  let matchedEvents: TelemetryEvent[] = [];

  if (matchedEventIds.length > 0) {
    const { data: eventsData } = await supabase
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
      .in("id", matchedEventIds)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false });

    matchedEvents = (eventsData as unknown as TelemetryEvent[]) || [];
  }

  // Load audit history
  const { data: historyData } = await supabase
    .from("alert_history")
    .select("*")
    .eq("alert_id", alertId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return {
    alert: alert as Alert,
    matchedEvents,
    history: (historyData as AlertHistory[]) || [],
  };
}

/**
 * Acknowledges an alert and logs to alert_history.
 */
export async function acknowledgeAlert(
  organizationId: string,
  actorId: string | null,
  alertId: string,
  note?: string
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("alerts")
    .select("status")
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Alert not found." };
  }

  const { data: updated, error } = await supabase
    .from("alerts")
    .update({
      status: "Acknowledged",
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log in alert_history
  await supabase.from("alert_history").insert({
    organization_id: organizationId,
    alert_id: alertId,
    actor_id: actorId,
    action: "acknowledged",
    previous_status: existing.status,
    new_status: "Acknowledged",
    note: note || "Alert acknowledged by analyst.",
  });

  return { success: true, data: updated as Alert };
}

/**
 * Assigns an alert to a team member / analyst.
 */
export async function assignAlert(
  organizationId: string,
  actorId: string | null,
  alertId: string,
  assignedTo: string | null,
  note?: string
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("alerts")
    .select("status, assigned_to")
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Alert not found." };
  }

  const nextStatus =
    existing.status === "Open" || existing.status === "open"
      ? "In Progress"
      : existing.status;

  const { data: updated, error } = await supabase
    .from("alerts")
    .update({
      assigned_to: assignedTo,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("alert_history").insert({
    organization_id: organizationId,
    alert_id: alertId,
    actor_id: actorId,
    action: "assigned",
    previous_status: existing.status,
    new_status: nextStatus,
    note: note || (assignedTo ? `Assigned to analyst (${assignedTo}).` : "Unassigned alert."),
    metadata: { assigned_to: assignedTo },
  });

  return { success: true, data: updated as Alert };
}

/**
 * Updates alert status (Investigating, Escalated, Closed, False Positive).
 */
export async function updateAlertStatus(
  organizationId: string,
  actorId: string | null,
  alertId: string,
  status: AlertStatus,
  note?: string,
  closedReason?: string
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("alerts")
    .select("status")
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Alert not found." };
  }

  const isClosing =
    status === "Closed" ||
    status === "False Positive" ||
    status === "closed" ||
    status === "false_positive";

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (isClosing) {
    updatePayload.closed_at = new Date().toISOString();
    if (closedReason) {
      updatePayload.closed_reason = closedReason;
    }
  }

  const { data: updated, error } = await supabase
    .from("alerts")
    .update(updatePayload)
    .eq("id", alertId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("alert_history").insert({
    organization_id: organizationId,
    alert_id: alertId,
    actor_id: actorId,
    action: "status_changed",
    previous_status: existing.status,
    new_status: status,
    note: note || closedReason || `Status changed to ${status}.`,
    metadata: { closed_reason: closedReason },
  });

  return { success: true, data: updated as Alert };
}

/**
 * Adds an analyst note to an alert audit history.
 */
export async function addAlertNote(
  organizationId: string,
  actorId: string | null,
  alertId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("alert_history").insert({
    organization_id: organizationId,
    alert_id: alertId,
    actor_id: actorId,
    action: "note_added",
    previous_status: null,
    new_status: null,
    note,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Computes high-level KPI metrics for the alert center.
 */
export async function getAlertStats(
  organizationId: string
): Promise<AlertKpiStats> {
  const supabase = await createServerSupabaseClient();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("status, severity")
    .eq("organization_id", organizationId);

  if (!alerts || alerts.length === 0) {
    return {
      totalAlerts: 0,
      openCount: 0,
      criticalCount: 0,
      acknowledgedCount: 0,
      inProgressCount: 0,
      closedCount: 0,
    };
  }

  let openCount = 0;
  let criticalCount = 0;
  let acknowledgedCount = 0;
  let inProgressCount = 0;
  let closedCount = 0;

  for (const a of alerts) {
    const st = a.status.toLowerCase();
    const sv = a.severity.toLowerCase();

    if (st === "open") openCount++;
    if (st === "acknowledged") acknowledgedCount++;
    if (st === "in progress" || st === "in_progress") inProgressCount++;
    if (st === "closed" || st === "false positive" || st === "false_positive") closedCount++;

    if (sv === "critical" || sv === "high") criticalCount++;
  }

  return {
    totalAlerts: alerts.length,
    openCount,
    criticalCount,
    acknowledgedCount,
    inProgressCount,
    closedCount,
  };
}
