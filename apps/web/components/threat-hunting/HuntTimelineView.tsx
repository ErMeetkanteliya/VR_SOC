"use client";

import React, { useState } from "react";
import {
  Clock,
  Server,
  Globe,
  Cpu,
  Database,
  Link2,
  ShieldAlert,
  FileText,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { HuntTimelineItem, CreateHuntEvidenceInput } from "@vrsoc/types";

interface HuntTimelineViewProps {
  timeline: HuntTimelineItem[];
  onAddEvidence: (input: CreateHuntEvidenceInput) => Promise<boolean>;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  dns: <Link2 className="w-3.5 h-3.5 text-teal-400" />,
  process: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
  socket: <Server className="w-3.5 h-3.5 text-blue-400" />,
  registry: <Database className="w-3.5 h-3.5 text-pink-400" />,
  event: <FileText className="w-3.5 h-3.5 text-amber-400" />,
  alert: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
  ioc: <Globe className="w-3.5 h-3.5 text-purple-400" />,
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  informational: "bg-white/10 text-white/60 border-white/20",
};

export const HuntTimelineView: React.FC<HuntTimelineViewProps> = ({
  timeline,
  onAddEvidence,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddEvidence = async (item: HuntTimelineItem) => {
    const input: CreateHuntEvidenceInput = {
      target_type: (item.source_type === "dns" ? "event" : item.source_type) as any,
      target_id: item.id,
      summary: `${item.title} — ${item.entity_value}`,
      description: item.description,
      confidence: 90,
      metadata: item.raw_data || {},
    };

    const success = await onAddEvidence(input);
    if (success) {
      setAddedIds((prev) => new Set([...prev, item.id]));
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121212] border border-white/10 text-white/40 text-xs italic">
        No chronological timeline sightings found for the specified hunt query.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="hunt-timeline-view">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/40" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Chronological Forensic Timeline ({timeline.length} Sightings)
          </h3>
        </div>
        <span className="text-[11px] text-white/40">Ordered by occurred_at</span>
      </div>

      <div className="relative pl-6 border-l border-white/10 space-y-4">
        {timeline.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const isAdded = addedIds.has(item.id);
          const sevClass = SEVERITY_BADGES[item.severity || "medium"];

          return (
            <div
              key={item.id || idx}
              data-testid={`timeline-item-${item.id}`}
              className="relative p-4 rounded-xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all shadow-md group"
            >
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0A0A0A] shadow-sm shadow-red-500/50" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Header info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 flex items-center gap-1.5">
                    {SOURCE_ICONS[item.source_type] || <FileText className="w-3 h-3" />}
                    <span>{item.source_type}</span>
                  </span>

                  {item.severity && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevClass}`}>
                      {item.severity}
                    </span>
                  )}

                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                </div>

                {/* Timestamp & Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/40">
                    {new Date(item.occurred_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>

                  <button
                    type="button"
                    data-testid={`add-evidence-btn-${item.id}`}
                    disabled={isAdded}
                    onClick={() => handleAddEvidence(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      isAdded
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Evidence</span>
                      </>
                    )}
                  </button>

                  {item.raw_data && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1 rounded text-white/40 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Narrative Description */}
              <p className="text-xs text-white/70 mt-2 leading-relaxed">
                {item.description}
              </p>

              {/* Entity metadata tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] font-mono text-white/50">
                <span className="text-red-400/80 font-bold">{item.entity_type}: {item.entity_value}</span>
                {item.host_name && <span>Host: {item.host_name}</span>}
                {item.user_name && <span>User: {item.user_name}</span>}
              </div>

              {/* Raw Details JSON Drawer */}
              {isExpanded && item.raw_data && (
                <div className="mt-3 p-3 rounded-lg bg-black/50 border border-white/5 font-mono text-[11px] text-white/80 overflow-x-auto">
                  <pre>{JSON.stringify(item.raw_data, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
