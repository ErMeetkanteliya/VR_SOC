"use server";

/**
 * Phase 15: Detection Rules Server Actions
 *
 * Provides authenticated, tenant-isolated Server Actions for:
 * - Listing detection rules (system + custom tenant rules)
 * - Creating custom detection rules (with strict Zod validation and RBAC checks)
 * - Updating tenant-owned detection rules
 * - Deleting tenant-owned detection rules
 * - Toggling rule activation
 * - Evaluating a single detection rule against canonical telemetry
 * - Batch evaluating active detection rules
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  getDetectionRules,
  getDetectionRuleById,
  createDetectionRule,
  updateDetectionRule,
  deleteDetectionRule,
  toggleDetectionRule,
} from "./rules-service";
import {
  evaluateDetectionRule,
  evaluateAllActiveDetectionRules,
} from "./engine";
import {
  CreateDetectionRuleSchema,
  UpdateDetectionRuleSchema,
  DeleteDetectionRuleSchema,
  ToggleDetectionRuleSchema,
  EvaluateDetectionRuleSchema,
  EvaluateAllDetectionRulesSchema,
} from "@vrsoc/validation";
import type {
  DetectionRule,
  DetectionExecutionResult,
  UserRole,
  CreateDetectionRuleInput,
  UpdateDetectionRuleInput,
} from "@vrsoc/types";

/**
 * Helper to resolve authenticated user, organization, and role context.
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
 * Server Action: List all detection rules (System + Custom).
 */
export async function getDetectionRulesAction(filter?: {
  category?: string;
  severity?: string;
  isEnabled?: boolean;
  query?: string;
  organizationId?: string;
}): Promise<{ success: boolean; data?: DetectionRule[]; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = filter?.organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:read")) {
      return { success: false, error: "Forbidden: Missing 'detections:read' permission." };
    }

    const rules = await getDetectionRules(orgId, filter);
    return { success: true, data: rules };
  } catch (err: any) {
    console.error("[getDetectionRulesAction] Error:", err);
    return { success: false, error: err.message || "Failed to load detection rules." };
  }
}

/**
 * Server Action: Get single detection rule by ID.
 */
export async function getDetectionRuleByIdAction(
  ruleId: string,
  organizationId?: string
): Promise<{ success: boolean; data?: DetectionRule | null; error?: string }> {
  try {
    const auth = await getAuthContext();
    const orgId = organizationId || auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:read")) {
      return { success: false, error: "Forbidden: Missing 'detections:read' permission." };
    }

    const rule = await getDetectionRuleById(orgId, ruleId);
    return { success: true, data: rule };
  } catch (err: any) {
    console.error("[getDetectionRuleByIdAction] Error:", err);
    return { success: false, error: err.message || "Failed to load detection rule." };
  }
}

/**
 * Server Action: Create custom detection rule.
 */
export async function createDetectionRuleAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = CreateDetectionRuleSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:create")) {
      return { success: false, error: "Forbidden: Missing 'detections:create' permission." };
    }

    const result = await createDetectionRule(
      orgId,
      auth.user?.id || null,
      parsed.data as CreateDetectionRuleInput
    );
    return result;
  } catch (err: any) {
    console.error("[createDetectionRuleAction] Error:", err);
    return { success: false, error: err.message || "Failed to create detection rule." };
  }
}

/**
 * Server Action: Update custom detection rule.
 */
export async function updateDetectionRuleAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = UpdateDetectionRuleSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:update")) {
      return { success: false, error: "Forbidden: Missing 'detections:update' permission." };
    }

    const result = await updateDetectionRule(
      orgId,
      parsed.data as UpdateDetectionRuleInput
    );
    return result;
  } catch (err: any) {
    console.error("[updateDetectionRuleAction] Error:", err);
    return { success: false, error: err.message || "Failed to update detection rule." };
  }
}

/**
 * Server Action: Delete custom detection rule.
 */
export async function deleteDetectionRuleAction(
  rawInput: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = DeleteDetectionRuleSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid delete request parameters." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:delete")) {
      return { success: false, error: "Forbidden: Missing 'detections:delete' permission." };
    }

    const result = await deleteDetectionRule(orgId, parsed.data.id);
    return result;
  } catch (err: any) {
    console.error("[deleteDetectionRuleAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete detection rule." };
  }
}

/**
 * Server Action: Toggle detection rule enabled/disabled state.
 */
export async function toggleDetectionRuleAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: DetectionRule; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = ToggleDetectionRuleSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid toggle request parameters." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:update")) {
      return { success: false, error: "Forbidden: Missing 'detections:update' permission." };
    }

    const isEnabled = parsed.data.is_enabled ?? parsed.data.isEnabled ?? true;
    const result = await toggleDetectionRule(orgId, parsed.data.id, isEnabled);
    return result;
  } catch (err: any) {
    console.error("[toggleDetectionRuleAction] Error:", err);
    return { success: false, error: err.message || "Failed to toggle detection rule." };
  }
}

/**
 * Server Action: Evaluate a single detection rule against canonical telemetry in PostgreSQL.
 */
export async function evaluateDetectionRuleAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: DetectionExecutionResult; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = EvaluateDetectionRuleSchema.safeParse(rawInput);

    if (!parsed.success) {
      return { success: false, error: "Invalid evaluation request parameters." };
    }

    const orgId = parsed.data.organization_id || parsed.data.organizationId || auth.organizationId;
    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:test")) {
      return { success: false, error: "Forbidden: Missing 'detections:test' permission." };
    }

    const targetRuleId = parsed.data.rule_id || parsed.data.id;
    if (!targetRuleId) {
      return { success: false, error: "Rule ID is required." };
    }

    const rule = await getDetectionRuleById(orgId, targetRuleId);
    if (!rule) {
      return { success: false, error: "Detection rule not found." };
    }

    const result = await evaluateDetectionRule(rule, orgId, {
      timeWindowMinutes: parsed.data.time_window_minutes || parsed.data.timeWindowMinutes,
    });

    return { success: true, data: result };
  } catch (err: any) {
    console.error("[evaluateDetectionRuleAction] Error:", err);
    return { success: false, error: err.message || "Failed to evaluate detection rule." };
  }
}

/**
 * Server Action: Evaluate all active detection rules.
 */
export async function evaluateAllDetectionRulesAction(
  rawInput?: unknown
): Promise<{ success: boolean; data?: DetectionExecutionResult[]; error?: string }> {
  try {
    const auth = await getAuthContext();
    const parsed = EvaluateAllDetectionRulesSchema.safeParse(rawInput || {});

    const orgId = parsed.success && (parsed.data.organization_id || parsed.data.organizationId)
      ? (parsed.data.organization_id || parsed.data.organizationId)
      : auth.organizationId;

    if (!orgId) {
      return { success: false, error: "Unauthorized: No active organization." };
    }

    if (!hasPermission(auth.role, "detections:test")) {
      return { success: false, error: "Forbidden: Missing 'detections:test' permission." };
    }

    const options = parsed.success
      ? {
          timeWindowMinutes: parsed.data.time_window_minutes || parsed.data.timeWindowMinutes,
          category: parsed.data.category,
        }
      : undefined;

    const results = await evaluateAllActiveDetectionRules(orgId, options);
    return { success: true, data: results };
  } catch (err: any) {
    console.error("[evaluateAllDetectionRulesAction] Error:", err);
    return { success: false, error: err.message || "Failed to evaluate detection rules." };
  }
}
