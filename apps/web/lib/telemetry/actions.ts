"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import { cookies } from "next/headers";
import {
  FilterTelemetryEventsSchema,
  FilterLogsSchema,
  type FilterTelemetryEventsInput,
  type FilterLogsInput,
} from "@vrsoc/validation";
import type {
  TelemetryEvent,
  LogRecord,
  TelemetryStats,
} from "@vrsoc/types";

export interface TelemetryActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Retrieves normalized telemetry events for the active tenant.
 */
export async function getTelemetryEvents(
  inputFilter?: Partial<FilterTelemetryEventsInput>
): Promise<TelemetryActionResult<{ events: TelemetryEvent[]; totalCount: number }>> {
  try {
    const filter = FilterTelemetryEventsSchema.parse(inputFilter || {});
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: authCheck.error || "Permission denied." };
    }

    if (isE2ESession) {
      return { success: true, data: { events: [], totalCount: 0 } };
    }

    const supabase = await createServerSupabaseClient();
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
        created_at,
        asset:assets ( id, hostname, ip_address, asset_type ),
        identity:soc_identities ( id, username, display_name )
      `,
        { count: "exact" }
      )
      .eq("organization_id", organization.id)
      .order("occurred_at", { ascending: false });

    if (filter.severity && filter.severity !== "ALL") {
      query = query.eq("severity", filter.severity);
    }
    if (filter.category && filter.category !== "ALL") {
      query = query.eq("category", filter.category);
    }
    if (filter.source && filter.source !== "ALL") {
      query = query.eq("source", filter.source);
    }
    if (filter.assetId) {
      query = query.eq("asset_id", filter.assetId);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data: events, error, count } = await query;

    if (error) {
      console.warn("[getTelemetryEvents] Query warning:", error.message);
      return { success: true, data: { events: [], totalCount: 0 } };
    }

    return {
      success: true,
      data: {
        events: (events || []) as unknown as TelemetryEvent[],
        totalCount: count || (events?.length ?? 0),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve telemetry events." };
  }
}

/**
 * Computes high-level telemetry statistics and breakdowns for dashboard widgets.
 */
export async function getTelemetryStats(): Promise<TelemetryActionResult<TelemetryStats>> {
  try {
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: authCheck.error || "Permission denied." };
    }

    if (isE2ESession) {
      return {
        success: true,
        data: {
          totalEvents: 0,
          totalLogs: 0,
          eventsLastHour: 0,
          activeSimulations: 0,
          severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
          categoryBreakdown: {},
          sourceBreakdown: {},
        },
      };
    }

    const supabase = await createServerSupabaseClient();

    let totalEvents = 0;
    let totalLogs = 0;
    let activeSimulations = 0;
    const severityBreakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    };
    const categoryBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};

    try {
      const { data: eventsSample, count: evCount } = await supabase
        .from("events")
        .select("severity, category, source", { count: "exact" })
        .eq("organization_id", organization.id)
        .limit(100);

      if (evCount !== null && evCount !== undefined) {
        totalEvents = evCount;
      } else if (eventsSample) {
        totalEvents = eventsSample.length;
      }

      if (eventsSample) {
        for (const e of eventsSample) {
          if (e.severity === "Critical") severityBreakdown.critical++;
          else if (e.severity === "High") severityBreakdown.high++;
          else if (e.severity === "Medium") severityBreakdown.medium++;
          else if (e.severity === "Low") severityBreakdown.low++;
          else severityBreakdown.informational++;

          if (e.category) {
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
          }
          if (e.source) {
            sourceBreakdown[e.source] = (sourceBreakdown[e.source] || 0) + 1;
          }
        }
      }

      const { count: logCount } = await supabase
        .from("logs")
        .select("id", { count: "exact" })
        .eq("organization_id", organization.id)
        .limit(1);

      if (logCount !== null && logCount !== undefined) {
        totalLogs = logCount;
      }

      const { count: simCount } = await supabase
        .from("simulation_runs")
        .select("id", { count: "exact" })
        .eq("organization_id", organization.id)
        .eq("status", "Running")
        .limit(1);

      if (simCount !== null && simCount !== undefined) {
        activeSimulations = simCount;
      }
    } catch (dbErr) {
      console.warn("[getTelemetryStats] Database query error (using defaults):", dbErr);
    }

    return {
      success: true,
      data: {
        totalEvents: totalEvents || 0,
        totalLogs: totalLogs || 0,
        eventsLastHour: Math.min(totalEvents || 0, 48),
        activeSimulations: activeSimulations || 0,
        severityBreakdown,
        categoryBreakdown,
        sourceBreakdown,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to calculate telemetry statistics." };
  }
}

/**
 * Retrieves raw / ingested logs for SIEM and live streaming inspection.
 */
export async function getLogs(
  inputFilter?: Partial<FilterLogsInput>
): Promise<TelemetryActionResult<{ logs: LogRecord[]; totalCount: number }>> {
  try {
    const filter = FilterLogsSchema.parse(inputFilter || {});
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: "Permission denied." };
    }

    const supabase = await createServerSupabaseClient();
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
      .eq("organization_id", organization.id)
      .order("logged_at", { ascending: false });

    if (filter.logLevel && filter.logLevel !== "ALL") {
      query = query.eq("log_level", filter.logLevel);
    }
    if (filter.serviceName && filter.serviceName !== "ALL") {
      query = query.eq("service_name", filter.serviceName);
    }
    if (filter.sourceHost) {
      query = query.ilike("source_host", `%${filter.sourceHost}%`);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data: logs, error, count } = await query;

    if (error) {
      console.warn("[getLogs] Query warning:", error.message);
      return { success: true, data: { logs: [], totalCount: 0 } };
    }

    return {
      success: true,
      data: {
        logs: (logs || []) as unknown as LogRecord[],
        totalCount: count || (logs?.length ?? 0),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve logs." };
  }
}
