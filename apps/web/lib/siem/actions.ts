"use server";

/**
 * Phase 14: SIEM Core Server Actions
 *
 * Provides authenticated, tenant-scoped Server Actions for:
 * - Executing SIEM event searches with multi-field filtering & pagination
 * - Executing SIEM log searches
 * - Retrieving deep event inspection packages
 * - Running foundational telemetry correlation queries
 * - Building chronological investigation timelines
 * - Managing saved queries (create, list, update, delete)
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  executeSiemEventsQuery,
  executeSiemLogsQuery,
  getSiemEventDetails,
  type TelemetryEventDetail,
} from "./query";
import { getEventCorrelations } from "./correlate";
import { buildSiemTimeline } from "./timeline";
import {
  getSavedQueries,
  createSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
} from "./saved-queries";
import {
  SiemQuerySchema,
  SiemCorrelationQuerySchema,
  SiemTimelineQuerySchema,
  CreateSavedQuerySchema,
  UpdateSavedQuerySchema,
  DeleteSavedQuerySchema,
} from "@vrsoc/validation";
import type {
  TelemetryEvent,
  LogRecord,
  SiemQueryResult,
  SiemCorrelatedGroup,
  SiemTimelineItem,
  SavedQuery,
} from "@vrsoc/types";

/**
 * Helper to get active user and organization context.
 */
async function getAuthContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, organizationId: null };
  }

  // Get user's active organization membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return {
    user,
    organizationId: membership?.organization_id || null,
    role: membership?.role || null,
  };
}

/**
 * Server Action: Execute SIEM events search.
 */
export async function executeSiemEventsAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SiemQueryResult<TelemetryEvent>; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = SiemQuerySchema.safeParse(rawInput);

    let orgId = auth.organizationId;
    let filters = {};

    if (parsed.success) {
      orgId = parsed.data.organizationId || orgId;
      filters = parsed.data.filters;
    }

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await executeSiemEventsQuery(orgId, filters);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("[executeSiemEventsAction] Error:", err);
    return { success: false, error: err.message || "Failed to query SIEM events." };
  }
}

/**
 * Server Action: Execute SIEM logs search.
 */
export async function executeSiemLogsAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SiemQueryResult<LogRecord>; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = SiemQuerySchema.safeParse(rawInput);

    let orgId = auth.organizationId;
    let filters = {};

    if (parsed.success) {
      orgId = parsed.data.organizationId || orgId;
      filters = parsed.data.filters;
    }

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await executeSiemLogsQuery(orgId, filters);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("[executeSiemLogsAction] Error:", err);
    return { success: false, error: err.message || "Failed to query SIEM logs." };
  }
}

/**
 * Server Action: Get deep inspection details for a single event.
 */
export async function getSiemEventDetailsAction(
  eventId: string,
  organizationId?: string
): Promise<{ success: boolean; data?: TelemetryEventDetail | null; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const details = await getSiemEventDetails(orgId, eventId);
    return { success: true, data: details };
  } catch (err: any) {
    console.error("[getSiemEventDetailsAction] Error:", err);
    return { success: false, error: err.message || "Failed to inspect event." };
  }
}

/**
 * Server Action: Correlate related telemetry for an event.
 */
export async function getEventCorrelationsAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SiemCorrelatedGroup[]; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = SiemCorrelationQuerySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid correlation query parameters." };
    }

    const orgId = parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const correlations = await getEventCorrelations(
      orgId,
      parsed.data.eventId,
      parsed.data.timeWindowMinutes
    );

    return { success: true, data: correlations };
  } catch (err: any) {
    console.error("[getEventCorrelationsAction] Error:", err);
    return { success: false, error: err.message || "Failed to correlate telemetry." };
  }
}

/**
 * Server Action: Build investigation timeline.
 */
export async function getSiemTimelineAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SiemTimelineItem[]; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = SiemTimelineQuerySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid timeline query parameters." };
    }

    const orgId = parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const timeline = await buildSiemTimeline(orgId, parsed.data);
    return { success: true, data: timeline };
  } catch (err: any) {
    console.error("[getSiemTimelineAction] Error:", err);
    return { success: false, error: err.message || "Failed to build SIEM timeline." };
  }
}

/**
 * Server Action: List saved queries.
 */
export async function getSavedQueriesAction(
  organizationId?: string,
  queryType?: "events" | "logs" | "correlated"
): Promise<{ success: boolean; data?: SavedQuery[]; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const queries = await getSavedQueries(orgId, queryType);
    return { success: true, data: queries };
  } catch (err: any) {
    console.error("[getSavedQueriesAction] Error:", err);
    return { success: false, error: err.message || "Failed to list saved queries." };
  }
}

/**
 * Server Action: Create saved query.
 */
export async function createSavedQueryAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = CreateSavedQuerySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const orgId = parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await createSavedQuery(orgId, auth.user?.id || null, parsed.data);
    return result;
  } catch (err: any) {
    console.error("[createSavedQueryAction] Error:", err);
    return { success: false, error: err.message || "Failed to create saved query." };
  }
}

/**
 * Server Action: Update saved query.
 */
export async function updateSavedQueryAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = UpdateSavedQuerySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const orgId = parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await updateSavedQuery(orgId, parsed.data);
    return result;
  } catch (err: any) {
    console.error("[updateSavedQueryAction] Error:", err);
    return { success: false, error: err.message || "Failed to update saved query." };
  }
}

/**
 * Server Action: Delete saved query.
 */
export async function deleteSavedQueryAction(
  rawInput: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = DeleteSavedQuerySchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid delete request." };
    }

    const orgId = parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await deleteSavedQuery(orgId, parsed.data.id);
    return result;
  } catch (err: any) {
    console.error("[deleteSavedQueryAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete saved query." };
  }
}
