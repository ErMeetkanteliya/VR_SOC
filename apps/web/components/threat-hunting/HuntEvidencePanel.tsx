"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import type { HuntEvidence, CreateHuntEvidenceInput, HuntEvidenceTargetType } from "@vrsoc/types";

interface HuntEvidencePanelProps {
  evidenceList: HuntEvidence[];
  onAddEvidence: (input: CreateHuntEvidenceInput) => Promise<boolean>;
  onDeleteEvidence: (id: string) => Promise<boolean>;
}

export const HuntEvidencePanel: React.FC<HuntEvidencePanelProps> = ({
  evidenceList,
  onAddEvidence,
  onDeleteEvidence,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [targetType, setTargetType] = useState<HuntEvidenceTargetType>("event");
  const [targetId, setTargetId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !targetId.trim()) return;

    setIsSubmitting(true);
    const success = await onAddEvidence({
      target_type: targetType,
      target_id: targetId.trim(),
      summary: summary.trim(),
      description: description.trim(),
      confidence,
    });
    setIsSubmitting(false);

    if (success) {
      setSummary("");
      setTargetId("");
      setDescription("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="hunt-evidence-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Collected Investigation Evidence ({evidenceList.length})
          </h3>
        </div>

        <button
          type="button"
          data-testid="add-custom-evidence-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500/40 shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? "Cancel" : "Add Evidence"}</span>
        </button>
      </div>

      {/* Inline Evidence Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          data-testid="add-evidence-form"
          className="p-4 rounded-xl bg-[#141414] border border-red-500/30 space-y-3 shadow-xl animate-in fade-in duration-150"
        >
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Register Investigation Evidence Reference
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60 uppercase">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as HuntEvidenceTargetType)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="event">Event / Log</option>
                <option value="alert">Detection Alert</option>
                <option value="ioc">Threat Indicator</option>
                <option value="process">Endpoint Process</option>
                <option value="socket">Network Socket</option>
                <option value="registry">Registry Key</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/60 uppercase">Target Entity / ID</label>
              <input
                type="text"
                required
                data-testid="evidence-target-id-input"
                placeholder="e.g. 185.220.101.5 or PID 4820"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-white/60 uppercase">Confidence</label>
                <span className="text-[11px] font-mono text-white">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-red-500 cursor-pointer pt-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/60 uppercase">Evidence Summary</label>
            <input
              type="text"
              required
              data-testid="evidence-summary-input"
              placeholder="e.g. Outbound C2 socket connection matching Cobalt Strike beaconing pattern"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/60 uppercase">Forensic Context & Notes</label>
            <textarea
              rows={2}
              placeholder="Provide technical justification, associated hashes, or packet captures..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-evidence-btn"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Evidence"}
            </button>
          </div>
        </form>
      )}

      {/* Evidence Items List */}
      <div className="space-y-3">
        {evidenceList.map((item) => (
          <div
            key={item.id}
            data-testid={`evidence-item-${item.id}`}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-md space-y-2 group relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-emerald-400">
                  {item.target_type}
                </span>
                <span className="font-mono text-xs font-bold text-white">{item.target_id}</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.confidence}% Confidence
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-white/40">
                  By {item.added_by} • {new Date(item.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  type="button"
                  data-testid={`delete-evidence-btn-${item.id}`}
                  onClick={() => onDeleteEvidence(item.id)}
                  className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove Evidence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-xs font-bold text-white/95">{item.summary}</h4>
            {item.description && (
              <p className="text-xs text-white/70 leading-relaxed">{item.description}</p>
            )}
          </div>
        ))}

        {evidenceList.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
            No evidence references attached yet. Use the timeline &quot;Add Evidence&quot; buttons or register custom items above.
          </div>
        )}
      </div>
    </div>
  );
};
