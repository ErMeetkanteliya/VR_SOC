"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Server,
  Activity,
  Globe,
  Binary,
  Terminal,
} from "lucide-react";
import type { IncidentEvidence, IncidentEvidenceType, CreateIncidentEvidenceInput } from "@vrsoc/types";

interface IncidentEvidencePanelProps {
  evidenceList: IncidentEvidence[];
  onAddEvidence: (input: CreateIncidentEvidenceInput) => Promise<boolean>;
  onDeleteEvidence: (id: string) => Promise<boolean>;
  disabled?: boolean;
}

export const IncidentEvidencePanel: React.FC<IncidentEvidencePanelProps> = ({
  evidenceList,
  onAddEvidence,
  onDeleteEvidence,
  disabled = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetType, setTargetType] = useState<IncidentEvidenceType>("socket");
  const [targetId, setTargetId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !summary.trim()) return;

    setIsSubmitting(true);
    const ok = await onAddEvidence({
      incident_id: "",
      target_type: targetType,
      target_id: targetId.trim(),
      summary: summary.trim(),
      description: description.trim() || undefined,
      confidence,
    });
    setIsSubmitting(false);

    if (ok) {
      setTargetId("");
      setSummary("");
      setDescription("");
      setShowAddForm(false);
    }
  };

  const getTargetIcon = (type: IncidentEvidenceType) => {
    switch (type) {
      case "alert":
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
      case "socket":
        return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      case "process":
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case "registry":
        return <Binary className="w-3.5 h-3.5 text-amber-400" />;
      case "ioc":
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Server className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getPivotLink = (item: IncidentEvidence) => {
    switch (item.target_type) {
      case "alert":
        return `/alerts?id=${item.target_id}`;
      case "socket":
      case "ioc":
        return `/threat-intelligence?search=${encodeURIComponent(item.target_id)}`;
      case "process":
        return `/threat-hunting?query=${encodeURIComponent(item.target_id)}&type=process`;
      case "registry":
        return `/threat-hunting?query=${encodeURIComponent(item.target_id)}&type=registry`;
      default:
        return `/logs?search=${encodeURIComponent(item.target_id)}`;
    }
  };

  return (
    <div className="space-y-4" data-testid="incident-evidence-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Forensic Evidence References ({evidenceList.length})
          </h3>
        </div>

        {!disabled && (
          <button
            type="button"
            data-testid="attach-evidence-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Attach Evidence Item</span>
          </button>
        )}
      </div>

      {/* Attach Evidence Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[#161616] border border-cyan-500/30 space-y-3 shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-white/70 block mb-1">
                Evidence Target Type
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as IncidentEvidenceType)}
                className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white"
              >
                <option value="alert">Alert Reference</option>
                <option value="socket">Network Socket / IP</option>
                <option value="process">Process / Command</option>
                <option value="registry">Registry Key / Hive</option>
                <option value="ioc">Threat Indicator (IOC)</option>
                <option value="hunt_evidence">Threat Hunting Sighting</option>
                <option value="event">Log / Telemetry Event</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/70 block mb-1">
                Target Identifier / Observable
              </label>
              <input
                type="text"
                data-testid="evidence-target-id-input"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. 185.220.101.5:443 or PID-4820"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/70 block mb-1">
              Evidence Summary / Title
            </label>
            <input
              type="text"
              data-testid="evidence-summary-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Outbound Cobalt Strike C2 Socket"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-white/70 block mb-1">
              Description / Forensic Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observed packet size, parent PID, payload hashes, or beacon frequency..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60">Confidence:</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{confidence}%</span>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-24 accent-cyan-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-evidence-btn"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
              >
                {isSubmitting ? "Attaching..." : "Attach Evidence"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Evidence Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evidenceList.map((item) => (
          <div
            key={item.id}
            data-testid={`evidence-item-${item.id}`}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 hover:border-white/20 shadow-md space-y-2.5 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                  {getTargetIcon(item.target_type)}
                </div>
                <div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 text-white/60 border border-white/5">
                    {item.target_type}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 ml-2">
                    {item.target_id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {item.confidence}% Conf
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onDeleteEvidence(item.id)}
                    className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Remove evidence item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <h4 className="text-xs font-bold text-white/95">{item.summary}</h4>
            {item.description && (
              <p className="text-xs text-white/70 leading-relaxed">{item.description}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/50">
              <span>Added by {item.added_by}</span>
              <Link
                href={getPivotLink(item)}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Pivot to Source</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}

        {evidenceList.length === 0 && (
          <div className="col-span-2 p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
            No forensic evidence attached yet. Click &quot;Attach Evidence Item&quot; to correlate observables.
          </div>
        )}
      </div>
    </div>
  );
};
