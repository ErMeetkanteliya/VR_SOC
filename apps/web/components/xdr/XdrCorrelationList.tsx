"use client";

import React from "react";
import { Search, Sparkles, Clock, Link2 } from "lucide-react";
import type { XdrCorrelationResult, XdrRelationshipType } from "@vrsoc/types";


interface XdrCorrelationListProps {
  correlations: XdrCorrelationResult[];
  selectedCorrelationId: string;
  onSelectCorrelation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  relationshipFilter: string;
  onRelationshipFilterChange: (rel: string) => void;
}

export function XdrCorrelationList({
  correlations,
  selectedCorrelationId,
  onSelectCorrelation,
  searchQuery,
  onSearchChange,
  relationshipFilter,
  onRelationshipFilterChange,
}: XdrCorrelationListProps) {
  const filtered = correlations.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.correlation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primary_entity_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRel =
      relationshipFilter === "ALL" || c.relationship_type === relationshipFilter;

    return matchesSearch && matchesRel;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "critical":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
  };

  const formatRelType = (rel: XdrRelationshipType) => {
    switch (rel) {
      case "same_identity":
        return "Identity Cross-Domain";
      case "same_asset":
        return "Host Convergence";
      case "same_ip":
        return "Target IP Linkage";
      case "same_domain":
        return "Domain Attribution";
      case "temporal_killchain":
        return "Ordered Killchain";
      case "related_alert":
        return "Multi-Alert Cluster";
      default:
        return rel;
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[#161616]/90 border border-white/10 shadow-xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#E53935]" />
          <h3 className="text-sm font-semibold text-white">Correlation Clusters</h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
          {filtered.length} active
        </span>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search code, title, host, user..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E53935]/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => onRelationshipFilterChange("ALL")}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
              relationshipFilter === "ALL"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "bg-white/[0.03] text-white/50 border border-white/5 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onRelationshipFilterChange("temporal_killchain")}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
              relationshipFilter === "temporal_killchain"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "bg-white/[0.03] text-white/50 border border-white/5 hover:text-white"
            }`}
          >
            Killchain
          </button>
          <button
            onClick={() => onRelationshipFilterChange("same_identity")}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
              relationshipFilter === "same_identity"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "bg-white/[0.03] text-white/50 border border-white/5 hover:text-white"
            }`}
          >
            Identity
          </button>
          <button
            onClick={() => onRelationshipFilterChange("same_ip")}
            className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
              relationshipFilter === "same_ip"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "bg-white/[0.03] text-white/50 border border-white/5 hover:text-white"
            }`}
          >
            IP Linkage
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/40">
            No cross-source correlations match criteria.
          </div>
        ) : (
          filtered.map((corr) => {
            const isSelected = corr.id === selectedCorrelationId || corr.correlation_code === selectedCorrelationId;
            const sourcesList = corr.source_counts ? Object.keys(corr.source_counts) : [];

            return (
              <div
                key={corr.id}
                onClick={() => onSelectCorrelation(corr.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-[#5B0A0A]/25 border-[#E53935]/60 shadow-lg shadow-black/40 scale-[1.01]"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-white/80">{corr.correlation_code}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getSeverityBadge(corr.severity)}`}>
                    {corr.severity}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">{corr.title}</h4>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/50">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                    {formatRelType(corr.relationship_type)}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span>{corr.confidence_score}%</span>
                  </div>
                </div>

                {/* Sources pill row */}
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>{sourcesList.length} sources</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{corr.duration_minutes}m span</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
