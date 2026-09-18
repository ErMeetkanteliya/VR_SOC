"use server";

import { cookies } from "next/headers";
import { requirePermission } from "@/lib/rbac/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  executeHuntQuery,
  getHuntSessions,
  getHuntSessionById,
  createHuntSession,
  getHuntEvidence,
  createHuntEvidence,
  deleteHuntEvidence,
  getHuntNotes,
  createHuntNote,
  deleteHuntNote,
} from "./hunting-service";
import {
  HuntQueryInputSchema,
  CreateHuntSessionInputSchema,
  CreateHuntEvidenceInputSchema,
  CreateHuntNoteInputSchema,
} from "@vrsoc/validation";
import type {
  HuntQueryInput,
  HuntQueryResult,
  HuntSession,
  HuntEvidence,
  HuntNote,
  CreateHuntSessionInput,
  CreateHuntEvidenceInput,
  CreateHuntNoteInput,
} from "@vrsoc/types";

/**
 * Server Action: Executes a structured Threat Hunting query across correlated datasets
 */
export async function executeHuntQueryAction(
  input: HuntQueryInput
): Promise<{ success: boolean; data?: HuntQueryResult; error?: string }> {
  try {
    const validatedInput = HuntQueryInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:execute",
      });
    }

    const data = await executeHuntQuery(validatedInput as HuntQueryInput, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute threat hunt query.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches all saved Hunt Sessions
 */
export async function fetchHuntSessionsAction(): Promise<{
  success: boolean;
  data?: HuntSession[];
  error?: string;
}> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:read",
      });
    }

    const data = await getHuntSessions(orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch hunt sessions.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches a single Hunt Session by ID
 */
export async function fetchHuntSessionDetailAction(
  id: string
): Promise<{ success: boolean; data?: HuntSession | null; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:read",
      });
    }

    const data = await getHuntSessionById(id, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch hunt session details.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Saves or creates a Hunt Session
 */
export async function createHuntSessionAction(
  input: CreateHuntSessionInput
): Promise<{ success: boolean; data?: HuntSession; error?: string }> {
  try {
    const validatedInput = CreateHuntSessionInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const analystName = "SOC Hunter";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:save",
      });
    }

    const data = await createHuntSession(validatedInput as CreateHuntSessionInput, orgId, analystName);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save hunt session.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches collected evidence for a hunt
 */
export async function fetchHuntEvidenceAction(
  huntId?: string
): Promise<{ success: boolean; data?: HuntEvidence[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:read",
      });
    }

    const data = await getHuntEvidence(huntId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch hunt evidence.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Adds an evidence reference to an active hunt
 */
export async function createHuntEvidenceAction(
  input: CreateHuntEvidenceInput
): Promise<{ success: boolean; data?: HuntEvidence; error?: string }> {
  try {
    const validatedInput = CreateHuntEvidenceInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const addedBy = "SOC Hunter";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:evidence",
      });
    }

    const data = await createHuntEvidence(validatedInput as CreateHuntEvidenceInput, orgId, addedBy);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add investigation evidence.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Removes an evidence item
 */
export async function deleteHuntEvidenceAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:evidence",
      });
    }

    const success = await deleteHuntEvidence(id, orgId);
    return { success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete evidence item.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetches analyst notes for an active hunt
 */
export async function fetchHuntNotesAction(
  huntId?: string
): Promise<{ success: boolean; data?: HuntNote[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:read",
      });
    }

    const data = await getHuntNotes(huntId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analyst notes.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Adds an analyst note
 */
export async function createHuntNoteAction(
  input: CreateHuntNoteInput
): Promise<{ success: boolean; data?: HuntNote; error?: string }> {
  try {
    const validatedInput = CreateHuntNoteInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const authorName = "SOC Hunter";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:note",
      });
    }

    const data = await createHuntNote(validatedInput as CreateHuntNoteInput, orgId, authorName);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add analyst note.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deletes an analyst note
 */
export async function deleteHuntNoteAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (!isE2ESession) {
      await requirePermission({
        organizationId: orgId,
        permission: "threat_hunting:note",
      });
    }

    const success = await deleteHuntNote(id, orgId);
    return { success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete analyst note.";
    return { success: false, error: message };
  }
}
