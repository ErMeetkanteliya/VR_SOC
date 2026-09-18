"use server";

/**
 * XDR Server Actions
 *
 * Implements tenant-scoped, RBAC-protected actions for querying cross-source
 * correlations, retrieving full multi-source investigation packages, and executing
 * educational XDR simulations.
 */

import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import {
  getXdrCorrelations,
  getXdrInvestigationPackage,
} from "./investigation-service";
import { executeXdrSimulationScenario } from "./simulation-scenarios";
import {
  GetXdrInvestigationSchema,
  SimulateXdrScenarioSchema,
  XdrFilterParamsSchema,
  type GetXdrInvestigationInputType,
  type SimulateXdrScenarioInputType,
  type XdrFilterParamsInput,
} from "@vrsoc/validation";
import type {
  XdrCorrelationResult,
  XdrInvestigationPackage,
  PipelineBatchResult,
} from "@vrsoc/types";
import { revalidatePath } from "next/cache";

export interface XdrActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Lists all cross-source correlation clusters for the active organization.
 */
export async function getXdrCorrelationsAction(
  filters?: XdrFilterParamsInput
): Promise<XdrActionResult<XdrCorrelationResult[]>> {
  try {
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to view XDR correlations." };
    }

    const validatedFilters = filters ? XdrFilterParamsSchema.parse(filters) : undefined;
    const correlations = await getXdrCorrelations({
      organizationId: organization.id,
      filters: validatedFilters,
    });

    return { success: true, data: correlations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve XDR correlations.";
    console.error("[getXdrCorrelationsAction] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Fetches the deep investigation package for a specific XDR correlation cluster.
 */
export async function getXdrInvestigationPackageAction(
  input: GetXdrInvestigationInputType
): Promise<XdrActionResult<XdrInvestigationPackage>> {
  try {
    const validated = GetXdrInvestigationSchema.parse(input);
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to view XDR investigation package." };
    }

    const pkg = await getXdrInvestigationPackage({
      organizationId: organization.id,
      correlationId: validated.correlationId,
      filters: validated.filters,
    });

    return { success: true, data: pkg };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load XDR investigation package.";
    console.error("[getXdrInvestigationPackageAction] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Executes a safe, educational multi-source XDR simulation scenario.
 */
export async function runXdrSimulationAction(
  input: SimulateXdrScenarioInputType
): Promise<XdrActionResult<PipelineBatchResult>> {
  try {
    const validated = SimulateXdrScenarioSchema.parse(input);
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({
      organizationId: organization.id,
      permission: "telemetry:read",
    });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to run simulations." };
    }

    const result = await executeXdrSimulationScenario({
      organizationId: organization.id,
      scenarioType: validated.scenarioType,
      targetAssetId: validated.targetAssetId,
      targetIdentityId: validated.targetIdentityId,
    });

    revalidatePath("/xdr");
    revalidatePath("/edr");
    revalidatePath("/logs");
    revalidatePath("/alerts");

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute XDR simulation.";
    console.error("[runXdrSimulationAction] Error:", message);
    return { success: false, error: message };
  }
}
