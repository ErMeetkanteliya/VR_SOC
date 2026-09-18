"use server";

/**
 * Phase 19: MITRE ATT&CK Server Actions
 *
 * Implements tenant-scoped, RBAC-protected actions for querying MITRE tactics,
 * techniques, sub-technique details, detection rule mappings, and coverage metrics.
 */

import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import {
  getMitreTactics,
  getMitreTechniques,
  getMitreTechniqueById,
  getMitreCoverage,
} from "./mitre-service";
import {
  MitreTechniqueFilterSchema,
  type MitreTechniqueFilterInput,
} from "@vrsoc/validation";
import type {
  MitreTactic,
  MitreTechnique,
  MitreTechniqueDetail,
  MitreCoverageStats,
} from "@vrsoc/types";

export interface MitreActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Retrieves all 14 MITRE Tactics with technique counts.
 */
export async function getMitreTacticsAction(): Promise<MitreActionResult<MitreTactic[]>> {
  try {
    const { organization } = await getActiveOrganization();
    if (organization) {
      const auth = await authorizePermission({
        organizationId: organization.id,
        permission: "mitre:read",
      });
      if (!auth.authorized) {
        return { success: false, error: auth.error || "Unauthorized to access MITRE intelligence." };
      }
    }

    const tactics = await getMitreTactics();
    return { success: true, data: tactics };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load MITRE tactics.",
    };
  }
}

/**
 * Retrieves filtered & paginated MITRE techniques & sub-techniques.
 */
export async function getMitreTechniquesAction(
  filters?: MitreTechniqueFilterInput
): Promise<
  MitreActionResult<{
    techniques: MitreTechnique[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const { organization } = await getActiveOrganization();
    if (organization) {
      const auth = await authorizePermission({
        organizationId: organization.id,
        permission: "mitre:read",
      });
      if (!auth.authorized) {
        return { success: false, error: auth.error || "Unauthorized to access MITRE intelligence." };
      }
    }

    const validatedFilters = filters ? MitreTechniqueFilterSchema.parse(filters) : {};
    const result = await getMitreTechniques(validatedFilters, organization?.id);
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load MITRE techniques.",
    };
  }
}

/**
 * Retrieves comprehensive detail for a single MITRE Technique by ID.
 */
export async function getMitreTechniqueDetailAction(
  techniqueId: string
): Promise<MitreActionResult<MitreTechniqueDetail | null>> {
  try {
    if (!techniqueId || !techniqueId.trim()) {
      return { success: false, error: "Technique ID is required." };
    }

    const { organization } = await getActiveOrganization();
    if (organization) {
      const auth = await authorizePermission({
        organizationId: organization.id,
        permission: "mitre:read",
      });
      if (!auth.authorized) {
        return { success: false, error: auth.error || "Unauthorized to access MITRE intelligence." };
      }
    }

    const detail = await getMitreTechniqueById(techniqueId, organization?.id);
    if (!detail) {
      return { success: false, error: `MITRE technique '${techniqueId}' not found.` };
    }

    return { success: true, data: detail };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load MITRE technique detail.",
    };
  }
}

/**
 * Calculates current MITRE ATT&CK coverage statistics for the active tenant.
 */
export async function getMitreCoverageAction(): Promise<MitreActionResult<MitreCoverageStats>> {
  try {
    const { organization } = await getActiveOrganization();
    if (organization) {
      const auth = await authorizePermission({
        organizationId: organization.id,
        permission: "mitre:read",
      });
      if (!auth.authorized) {
        return { success: false, error: auth.error || "Unauthorized to access MITRE coverage." };
      }
    }

    const stats = await getMitreCoverage(organization?.id);
    return { success: true, data: stats };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to calculate MITRE coverage.",
    };
  }
}
