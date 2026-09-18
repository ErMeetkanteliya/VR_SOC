"use client";

import React from "react";
import { Share2, Server, User, Cpu, ShieldAlert, Globe, ArrowRight } from "lucide-react";
import type { HuntInvestigationGraph, HuntGraphNode } from "@vrsoc/types";

interface HuntGraphViewProps {
  graph: HuntInvestigationGraph;
}

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  ioc: <Globe className="w-4 h-4 text-red-400" />,
  host: <Server className="w-4 h-4 text-blue-400" />,
  user: <User className="w-4 h-4 text-amber-400" />,
  process: <Cpu className="w-4 h-4 text-cyan-400" />,
  alert: <ShieldAlert className="w-4 h-4 text-rose-400" />,
};

export const HuntGraphView: React.FC<HuntGraphViewProps> = ({ graph }) => {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121212] border border-white/10 text-white/40 text-xs italic">
        No investigation graph nodes available for this query.
      </div>
    );
  }

  const nodesById = new Map<string, HuntGraphNode>();
  for (const n of graph.nodes) {
    nodesById.set(n.id, n);
  }

  return (
    <div className="space-y-4" data-testid="hunt-graph-view">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Investigation Relationship Topology ({graph.nodes.length} Entities, {graph.edges.length} Relationships)
          </h3>
        </div>
        <span className="text-[11px] text-white/40">Correlated Entity Graph</span>
      </div>

      {/* Entity Nodes Grid */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
          Correlated Investigation Entities
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {graph.nodes.map((node) => (
            <div
              key={node.id}
              data-testid={`graph-node-${node.id}`}
              className={`p-3.5 rounded-xl bg-[#141414] border transition-all shadow-md flex items-start gap-3 ${
                node.severity === "critical"
                  ? "border-red-500/40 bg-red-950/10"
                  : node.severity === "high"
                  ? "border-orange-500/30"
                  : "border-white/10"
              }`}
            >
              <div className="p-2 rounded-lg bg-[#1a1a1a] border border-white/5 shrink-0">
                {NODE_TYPE_ICONS[node.type] || <Globe className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[10px] font-mono font-bold uppercase text-white/40">
                  {node.type}
                </span>
                <div className="font-mono text-xs font-bold text-white truncate" title={node.label}>
                  {node.label}
                </div>
                {node.sublabel && (
                  <div className="text-[11px] text-white/50 truncate">
                    {node.sublabel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Graph Edges List */}
      <div className="space-y-2 pt-3">
        <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
          Observed Telemetry Edges & Cross-Source Links
        </div>
        <div className="space-y-2">
          {graph.edges.map((edge) => {
            const sourceNode = nodesById.get(edge.source);
            const targetNode = nodesById.get(edge.target);

            return (
              <div
                key={edge.id}
                data-testid={`graph-edge-${edge.id}`}
                className="p-3 rounded-xl bg-[#141414] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {/* Source Node Pill */}
                  <span className="px-2.5 py-1 rounded-lg bg-[#181818] border border-white/10 font-mono font-bold text-white">
                    {sourceNode?.label || edge.source}
                  </span>

                  {/* Edge Label */}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                    <span>{edge.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>

                  {/* Target Node Pill */}
                  <span className="px-2.5 py-1 rounded-lg bg-[#181818] border border-white/10 font-mono font-bold text-white">
                    {targetNode?.label || edge.target}
                  </span>
                </div>

                {edge.timestamp && (
                  <span className="text-[11px] font-mono text-white/40 shrink-0">
                    {edge.timestamp}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
