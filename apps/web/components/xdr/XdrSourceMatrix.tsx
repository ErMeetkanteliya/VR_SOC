"use client";

import React from "react";
import {
  Mail,
  UserCheck,
  Terminal,
  Globe,
  Cloud,
  Network,
  Shield,
  Fingerprint,
  ArrowRight,
} from "lucide-react";
import type { XdrCorrelationResult, XdrTelemetrySource } from "@vrsoc/types";

interface XdrSourceMatrixProps {
  activeCorrelation?: XdrCorrelationResult | null;
}

interface SourceNode {
  id: XdrTelemetrySource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SOURCES: SourceNode[] = [
  { id: "email", label: "Email Gateway", icon: Mail, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { id: "authentication", label: "Authentication / AD", icon: UserCheck, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "endpoint", label: "Endpoint (EDR)", icon: Terminal, color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { id: "dns", label: "DNS Resolution", icon: Globe, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "network", label: "Network Sockets", icon: Network, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "firewall", label: "Perimeter Firewall", icon: Shield, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { id: "cloud", label: "Cloud Audit (IAM/S3)", icon: Cloud, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { id: "identity", label: "SOC Identity", icon: Fingerprint, color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
];

export function XdrSourceMatrix({ activeCorrelation }: XdrSourceMatrixProps) {
  const activeSources = new Set<string>();

  if (activeCorrelation) {
    if (activeCorrelation.source_counts) {
      Object.keys(activeCorrelation.source_counts).forEach((s) => activeSources.add(s.toLowerCase()));
    }
    if (activeCorrelation.explanation) {
      activeCorrelation.explanation.forEach((e) => activeSources.add(e.source.toLowerCase()));
    }
  }

  return (
    <div className="p-5 rounded-xl bg-[#161616]/90 border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Multi-Source Telemetry Matrix</h3>
          <p className="text-xs text-white/50">Cross-domain detection convergence &amp; killchain coverage</p>
        </div>
        {activeCorrelation && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/40">Correlation:</span>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#5B0A0A]/40 text-red-300 border border-red-500/30">
              {activeCorrelation.correlation_code}
            </span>
          </div>
        )}
      </div>

      {/* Grid of 8 Telemetry Surfaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {SOURCES.map((source) => {
          const isActive = activeSources.has(source.id);
          const count = activeCorrelation?.source_counts?.[source.id] || 0;
          const Icon = source.icon;

          return (
            <div
              key={source.id}
              className={`p-3 rounded-xl border flex flex-col items-center text-center justify-between transition-all duration-200 ${
                isActive
                  ? `${source.color} shadow-lg shadow-black/40 scale-[1.02]`
                  : "bg-white/[0.02] border-white/5 opacity-40 text-white/50"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium leading-tight">{source.label}</span>
              <div className="mt-2 text-[10px] font-mono">
                {isActive ? (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                    {count > 0 ? `${count} events` : "Active"}
                  </span>
                ) : (
                  <span className="text-white/30">Inactive</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sequential Killchain Summary banner if active */}
      {activeCorrelation && activeCorrelation.explanation.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-white/40 shrink-0 uppercase tracking-wider text-[10px]">Killchain Flow:</span>
          {activeCorrelation.explanation.map((exp, idx) => (
            <React.Fragment key={idx}>
              <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-white/80 shrink-0 flex items-center gap-1.5">
                <span className="text-[10px] text-red-400 font-bold">#{exp.step}</span>
                <span>{exp.title}</span>
              </div>
              {idx < activeCorrelation.explanation.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
