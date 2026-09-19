"use client";

import React from "react";
import { Search, ArrowRight, User } from "lucide-react";
import type { Incident, IncidentStage } from "@vrsoc/types";

interface IncidentQueueTableProps {
  incidents: Incident[];
  total: number;
  search: string;
  onSearchChange: (val: string) => void;
  selectedStage: string;
  onStageChange: (val: string) => void;
  selectedSeverity: string;
  onSeverityChange: (val: string) => void;
  selectedPriority: string;
  onPriorityChange: (val: string) => void;
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentQueueTable: React.FC<IncidentQueueTableProps> = ({
  incidents,
  total: _total,
  search,
  onSearchChange,
  selectedStage,
  onStageChange,
  selectedSeverity,
  onSeverityChange,
  selectedPriority,
  onPriorityChange,
  onSelectIncident,
}) => {
  const getSeverityBadgeClass = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
    if (s === "high") return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    if (s === "medium") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  };

  const getStageBadgeClass = (stg: IncidentStage) => {
    switch (stg) {
      case "Detection":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "Analysis":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Containment":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "Eradication":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "Recovery":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Lessons Learned":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "Closed":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  return (
    <div className="space-y-4" data-testid="incident-queue-table">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            data-testid="incident-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search incident code, title, or asset..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            data-testid="filter-stage-select"
            value={selectedStage}
            onChange={(e) => onStageChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Lifecycle Stages</option>
            <option value="Detection">Detection</option>
            <option value="Analysis">Analysis</option>
            <option value="Containment">Containment</option>
            <option value="Eradication">Eradication</option>
            <option value="Recovery">Recovery</option>
            <option value="Lessons Learned">Lessons Learned</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Severity Filter */}
          <select
            data-testid="filter-severity-select"
            value={selectedSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Priority Filter */}
          <select
            data-testid="filter-priority-select"
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-red-500/50"
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 (Immediate)</option>
            <option value="P2">P2 (High)</option>
            <option value="P3">P3 (Medium)</option>
            <option value="P4">P4 (Low)</option>
          </select>
        </div>
      </div>

      {/* Incidents Data Table */}
      <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#161616] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                <th className="py-3 px-4">Code / Incident</th>
                <th className="py-3 px-4">Severity / Priority</th>
                <th className="py-3 px-4">Lifecycle Stage</th>
                <th className="py-3 px-4">Affected Assets</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Checklist / Evidence</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  data-testid={`incident-row-${incident.incident_code}`}
                  onClick={() => onSelectIncident(incident)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  {/* Code & Title */}
                  <td className="py-3.5 px-4 space-y-1 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-400 text-[11px]">
                        {incident.incident_code}
                      </span>
                      {incident.status === "Closed" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          CLOSED
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-white group-hover:text-red-300 transition-colors truncate">
                      {incident.title}
                    </div>
                  </td>

                  {/* Severity & Priority */}
                  <td className="py-3.5 px-4 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadgeClass(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-white/5 text-white/70 border border-white/10">
                        {incident.priority}
                      </span>
                    </div>
                  </td>

                  {/* Lifecycle Stage */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border inline-block ${getStageBadgeClass(
                        incident.stage
                      )}`}
                    >
                      {incident.stage}
                    </span>
                  </td>

                  {/* Affected Assets */}
                  <td className="py-3.5 px-4">
                    {incident.affected_assets.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {incident.affected_assets.map((asset, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#181818] border border-white/5 text-white/70"
                          >
                            {asset}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/30 italic">None logged</span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 text-white/70">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white/40" />
                      <span className="truncate max-w-[130px]">
                        {incident.assignee_name || "Unassigned"}
                      </span>
                    </div>
                  </td>

                  {/* Checklist & Evidence Counts */}
                  <td className="py-3.5 px-4 text-white/60">
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span>Tasks: {incident.tasks_completed ?? 0}/{incident.tasks_total ?? 6}</span>
                      <span>Evid: {incident.evidence_count ?? 0}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      data-testid={`investigate-btn-${incident.incident_code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(incident);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-red-600 group-hover:text-white text-white/70 transition-all font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {incidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40 italic">
                    No incidents found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
