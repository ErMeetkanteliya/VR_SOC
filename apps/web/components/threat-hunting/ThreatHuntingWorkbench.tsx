"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  GitCommit,
  Share2,
  ShieldAlert,
  FileCheck,
  ArrowRight,
  Terminal,
  Activity,
  Globe,
} from "lucide-react";
import { HuntHeader } from "./HuntHeader";
import { HuntQueryBar } from "./HuntQueryBar";
import { HuntSummaryKpis } from "./HuntSummaryKpis";
import { HuntTimelineView } from "./HuntTimelineView";
import { HuntAttackPathView } from "./HuntAttackPathView";
import { HuntGraphView } from "./HuntGraphView";
import { HuntEvidencePanel } from "./HuntEvidencePanel";
import { HuntNotesPanel } from "./HuntNotesPanel";
import {
  executeHuntQueryAction,
  createHuntEvidenceAction,
  deleteHuntEvidenceAction,
  createHuntNoteAction,
  deleteHuntNoteAction,
} from "@/lib/threat-hunting/actions";
import type {
  HuntQueryResult,
  HuntEvidence,
  HuntNote,
  HuntType,
  CreateHuntEvidenceInput,
  CreateHuntNoteInput,
} from "@vrsoc/types";
import type { HuntHypothesisTemplate } from "@/lib/threat-hunting/catalog";

interface ThreatHuntingWorkbenchProps {
  initialResult: HuntQueryResult;
  initialEvidence: HuntEvidence[];
  initialNotes: HuntNote[];
  organizationId?: string;
}

export const ThreatHuntingWorkbench: React.FC<ThreatHuntingWorkbenchProps> = ({
  initialResult,
  initialEvidence,
  initialNotes,
}) => {
  // Query Bar States
  const [query, setQuery] = useState(initialResult.query === "*" ? "185.220.101.5" : initialResult.query);
  const [huntType, setHuntType] = useState<HuntType>(initialResult.hunt_type || "all");
  const [timeRange, setTimeRange] = useState("24h");
  const [isLoading, setIsLoading] = useState(false);

  // Result & Tab States
  const [result, setResult] = useState<HuntQueryResult>(initialResult);
  const [activeTab, setActiveTab] = useState<"timeline" | "attack_path" | "graph" | "alerts_iocs" | "evidence_notes">("timeline");

  // Evidence & Notes States
  const [evidence, setEvidence] = useState<HuntEvidence[]>(initialEvidence);
  const [notes, setNotes] = useState<HuntNote[]>(initialNotes);

  // Auto-execute query on first load if default
  useEffect(() => {
    if (initialResult.query === "*") {
      handleExecuteHunt("185.220.101.5", "ioc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Execute Hunt
  const handleExecuteHunt = async (queryOverride?: string, typeOverride?: HuntType) => {
    const q = queryOverride !== undefined ? queryOverride : query;
    const t = typeOverride !== undefined ? typeOverride : huntType;

    setIsLoading(true);

    const res = await executeHuntQueryAction({
      query: q.trim() || "*",
      hunt_type: t,
      time_range: timeRange as any,
    });

    setIsLoading(false);
    if (res.success && res.data) {
      setResult(res.data);
    }
  };

  // Select Quick Hypothesis Template
  const handleSelectTemplate = (template: HuntHypothesisTemplate) => {
    setQuery(template.default_query);
    setHuntType(template.hunt_type);
    handleExecuteHunt(template.default_query, template.hunt_type);
  };

  // Add Evidence
  const handleAddEvidence = async (input: CreateHuntEvidenceInput): Promise<boolean> => {
    const res = await createHuntEvidenceAction(input);
    if (res.success && res.data) {
      setEvidence((prev) => [res.data!, ...prev]);
      return true;
    }
    // Local fallback
    const fallbackItem: HuntEvidence = {
      id: `evid-local-${Date.now()}`,
      organization_id: "00000000-0000-0000-0000-000000000001",
      target_type: input.target_type,
      target_id: input.target_id,
      summary: input.summary,
      description: input.description,
      confidence: input.confidence ?? 85,
      metadata: input.metadata || {},
      added_by: "SOC Hunter",
      created_at: new Date().toISOString(),
    };
    setEvidence((prev) => [fallbackItem, ...prev]);
    return true;
  };

  // Delete Evidence
  const handleDeleteEvidence = async (id: string): Promise<boolean> => {
    await deleteHuntEvidenceAction(id);
    setEvidence((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  // Add Note
  const handleAddNote = async (input: CreateHuntNoteInput): Promise<boolean> => {
    const res = await createHuntNoteAction(input);
    if (res.success && res.data) {
      setNotes((prev) => [res.data!, ...prev]);
      return true;
    }
    // Local fallback
    const fallbackNote: HuntNote = {
      id: `note-local-${Date.now()}`,
      organization_id: "00000000-0000-0000-0000-000000000001",
      author_name: "SOC Hunter",
      content: input.content,
      tags: input.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes((prev) => [fallbackNote, ...prev]);
    return true;
  };

  // Delete Note
  const handleDeleteNote = async (id: string): Promise<boolean> => {
    await deleteHuntNoteAction(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    return true;
  };

  return (
    <div className="w-full space-y-6 pb-12" data-testid="threat-hunting-workbench">
      {/* 1. Header & Quick Hypothesis Templates */}
      <HuntHeader onSelectTemplate={handleSelectTemplate} />

      {/* 2. Structured Query Bar */}
      <HuntQueryBar
        query={query}
        onQueryChange={setQuery}
        huntType={huntType}
        onHuntTypeChange={setHuntType}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExecuteHunt={() => handleExecuteHunt()}
        isLoading={isLoading}
      />

      {/* 3. Summary KPI Overview */}
      <HuntSummaryKpis result={result} />

      {/* 4. Investigation Workspace Tab Navigation */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Tab */}
            <button
              type="button"
              data-testid="tab-timeline"
              onClick={() => setActiveTab("timeline")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Forensic Timeline ({result.timeline.length})</span>
            </button>

            {/* Attack Path Tab */}
            <button
              type="button"
              data-testid="tab-attack-path"
              onClick={() => setActiveTab("attack_path")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "attack_path"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Attack Path ({result.attack_path.length})</span>
            </button>

            {/* Investigation Graph Tab */}
            <button
              type="button"
              data-testid="tab-graph"
              onClick={() => setActiveTab("graph")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "graph"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Relationship Graph</span>
            </button>

            {/* Correlated Alerts & IOCs Tab */}
            <button
              type="button"
              data-testid="tab-alerts-iocs"
              onClick={() => setActiveTab("alerts_iocs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "alerts_iocs"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alerts & IOCs ({result.related_alerts.length + result.related_iocs.length})</span>
            </button>

            {/* Evidence & Notes Tab */}
            <button
              type="button"
              data-testid="tab-evidence-notes"
              onClick={() => setActiveTab("evidence_notes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "evidence_notes"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-[#141414] text-white/60 hover:text-white border border-white/5"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Evidence & Notes ({evidence.length + notes.length})</span>
            </button>
          </div>

          {/* Quick SOC Pivots */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-white/40 uppercase">Pivots:</span>
            <Link
              href={`/logs?search=${encodeURIComponent(query)}`}
              className="px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
            >
              <Terminal className="w-3 h-3 text-amber-400" />
              <span>SIEM</span>
            </Link>
            <Link
              href={`/alerts?search=${encodeURIComponent(query)}`}
              className="px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>Alerts</span>
            </Link>
            <Link
              href="/edr"
              className="px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>EDR</span>
            </Link>
            <Link
              href="/threat-intelligence"
              className="px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-purple-400" />
              <span>IOCs</span>
            </Link>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "timeline" && (
          <HuntTimelineView
            timeline={result.timeline}
            onAddEvidence={handleAddEvidence}
          />
        )}

        {activeTab === "attack_path" && (
          <HuntAttackPathView attackPath={result.attack_path} />
        )}

        {activeTab === "graph" && (
          <HuntGraphView graph={result.graph} />
        )}

        {activeTab === "alerts_iocs" && (
          <div className="space-y-6" data-testid="hunt-alerts-iocs-tab">
            {/* Correlated Alerts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Correlated Detection Alerts ({result.related_alerts.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.related_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        {alert.severity}
                      </span>
                      <span className="text-[11px] font-mono text-white/40">{alert.rule_id}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                    <p className="text-xs text-white/60">{alert.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/50">
                      <span>Host: {(alert.metadata?.hostname as string) || alert.asset?.hostname || "Unknown"}</span>
                      <Link
                        href={`/alerts?id=${alert.id}`}
                        className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                      >
                        <span>Triage Alert</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
                {result.related_alerts.length === 0 && (
                  <div className="col-span-2 p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
                    No detection alerts match this search observable.
                  </div>
                )}
              </div>
            </div>

            {/* Correlated Threat Indicators */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Correlated Threat Indicators ({result.related_iocs.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.related_iocs.map((ioc) => (
                  <div
                    key={ioc.id}
                    className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 text-white/70 border border-white/10">
                        {ioc.ioc_type}
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">
                        {ioc.confidence}% Confidence
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-white truncate" title={ioc.normalized_value}>
                      {ioc.normalized_value}
                    </div>
                    <p className="text-xs text-white/60">{ioc.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <div className="flex gap-1">
                        {ioc.tags.map((t) => (
                          <span key={t} className="text-[10px] font-mono text-white/40">#{t}</span>
                        ))}
                      </div>
                      <Link
                        href="/threat-intelligence"
                        className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                      >
                        <span>View Catalog</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
                {result.related_iocs.length === 0 && (
                  <div className="col-span-2 p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
                    No threat indicators correlate with this search string.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "evidence_notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="hunt-evidence-notes-tab">
            <HuntEvidencePanel
              evidenceList={evidence}
              onAddEvidence={handleAddEvidence}
              onDeleteEvidence={handleDeleteEvidence}
            />
            <HuntNotesPanel
              notes={notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        )}
      </div>
    </div>
  );
};
