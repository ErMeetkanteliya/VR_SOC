"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  Server,
  Globe,
  Link2,
  Hash,
  Mail,
  FileText,
  Activity,
  ShieldAlert,
  Terminal,
  Cpu,
  ArrowRight,
  Clock,
  Layers,
  Database,
} from "lucide-react";
import type { ThreatIndicatorDetail, IocType, IocSeverity } from "@vrsoc/types";

interface IocDetailDrawerProps {
  indicator: ThreatIndicatorDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<IocType, React.ReactNode> = {
  ip: <Server className="w-4 h-4 text-blue-400" />,
  domain: <Globe className="w-4 h-4 text-emerald-400" />,
  url: <Link2 className="w-4 h-4 text-cyan-400" />,
  hash: <Hash className="w-4 h-4 text-purple-400" />,
  email: <Mail className="w-4 h-4 text-amber-400" />,
  file: <FileText className="w-4 h-4 text-rose-400" />,
};

const SEVERITY_BADGES: Record<IocSeverity, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  informational: "bg-white/10 text-white/70 border-white/20",
};

export const IocDetailDrawer: React.FC<IocDetailDrawerProps> = ({
  indicator,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "alerts" | "assets">("overview");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !indicator) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const relatedEvents = (indicator.relationships || []).filter((r) => r.target_type === "event");
  const relatedAlerts = (indicator.relationships || []).filter((r) => r.target_type === "alert" || r.target_type === "incident");
  const relatedAssets = (indicator.relationships || []).filter((r) => r.target_type === "asset" || r.target_type === "malware");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div
        data-testid="ioc-detail-drawer"
        className="relative w-full max-w-2xl bg-[#111111] border-l border-white/10 h-full overflow-y-auto z-10 flex flex-col shadow-2xl"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur border-b border-white/10 p-5 z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Pill */}
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/5 text-white/80 border border-white/10 flex items-center gap-1.5">
                  {TYPE_ICONS[indicator.ioc_type]}
                  <span className="uppercase">{indicator.ioc_type}</span>
                </span>

                {/* Severity Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                    SEVERITY_BADGES[indicator.severity]
                  }`}
                >
                  {indicator.severity}
                </span>

                {/* Status Pill */}
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {indicator.status}
                </span>

                {/* Confidence */}
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {indicator.confidence}% Confidence
                </span>
              </div>

              {/* Indicator Value Title */}
              <div className="flex items-center gap-2 mt-1">
                <h2
                  data-testid="ioc-drawer-title"
                  className="text-lg font-mono font-bold text-white break-all"
                >
                  {indicator.normalized_value}
                </h2>
                <button
                  onClick={() => handleCopy(indicator.normalized_value)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  title="Copy indicator value"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {indicator.raw_value && indicator.raw_value !== indicator.normalized_value && (
                <div className="text-xs font-mono text-white/40">
                  Raw input: {indicator.raw_value}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-white/5 pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "overview" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Overview & Technical
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "events" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              <span>Related Events</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {relatedEvents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "alerts" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              <span>Alerts & Incidents</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {relatedAlerts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "assets" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              <span>Target Assets</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {relatedAssets.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Threat Description
                </h3>
                <p className="text-sm text-white/80 leading-relaxed bg-[#161616] p-4 rounded-xl border border-white/5">
                  {indicator.description || "No descriptive narrative provided for this indicator."}
                </p>
              </div>

              {/* Threat Types & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Threat Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {indicator.threat_types.map((tt) => (
                      <span
                        key={tt}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 uppercase"
                      >
                        {tt}
                      </span>
                    ))}
                    {indicator.threat_types.length === 0 && (
                      <span className="text-xs text-white/40 italic">None tagged</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Analyst Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {indicator.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-white/70 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                    {indicator.tags.length === 0 && (
                      <span className="text-xs text-white/40 italic">None tagged</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Key-Value Details */}
              {indicator.metadata && Object.keys(indicator.metadata).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enriched Technical Metadata</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-[#161616] border border-white/5 grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(indicator.metadata).map(([key, value]) => (
                      <div key={key} className="space-y-0.5">
                        <span className="text-[11px] font-mono text-white/40 uppercase">{key}</span>
                        <div className="font-mono text-white/90 truncate">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Info */}
              <div className="p-4 rounded-xl bg-[#161616] border border-white/5 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>First Seen</span>
                  </span>
                  <div className="font-mono text-white/90">
                    {new Date(indicator.first_seen).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-white/40 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Last Seen</span>
                  </span>
                  <div className="font-mono text-white/90">
                    {new Date(indicator.last_seen).toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RELATED EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-3">
              <div className="text-xs text-white/50">
                Observed telemetry events matching this indicator in VRSOC canonical pipeline.
              </div>
              {relatedEvents.map((rel) => (
                <div key={rel.id} className="p-3.5 rounded-xl bg-[#161616] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-red-400 font-bold">{rel.relationship_type}</span>
                    <span className="text-white/40">{new Date(rel.last_seen).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-mono text-white/80 bg-black/40 p-2 rounded">
                    Target: {rel.target_id}
                  </div>
                  {rel.context && Object.keys(rel.context).length > 0 && (
                    <div className="text-[11px] text-white/50 font-mono">
                      {JSON.stringify(rel.context)}
                    </div>
                  )}
                </div>
              ))}
              {relatedEvents.length === 0 && (
                <div className="py-8 text-center text-xs text-white/40 italic">
                  No telemetry event sightings currently linked.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RELATED ALERTS */}
          {activeTab === "alerts" && (
            <div className="space-y-3">
              <div className="text-xs text-white/50">
                Security alerts and declared incident cases involving this threat indicator.
              </div>
              {relatedAlerts.map((rel) => (
                <div key={rel.id} className="p-3.5 rounded-xl bg-[#161616] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {(rel.context?.alert_title as string) || rel.target_id}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                      {(rel.context?.severity as string) || "Alert"}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    Target ID: {rel.target_id} • Mapped: {rel.relationship_type}
                  </div>
                </div>
              ))}
              {relatedAlerts.length === 0 && (
                <div className="py-8 text-center text-xs text-white/40 italic">
                  No alerts or incidents currently mapped to this indicator.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RELATED ASSETS */}
          {activeTab === "assets" && (
            <div className="space-y-3">
              <div className="text-xs text-white/50">
                Protected endpoints, servers, and malware samples associated with this IOC.
              </div>
              {relatedAssets.map((rel) => (
                <div key={rel.id} className="p-3.5 rounded-xl bg-[#161616] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-white">
                        {(rel.context?.hostname as string) || rel.target_id}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">
                      {(rel.context?.ip_address as string) || ""}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    Relationship: <span className="text-red-400">{rel.relationship_type}</span>
                  </div>
                </div>
              ))}
              {relatedAssets.length === 0 && (
                <div className="py-8 text-center text-xs text-white/40 italic">
                  No assets or malware samples currently linked.
                </div>
              )}
            </div>
          )}

          {/* QUICK SOC PIVOTS FOOTER */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Forensic SOC Investigation Pivots
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/logs?search=${encodeURIComponent(indicator.normalized_value)}`}
                className="p-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-white/5 hover:border-white/20 text-xs font-medium text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>SIEM Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href={`/alerts?search=${encodeURIComponent(indicator.normalized_value)}`}
                className="p-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-white/5 hover:border-white/20 text-xs font-medium text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Alert Center</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href={`/edr?search=${encodeURIComponent(indicator.normalized_value)}`}
                className="p-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-white/5 hover:border-white/20 text-xs font-medium text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>EDR Endpoint</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/mitre"
                className="p-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-white/5 hover:border-white/20 text-xs font-medium text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>MITRE ATT&CK</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
