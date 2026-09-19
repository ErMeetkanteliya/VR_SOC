import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CANONICAL_PLAYBOOKS,
  CANONICAL_INCIDENTS,
  CANONICAL_INCIDENT_TASKS,
  CANONICAL_INCIDENT_HISTORY,
  CANONICAL_INCIDENT_EVIDENCE,
  CANONICAL_INCIDENT_NOTES,
  calculateIncidentOverviewStats,
  STAGE_LIFECYCLE_ORDER,
  VALID_STAGE_TRANSITIONS,
  isValidStageTransition,
} from "./catalog";
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

export { STAGE_LIFECYCLE_ORDER, VALID_STAGE_TRANSITIONS, isValidStageTransition };

// In-memory development stores for offline / mock testing
const inMemoryIncidents = new Map<string, Incident>();
const inMemoryTasks = new Map<string, IncidentTask>();
const inMemoryHistory = new Map<string, IncidentHistoryItem>();
const inMemoryEvidence = new Map<string, IncidentEvidence>();
const inMemoryNotes = new Map<string, IncidentNote>();

// Seed initial memory stores
for (const inc of CANONICAL_INCIDENTS) {
  inMemoryIncidents.set(inc.id, { ...inc });
}
for (const task of CANONICAL_INCIDENT_TASKS) {
  inMemoryTasks.set(task.id, { ...task });
}
for (const hist of CANONICAL_INCIDENT_HISTORY) {
  inMemoryHistory.set(hist.id, { ...hist });
}
for (const evid of CANONICAL_INCIDENT_EVIDENCE) {
  inMemoryEvidence.set(evid.id, { ...evid });
}
for (const note of CANONICAL_INCIDENT_NOTES) {
  inMemoryNotes.set(note.id, { ...note });
}

let idCounter = 1000;
function generateUniqueId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function matchesTenant(itemOrgId: string, requestedOrgId?: string): boolean {
  if (!requestedOrgId) return true;
  if (itemOrgId === requestedOrgId) return true;
  if (
    (requestedOrgId === "org-cyber-defense-academy" || requestedOrgId === "00000000-0000-0000-0000-000000000001") &&
    (itemOrgId === "org-cyber-defense-academy" || itemOrgId === "00000000-0000-0000-0000-000000000001")
  ) {
    return true;
  }
  return false;
}

// ------------------------------------------------------------------------------
// Incident Retrieval & Query Layer
// ------------------------------------------------------------------------------

export async function getIncidents(
  filter: IncidentFilterParams = {},
  organizationId?: string
): Promise<{ incidents: Incident[]; total: number }> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("incidents").select("*", { count: "exact" });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    if (filter.stage && filter.stage !== "all") {
      query = query.eq("stage", filter.stage);
    }
    if (filter.severity && filter.severity !== "all") {
      query = query.eq("severity", filter.severity);
    }
    if (filter.priority && filter.priority !== "all") {
      query = query.eq("priority", filter.priority);
    }
    if (filter.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,incident_code.ilike.%${filter.search}%`);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error || !data) throw error;

    return { incidents: data as Incident[], total: count || data.length };
  } catch {
    // In-memory fallback
    let list = Array.from(inMemoryIncidents.values());

    if (organizationId) {
      list = list.filter((i) => matchesTenant(i.organization_id, organizationId));
    }
    if (filter.stage && filter.stage !== "all") {
      list = list.filter((i) => i.stage === filter.stage);
    }
    if (filter.severity && filter.severity !== "all") {
      list = list.filter(
        (i) => i.severity.toLowerCase() === (filter.severity as string).toLowerCase()
      );
    }
    if (filter.priority && filter.priority !== "all") {
      list = list.filter((i) => i.priority === filter.priority);
    }
    if (filter.status && filter.status !== "all") {
      list = list.filter(
        (i) => i.status.toLowerCase() === (filter.status as string).toLowerCase()
      );
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.incident_code.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    // Decorate counts
    for (const item of list) {
      const tasks = Array.from(inMemoryTasks.values()).filter((t) => t.incident_id === item.id);
      const evids = Array.from(inMemoryEvidence.values()).filter((e) => e.incident_id === item.id);
      const notes = Array.from(inMemoryNotes.values()).filter((n) => n.incident_id === item.id);
      item.tasks_total = tasks.length;
      item.tasks_completed = tasks.filter((t) => t.status === "completed").length;
      item.evidence_count = evids.length;
      item.notes_count = notes.length;
    }

    const total = list.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginated = list.slice(startIndex, startIndex + pageSize);

    return { incidents: paginated, total };
  }
}

export async function getIncidentById(
  id: string,
  organizationId?: string
): Promise<Incident | null> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("incidents").select("*").eq("id", id);
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    const { data, error } = await query.single();
    if (error || !data) throw error;
    return data as Incident;
  } catch {
    const item = inMemoryIncidents.get(id);
    if (!item) return null;
    if (organizationId && !matchesTenant(item.organization_id, organizationId)) return null;

    // Decorate counts
    const tasks = Array.from(inMemoryTasks.values()).filter((t) => t.incident_id === item.id);
    const evids = Array.from(inMemoryEvidence.values()).filter((e) => e.incident_id === item.id);
    const notes = Array.from(inMemoryNotes.values()).filter((n) => n.incident_id === item.id);
    item.tasks_total = tasks.length;
    item.tasks_completed = tasks.filter((t) => t.status === "completed").length;
    item.evidence_count = evids.length;
    item.notes_count = notes.length;

    return item;
  }
}

// ------------------------------------------------------------------------------
// Incident Creation & Declaration
// ------------------------------------------------------------------------------

export async function createIncident(
  input: CreateIncidentInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  actorName = "SOC Lead"
): Promise<Incident> {
  const codeIndex = inMemoryIncidents.size + 1;
  const incidentCode = `INC-${new Date().getFullYear()}-${String(codeIndex).padStart(3, "0")}`;
  const now = new Date().toISOString();

  let playbookName: string | undefined;
  if (input.playbook_id) {
    const pb = CANONICAL_PLAYBOOKS.find((p) => p.id === input.playbook_id);
    playbookName = pb?.name;
  }

  const newIncident: Incident = {
    id: generateUniqueId("inc"),
    organization_id: organizationId,
    incident_code: incidentCode,
    title: input.title,
    description: input.description || "",
    summary: input.description || input.title,
    severity: input.severity || "High",
    priority: input.priority || "P2",
    stage: input.stage || "Detection",
    status: "Open",
    source_alert_id: input.source_alert_id || null,
    source_alert_ids: input.source_alert_ids || (input.source_alert_id ? [input.source_alert_id] : []),
    assigned_to: input.assigned_to || null,
    assignee_name: input.assignee_name || "Unassigned",
    lead_responder_name: input.assignee_name || actorName,
    affected_assets: input.affected_assets || [],
    affected_identities: input.affected_identities || [],
    mitre_tactics: input.mitre_tactics || [],
    mitre_techniques: input.mitre_techniques || [],
    playbook_id: input.playbook_id || null,
    playbook_name: playbookName || null,
    stage_timestamps: { [input.stage || "Detection"]: now },
    declared_at: now,
    created_at: now,
    updated_at: now,
    tasks_total: 0,
    tasks_completed: 0,
    evidence_count: 0,
    notes_count: 0,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("incidents").insert(newIncident).select().single();
    if (error || !data) throw error;
  } catch {
    inMemoryIncidents.set(newIncident.id, newIncident);
  }

  // Record history
  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: newIncident.id,
    actor_name: actorName,
    action_type: "declared",
    previous_stage: null,
    new_stage: newIncident.stage,
    rationale: `Incident declared with severity ${newIncident.severity} (${newIncident.priority}).`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  // If a playbook is selected, instantiate default tasks
  if (input.playbook_id) {
    await instantiatePlaybookTasks(newIncident.id, input.playbook_id, organizationId);
  }

  return newIncident;
}

export async function declareIncidentFromAlert(
  input: DeclareIncidentFromAlertInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  actorName = "SOC Analyst"
): Promise<Incident> {
  const codeIndex = inMemoryIncidents.size + 1;
  const incidentCode = `INC-${new Date().getFullYear()}-${String(codeIndex).padStart(3, "0")}`;
  const now = new Date().toISOString();

  let playbookId = input.playbook_id || "PB-MAL-001";
  let pb = CANONICAL_PLAYBOOKS.find((p) => p.id === playbookId);

  const title = input.title || `Incident: Escalation from Alert ${input.alert_id}`;

  const newIncident: Incident = {
    id: `inc-${Date.now()}`,
    organization_id: organizationId,
    incident_code: incidentCode,
    title,
    description: input.rationale || `Declared directly from detection alert ${input.alert_id}.`,
    summary: input.rationale || `Alert hand-off into active incident investigation.`,
    severity: input.severity || "High",
    priority: input.priority || "P2",
    stage: "Detection",
    status: "Open",
    source_alert_id: input.alert_id,
    source_alert_ids: [input.alert_id],
    assigned_to: input.assigned_to || null,
    assignee_name: input.assignee_name || actorName,
    lead_responder_name: actorName,
    affected_assets: ["WKSTN-FIN-004"],
    affected_identities: ["jsmith@target-corp.com"],
    mitre_tactics: ["Command and Control"],
    mitre_techniques: ["T1071.001"],
    playbook_id: playbookId,
    playbook_name: pb?.name || "Malware Outbreak Response",
    stage_timestamps: { Detection: now },
    declared_at: now,
    created_at: now,
    updated_at: now,
    tasks_total: 0,
    tasks_completed: 0,
    evidence_count: 1,
    notes_count: 0,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("incidents").insert(newIncident).select().single();
    if (error || !data) throw error;
  } catch {
    inMemoryIncidents.set(newIncident.id, newIncident);
  }

  // Record history
  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: newIncident.id,
    actor_name: actorName,
    action_type: "declared",
    previous_stage: null,
    new_stage: "Detection",
    rationale: input.rationale || `Escalated directly from Alert ${input.alert_id}.`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  // Attach Alert as initial evidence
  const initialEvid: IncidentEvidence = {
    id: generateUniqueId("inc-evid"),
    organization_id: organizationId,
    incident_id: newIncident.id,
    target_type: "alert",
    target_id: input.alert_id,
    summary: `Source Trigger Alert (${input.alert_id})`,
    description: `Alert associated with this incident at declaration time.`,
    confidence: 100,
    metadata: { alert_id: input.alert_id },
    added_by: actorName,
    created_at: now,
  };
  inMemoryEvidence.set(initialEvid.id, initialEvid);

  // Instantiate playbook tasks
  await instantiatePlaybookTasks(newIncident.id, playbookId, organizationId);

  return newIncident;
}

// ------------------------------------------------------------------------------
// Lifecycle State Machine & Updates
// ------------------------------------------------------------------------------

export async function transitionIncidentStage(
  input: TransitionIncidentStageInput,
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<{ success: boolean; incident?: Incident; error?: string }> {
  const incident = inMemoryIncidents.get(input.incident_id);
  if (!incident) {
    return { success: false, error: "Incident not found." };
  }

  const currentStage = incident.stage;
  const nextStage = input.new_stage;

  if (!isValidStageTransition(currentStage, nextStage)) {
    return {
      success: false,
      error: `Invalid lifecycle transition from '${currentStage}' to '${nextStage}'. Allowed transitions: ${VALID_STAGE_TRANSITIONS[currentStage]?.join(", ")}.`,
    };
  }

  const now = new Date().toISOString();
  incident.stage = nextStage;
  incident.stage_timestamps = {
    ...incident.stage_timestamps,
    [nextStage]: now,
  };
  incident.updated_at = now;

  // Status mapping
  if (nextStage === "Containment") {
    incident.status = "Contained";
  } else if (nextStage === "Closed") {
    incident.status = "Closed";
    incident.closed_at = now;
  } else if (incident.status === "Open" && nextStage !== "Detection") {
    incident.status = "In Progress";
  }

  // Update in store
  inMemoryIncidents.set(incident.id, incident);

  // Record audit history item
  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: incident.id,
    actor_name: input.actor_name || "Incident Lead",
    action_type: "stage_transition",
    previous_stage: currentStage,
    new_stage: nextStage,
    rationale: input.rationale || `Advanced lifecycle stage from ${currentStage} to ${nextStage}.`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("incidents").update(incident).eq("id", incident.id);
    await supabase.from("incident_history").insert(historyItem);
  } catch {
    // Offline fallback
  }

  return { success: true, incident };
}

export async function updateIncident(
  id: string,
  input: UpdateIncidentInput,
  organizationId?: string
): Promise<Incident | null> {
  const incident = inMemoryIncidents.get(id);
  if (!incident) return null;
  if (organizationId && incident.organization_id !== organizationId) return null;

  const now = new Date().toISOString();
  if (input.title) incident.title = input.title;
  if (input.description !== undefined) incident.description = input.description;
  if (input.severity) incident.severity = input.severity;
  if (input.priority) incident.priority = input.priority;
  if (input.status) incident.status = input.status;
  if (input.assigned_to !== undefined) incident.assigned_to = input.assigned_to;
  if (input.assignee_name !== undefined) incident.assignee_name = input.assignee_name;
  if (input.affected_assets) incident.affected_assets = input.affected_assets;
  if (input.affected_identities) incident.affected_identities = input.affected_identities;
  incident.updated_at = now;

  inMemoryIncidents.set(incident.id, incident);

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("incidents").update(incident).eq("id", id);
  } catch {
    // Offline
  }

  return incident;
}

export async function assignIncident(
  id: string,
  assignedTo: string | null,
  assigneeName: string,
  actorName = "SOC Lead",
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<Incident | null> {
  const incident = inMemoryIncidents.get(id);
  if (!incident) return null;

  const now = new Date().toISOString();
  incident.assigned_to = assignedTo;
  incident.assignee_name = assigneeName;
  incident.updated_at = now;

  inMemoryIncidents.set(incident.id, incident);

  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: incident.id,
    actor_name: actorName,
    action_type: "assignment",
    rationale: `Incident assigned to ${assigneeName || "Unassigned"}.`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  return incident;
}

export async function closeIncident(
  input: CloseIncidentInput,
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<Incident | null> {
  const incident = inMemoryIncidents.get(input.incident_id);
  if (!incident) return null;

  const now = new Date().toISOString();
  const previousStage = incident.stage;

  incident.stage = "Closed";
  incident.status = "Closed";
  incident.closed_at = now;
  incident.closure_reason = input.closure_reason;
  incident.closure_notes = input.closure_notes || "";
  incident.stage_timestamps = {
    ...incident.stage_timestamps,
    Closed: now,
  };
  incident.updated_at = now;

  inMemoryIncidents.set(incident.id, incident);

  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: incident.id,
    actor_name: input.actor_name || "Incident Lead",
    action_type: "closed",
    previous_stage: previousStage,
    new_stage: "Closed",
    rationale: `Incident closed. Reason: ${input.closure_reason}`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  return incident;
}

// ------------------------------------------------------------------------------
// Incident Playbooks & Tasks
// ------------------------------------------------------------------------------

export async function getIncidentPlaybooks(): Promise<IncidentPlaybook[]> {
  return CANONICAL_PLAYBOOKS;
}

export async function getIncidentTasks(
  incidentId: string,
  organizationId?: string
): Promise<IncidentTask[]> {
  const tasks = Array.from(inMemoryTasks.values()).filter((t) => t.incident_id === incidentId);
  if (organizationId) {
    return tasks
      .filter((t) => matchesTenant(t.organization_id, organizationId))
      .sort((a, b) => a.order_index - b.order_index);
  }
  return tasks.sort((a, b) => a.order_index - b.order_index);
}

export async function createIncidentTask(
  input: CreateIncidentTaskInput,
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<IncidentTask> {
  const now = new Date().toISOString();
  const newTask: IncidentTask = {
    id: generateUniqueId("task"),
    organization_id: organizationId,
    incident_id: input.incident_id,
    stage: input.stage,
    title: input.title,
    description: input.description || "",
    status: "pending",
    order_index: input.order_index ?? (inMemoryTasks.size + 1),
    assigned_to: input.assigned_to || null,
    created_at: now,
    updated_at: now,
  };

  inMemoryTasks.set(newTask.id, newTask);

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("incident_tasks").insert(newTask);
  } catch {
    // Offline
  }

  return newTask;
}

export async function updateIncidentTask(
  input: UpdateIncidentTaskInput,
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<IncidentTask | null> {
  const task = inMemoryTasks.get(input.id);
  if (!task) return null;

  const now = new Date().toISOString();
  if (input.status) {
    task.status = input.status;
    if (input.status === "completed") {
      task.completed_at = now;
      task.completed_by = input.completed_by || "SOC Analyst";
    }
  }
  if (input.notes !== undefined) task.notes = input.notes;
  if (input.assigned_to !== undefined) task.assigned_to = input.assigned_to;
  task.updated_at = now;

  inMemoryTasks.set(task.id, task);

  // Record task history update
  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: task.incident_id,
    actor_name: input.completed_by || "SOC Analyst",
    action_type: "task_update",
    rationale: `Task '${task.title}' marked as ${task.status}.`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  return task;
}

export async function instantiatePlaybookTasks(
  incidentId: string,
  playbookId: string,
  organizationId = "00000000-0000-0000-0000-000000000001"
): Promise<IncidentTask[]> {
  const pb = CANONICAL_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!pb) return [];

  const now = new Date().toISOString();
  const createdTasks: IncidentTask[] = [];

  for (const def of pb.default_tasks) {
    const task: IncidentTask = {
      id: generateUniqueId(`task-${incidentId}-${def.id}`),
      organization_id: organizationId,
      incident_id: incidentId,
      playbook_id: playbookId,
      stage: def.stage,
      title: def.title,
      description: def.description,
      status: "pending",
      order_index: def.order_index,
      created_at: now,
      updated_at: now,
    };
    inMemoryTasks.set(task.id, task);
    createdTasks.push(task);
  }

  return createdTasks;
}

// ------------------------------------------------------------------------------
// History, Evidence & Notes
// ------------------------------------------------------------------------------

export async function getIncidentHistory(
  incidentId: string,
  organizationId?: string
): Promise<IncidentHistoryItem[]> {
  const list = Array.from(inMemoryHistory.values()).filter((h) => h.incident_id === incidentId);
  if (organizationId) {
    return list
      .filter((h) => matchesTenant(h.organization_id, organizationId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getIncidentEvidence(
  incidentId: string,
  organizationId?: string
): Promise<IncidentEvidence[]> {
  const list = Array.from(inMemoryEvidence.values()).filter((e) => e.incident_id === incidentId);
  if (organizationId) {
    return list
      .filter((e) => matchesTenant(e.organization_id, organizationId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createIncidentEvidence(
  input: CreateIncidentEvidenceInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  addedBy = "Incident Responder"
): Promise<IncidentEvidence> {
  const now = new Date().toISOString();
  const newEvid: IncidentEvidence = {
    id: generateUniqueId("inc-evid"),
    organization_id: organizationId,
    incident_id: input.incident_id,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    description: input.description || "",
    confidence: input.confidence ?? 90,
    metadata: input.metadata || {},
    added_by: addedBy,
    created_at: now,
  };

  inMemoryEvidence.set(newEvid.id, newEvid);

  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: input.incident_id,
    actor_name: addedBy,
    action_type: "evidence_attached",
    rationale: `Attached ${input.target_type} evidence: ${input.summary}`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  return newEvid;
}

export async function deleteIncidentEvidence(
  id: string,
  organizationId?: string
): Promise<boolean> {
  const item = inMemoryEvidence.get(id);
  if (!item) return false;
  if (organizationId && !matchesTenant(item.organization_id, organizationId)) return false;

  inMemoryEvidence.delete(id);
  return true;
}

export async function getIncidentNotes(
  incidentId: string,
  organizationId?: string
): Promise<IncidentNote[]> {
  const list = Array.from(inMemoryNotes.values()).filter((n) => n.incident_id === incidentId);
  if (organizationId) {
    return list
      .filter((n) => matchesTenant(n.organization_id, organizationId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createIncidentNote(
  input: CreateIncidentNoteInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  authorName = "Incident Responder"
): Promise<IncidentNote> {
  const now = new Date().toISOString();
  const newNote: IncidentNote = {
    id: generateUniqueId("inc-note"),
    organization_id: organizationId,
    incident_id: input.incident_id,
    author_name: authorName,
    content: input.content,
    tags: input.tags || [],
    created_at: now,
    updated_at: now,
  };

  inMemoryNotes.set(newNote.id, newNote);

  const historyItem: IncidentHistoryItem = {
    id: generateUniqueId("hist"),
    organization_id: organizationId,
    incident_id: input.incident_id,
    actor_name: authorName,
    action_type: "note_added",
    rationale: `Analyst note added.`,
    created_at: now,
  };
  inMemoryHistory.set(historyItem.id, historyItem);

  return newNote;
}

export async function deleteIncidentNote(
  id: string,
  organizationId?: string
): Promise<boolean> {
  const item = inMemoryNotes.get(id);
  if (!item) return false;
  if (organizationId && !matchesTenant(item.organization_id, organizationId)) return false;

  inMemoryNotes.delete(id);
  return true;
}

export async function getIncidentOverviewStats(organizationId?: string): Promise<IncidentOverviewStats> {
  let list = Array.from(inMemoryIncidents.values());
  if (organizationId) {
    list = list.filter((i) => matchesTenant(i.organization_id, organizationId));
  }
  return calculateIncidentOverviewStats(list);
}
