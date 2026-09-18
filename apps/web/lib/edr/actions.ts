"use server";

/**
 * EDR Endpoint Investigation Server Actions
 *
 * Implements tenant-scoped, RBAC-protected actions for querying endpoint
 * forensics, process trees, and executing safe educational simulations.
 */

import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import {
  getEndpointsList,
  getEndpointInvestigation,
  type EndpointOption,
} from "./investigation-service";
import { runEdrSimulationScenario } from "./simulation-scenarios";
import {
  GetEndpointInvestigationSchema,
  SimulateEdrScenarioSchema,
  GetProcessTreeSchema,
  type GetEndpointInvestigationInputType,
  type SimulateEdrScenarioInputType,
  type GetProcessTreeInputType,
} from "@vrsoc/validation";
import type {
  EndpointInvestigationPackage,
  EdrProcessTreeNode,
  PipelineBatchResult,
} from "@vrsoc/types";
import { revalidatePath } from "next/cache";

export interface EdrActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Lists all endpoints in the active organization for selection.
 */
export async function getEndpointsListAction(): Promise<EdrActionResult<EndpointOption[]>> {
  try {
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({ organizationId: organization.id, permission: "agents:read" });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to view endpoint fleet." };
    }

    const list = await getEndpointsList(organization.id);
    return { success: true, data: list };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list endpoints.";
    console.error("[getEndpointsListAction] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Fetches the forensic investigation package for a specific endpoint.
 */
export async function getEndpointInvestigationAction(
  input: GetEndpointInvestigationInputType
): Promise<EdrActionResult<EndpointInvestigationPackage>> {
  try {
    const validated = GetEndpointInvestigationSchema.parse(input);
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({ organizationId: organization.id, permission: "telemetry:read" });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to view endpoint telemetry." };
    }

    const investigation = await getEndpointInvestigation(
      organization.id,
      validated.assetId,
      validated.filters || {}
    );

    if (!investigation) {
      return { success: false, error: "Endpoint not found or inaccessible in current organization." };
    }

    return { success: true, data: investigation };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load endpoint investigation.";
    console.error("[getEndpointInvestigationAction] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Retrieves only the process tree for an endpoint.
 */
export async function getProcessTreeAction(
  input: GetProcessTreeInputType
): Promise<EdrActionResult<EdrProcessTreeNode[]>> {
  try {
    const validated = GetProcessTreeSchema.parse(input);
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({ organizationId: organization.id, permission: "telemetry:read" });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to view process tree." };
    }

    const investigation = await getEndpointInvestigation(
      organization.id,
      validated.assetId
    );

    return { success: true, data: investigation?.processTree || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load process tree.";
    console.error("[getProcessTreeAction] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Executes a safe, educational EDR simulation on an endpoint.
 */
export async function runEdrSimulationAction(
  input: SimulateEdrScenarioInputType
): Promise<EdrActionResult<PipelineBatchResult>> {
  try {
    const validated = SimulateEdrScenarioSchema.parse(input);
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const auth = await authorizePermission({ organizationId: organization.id, permission: "telemetry:read" });
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized to run simulations." };
    }

    const result = await runEdrSimulationScenario(validated.scenarioType, {
      organizationId: organization.id,
      assetId: validated.assetId,
    });

    revalidatePath("/edr");
    revalidatePath("/agents");
    revalidatePath("/logs");
    revalidatePath("/alerts");

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute EDR simulation.";
    console.error("[runEdrSimulationAction] Error:", message);
    return { success: false, error: message };
  }
}
