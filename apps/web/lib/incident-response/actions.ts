"use server";

import { cookies } from "next/headers";
import { requirePermission } from "@/lib/rbac/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  getIncidents,
  getIncidentById,
  createIncident,
  declareIncidentFromAlert,
  updateIncident,
  transitionIncidentStage,
  assignIncident,
  closeIncident,
  getIncidentPlaybooks,
  getIncidentTasks,
  createIncidentTask,
  updateIncidentTask,
  getIncidentHistory,
  getIncidentEvidence,
  createIncidentEvidence,
  deleteIncidentEvidence,
  getIncidentNotes,
  createIncidentNote,
  deleteIncidentNote,
  getIncidentOverviewStats,
} from "./incident-service";
import {
  IncidentFilterParamsSchema,
  CreateIncidentInputSchema,
  DeclareIncidentFromAlertInputSchema,
  UpdateIncidentInputSchema,
  TransitionIncidentStageInputSchema,
  CreateIncidentTaskInputSchema,
  UpdateIncidentTaskInputSchema,
  CreateIncidentEvidenceInputSchema,
  CreateIncidentNoteInputSchema,
  CloseIncidentInputSchema,
} from "@vrsoc/validation";
import type {
  Incident,
  IncidentPlaybook,
  IncidentTask,
  IncidentHistoryItem,
  IncidentEvidence,
  IncidentNote,
  IncidentFilterParams,
  IncidentOverviewStats,
  CreateIncidentInput,
  DeclareIncidentFromAlertInput,
  UpdateIncidentInput,
  TransitionIncidentStageInput,
  CreateIncidentTaskInput,
  UpdateIncidentTaskInput,
  CreateIncidentEvidenceInput,
  CreateIncidentNoteInput,
  CloseIncidentInput,
} from "@vrsoc/types";

// ------------------------------------------------------------------------------
// Incidents Queries & Mutations
// ------------------------------------------------------------------------------

export async function fetchIncidentsAction(
  filter: IncidentFilterParams = {}
): Promise<{ success: boolean; data?: { incidents: Incident[]; total: number }; error?: string }> {
  try {
    const validated = IncidentFilterParamsSchema.parse(filter);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidents(validated, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incidents.";
    return { success: false, error: message };
  }
}

export async function fetchIncidentByIdAction(
  id: string
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentById(id, orgId);
    if (!data) return { success: false, error: "Incident not found." };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident details.";
    return { success: false, error: message };
  }
}

export async function createIncidentAction(
  input: CreateIncidentInput
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const validated = CreateIncidentInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:create" });
    }

    const data = await createIncident(validated as CreateIncidentInput, orgId, "SOC Lead");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create incident.";
    return { success: false, error: message };
  }
}

export async function declareIncidentFromAlertAction(
  input: DeclareIncidentFromAlertInput
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const validated = DeclareIncidentFromAlertInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:create" });
    }

    const data = await declareIncidentFromAlert(validated as DeclareIncidentFromAlertInput, orgId, "SOC Analyst");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to declare incident from alert.";
    return { success: false, error: message };
  }
}

export async function updateIncidentAction(
  id: string,
  input: UpdateIncidentInput
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const validated = UpdateIncidentInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:update_status" });
    }

    const data = await updateIncident(id, validated as UpdateIncidentInput, orgId);
    if (!data) return { success: false, error: "Incident not found." };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update incident.";
    return { success: false, error: message };
  }
}

export async function transitionIncidentStageAction(
  input: TransitionIncidentStageInput
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const validated = TransitionIncidentStageInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:stage" });
    }

    const res = await transitionIncidentStage(validated as TransitionIncidentStageInput, orgId);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to transition incident stage." };
    }
    return { success: true, data: res.incident };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to transition incident stage.";
    return { success: false, error: message };
  }
}

export async function assignIncidentAction(
  id: string,
  assigneeId?: string,
  assigneeName?: string
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:assign" });
    }

    const data = await assignIncident(
      id,
      assigneeId || null,
      assigneeName || "Unassigned",
      "SOC Lead",
      orgId
    );
    if (!data) return { success: false, error: "Incident not found." };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to assign incident.";
    return { success: false, error: message };
  }
}

export async function closeIncidentAction(
  input: CloseIncidentInput
): Promise<{ success: boolean; data?: Incident; error?: string }> {
  try {
    const validated = CloseIncidentInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:close" });
    }

    const data = await closeIncident(validated as CloseIncidentInput, orgId);
    if (!data) return { success: false, error: "Incident not found." };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to close incident.";
    return { success: false, error: message };
  }
}

// ------------------------------------------------------------------------------
// Tasks & Playbooks Actions
// ------------------------------------------------------------------------------

export async function fetchIncidentTasksAction(
  incidentId: string
): Promise<{ success: boolean; data?: IncidentTask[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentTasks(incidentId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident tasks.";
    return { success: false, error: message };
  }
}

export async function createIncidentTaskAction(
  input: CreateIncidentTaskInput
): Promise<{ success: boolean; data?: IncidentTask; error?: string }> {
  try {
    const validated = CreateIncidentTaskInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:task" });
    }

    const data = await createIncidentTask(validated as CreateIncidentTaskInput, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create incident task.";
    return { success: false, error: message };
  }
}

export async function updateIncidentTaskAction(
  input: UpdateIncidentTaskInput
): Promise<{ success: boolean; data?: IncidentTask; error?: string }> {
  try {
    const validated = UpdateIncidentTaskInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:task" });
    }

    const data = await updateIncidentTask(validated as UpdateIncidentTaskInput, orgId);
    if (!data) return { success: false, error: "Task not found." };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update incident task.";
    return { success: false, error: message };
  }
}

export async function fetchIncidentPlaybooksAction(): Promise<{
  success: boolean;
  data?: IncidentPlaybook[];
  error?: string;
}> {
  try {
    const data = await getIncidentPlaybooks();
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch playbooks.";
    return { success: false, error: message };
  }
}

// ------------------------------------------------------------------------------
// History, Evidence & Notes Actions
// ------------------------------------------------------------------------------

export async function fetchIncidentHistoryAction(
  incidentId: string
): Promise<{ success: boolean; data?: IncidentHistoryItem[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentHistory(incidentId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident history.";
    return { success: false, error: message };
  }
}

export async function fetchIncidentEvidenceAction(
  incidentId: string
): Promise<{ success: boolean; data?: IncidentEvidence[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentEvidence(incidentId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident evidence.";
    return { success: false, error: message };
  }
}

export async function createIncidentEvidenceAction(
  input: CreateIncidentEvidenceInput
): Promise<{ success: boolean; data?: IncidentEvidence; error?: string }> {
  try {
    const validated = CreateIncidentEvidenceInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:evidence" });
    }

    const data = await createIncidentEvidence(validated as CreateIncidentEvidenceInput, orgId, "Incident Responder");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to attach incident evidence.";
    return { success: false, error: message };
  }
}

export async function deleteIncidentEvidenceAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:evidence" });
    }

    const success = await deleteIncidentEvidence(id, orgId);
    return { success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete incident evidence.";
    return { success: false, error: message };
  }
}

export async function fetchIncidentNotesAction(
  incidentId: string
): Promise<{ success: boolean; data?: IncidentNote[]; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentNotes(incidentId, orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident notes.";
    return { success: false, error: message };
  }
}

export async function createIncidentNoteAction(
  input: CreateIncidentNoteInput
): Promise<{ success: boolean; data?: IncidentNote; error?: string }> {
  try {
    const validated = CreateIncidentNoteInputSchema.parse(input);
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id || "00000000-0000-0000-0000-000000000001";
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:note" });
    }

    const data = await createIncidentNote(validated as CreateIncidentNoteInput, orgId, "Incident Responder");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create incident note.";
    return { success: false, error: message };
  }
}

export async function deleteIncidentNoteAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:note" });
    }

    const success = await deleteIncidentNote(id, orgId);
    return { success };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete incident note.";
    return { success: false, error: message };
  }
}

export async function fetchIncidentOverviewStatsAction(): Promise<{
  success: boolean;
  data?: IncidentOverviewStats;
  error?: string;
}> {
  try {
    const { organization } = await getActiveOrganization();
    const orgId = organization?.id;
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);

    if (orgId && !isE2ESession) {
      await requirePermission({ organizationId: orgId, permission: "incidents:read" });
    }

    const data = await getIncidentOverviewStats(orgId);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch overview stats.";
    return { success: false, error: message };
  }
}
