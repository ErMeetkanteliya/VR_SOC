"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ChevronRight,
  Server,
  Globe,
  Link2,
  Hash,
  Mail,
  FileText,
} from "lucide-react";
import type { ThreatIndicator, IocType, IocSeverity } from "@vrsoc/types";

interface IocTableProps {
  indicators: ThreatIndicator[];
  onSelectIndicator: (indicator: ThreatIndicator) => void;
  selectedId?: string | null;
}

const TYPE_ICONS: Record<IocType, React.ReactNode> = {
  ip: <Server className="w-3.5 h-3.5 text-blue-400" />,
  domain: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
  url: <Link2 className="w-3.5 h-3.5 text-cyan-400" />,
  hash: <Hash className="w-3.5 h-3.5 text-purple-400" />,
  email: <Mail className="w-3.5 h-3.5 text-amber-400" />,
  file: <FileText className="w-3.5 h-3.5 text-rose-400" />,
};

const SEVERITY_BADGES: Record<IocSeverity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  informational: "bg-white/10 text-white/60 border-white/20",
};

export const IocTable: React.FC<IocTableProps> = ({
  indicators,
  onSelectIndicator,
  selectedId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-xl bg-[#141414] border border-white/10 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#181818] text-white/50 uppercase tracking-wider font-semibold border-b border-white/10">
            <tr>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Indicator Value</th>
              <th className="py-3.5 px-4">Threat Tags</th>
              <th className="py-3.5 px-4">Confidence</th>
              <th className="py-3.5 px-4">Source</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Last Seen</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-normal text-white/80">
            {indicators.map((ioc) => {
              const isSelected = selectedId === ioc.id;
              const sevBadge = SEVERITY_BADGES[ioc.severity] || SEVERITY_BADGES.medium;

              return (
                <tr
                  key={ioc.id}
                  data-testid={`ioc-row-${ioc.id}`}
                  onClick={() => onSelectIndicator(ioc)}
                  className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                    isSelected ? "bg-red-500/10 border-l-2 border-l-red-500" : ""
                  }`}
                >
                  {/* Severity Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${sevBadge}`}
                    >
                      {ioc.severity}
                    </span>
                  </td>

                  {/* Type Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase font-semibold text-white/70">
                      {TYPE_ICONS[ioc.ioc_type] || <Hash className="w-3.5 h-3.5" />}
                      <span>{ioc.ioc_type}</span>
                    </span>
                  </td>

                  {/* Normalized Value & Copy Button */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white truncate" title={ioc.normalized_value}>
                        {ioc.normalized_value}
                      </span>
                      <button
                        onClick={(e) => handleCopy(e, ioc.normalized_value, ioc.id)}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Copy normalized value"
                      >
                        {copiedId === ioc.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {ioc.raw_value && ioc.raw_value !== ioc.normalized_value && (
                      <div className="text-[10px] font-mono text-white/40 truncate mt-0.5" title={`Original: ${ioc.raw_value}`}>
                        orig: {ioc.raw_value}
                      </div>
                    )}
                  </td>

                  {/* Threat Tags */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {ioc.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/70 border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                      {ioc.threat_types.slice(0, 1).map((tt) => (
                        <span
                          key={tt}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-300 border border-red-500/20"
                        >
                          {tt}
                        </span>
                      ))}
                      {ioc.tags.length > 2 && (
                        <span className="text-[10px] text-white/40">+{ioc.tags.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Confidence Meter */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ioc.confidence >= 80
                              ? "bg-emerald-500"
                              : ioc.confidence >= 50
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${ioc.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-white/60">
                        {ioc.confidence}%
                      </span>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-[11px] text-white/60 capitalize">
                      {ioc.source}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ioc.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : ioc.status === "whitelisted"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ioc.status === "active"
                            ? "bg-emerald-400"
                            : ioc.status === "whitelisted"
                            ? "bg-blue-400"
                            : "bg-white/40"
                        }`}
                      />
                      <span className="capitalize">{ioc.status}</span>
                    </span>
                  </td>

                  {/* Last Seen */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-white/50 font-mono">
                    {new Date(ioc.last_seen).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Inspect Button */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      data-testid={`inspect-ioc-${ioc.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIndicator(ioc);
                      }}
                      className="text-xs text-red-400 group-hover:text-red-300 inline-flex items-center gap-1 font-medium bg-transparent border-0 cursor-pointer p-0"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {indicators.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-white/40 italic">
                  No Threat Indicators match the specified filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
