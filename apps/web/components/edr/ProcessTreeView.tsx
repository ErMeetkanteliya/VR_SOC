"use client";

import React, { useState } from "react";
import type { EdrProcessTreeNode } from "@vrsoc/types";
import {
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Terminal,
  User,
  Clock,
  Hash,
  Copy,
  Check,
  Cpu,
} from "lucide-react";

interface ProcessTreeViewProps {
  tree: EdrProcessTreeNode[];
  onSelectProcess?: (node: EdrProcessTreeNode) => void;
  selectedPid?: number | null;
}

export function ProcessTreeView({
  tree,
  onSelectProcess,
  selectedPid,
}: ProcessTreeViewProps) {
  if (!tree || tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-white/5 bg-[#141414]/50">
        <Cpu className="w-10 h-10 text-gray-500 mb-3" />
        <h4 className="text-sm font-medium text-gray-200">No Process Telemetry Found</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          No active or historical process execution tree is recorded for this endpoint yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400 px-2 pb-1 border-b border-white/5">
        <span>Process Lineage Tree</span>
        <span>Click node to inspect forensic details</span>
      </div>
      <div className="space-y-2">
        {tree.map((node) => (
          <ProcessTreeNodeItem
            key={`${node.pid}-${node.started_at}`}
            node={node}
            depth={0}
            onSelectProcess={onSelectProcess}
            selectedPid={selectedPid}
          />
        ))}
      </div>
    </div>
  );
}

interface ProcessTreeNodeItemProps {
  node: EdrProcessTreeNode;
  depth: number;
  onSelectProcess?: (node: EdrProcessTreeNode) => void;
  selectedPid?: number | null;
}

function ProcessTreeNodeItem({
  node,
  depth,
  onSelectProcess,
  selectedPid,
}: ProcessTreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPid === node.pid;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.sha256) {
      navigator.clipboard.writeText(node.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const getIntegrityBadge = (level?: string | null) => {
    switch (level) {
      case "System":
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">SYSTEM</span>;
      case "High":
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-300 border border-red-500/30">HIGH</span>;
      case "Medium":
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">MED</span>;
      case "Low":
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-500/20 text-gray-300 border border-gray-500/30">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Indentation line */}
      {depth > 0 && (
        <div
          className="absolute left-[-16px] top-4 bottom-0 w-[1px] bg-white/10"
          style={{ left: `${depth * 20 - 10}px` }}
        />
      )}

      <div
        onClick={() => onSelectProcess?.(node)}
        style={{ marginLeft: `${depth * 20}px` }}
        className={`group flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
          isSelected
            ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-950/20"
            : node.is_suspicious
            ? "bg-red-950/20 border-red-500/30 hover:bg-red-950/30"
            : "bg-[#161616] border-white/5 hover:border-white/15 hover:bg-[#1c1c1c]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-gray-600">
                <Terminal className="w-3 h-3" />
              </div>
            )}

            <div className="font-mono text-sm font-semibold text-gray-100 truncate">
              {node.name}
            </div>

            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-gray-800 text-gray-300 border border-white/5">
              PID: {node.pid}
            </span>

            {node.ppid !== undefined && (
              <span className="text-[10px] text-gray-400">
                (PPID: {node.ppid})
              </span>
            )}

            {getIntegrityBadge(node.integrity_level)}

            {node.is_suspicious && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-3 h-3" />
                SUSPICIOUS
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-gray-500" />
              {new Date(node.started_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Command line & User info */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-gray-400 pl-7">
          <div className="flex items-center gap-1.5 text-gray-300 truncate max-w-xl">
            <span className="text-gray-500">$</span>
            <span className="truncate">{node.command_line || node.executable_path}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-400">
            <User className="w-3 h-3 text-gray-500" />
            <span>{node.username || "SYSTEM"}</span>
          </div>

          {node.sha256 && (
            <button
              type="button"
              onClick={handleCopyHash}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition"
              title="Copy SHA-256 Hash"
            >
              <Hash className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{node.sha256.substring(0, 12)}...</span>
              {copiedHash ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Suspicion Reasons */}
        {node.is_suspicious && node.suspicious_reasons && node.suspicious_reasons.length > 0 && (
          <div className="mt-1 pl-7 space-y-1">
            {node.suspicious_reasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-red-400/90 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Children branches */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <ProcessTreeNodeItem
              key={`${child.pid}-${child.started_at}`}
              node={child}
              depth={depth + 1}
              onSelectProcess={onSelectProcess}
              selectedPid={selectedPid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
