"use client";

import React, { useState } from "react";
import { IncidentHeader } from "./IncidentHeader";
import { IncidentKpis } from "./IncidentKpis";
import { IncidentQueueTable } from "./IncidentQueueTable";
import { IncidentDetailWorkspace } from "./IncidentDetailWorkspace";
import { DeclareIncidentModal } from "./DeclareIncidentModal";
import {
  fetchIncidentsAction,
  createIncidentAction,
  transitionIncidentStageAction,
  createIncidentTaskAction,
  updateIncidentTaskAction,
  createIncidentEvidenceAction,
  deleteIncidentEvidenceAction,
  createIncidentNoteAction,
  deleteIncidentNoteAction,
} from "@/lib/incident-response/actions";
import type {
  Incident,
  IncidentStage,
  IncidentPlaybook,
  IncidentTask,
  IncidentHistoryItem,
  IncidentEvidence,
  IncidentNote,
  IncidentOverviewStats,
  IncidentTaskStatus,
  SeverityLevel,
  IncidentPriority,
  CreateIncidentEvidenceInput,
  CreateIncidentNoteInput,
} from "@vrsoc/types";

interface IncidentCenterWorkbenchProps {
  initialIncidents: Incident[];
  initialTotal: number;
  initialStats: IncidentOverviewStats;
  initialPlaybooks: IncidentPlaybook[];
  initialTasks?: IncidentTask[];
  initialHistory?: IncidentHistoryItem[];
  initialEvidence?: IncidentEvidence[];
  initialNotes?: IncidentNote[];
  selectedIncidentId?: string;
  organizationId?: string;
}

export const IncidentCenterWorkbench: React.FC<IncidentCenterWorkbenchProps> = ({
  initialIncidents,
  initialTotal,
  initialStats,
  initialPlaybooks,
  initialTasks = [],
  initialHistory = [],
  initialEvidence = [],
  initialNotes = [],
  selectedIncidentId,
}) => {
  // Queue & State Management
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [total, setTotal] = useState<number>(initialTotal);
  const [stats, setStats] = useState<IncidentOverviewStats>(initialStats);
  const [playbooks] = useState<IncidentPlaybook[]>(initialPlaybooks);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Active Detail Incident
  const initialActive = selectedIncidentId
    ? initialIncidents.find((i) => i.id === selectedIncidentId || i.incident_code === selectedIncidentId) || null
    : null;

  const [activeIncident, setActiveIncident] = useState<Incident | null>(initialActive);

  // Active Incident Sub-Entities
  const [tasks, setTasks] = useState<IncidentTask[]>(initialTasks);
  const [history, setHistory] = useState<IncidentHistoryItem[]>(initialHistory);
  const [evidence, setEvidence] = useState<IncidentEvidence[]>(initialEvidence);
  const [notes, setNotes] = useState<IncidentNote[]>(initialNotes);

  // Modals
  const [declareModalOpen, setDeclareModalOpen] = useState(false);

  // Filter change handler
  const handleFilterChange = async (
    newSearch = search,
    newStage = selectedStage,
    newSeverity = selectedSeverity,
    newPriority = selectedPriority
  ) => {
    const res = await fetchIncidentsAction({
      search: newSearch.trim() || undefined,
      stage: newStage as any,
      severity: newSeverity as any,
      priority: newPriority as any,
    });
    if (res.success && res.data) {
      setIncidents(res.data.incidents);
      setTotal(res.data.total);
    }
  };

  // Select incident to view detail
  const handleSelectIncident = (incident: Incident) => {
    setActiveIncident(incident);
  };

  // Declare Incident
  const handleDeclareIncident = async (data: {
    title: string;
    description: string;
    severity: SeverityLevel;
    priority: IncidentPriority;
    playbook_id?: string;
    source_alert_id?: string;
  }): Promise<boolean> => {
    const res = await createIncidentAction(data);
    if (res.success && res.data) {
      const created = res.data;
      setIncidents((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      setStats((prev) => ({
        ...prev,
        total_incidents: prev.total_incidents + 1,
        active_incidents: prev.active_incidents + 1,
        critical_p1:
          created.severity === "Critical" || created.priority === "P1"
            ? prev.critical_p1 + 1
            : prev.critical_p1,
      }));
      setActiveIncident(created);
      return true;
    }
    return false;
  };

  // Transition Lifecycle Stage
  const handleTransitionStage = async (newStage: IncidentStage, rationale: string): Promise<boolean> => {
    if (!activeIncident) return false;
    const res = await transitionIncidentStageAction({
      incident_id: activeIncident.id,
      new_stage: newStage,
      rationale,
      actor_name: "SOC Lead",
    });

    if (res.success && res.data) {
      const updated = res.data;
      setActiveIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

      // Add to local history timeline
      const newHist: IncidentHistoryItem = {
        id: `hist-${Date.now()}`,
        organization_id: updated.organization_id,
        incident_id: updated.id,
        actor_name: "SOC Lead",
        action_type: "stage_transition",
        previous_stage: activeIncident.stage,
        new_stage: newStage,
        rationale,
        created_at: new Date().toISOString(),
      };
      setHistory((prev) => [newHist, ...prev]);

      // Update stats
      if (newStage === "Containment") {
        setStats((prev) => ({ ...prev, in_containment: prev.in_containment + 1 }));
      } else if (newStage === "Closed") {
        setStats((prev) => ({
          ...prev,
          active_incidents: Math.max(0, prev.active_incidents - 1),
          resolved_today: prev.resolved_today + 1,
        }));
      }

      return true;
    }
    return false;
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, status: IncidentTaskStatus): Promise<boolean> => {
    const res = await updateIncidentTaskAction({
      id: taskId,
      status,
      completed_by: "SOC Lead",
    });
    if (res.success && res.data) {
      const updatedTask = res.data;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return true;
    }
    return false;
  };

  // Create Custom Task
  const handleCreateTask = async (
    stage: IncidentStage,
    title: string,
    description?: string
  ): Promise<boolean> => {
    if (!activeIncident) return false;
    const res = await createIncidentTaskAction({
      incident_id: activeIncident.id,
      stage,
      title,
      description,
    });
    if (res.success && res.data) {
      setTasks((prev) => [...prev, res.data!]);
      return true;
    }
    return false;
  };

  // Add Evidence
  const handleAddEvidence = async (input: CreateIncidentEvidenceInput): Promise<boolean> => {
    if (!activeIncident) return false;
    const res = await createIncidentEvidenceAction({
      ...input,
      incident_id: activeIncident.id,
    });
    if (res.success && res.data) {
      setEvidence((prev) => [res.data!, ...prev]);
      return true;
    }
    return false;
  };

  // Delete Evidence
  const handleDeleteEvidence = async (id: string): Promise<boolean> => {
    const res = await deleteIncidentEvidenceAction(id);
    if (res.success) {
      setEvidence((prev) => prev.filter((e) => e.id !== id));
      return true;
    }
    return false;
  };

  // Create Note
  const handleCreateNote = async (input: CreateIncidentNoteInput): Promise<boolean> => {
    if (!activeIncident) return false;
    const res = await createIncidentNoteAction({
      ...input,
      incident_id: activeIncident.id,
    });
    if (res.success && res.data) {
      setNotes((prev) => [res.data!, ...prev]);
      return true;
    }
    return false;
  };

  // Delete Note
  const handleDeleteNote = async (id: string): Promise<boolean> => {
    const res = await deleteIncidentNoteAction(id);
    if (res.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    }
    return false;
  };

  return (
    <div className="w-full space-y-6 pb-12" data-testid="incident-workbench">
      {/* 1. Page Header */}
      <IncidentHeader
        stats={stats}
        onOpenDeclareModal={() => setDeclareModalOpen(true)}
        selectedIncidentCode={activeIncident?.incident_code}
        onBackToQueue={() => setActiveIncident(null)}
      />

      {/* 2. Top KPI Cards */}
      <IncidentKpis stats={stats} />

      {/* 3. Main Workspace Display: Queue vs Detail Dossier */}
      {activeIncident ? (
        <IncidentDetailWorkspace
          incident={activeIncident}
          tasks={tasks}
          history={history}
          evidence={evidence}
          notes={notes}
          onTransitionStage={handleTransitionStage}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onCreateTask={handleCreateTask}
          onAddEvidence={handleAddEvidence}
          onDeleteEvidence={handleDeleteEvidence}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <IncidentQueueTable
          incidents={incidents}
          total={total}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            handleFilterChange(val, selectedStage, selectedSeverity, selectedPriority);
          }}
          selectedStage={selectedStage}
          onStageChange={(val) => {
            setSelectedStage(val);
            handleFilterChange(search, val, selectedSeverity, selectedPriority);
          }}
          selectedSeverity={selectedSeverity}
          onSeverityChange={(val) => {
            setSelectedSeverity(val);
            handleFilterChange(search, selectedStage, val, selectedPriority);
          }}
          selectedPriority={selectedPriority}
          onPriorityChange={(val) => {
            setSelectedPriority(val);
            handleFilterChange(search, selectedStage, selectedSeverity, val);
          }}
          onSelectIncident={handleSelectIncident}
        />
      )}

      {/* 4. Declare Incident Modal */}
      <DeclareIncidentModal
        isOpen={declareModalOpen}
        onClose={() => setDeclareModalOpen(false)}
        playbooks={playbooks}
        onDeclare={handleDeclareIncident}
      />
    </div>
  );
};
