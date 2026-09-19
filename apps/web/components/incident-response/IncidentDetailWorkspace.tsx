"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  User,
  ExternalLink,
  BookOpen,
  FileCheck,
  MessageSquare,
  History,
  Activity,
  Layers,
  Crosshair,
  FileText,
} from "lucide-react";
import { StageLifecycleStepper } from "./StageLifecycleStepper";
import { IncidentPlaybookPanel } from "./IncidentPlaybookPanel";
import { IncidentEvidencePanel } from "./IncidentEvidencePanel";
import { IncidentNotesPanel } from "./IncidentNotesPanel";
import { IncidentHistoryTimeline } from "./IncidentHistoryTimeline";
import { StageTransitionModal } from "./StageTransitionModal";
import type {
  Incident,
  IncidentStage,
  IncidentTask,
  IncidentHistoryItem,
  IncidentEvidence,
  IncidentNote,
  IncidentTaskStatus,
  CreateIncidentEvidenceInput,
  CreateIncidentNoteInput,
} from "@vrsoc/types";

interface IncidentDetailWorkspaceProps {
  incident: Incident;
  tasks: IncidentTask[];
  history: IncidentHistoryItem[];
  evidence: IncidentEvidence[];
  notes: IncidentNote[];
  onTransitionStage: (newStage: IncidentStage, rationale: string) => Promise<boolean>;
  onUpdateTaskStatus: (taskId: string, status: IncidentTaskStatus) => Promise<boolean>;
  onCreateTask: (stage: IncidentStage, title: string, description?: string) => Promise<boolean>;
  onAddEvidence: (input: CreateIncidentEvidenceInput) => Promise<boolean>;
  onDeleteEvidence: (id: string) => Promise<boolean>;
  onCreateNote: (input: CreateIncidentNoteInput) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
  onCloseIncident?: () => void;
  disabled?: boolean;
}

export const IncidentDetailWorkspace: React.FC<IncidentDetailWorkspaceProps> = ({
  incident,
  tasks,
  history,
  evidence,
  notes,
  onTransitionStage,
  onUpdateTaskStatus,
  onCreateTask,
  onAddEvidence,
  onDeleteEvidence,
  onCreateNote,
  onDeleteNote,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    "playbook" | "evidence" | "notes" | "history" | "pivots"
  >("playbook");
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetTransitionStage, setTargetTransitionStage] = useState<IncidentStage | undefined>();

  const handleOpenTransitionModal = (targetStage?: IncidentStage) => {
    setTargetTransitionStage(targetStage);
    setTransitionModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="incident-detail-workspace">
      {/* 1. Lifecycle Stage Progress Stepper */}
      <StageLifecycleStepper
        incident={incident}
        onOpenTransitionModal={handleOpenTransitionModal}
        disabled={disabled}
      />

      {/* 2. Incident Summary & Identity Overview Card */}
      <div className="p-5 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                {incident.incident_code}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {incident.title}
              </h2>
            </div>
            {incident.description && (
              <p className="text-xs text-white/70 leading-relaxed max-w-4xl">
                {incident.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {incident.source_alert_id && (
              <Link
                href={`/alerts?id=${incident.source_alert_id}`}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Source Alert ({incident.source_alert_id})</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Key Entity Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-white/40">Incident Lead</span>
            <div className="flex items-center gap-1.5 text-white/90 font-medium">
              <User className="w-3.5 h-3.5 text-white/40" />
              <span className="truncate">{incident.assignee_name || "Unassigned"}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-white/40">Affected Assets</span>
            <div className="flex flex-wrap gap-1">
              {incident.affected_assets.map((a, i) => (
                <span key={i} className="font-mono text-[11px] text-cyan-300">
                  {a}
                </span>
              ))}
              {incident.affected_assets.length === 0 && (
                <span className="text-white/30 italic">None logged</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-white/40">Affected Identities</span>
            <div className="flex flex-wrap gap-1">
              {incident.affected_identities.map((id, i) => (
                <span key={i} className="font-mono text-[11px] text-purple-300">
                  {id}
                </span>
              ))}
              {incident.affected_identities.length === 0 && (
                <span className="text-white/30 italic">None logged</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-white/40">MITRE Techniques</span>
            <div className="flex flex-wrap gap-1">
              {incident.mitre_techniques.map((t, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-amber-300 border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="tab-playbook"
              onClick={() => setActiveTab("playbook")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "playbook"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Playbook Checklist ({tasks.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-evidence"
              onClick={() => setActiveTab("evidence")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "evidence"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Evidence References ({evidence.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-notes"
              onClick={() => setActiveTab("notes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Analyst Notes ({notes.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-history"
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({history.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-pivots"
              onClick={() => setActiveTab("pivots")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "pivots"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Telemetry & SOC Pivots</span>
            </button>
          </div>
        </div>

        {/* 4. Tab Display Panels */}
        {activeTab === "playbook" && (
          <IncidentPlaybookPanel
            tasks={tasks}
            playbookName={incident.playbook_name}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onCreateTask={onCreateTask}
            disabled={disabled}
          />
        )}

        {activeTab === "evidence" && (
          <IncidentEvidencePanel
            evidenceList={evidence}
            onAddEvidence={onAddEvidence}
            onDeleteEvidence={onDeleteEvidence}
            disabled={disabled}
          />
        )}

        {activeTab === "notes" && (
          <IncidentNotesPanel
            notes={notes}
            onCreateNote={onCreateNote}
            onDeleteNote={onDeleteNote}
            disabled={disabled}
          />
        )}

        {activeTab === "history" && (
          <IncidentHistoryTimeline history={history} />
        )}

        {activeTab === "pivots" && (
          <div className="p-6 rounded-xl bg-[#141414] border border-white/10 space-y-4" data-testid="incident-pivots-panel">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cross-Platform SOC Telemetry & Investigation Deep-Links
            </h3>
            <p className="text-xs text-white/60">
              Pivot directly into related telemetry, SIEM query logs, detection rules, threat hunting sessions, and intelligence observables matching this incident.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <Link
                href={`/threat-hunting?query=${encodeURIComponent(incident.affected_assets[0] || "185.220.101.5")}`}
                className="p-4 rounded-xl bg-[#161616] hover:bg-white/5 border border-white/10 hover:border-red-500/30 transition-all space-y-1 block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <Crosshair className="w-4 h-4" />
                    <span>Threat Hunting Workspace</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-[11px] text-white/50">
                  Execute hypothesis queries across EDR, sockets, and memory handles.
                </p>
              </Link>

              <Link
                href={`/threat-intelligence?search=${encodeURIComponent(incident.affected_assets[0] || "185.220.101.5")}`}
                className="p-4 rounded-xl bg-[#161616] hover:bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all space-y-1 block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Activity className="w-4 h-4" />
                    <span>Threat Intelligence (IOCs)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-[11px] text-white/50">
                  Inspect matched threat feeds, confidence ratings, and sighting counts.
                </p>
              </Link>

              <Link
                href={`/logs?search=${encodeURIComponent(incident.affected_assets[0] || "powershell")}`}
                className="p-4 rounded-xl bg-[#161616] hover:bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all space-y-1 block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>SIEM Log Explorer</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-[11px] text-white/50">
                  Query normalized Syslog, Windows Event Logs, and NetFlow streams.
                </p>
              </Link>

              <Link
                href={`/mitre?technique=${encodeURIComponent(incident.mitre_techniques[0] || "T1071.001")}`}
                className="p-4 rounded-xl bg-[#161616] hover:bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all space-y-1 block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>MITRE ATT&CK Center</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-[11px] text-white/50">
                  Review adversary TTP definitions, mitigations, and detection logic.
                </p>
              </Link>

              <Link
                href="/alerts"
                className="p-4 rounded-xl bg-[#161616] hover:bg-white/5 border border-white/10 hover:border-red-500/30 transition-all space-y-1 block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Detection Alerts Center</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </div>
                <p className="text-[11px] text-white/50">
                  Triage related Sigma rule triggers and correlated event clusters.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 5. Stage Transition Modal */}
      <StageTransitionModal
        isOpen={transitionModalOpen}
        onClose={() => setTransitionModalOpen(false)}
        incident={incident}
        targetStage={targetTransitionStage}
        onTransition={onTransitionStage}
      />
    </div>
  );
};
