"use client";

import React from "react";
import {
  History,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  FileCheck,
  MessageSquare,
  Flame,
  AlertOctagon,
} from "lucide-react";
import type { IncidentHistoryItem } from "@vrsoc/types";

interface IncidentHistoryTimelineProps {
  history: IncidentHistoryItem[];
}

export const IncidentHistoryTimeline: React.FC<IncidentHistoryTimelineProps> = ({ history }) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "declared":
        return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case "stage_transition":
        return <ArrowRight className="w-3.5 h-3.5 text-purple-400" />;
      case "assignment":
        return <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
      case "task_update":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "evidence_attached":
        return <FileCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case "note_added":
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      case "closed":
        return <AlertOctagon className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <History className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <div className="space-y-4" data-testid="incident-history-timeline">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Incident Audit History & State Changes ({history.length})
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {history.map((item) => (
          <div
            key={item.id}
            data-testid={`history-item-${item.id}`}
            className="relative flex items-start gap-3 group"
          >
            {/* Timeline Node */}
            <div className="absolute -left-6 mt-1 p-1 rounded-full bg-[#161616] border border-white/20 z-10">
              {getActionIcon(item.action_type)}
            </div>

            <div className="flex-1 p-3.5 rounded-xl bg-[#141414] border border-white/10 group-hover:border-white/20 transition-colors space-y-1.5 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">
                    {item.action_type.replace("_", " ")}
                  </span>
                  {item.previous_stage && item.new_stage && (
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="text-white/40">{item.previous_stage}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-300 font-bold">{item.new_stage}</span>
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-mono text-white/40">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              {item.rationale && (
                <p className="text-xs text-white/70 leading-relaxed">{item.rationale}</p>
              )}

              <div className="text-[10px] text-white/40 pt-1">
                Recorded by <strong className="text-white/60">{item.actor_name}</strong>
              </div>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
            No history entries recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
