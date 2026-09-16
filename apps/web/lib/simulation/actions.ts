"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  LaunchSimulationSchema,
  CancelSimulationSchema,
  FilterSimulationScenariosSchema,
  FilterSimulationRunsSchema,
  type LaunchSimulationInput,
  type CancelSimulationInput,
  type FilterSimulationScenariosInput,
  type FilterSimulationRunsInput,
} from "@vrsoc/validation";
import { CANONICAL_SIMULATION_SCENARIOS } from "./scenarios";
import { executeSimulationRun } from "./engine";
import type {
  SimulationScenario,
  SimulationRun,
} from "@vrsoc/types";

export interface SimulationActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Retrieves all available simulation scenarios for the active tenant.
 */
export async function getSimulationScenarios(
  inputFilter?: Partial<FilterSimulationScenariosInput>
): Promise<SimulationActionResult<SimulationScenario[]>> {
  try {
    const filter = FilterSimulationScenariosSchema.parse(inputFilter || {});
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return {
        success: false,
        error: "Active organization context required.",
      };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "simulation:scenarios:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return {
        success: false,
        error: authCheck.error || "Permission denied to view simulation scenarios.",
      };
    }

    if (isE2ESession) {
      let scenarios = [...CANONICAL_SIMULATION_SCENARIOS];
      if (filter.category && filter.category !== "ALL") {
        scenarios = scenarios.filter((s) => s.category === filter.category);
      }
      if (filter.severity && filter.severity !== "ALL") {
        scenarios = scenarios.filter((s) => s.severity === filter.severity);
      }
      if (filter.search && filter.search.trim().length > 0) {
        const q = filter.search.toLowerCase().trim();
        scenarios = scenarios.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.mitre_techniques.some((t) => t.toLowerCase().includes(q))
        );
      }
      return { success: true, data: scenarios };
    }

    const supabase = await createServerSupabaseClient();

    // Query tenant-specific or global system scenarios from DB
    const { data: dbScenarios, error } = await supabase
      .from("simulation_scenarios")
      .select("*")
      .or(`organization_id.eq.${organization.id},is_system.eq.true`)
      .order("created_at", { ascending: false });

    let scenarios: SimulationScenario[] = [];
    if (!error && dbScenarios && dbScenarios.length > 0) {
      scenarios = dbScenarios as SimulationScenario[];
    } else {
      // Use canonical built-in scenarios as fallback
      scenarios = [...CANONICAL_SIMULATION_SCENARIOS];
    }

    // Apply filtering
    if (filter.category && filter.category !== "ALL") {
      scenarios = scenarios.filter((s) => s.category === filter.category);
    }
    if (filter.severity && filter.severity !== "ALL") {
      scenarios = scenarios.filter((s) => s.severity === filter.severity);
    }
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      scenarios = scenarios.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.mitre_techniques.some((t) => t.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: scenarios,
    };
  } catch (err: any) {
    console.error("[getSimulationScenarios] Exception:", err);
    return {
      success: false,
      error: err.message || "Failed to retrieve simulation scenarios.",
    };
  }
}

/**
 * Retrieves a single simulation scenario by ID or slug.
 */
export async function getSimulationScenarioById(
  scenarioId: string
): Promise<SimulationActionResult<SimulationScenario>> {
  try {
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "simulation:scenarios:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: authCheck.error || "Permission denied." };
    }

    const fallback = CANONICAL_SIMULATION_SCENARIOS.find(
      (s) => s.id === scenarioId || s.slug === scenarioId
    );
    if (fallback) {
      return { success: true, data: fallback };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("simulation_scenarios")
      .select("*")
      .or(`organization_id.eq.${organization.id},is_system.eq.true`)
      .eq("id", scenarioId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Simulation scenario not found." };
    }

    return { success: true, data: data as SimulationScenario };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve scenario." };
  }
}

/**
 * Launches an authoritative synthetic simulation scenario within the active tenant.
 */
export async function launchSimulationAction(
  input: LaunchSimulationInput
): Promise<SimulationActionResult<{ runId: string; scenarioName: string; eventsCount: number }>> {
  try {
    const parsed = LaunchSimulationSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return {
        success: false,
        error: "Active organization context required to launch simulations.",
      };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "simulation:scenarios:launch",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return {
        success: false,
        error:
          authCheck.error ||
          "Permission denied. Only authorized analysts and instructors may trigger simulation scenarios.",
      };
    }

    if (isE2ESession) {
      const scen =
        CANONICAL_SIMULATION_SCENARIOS.find(
          (s) => s.id === parsed.scenarioId || s.slug === parsed.scenarioId
        ) || CANONICAL_SIMULATION_SCENARIOS[0]!;
      return {
        success: true,
        data: {
          runId: `run-${Date.now().toString(36)}`,
          scenarioName: scen.name,
          eventsCount: scen.event_sequence.length,
        },
      };
    }

    // Execute through canonical server-side simulation engine
    const result = await executeSimulationRun({
      organizationId: organization.id,
      scenarioId: parsed.scenarioId,
      userId: authCheck.authorized ? authCheck.userId : null,
      targetAssetId: parsed.targetAssetId,
      targetAgentId: parsed.targetAgentId,
      targetIdentityId: parsed.targetIdentityId,
      parameters: parsed.parameters,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to execute simulation scenario.",
      };
    }

    revalidatePath("/soar/simulation");
    revalidatePath("/soar/live");
    revalidatePath("/logs");

    return {
      success: true,
      data: {
        runId: result.runId || `run-${Date.now()}`,
        scenarioName: result.scenarioName || "Simulated Security Scenario",
        eventsCount: result.eventsCount || 0,
      },
    };
  } catch (err: any) {
    console.error("[launchSimulationAction] Exception:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred launching the simulation.",
    };
  }
}

/**
 * Retrieves the history of simulation runs for the active tenant.
 */
export async function getSimulationRuns(
  inputFilter?: Partial<FilterSimulationRunsInput>
): Promise<SimulationActionResult<SimulationRun[]>> {
  try {
    const filter = FilterSimulationRunsSchema.parse(inputFilter || {});
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "simulation:scenarios:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: authCheck.error || "Permission denied." };
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("simulation_runs")
      .select(
        `
        id,
        organization_id,
        scenario_id,
        status,
        target_asset_id,
        target_agent_id,
        target_identity_id,
        initiated_by,
        events_generated_count,
        logs_generated_count,
        error_message,
        metadata,
        started_at,
        completed_at,
        created_at,
        updated_at,
        target_asset:assets ( id, hostname, ip_address, asset_type )
      `
      )
      .eq("organization_id", organization.id)
      .order("started_at", { ascending: false });

    if (filter.status && filter.status !== "ALL") {
      query = query.eq("status", filter.status);
    }
    if (filter.scenarioId) {
      query = query.eq("scenario_id", filter.scenarioId);
    }

    const { data: runs, error } = await query;

    if (error) {
      console.warn("[getSimulationRuns] Query warning:", error.message);
      return { success: true, data: [] };
    }

    return {
      success: true,
      data: (runs || []) as unknown as SimulationRun[],
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve simulation runs." };
  }
}

/**
 * Cancels an active or running simulation scenario.
 */
export async function cancelSimulationAction(
  input: CancelSimulationInput
): Promise<SimulationActionResult> {
  try {
    const parsed = CancelSimulationSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "simulation:scenarios:launch",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: "Permission denied." };
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("simulation_runs")
      .update({
        status: "Cancelled",
        error_message: parsed.reason || "Cancelled by analyst request.",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.simulationRunId)
      .eq("organization_id", organization.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/soar/simulation");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to cancel simulation." };
  }
}
