/**
 * Phase 14: SIEM Core — Basic Correlation Engine
 *
 * Implements foundational, deterministic, transparent telemetry correlation:
 * 1. Asset Correlation: Events on same asset within temporal proximity window (+/- X min)
 * 2. Identity Correlation: Events associated with same user/account
 * 3. Agent Correlation: Nearby telemetry from same telemetry sensor/agent
 * 4. Ingestion Stream Correlation: Telemetry belonging to the same synthetic/simulation batch
 *
 * Adheres strictly to defensive boundaries:
 * - No fake detection rules or alert generation (deferred to Phase 15)
 * - Deterministic, transparent grouping with explicit reason explanations
 * - Strict multi-tenant isolation via organization_id
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TelemetryEvent, SiemCorrelatedGroup } from "@vrsoc/types";

/**
 * Correlates events on the same asset within a symmetric time window around centerTime.
 */
export async function correlateByAsset(
  organizationId: string,
  assetId: string,
  centerTime: string,
  windowMinutes: number = 30
): Promise<SiemCorrelatedGroup | null> {
  const supabase = await createServerSupabaseClient();
  const centerMs = new Date(centerTime).getTime();
  const windowMs = windowMinutes * 60 * 1000;
  const startISO = new Date(centerMs - windowMs).toISOString();
  const endISO = new Date(centerMs + windowMs).toISOString();

  // Fetch asset details for label
  const { data: asset } = await supabase
    .from("assets")
    .select("hostname, asset_type, criticality")
    .eq("id", assetId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const hostname = asset?.hostname || assetId.substring(0, 8);

  const { data, error } = await supabase
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
      created_at
    `
    )
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .gte("occurred_at", startISO)
    .lte("occurred_at", endISO)
    .order("occurred_at", { ascending: true })
    .limit(50);

  if (error || !data || data.length === 0) {
    return null;
  }

  const events = data as unknown as TelemetryEvent[];

  return {
    correlationType: "asset",
    correlationKey: assetId,
    label: `Host Telemetry: ${hostname}`,
    reason: `Identified ${events.length} telemetry events on host ${hostname} within ±${windowMinutes}m window.`,
    events,
    count: events.length,
    timeSpan: {
      start: events[0]?.occurred_at || startISO,
      end: events[events.length - 1]?.occurred_at || endISO,
    },
  };
}

/**
 * Correlates events associated with the same identity/user account.
 */
export async function correlateByIdentity(
  organizationId: string,
  identityId: string,
  centerTime?: string,
  windowMinutes: number = 60
): Promise<SiemCorrelatedGroup | null> {
  const supabase = await createServerSupabaseClient();

  // Fetch identity details
  const { data: identity } = await supabase
    .from("soc_identities")
    .select("username, domain, account_type, is_privileged")
    .eq("id", identityId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const username = identity?.username || identityId.substring(0, 8);

  let query = supabase
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
      created_at
    `
    )
    .eq("organization_id", organizationId)
    .eq("identity_id", identityId);

  if (centerTime) {
    const centerMs = new Date(centerTime).getTime();
    const windowMs = windowMinutes * 60 * 1000;
    query = query
      .gte("occurred_at", new Date(centerMs - windowMs).toISOString())
      .lte("occurred_at", new Date(centerMs + windowMs).toISOString());
  }

  const { data, error } = await query
    .order("occurred_at", { ascending: true })
    .limit(50);

  if (error || !data || data.length === 0) {
    return null;
  }

  const events = data as unknown as TelemetryEvent[];

  return {
    correlationType: "identity",
    correlationKey: identityId,
    label: `Identity Activity: ${username}`,
    reason: `Tracked ${events.length} events associated with user account ${username}.`,
    events,
    count: events.length,
    timeSpan: {
      start: events[0]?.occurred_at || new Date().toISOString(),
      end: events[events.length - 1]?.occurred_at || new Date().toISOString(),
    },
  };
}

/**
 * Correlates events sharing the same ingestion batch ID (e.g. simulation scenario run).
 */
export async function correlateByIngestionBatch(
  organizationId: string,
  ingestionId: string
): Promise<SiemCorrelatedGroup | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
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
      created_at
    `
    )
    .eq("organization_id", organizationId)
    .eq("ingestion_id", ingestionId)
    .order("occurred_at", { ascending: true })
    .limit(50);

  if (error || !data || data.length === 0) {
    return null;
  }

  const events = data as unknown as TelemetryEvent[];

  return {
    correlationType: "ingestion_batch",
    correlationKey: ingestionId,
    label: `Simulation Stream: ${ingestionId.substring(0, 16)}...`,
    reason: `Grouped ${events.length} telemetry records emitted in the same batch stream.`,
    events,
    count: events.length,
    timeSpan: {
      start: events[0]?.occurred_at || new Date().toISOString(),
      end: events[events.length - 1]?.occurred_at || new Date().toISOString(),
    },
  };
}

/**
 * Automatically calculates all applicable SIEM correlation groups for a target event.
 */
export async function getEventCorrelations(
  organizationId: string,
  eventId: string,
  windowMinutes: number = 30
): Promise<SiemCorrelatedGroup[]> {
  const supabase = await createServerSupabaseClient();

  const { data: targetEvent } = await supabase
    .from("events")
    .select("id, occurred_at, asset_id, identity_id, agent_id, ingestion_id")
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!targetEvent) {
    return [];
  }

  const correlationPromises: Promise<SiemCorrelatedGroup | null>[] = [];

  // 1. Asset Correlation
  if (targetEvent.asset_id) {
    correlationPromises.push(
      correlateByAsset(
        organizationId,
        targetEvent.asset_id,
        targetEvent.occurred_at,
        windowMinutes
      )
    );
  }

  // 2. Identity Correlation
  if (targetEvent.identity_id) {
    correlationPromises.push(
      correlateByIdentity(
        organizationId,
        targetEvent.identity_id,
        targetEvent.occurred_at,
        windowMinutes * 2
      )
    );
  }

  // 3. Ingestion Batch Correlation
  if (targetEvent.ingestion_id) {
    correlationPromises.push(
      correlateByIngestionBatch(organizationId, targetEvent.ingestion_id)
    );
  }

  const results = await Promise.all(correlationPromises);
  return results.filter((g): g is SiemCorrelatedGroup => g !== null && g.count > 1);
}
