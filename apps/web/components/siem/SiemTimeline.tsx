"use client";

import React, { useState } from "react";
import { SeverityBadge, Button } from "@vrsoc/ui";
import {
  Clock,
  Server,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Network,
  Cpu,
} from "lucide-react";
import type { SiemTimelineItem } from "@vrsoc/types";

interface SiemTimelineProps {
  items: SiemTimelineItem[];
  isLoading?: boolean;
  onInspectItem?: (item: SiemTimelineItem) => void;
}

export function SiemTimeline({
  items,
  isLoading = false,
  onInspectItem,
}: SiemTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("process") || cat.includes("exec")) return <Cpu className="w-3.5 h-3.5" />;
    if (cat.includes("file") || cat.includes("malware")) return <FileText className="w-3.5 h-3.5" />;
    if (cat.includes("network") || cat.includes("dns")) return <Network className="w-3.5 h-3.5" />;
    if (cat.includes("auth") || cat.includes("ident")) return <User className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  const getSeverityBorder = (sev: string) => {
    switch (sev) {
      case "Critical": return "border-red-500/60 bg-red-950/20";
      case "High": return "border-orange-500/50 bg-orange-950/20";
      case "Medium": return "border-amber-500/40 bg-amber-950/10";
      case "Low": return "border-blue-500/30 bg-blue-950/10";
      default: return "border-white/10 bg-white/[0.02]";
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Activity className="w-6 h-6 text-crimson-500 animate-spin" />
        <p className="text-xs text-gray-400">Reconstructing investigation timeline...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center gap-2 text-center">
        <Clock className="w-8 h-8 text-gray-600 mb-1" />
        <p className="text-sm font-semibold text-gray-300">No Timeline Records Found</p>
        <p className="text-xs text-gray-500 max-w-sm">
          No telemetry events or logs match the current investigation window. Expand your time range or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-crimson-600 before:via-white/10 before:to-white/5">
      {items.map((item, idx) => {
        const isExpanded = expandedIds.has(item.id);
        const occurred = new Date(item.occurredAt);
        const timeFormatted = occurred.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        const dateFormatted = occurred.toLocaleDateString([], { month: "short", day: "numeric" });

        return (
          <div key={`${item.id}-${idx}`} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 top-2 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shadow-sm transition-all ${
                item.severity === "Critical"
                  ? "bg-red-600 border-red-400 text-white shadow-red-900/50 scale-110"
                  : item.severity === "High"
                  ? "bg-orange-600 border-orange-400 text-white shadow-orange-900/40"
                  : item.severity === "Medium"
                  ? "bg-amber-600 border-amber-400 text-black"
                  : "bg-charcoal-800 border-white/20 text-gray-400"
              }`}
            >
              {idx + 1}
            </div>

            {/* Timeline Item Card */}
            <div
              className={`rounded-lg border p-3 transition-all ${getSeverityBorder(
                item.severity
              )} hover:border-white/20`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    {dateFormatted} {timeFormatted} UTC
                  </span>

                  <SeverityBadge severity={item.severity} />

                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {getCategoryIcon(item.category)}
                    {item.title}
                  </span>

                  <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                    {item.source}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onInspectItem && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onInspectItem(item)}
                      className="text-[11px] h-6 px-2 py-0"
                    >
                      Inspect
                    </Button>
                  )}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Summary line */}
              <p className="text-xs text-gray-300 mt-1.5 font-mono break-all line-clamp-2">
                {item.summary}
              </p>

              {/* Attribution Pills */}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                {item.assetHostname && (
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3 text-crimson-400" />
                    Host: <strong className="text-gray-200">{item.assetHostname}</strong>
                  </span>
                )}
                {item.username && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-400" />
                    User: <strong className="text-gray-200">{item.username}</strong>
                  </span>
                )}
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-gray-500 block mb-0.5">Telemetry Occurrence Time (occurred_at):</span>
                      <span className="font-mono text-gray-200">{item.occurredAt}</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-gray-500 block mb-0.5">Pipeline Ingestion Time (created_at):</span>
                      <span className="font-mono text-gray-200">{item.createdAt}</span>
                    </div>
                  </div>

                  <div className="bg-black/60 p-2.5 rounded border border-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto max-h-48">
                    <pre>{JSON.stringify(item.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
