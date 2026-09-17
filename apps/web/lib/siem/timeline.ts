/**
 * Phase 14: SIEM Core — Chronological Timeline Service
 *
 * Constructs unified, chronological investigation timelines combining
 * normalized events and logs for incident analysis and forensic reconstruction.
 *
 * Implements:
 * - Strict occurred_at ordering for telemetry semantics
 * - Contextual formatting for assets, users, and severities
 * - High-performance timeline generation bounded by tenant isolation
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TelemetryEvent, LogRecord, SiemTimelineItem, SeverityLevel } from "@vrsoc/types";
import type { SiemTimelineQueryInput } from "@vrsoc/validation";

/**
 * Builds a chronological investigation timeline for a given tenant and optional filters.
 */
export async function buildSiemTimeline(
  organizationId: string,
  options: SiemTimelineQueryInput
): Promise<SiemTimelineItem[]> {
  const supabase = await createServerSupabaseClient();
  const limit = options.limit || 50;

  // 1. Fetch Events
  let eventQuery = supabase
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
      identity_id,
      raw_payload,
      normalized_fields,
      tags,
      pipeline_status,
      created_at,
      asset:assets(id, hostname),
      identity:soc_identities(id, username)
    `
    )
    .eq("organization_id", organizationId);

  if (options.assetId) {
    eventQuery = eventQuery.eq("asset_id", options.assetId);
  }
  if (options.identityId) {
    eventQuery = eventQuery.eq("identity_id", options.identityId);
  }
  if (options.startTime) {
    eventQuery = eventQuery.gte("occurred_at", options.startTime);
  }
  if (options.endTime) {
    eventQuery = eventQuery.lte("occurred_at", options.endTime);
  }

  // 2. Fetch Logs
  let logQuery = supabase
    .from("logs")
    .select(
      `
      id,
      organization_id,
      event_id,
      logged_at,
      facility,
      log_level,
      source_host,
      service_name,
      message,
      raw_log,
      created_at
    `
    )
    .eq("organization_id", organizationId);

  if (options.startTime) {
    logQuery = logQuery.gte("logged_at", options.startTime);
  }
  if (options.endTime) {
    logQuery = logQuery.lte("logged_at", options.endTime);
  }

  const [eventRes, logRes] = await Promise.all([
    eventQuery.order("occurred_at", { ascending: false }).limit(limit),
    logQuery.order("logged_at", { ascending: false }).limit(Math.floor(limit / 2)),
  ]);

  const rawEvents = (eventRes.data as unknown as TelemetryEvent[]) || [];
  const rawLogs = (logRes.data as unknown as LogRecord[]) || [];

  const timelineItems: SiemTimelineItem[] = [];

  // Transform events
  for (const ev of rawEvents) {
    const assetHost =
      (ev as any).asset?.hostname || (ev.normalized_fields as any)?.asset_hostname || undefined;
    const username =
      (ev as any).identity?.username || (ev.normalized_fields as any)?.user || undefined;

    timelineItems.push({
      id: ev.id,
      occurredAt: ev.occurred_at,
      createdAt: ev.created_at,
      type: "event",
      title: `${ev.category}: ${ev.event_type}`,
      source: ev.source,
      sourceType: ev.source_type,
      severity: ev.severity,
      category: ev.category,
      summary: (ev.normalized_fields as any)?.message || `${ev.event_type} observed on ${ev.source}`,
      assetHostname: assetHost,
      assetId: ev.asset_id || undefined,
      username,
      details: (ev.normalized_fields as Record<string, unknown>) || {},
      rawEvent: ev,
    });
  }

  // Transform standalone logs (not already mapped to an event in the list)
  const eventIdsInTimeline = new Set(rawEvents.map((e) => e.id));
  for (const log of rawLogs) {
    if (log.event_id && eventIdsInTimeline.has(log.event_id)) {
      continue; // Skip duplicate log if parent event is already represented
    }

    let severity: SeverityLevel = "Informational";
    if (log.log_level === "CRIT" || log.log_level === "ALERT" || log.log_level === "EMERG") {
      severity = "Critical";
    } else if (log.log_level === "ERROR") {
      severity = "High";
    } else if (log.log_level === "WARN") {
      severity = "Medium";
    } else if (log.log_level === "NOTICE" || log.log_level === "INFO") {
      severity = "Low";
    }

    timelineItems.push({
      id: log.id,
      occurredAt: log.logged_at,
      createdAt: log.created_at,
      type: "log",
      title: `Log: ${log.service_name || log.facility}`,
      source: log.service_name || log.facility || "LogStream",
      severity,
      category: "System Log",
      summary: log.message,
      assetHostname: log.source_host || undefined,
      details: {
        raw_log: log.raw_log,
        facility: log.facility,
        log_level: log.log_level,
      },
      rawLog: log,
    });
  }

  // Sort strictly by occurredAt ascending for chronological reconstruction
  timelineItems.sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  return timelineItems;
}
