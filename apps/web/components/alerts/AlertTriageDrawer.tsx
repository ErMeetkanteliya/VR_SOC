"use client";

import React, { useState } from "react";
import { Drawer, Button, SeverityBadge, Input, Select } from "@vrsoc/ui";
import {
  ShieldAlert,
  Terminal,
  Activity,
  Server,
  FileCode,
  CheckCircle2,
  Send,
  UserCheck,
  History,
} from "lucide-react";
import type {
  Alert,
  AlertHistory,
  TelemetryEvent,
  AlertStatus,
  SeverityLevel,
} from "@vrsoc/types";
import { AlertStatusBadge } from "./AlertStatusBadge";
import {
  acknowledgeAlertAction,
  assignAlertAction,
  updateAlertStatusAction,
  addAlertNoteAction,
  closeAlertAction,
} from "@/lib/alerts/actions";

interface AlertTriageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  matchedEvents: TelemetryEvent[];
  history: AlertHistory[];
  onAlertUpdated: (updatedAlert: Alert) => void;
  onHistoryAdded: (newHistory: AlertHistory) => void;
}

export function AlertTriageDrawer({
  isOpen,
  onClose,
  alert,
  matchedEvents = [],
  history = [],
  onAlertUpdated,
  onHistoryAdded,
}: AlertTriageDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "explanation" | "telemetry" | "triage" | "history"
  >("overview");

  // Triage form states
  const [statusSelection, setStatusSelection] = useState<string>("");
  const [assigneeInput, setAssigneeInput] = useState<string>("");
  const [triageNote, setTriageNote] = useState<string>("");
  const [closureReason, setClosureReason] = useState<string>("");
  const [newNoteInput, setNewNoteInput] = useState<string>("");
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (alert) {
      setStatusSelection(alert.status);
      setAssigneeInput(alert.assigned_to || alert.assignee_id || "");
      setActionFeedback(null);
    }
  }, [alert]);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await acknowledgeAlertAction({
        alertId: alert.id,
        note: triageNote || undefined,
      });

      if (res.success && res.data) {
        onAlertUpdated(res.data);
        setActionFeedback("Alert acknowledged successfully.");
        setTriageNote("");
      } else {
        setActionFeedback(res.error || "Failed to acknowledge alert.");
      }
    } catch (err: any) {
      setActionFeedback(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusSelection) return;
    setIsSubmitting(true);
    setActionFeedback(null);

    try {
      if (
        statusSelection === "Closed" ||
        statusSelection === "False Positive" ||
        statusSelection === "closed" ||
        statusSelection === "false_positive"
      ) {
        const res = await closeAlertAction({
          alertId: alert.id,
          status: statusSelection as any,
          reason: closureReason || "Analyst resolved or dismissed alert.",
          note: triageNote || undefined,
        });
        if (res.success && res.data) {
          onAlertUpdated(res.data);
          setActionFeedback(`Alert closed as ${statusSelection}.`);
          setClosureReason("");
          setTriageNote("");
        } else {
          setActionFeedback(res.error || "Failed to close alert.");
        }
      } else {
        const res = await updateAlertStatusAction({
          alertId: alert.id,
          status: statusSelection as AlertStatus,
          note: triageNote || undefined,
        });
        if (res.success && res.data) {
          onAlertUpdated(res.data);
          setActionFeedback(`Status updated to ${statusSelection}.`);
          setTriageNote("");
        } else {
          setActionFeedback(res.error || "Failed to update status.");
        }
      }
    } catch (err: any) {
      setActionFeedback(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async () => {
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await assignAlertAction({
        alertId: alert.id,
        assignedTo: assigneeInput.trim() || null,
        note: triageNote || undefined,
      });
      if (res.success && res.data) {
        onAlertUpdated(res.data);
        setActionFeedback("Analyst assigned successfully.");
        setTriageNote("");
      } else {
        setActionFeedback(res.error || "Failed to assign analyst.");
      }
    } catch (err: any) {
      setActionFeedback(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await addAlertNoteAction({
        alertId: alert.id,
        note: newNoteInput.trim(),
      });
      if (res.success) {
        onHistoryAdded({
          id: `hist-${Date.now()}`,
          organization_id: alert.organization_id,
          alert_id: alert.id,
          action: "note_added",
          note: newNoteInput.trim(),
          created_at: new Date().toISOString(),
        });
        setNewNoteInput("");
        setActionFeedback("Note added to investigation history.");
      } else {
        setActionFeedback(res.error || "Failed to add note.");
      }
    } catch (err: any) {
      setActionFeedback(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const explanation = alert.explanation as any;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5 truncate">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <span className="font-mono text-sm font-semibold truncate text-white">
            [{alert.alert_code}] {alert.title}
          </span>
        </div>
      }
      width="lg"
    >
      <div className="space-y-5 text-neutral-200">
        {/* Top Header Card */}
        <div className="p-4 rounded-lg bg-[#161616] border border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">
                  {alert.alert_code}
                </span>
                <AlertStatusBadge status={alert.status} />
                <SeverityBadge severity={alert.severity as SeverityLevel} />
              </div>
              <h3 className="text-sm font-semibold text-white mt-1.5">{alert.title}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{alert.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">
                Risk Score
              </span>
              <span className="text-lg font-mono font-bold text-red-400">
                {alert.risk_score}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-neutral-400">
            <div>
              <span className="text-neutral-500 block">Occurred</span>
              {new Date(alert.occurred_at || alert.triggered_at || "").toLocaleTimeString()}
            </div>
            <div>
              <span className="text-neutral-500 block">Source</span>
              {alert.source}
            </div>
            <div>
              <span className="text-neutral-500 block">Asset</span>
              {alert.asset?.hostname || alert.asset_id || "Unassigned"}
            </div>
            <div>
              <span className="text-neutral-500 block">Identity</span>
              {alert.identity?.username || alert.identity_id || "SYSTEM"}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded font-medium transition ${
              activeTab === "overview"
                ? "bg-[#5B0A0A] text-white font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("explanation")}
            className={`px-3 py-1.5 rounded font-medium transition ${
              activeTab === "explanation"
                ? "bg-[#5B0A0A] text-white font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Detection Logic
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`px-3 py-1.5 rounded font-medium transition flex items-center gap-1 ${
              activeTab === "telemetry"
                ? "bg-[#5B0A0A] text-white font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Telemetry ({matchedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("triage")}
            className={`px-3 py-1.5 rounded font-medium transition ${
              activeTab === "triage"
                ? "bg-[#5B0A0A] text-white font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Triage Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded font-medium transition flex items-center gap-1 ${
              activeTab === "history"
                ? "bg-[#5B0A0A] text-white font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="p-3 rounded bg-[#161616] border border-red-500/30 text-xs font-mono text-neutral-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Attribution Context */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-red-400" />
                Asset &amp; Identity Attribution
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-500 block">Affected Asset</span>
                  <div className="font-bold text-white">
                    {alert.asset?.hostname || "Endpoint Host"}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Type: {alert.asset?.asset_type || "Endpoint"} | IP:{" "}
                    {alert.asset?.ip_address || "10.0.0.15"}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-500 block">Associated Identity</span>
                  <div className="font-bold text-white">
                    {alert.identity?.username || "SYSTEM"}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Domain: {alert.identity?.domain || "CORP"} | Privileged:{" "}
                    {alert.identity?.is_privileged ? "Yes (Admin)" : "No"}
                  </div>
                </div>
              </div>
            </div>

            {/* MITRE ATT&CK Mapping */}
            {alert.mitre_technique_id && (
              <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  MITRE ATT&CK Framework
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-950/40 text-red-300 border border-red-500/30">
                    {alert.mitre_technique_id}
                  </span>
                  <span className="text-xs text-neutral-300 font-medium">
                    {alert.mitre_technique_name || alert.mitre_tactic}
                  </span>
                </div>
              </div>
            )}

            {/* Deduplication & Detection Attribution */}
            <div className="p-3 rounded-lg bg-[#121212] border border-white/5 text-[11px] font-mono text-neutral-400 space-y-1">
              <div>
                <span className="text-neutral-500">Dedup Key:</span> {alert.dedup_key}
              </div>
              {alert.rule_id && (
                <div>
                  <span className="text-neutral-500">Rule Reference:</span> {alert.rule_id}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Explanation */}
        {activeTab === "explanation" && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-[#141414] border border-white/5 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Detection Match Summary
              </h4>
              <p className="text-xs text-neutral-300">
                {explanation?.summary || alert.description}
              </p>
            </div>

            {explanation?.details && explanation.details.length > 0 && (
              <div className="p-4 rounded-lg bg-[#141414] border border-white/5 space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Condition Evaluation Steps
                </h4>
                <div className="space-y-1.5">
                  {explanation.details.map((detail: string, i: number) => (
                    <div
                      key={i}
                      className="text-xs font-mono text-neutral-300 p-2 rounded bg-black/40 border border-white/5"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Telemetry */}
        {activeTab === "telemetry" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              Matched Telemetry Records ({matchedEvents.length})
            </h4>

            {matchedEvents.length === 0 ? (
              <div className="p-8 text-center bg-[#141414] rounded-lg border border-white/5 text-neutral-500 text-xs">
                No telemetry event payload available for this alert.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {matchedEvents.map((ev) => {
                  const isExpanded = expandedPayloadId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-md bg-[#161616] border border-white/5 hover:border-white/10 transition text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">
                              {ev.event_type}
                            </span>
                            <SeverityBadge severity={ev.severity as SeverityLevel} />
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {new Date(ev.occurred_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1 font-mono">
                            Source: {ev.source_type} | Host: {ev.source_host || "ws-01"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPayloadId(isExpanded ? null : ev.id)
                          }
                          className="p-1 text-neutral-400 hover:text-white rounded bg-black/30 border border-white/5 text-[11px] flex items-center gap-1"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          {isExpanded ? "Hide" : "Inspect"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded bg-black/80 border border-white/10 font-mono text-[11px] text-neutral-300 space-y-2 overflow-x-auto">
                          <div>
                            <span className="text-neutral-500 block mb-1">
                              Normalized Fields:
                            </span>
                            <pre className="text-emerald-400 whitespace-pre-wrap">
                              {JSON.stringify(ev.normalized_fields, null, 2)}
                            </pre>
                          </div>
                          {ev.raw_payload && (
                            <div>
                              <span className="text-neutral-500 block mb-1">
                                Raw Payload:
                              </span>
                              <pre className="text-neutral-400 whitespace-pre-wrap">
                                {JSON.stringify(ev.raw_payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Triage Actions */}
        {activeTab === "triage" && (
          <div className="space-y-4">
            {/* Quick Acknowledge */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Acknowledge Alert
              </h4>
              <p className="text-xs text-neutral-400">
                Mark alert as acknowledged to signal ongoing investigation.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcknowledge}
                disabled={isSubmitting || alert.status === "Acknowledged"}
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-950/30"
              >
                {alert.status === "Acknowledged" ? "Already Acknowledged" : "Acknowledge Alert"}
              </Button>
            </div>

            {/* Change Status & Closure Reason */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Change Triage Status
              </h4>

              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Target Lifecycle State</label>
                <Select
                  value={statusSelection}
                  onChange={(e) => setStatusSelection(e.target.value)}
                  options={[
                    { value: "Open", label: "Open" },
                    { value: "Acknowledged", label: "Acknowledged" },
                    { value: "In Progress", label: "In Progress" },
                    { value: "Escalated", label: "Escalated" },
                    { value: "Closed", label: "Closed (Resolved)" },
                    { value: "False Positive", label: "False Positive (Dismissed)" },
                  ]}
                />
              </div>

              {(statusSelection === "Closed" ||
                statusSelection === "False Positive" ||
                statusSelection === "closed" ||
                statusSelection === "false_positive") && (
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">
                    Closure Rationale <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="e.g. Authorized administrator activity verified via change request."
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Optional Transition Note</label>
                <Input
                  value={triageNote}
                  onChange={(e) => setTriageNote(e.target.value)}
                  placeholder="Notes for audit history..."
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={handleStatusUpdate}
                disabled={isSubmitting}
                className="bg-[#5B0A0A] hover:bg-[#8B0000] text-white text-xs border-red-500/30"
              >
                {isSubmitting ? "Updating..." : "Update Status"}
              </Button>
            </div>

            {/* Assign to Analyst */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                Assign Alert
              </h4>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400">Assignee User ID</label>
                <Input
                  value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                  placeholder="User UUID or leave empty to unassign"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAssign}
                disabled={isSubmitting}
                className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-950/30"
              >
                Assign Analyst
              </Button>
            </div>
          </div>
        )}

        {/* Tab 5: History / Activity Audit Trail */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                Add Analyst Note
              </label>
              <div className="flex gap-2">
                <Input
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Type an investigation finding or analyst comment..."
                  className="text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting || !newNoteInput.trim()}
                  className="gap-1.5 text-xs shrink-0 border-white/10 hover:border-white/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </Button>
              </div>
            </form>

            {/* History List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                Triage Audit Trail ({history.length})
              </h4>

              {history.length === 0 ? (
                <div className="p-6 text-center bg-[#141414] rounded-lg border border-white/5 text-neutral-500 text-xs">
                  No historical actions logged yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {history.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-3 rounded-md bg-[#161616] border border-white/5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-red-400 uppercase">
                          {hist.action}
                        </span>
                        <span className="text-neutral-500 font-mono">
                          {new Date(hist.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {hist.note && (
                        <p className="text-neutral-300 text-xs mt-0.5">{hist.note}</p>
                      )}
                      {hist.previous_status && hist.new_status && (
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {hist.previous_status} &rarr; {hist.new_status}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
