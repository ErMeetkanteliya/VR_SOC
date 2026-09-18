"use server";

import { cookies } from "next/headers";
import { requirePermission } from "@/lib/rbac/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  getThreatIndicators,
  getThreatIndicatorById,
  getIocOverviewStats,
  createThreatIndicator,
  updateThreatIndicator,
  deleteThreatIndicator,
  createIocRelationship,
} from "./threat-intel-service";
import {
  CreateIocInputSchema,
  UpdateIocInputSchema,
  IocFilterSchema,
  CreateIocRelationshipInputSchema,
} from "@vrsoc/validation";
import type {
  ThreatIndicator,
  ThreatIndicatorDetail,
  IocOverviewStats,
  IocRelationship,
  CreateIocInput,
  UpdateIocInput,
  IocFilter,
  CreateIocRelationshipInput,
} from "@vrsoc/types";

/**
 * Server Action: Fetches filtered and paginated Threat Indicators
 */
export async function fetchThreatIndicatorsAction(
  filter: IocFilter = {}
): Promise<{ success: boolean; data?: { indicators: ThreatIndicator[]; total: number; page: number; pageSize: number }; error?: string }> {
  try {
    const validatedFilter = IocFilterSchema.parse(filter);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:read",
      });
    }

    const data = await getThreatIndicators(validatedFilter, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch threat indicators.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches full detail and forensic relationships for a single IOC
 */
export async function fetchThreatIndicatorDetailAction(
  id: string
): Promise<{ success: boolean; data?: ThreatIndicatorDetail | null; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:read",
      });
    }

    const data = await getThreatIndicatorById(id, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch threat indicator details.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches Threat Intelligence overview KPI stats
 */
export async function fetchIocOverviewStatsAction(): Promise<{
  success: boolean;
  data?: IocOverviewStats;
  error?: string;
}> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:read",
      });
    }

    const data = await getIocOverviewStats(orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch threat intelligence stats.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Creates a new Threat Indicator
 */
export async function createThreatIndicatorAction(
  input: CreateIocInput
): Promise<{ success: boolean; data?: ThreatIndicator; error?: string }> {
  try {
    const validatedInput = CreateIocInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:create",
      });
    }

    const data = await createThreatIndicator(validatedInput as CreateIocInput, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create threat indicator.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates an existing Threat Indicator
 */
export async function updateThreatIndicatorAction(
  input: UpdateIocInput
): Promise<{ success: boolean; data?: ThreatIndicator; error?: string }> {
  try {
    const validatedInput = UpdateIocInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:update",
      });
    }

    const data = await updateThreatIndicator(validatedInput as UpdateIocInput, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update threat indicator.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deletes a Threat Indicator
 */
export async function deleteThreatIndicatorAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:delete",
      });
    }

    const success = await deleteThreatIndicator(id, orgId);
    return { success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete threat indicator.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Creates a relationship linking an IOC to a target entity
 */
export async function createIocRelationshipAction(
  input: CreateIocRelationshipInput
): Promise<{ success: boolean; data?: IocRelationship; error?: string }> {
  try {
    const validatedInput = CreateIocRelationshipInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_intel:relate",
      });
    }

    const data = await createIocRelationship(validatedInput as CreateIocRelationshipInput, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to link IOC relationship.";
    return { success: false, error: message };
  }
}
