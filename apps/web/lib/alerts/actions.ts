"use server";

/**
 * Phase 16: Alert Center Server Actions
 *
 * Provides authenticated, tenant-isolated Server Actions for:
 * - Querying and filtering alert queue
 * - Retrieving deep alert details with matched events and history
 * - Acknowledging alerts
 * - Assigning alerts to analysts
 * - Updating alert triage status
 * - Adding analyst notes
 * - Generating alerts from Phase 15 detection execution results
 * - Fetching KPI metrics
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  assignAlert,
  updateAlertStatus,
  addAlertNote,
  getAlertStats,
  type AlertQueryResult,
  type AlertDetailPackage,
  type AlertKpiStats,
} from "./triage-service";
import { createAlertFromDetection } from "./generator";
import {
  AlertFilterParamsSchema,
  AlertTriageUpdateSchema,
  AcknowledgeAlertSchema,
  AssignAlertSchema,
  AddAlertNoteSchema,
  CloseAlertSchema,
  CreateAlertFromDetectionSchema,
} from "@vrsoc/validation";
import type {
  Alert,
  UserRole,
  AlertFilterParams,
  DetectionExecutionResult,
} from "@vrsoc/types";

/**
 * Helper to get authenticated user and organization context.
 */
async function getAuthContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, organizationId: null, role: null };
  }

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
    role: (membership?.role as UserRole) || null,
  };
}

/**
 * Server Action: Query alerts with filters and pagination.
 */
export async function getAlertsAction(
  rawInput?: unknown
): Promise<{ success: boolean; data?: AlertQueryResult; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = AlertFilterParamsSchema.safeParse(rawInput || {});

    const orgId =
      (parsed.success && (parsed.data.organization_id || parsed.data.organizationId)) ||
      auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "alerts:read")) {
      return { success: false, error: "Forbidden: Missing 'alerts:read' permission." };
    }

    const filters = (parsed.success ? parsed.data : {}) as AlertFilterParams;
    const result = await getAlerts(orgId, filters);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("[getAlertsAction] Error:", err);
    return { success: false, error: err.message || "Failed to load alerts." };
  }
}

/**
 * Server Action: Get deep inspection details for a single alert.
 */
export async function getAlertDetailsAction(
  alertId: string,
  organizationId?: string
): Promise<{ success: boolean; data?: AlertDetailPackage | null; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "alerts:read")) {
      return { success: false, error: "Forbidden: Missing 'alerts:read' permission." };
    }

    const details = await getAlertById(orgId, alertId);
    return { success: true, data: details };
  } catch (err: any) {
    console.error("[getAlertDetailsAction] Error:", err);
    return { success: false, error: err.message || "Failed to inspect alert." };
  }
}

/**
 * Server Action: Acknowledge an alert.
 */
export async function acknowledgeAlertAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = AcknowledgeAlertSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid acknowledge input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    const alertId = parsed.data.alert_id || parsed.data.alertId;

    if (!orgId || !alertId) {
      return { success: false, error: "Unauthorized: Missing organization or alert ID." };
    }

    if (!hasPermission(auth.role, "alerts:triage")) {
      return { success: false, error: "Forbidden: Missing 'alerts:triage' permission." };
    }

    const result = await acknowledgeAlert(orgId, auth.user?.id || null, alertId, parsed.data.note);
    return result;
  } catch (err: any) {
    console.error("[acknowledgeAlertAction] Error:", err);
    return { success: false, error: err.message || "Failed to acknowledge alert." };
  }
}

/**
 * Server Action: Assign an alert.
 */
export async function assignAlertAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = AssignAlertSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid assign input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    const alertId = parsed.data.alert_id || parsed.data.alertId;
    const assignedTo = parsed.data.assigned_to || parsed.data.assignedTo || null;

    if (!orgId || !alertId) {
      return { success: false, error: "Unauthorized: Missing organization or alert ID." };
    }

    if (!hasPermission(auth.role, "alerts:triage")) {
      return { success: false, error: "Forbidden: Missing 'alerts:triage' permission." };
    }

    const result = await assignAlert(
      orgId,
      auth.user?.id || null,
      alertId,
      assignedTo,
      parsed.data.note
    );
    return result;
  } catch (err: any) {
    console.error("[assignAlertAction] Error:", err);
    return { success: false, error: err.message || "Failed to assign alert." };
  }
}

/**
 * Server Action: Update alert triage status.
 */
export async function updateAlertStatusAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = AlertTriageUpdateSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid status update input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    const alertId = parsed.data.alert_id || parsed.data.alertId;

    if (!orgId || !alertId) {
      return { success: false, error: "Unauthorized: Missing organization or alert ID." };
    }

    if (!hasPermission(auth.role, "alerts:triage")) {
      return { success: false, error: "Forbidden: Missing 'alerts:triage' permission." };
    }

    if (!parsed.data.status) {
      return { success: false, error: "Status is required." };
    }

    const result = await updateAlertStatus(
      orgId,
      auth.user?.id || null,
      alertId,
      parsed.data.status,
      parsed.data.note,
      parsed.data.closed_reason || parsed.data.closedReason
    );
    return result;
  } catch (err: any) {
    console.error("[updateAlertStatusAction] Error:", err);
    return { success: false, error: err.message || "Failed to update alert status." };
  }
}

/**
 * Server Action: Add note to alert history.
 */
export async function addAlertNoteAction(
  rawInput: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = AddAlertNoteSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid note input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    const alertId = parsed.data.alert_id || parsed.data.alertId;

    if (!orgId || !alertId) {
      return { success: false, error: "Unauthorized: Missing organization or alert ID." };
    }

    if (!hasPermission(auth.role, "alerts:comment")) {
      return { success: false, error: "Forbidden: Missing 'alerts:comment' permission." };
    }

    const result = await addAlertNote(orgId, auth.user?.id || null, alertId, parsed.data.note);
    return result;
  } catch (err: any) {
    console.error("[addAlertNoteAction] Error:", err);
    return { success: false, error: err.message || "Failed to add note." };
  }
}

/**
 * Server Action: Close / Dismiss alert.
 */
export async function closeAlertAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = CloseAlertSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid close alert input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    const alertId = parsed.data.alert_id || parsed.data.alertId;

    if (!orgId || !alertId) {
      return { success: false, error: "Unauthorized: Missing organization or alert ID." };
    }

    if (!hasPermission(auth.role, "alerts:triage")) {
      return { success: false, error: "Forbidden: Missing 'alerts:triage' permission." };
    }

    const result = await updateAlertStatus(
      orgId,
      auth.user?.id || null,
      alertId,
      parsed.data.status,
      parsed.data.note,
      parsed.data.reason
    );
    return result;
  } catch (err: any) {
    console.error("[closeAlertAction] Error:", err);
    return { success: false, error: err.message || "Failed to close alert." };
  }
}

/**
 * Server Action: Generate alert from Phase 15 detection result.
 */
export async function createAlertFromDetectionAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: Alert; isDuplicate?: boolean; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = CreateAlertFromDetectionSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid detection alert input." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    const result = await createAlertFromDetection(
      orgId,
      parsed.data.detectionResult as unknown as DetectionExecutionResult
    );
    return result;
  } catch (err: any) {
    console.error("[createAlertFromDetectionAction] Error:", err);
    return { success: false, error: err.message || "Failed to generate alert from detection." };
  }
}

/**
 * Server Action: Fetch alert KPI stats.
 */
export async function getAlertStatsAction(
  organizationId?: string
): Promise<{ success: boolean; data?: AlertKpiStats; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "alerts:read")) {
      return { success: false, error: "Forbidden: Missing 'alerts:read' permission." };
    }

    const stats = await getAlertStats(orgId);
    return { success: true, data: stats };
  } catch (err: any) {
    console.error("[getAlertStatsAction] Error:", err);
    return { success: false, error: err.message || "Failed to load alert metrics." };
  }
}
