/**
 * Phase 14: SIEM Core — Query Service
 *
 * Provides authoritative server-side search, filtering, and inspection
 * for canonical events (public.events) and logs (public.logs).
 *
 * Implements:
 * - Deterministic time handling using occurred_at for events & logged_at for logs
 * - Multi-criteria filtering: severity, source, category, asset, identity, agent, pipeline status
 * - Free text searching
 * - Server-side deterministic pagination and ordering
 * - Strict multi-tenant isolation via organization_id
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  TelemetryEvent,
  LogRecord,
  SiemQueryResult,
  SiemTimeRange,
  ProcessRecord,
  FileRecord,
  NetworkConnectionRecord,
} from "@vrsoc/types";
import type { SiemFilterParamsInput } from "@vrsoc/validation";

export interface TelemetryEventDetail {
  event: TelemetryEvent;
  log?: LogRecord | null;
  process?: ProcessRecord | null;
  file?: FileRecord | null;
  network?: NetworkConnectionRecord | null;
}

/**
 * Calculates start and end ISO UTC timestamps based on relative or custom time ranges.
 */
export function calculateTimeWindow(
  timeRange: SiemTimeRange = "24h",
  customStart?: string,
  customEnd?: string
): { startISO: string | null; endISO: string | null } {
  const now = new Date();

  if (timeRange === "all") {
    return { startISO: null, endISO: null };
  }

  if (timeRange === "custom") {
    return {
      startISO: customStart || null,
      endISO: customEnd || null,
    };
  }

  const durationMap: Record<Exclude<SiemTimeRange, "custom" | "all">, number> = {
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const ms = durationMap[timeRange] || durationMap["24h"];
  const start = new Date(now.getTime() - ms);

  return {
    startISO: start.toISOString(),
    endISO: now.toISOString(),
  };
}

/**
 * Executes a structured SIEM search across canonical events (public.events).
 */
export async function executeSiemEventsQuery(
  organizationId: string,
  filters: Partial<SiemFilterParamsInput> = {}
): Promise<SiemQueryResult<TelemetryEvent>> {
  const startTime = Date.now();
  const supabase = await createServerSupabaseClient();

  const page = filters.page || 1;
  const pageSize = Math.min(filters.pageSize || 25, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Build base query
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
      created_at,
      asset:assets(id, hostname, asset_type, criticality),
      agent:agents(id, agent_version, status),
      identity:soc_identities(id, username, domain, account_type, is_privileged)
    `,
      { count: "exact" }
    )
    .eq("organization_id", organizationId);

  // Time-range filter on occurred_at (telemetry occurrence semantics)
  const { startISO, endISO } = calculateTimeWindow(
    filters.timeRange || "24h",
    filters.startTime,
    filters.endTime
  );

  if (startISO) {
    query = query.gte("occurred_at", startISO);
  }
  if (endISO) {
    query = query.lte("occurred_at", endISO);
  }

  // Severity filter
  if (filters.severity && filters.severity !== "ALL") {
    query = query.eq("severity", filters.severity);
  }

  // Source filter
  if (filters.source && filters.source !== "ALL") {
    query = query.eq("source", filters.source);
  }

  // Source Type filter
  if (filters.sourceType && filters.sourceType !== "ALL") {
    query = query.eq("source_type", filters.sourceType);
  }

  // Category filter
  if (filters.category && filters.category !== "ALL") {
    query = query.eq("category", filters.category);
  }

  // Event Type filter
  if (filters.eventType) {
    query = query.ilike("event_type", `%${filters.eventType}%`);
  }

  // Entity filters
  if (filters.assetId) {
    query = query.eq("asset_id", filters.assetId);
  }
  if (filters.agentId) {
    query = query.eq("agent_id", filters.agentId);
  }
  if (filters.identityId) {
    query = query.eq("identity_id", filters.identityId);
  }

  // Pipeline status filter
  if (filters.pipelineStatus && filters.pipelineStatus !== "ALL") {
    query = query.eq("pipeline_status", filters.pipelineStatus);
  }

  // Free text query across message / event_type / tags / source
  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim();
    query = query.or(
      `event_type.ilike.%${q}%,source.ilike.%${q}%,category.ilike.%${q}%,source_host.ilike.%${q}%`
    );
  }

  // Sorting
  const sortBy = filters.sortBy || "occurred_at";
  const ascending = filters.sortDirection === "asc";
  query = query.order(sortBy, { ascending });

  // Pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("[executeSiemEventsQuery] Query error:", error);
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      hasMore: false,
      durationMs: Date.now() - startTime,
      appliedFilters: filters,
    };
  }

  const items = (data as unknown as TelemetryEvent[]) || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    durationMs: Date.now() - startTime,
    appliedFilters: filters,
  };
}

/**
 * Executes a structured SIEM search across raw and parsed logs (public.logs).
 */
export async function executeSiemLogsQuery(
  organizationId: string,
  filters: Partial<SiemFilterParamsInput> = {}
): Promise<SiemQueryResult<LogRecord>> {
  const startTime = Date.now();
  const supabase = await createServerSupabaseClient();

  const page = filters.page || 1;
  const pageSize = Math.min(filters.pageSize || 25, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
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
      parse_status,
      parser_name,
      metadata,
      created_at
    `,
      { count: "exact" }
    )
    .eq("organization_id", organizationId);

  // Time-range filter on logged_at
  const { startISO, endISO } = calculateTimeWindow(
    filters.timeRange || "24h",
    filters.startTime,
    filters.endTime
  );

  if (startISO) {
    query = query.gte("logged_at", startISO);
  }
  if (endISO) {
    query = query.lte("logged_at", endISO);
  }

  // Source / service name filter
  if (filters.source && filters.source !== "ALL") {
    query = query.eq("service_name", filters.source);
  }

  // Free text query across message, raw_log, service_name
  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim();
    query = query.or(`message.ilike.%${q}%,raw_log.ilike.%${q}%,service_name.ilike.%${q}%`);
  }

  // Sorting
  query = query.order("logged_at", { ascending: filters.sortDirection === "asc" });

  // Pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("[executeSiemLogsQuery] Query error:", error);
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      hasMore: false,
      durationMs: Date.now() - startTime,
      appliedFilters: filters,
    };
  }

  const items = (data as unknown as LogRecord[]) || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    durationMs: Date.now() - startTime,
    appliedFilters: filters,
  };
}

/**
 * Retrieves deep inspection details for a single event including related log,
 * process, file, or network auxiliary entities.
 */
export async function getSiemEventDetails(
  organizationId: string,
  eventId: string
): Promise<TelemetryEventDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: event, error: eventErr } = await supabase
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
      asset:assets(id, hostname, asset_type, criticality),
      agent:agents(id, agent_version, status),
      identity:soc_identities(id, username, domain, account_type, is_privileged)
    `
    )
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (eventErr || !event) {
    return null;
  }

  // Find linked log
  const { data: log } = await supabase
    .from("logs")
    .select("*")
    .eq("event_id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  // If asset is linked, find auxiliary entities occurred around same time
  let process: ProcessRecord | null = null;
  let file: FileRecord | null = null;
  let network: NetworkConnectionRecord | null = null;

  if (event.asset_id) {
    const [procRes, fileRes, netRes] = await Promise.all([
      supabase
        .from("processes")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("asset_id", event.asset_id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("files")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("asset_id", event.asset_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("network_connections")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("asset_id", event.asset_id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    process = procRes.data as ProcessRecord | null;
    file = fileRes.data as FileRecord | null;
    network = netRes.data as NetworkConnectionRecord | null;
  }

  return {
    event: event as unknown as TelemetryEvent,
    log: log as unknown as LogRecord | null,
    process,
    file,
    network,
  };
}
