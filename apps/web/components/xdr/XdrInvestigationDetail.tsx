"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Shield,
  User,
  Server,
  Terminal,
  Globe,
  Mail,
  Cloud,
  Network,
  ChevronRight,
  Code2,
  Copy,
  Check,
} from "lucide-react";

import type {
  XdrInvestigationPackage,
  XdrTelemetrySource,
  SeverityLevel,
} from "@vrsoc/types";

interface XdrInvestigationDetailProps {
  investigation: XdrInvestigationPackage;
}

type DetailTab = "overview" | "timeline" | "sources" | "alerts" | "context";

export function XdrInvestigationDetail({ investigation }: XdrInvestigationDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [timelineSourceFilter, setTimelineSourceFilter] = useState<string>("ALL");
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const { correlation, primaryAsset, primaryIdentity, timeline, relatedAlerts } = investigation;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const filteredTimeline = timeline.filter((item) => {
    if (timelineSourceFilter === "ALL") return true;
    return item.source === timelineSourceFilter;
  });

  const getSeverityBadge = (sev: SeverityLevel | string) => {
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

  const getSourceIcon = (src: XdrTelemetrySource) => {
    switch (src) {
      case "email":
        return <Mail className="w-3.5 h-3.5 text-purple-400" />;
      case "authentication":
        return <User className="w-3.5 h-3.5 text-amber-400" />;
      case "endpoint":
        return <Terminal className="w-3.5 h-3.5 text-red-400" />;
      case "dns":
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case "network":
        return <Network className="w-3.5 h-3.5 text-blue-400" />;
      case "firewall":
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case "cloud":
        return <Cloud className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-[#161616]/90 border border-white/10 shadow-xl space-y-5 flex flex-col h-full">
      {/* Top Header & Pivots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-[#5B0A0A]/40 text-red-300 border border-red-500/30">
              {correlation.correlation_code}
            </span>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${getSeverityBadge(correlation.severity)}`}>
              {correlation.severity} Severity
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {correlation.confidence_score}% Confidence
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{correlation.title}</h2>
          <p className="text-xs text-white/60">{correlation.description}</p>
        </div>

        {/* 1-Click Forensic Pivots */}
        <div className="flex items-center gap-2 shrink-0">
          {primaryAsset && (
            <Link
              href={`/edr?assetId=${primaryAsset.id}`}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>Pivot to EDR</span>
            </Link>
          )}

          <Link
            href={`/logs?query=${encodeURIComponent(correlation.primary_entity_name || correlation.correlation_code)}`}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Pivot to SIEM</span>
          </Link>

          <Link
            href={`/alerts?query=${encodeURIComponent(correlation.correlation_code)}`}
            className="px-3 py-1.5 rounded-lg bg-[#5B0A0A]/60 border border-[#E53935]/40 hover:bg-[#5B0A0A] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-red-300" />
            <span>Alert Center</span>
          </Link>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "overview"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            Killchain &amp; Identifiers
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "timeline"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>Cross-Source Timeline</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-white/10">{timeline.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "sources"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            Source Telemetry Tables
          </button>
          <button
            onClick={() => setActiveTab("context")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "context"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            Entity Dossiers
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "alerts"
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>Related Alerts</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-white/10">{relatedAlerts.length}</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* TAB 1: OVERVIEW & KILLCHAIN */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Step-by-Step Killchain Explanation */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Deterministic Killchain Explanation ({correlation.explanation.length} Verified Steps)
              </h3>
              <div className="space-y-2.5">
                {correlation.explanation.map((step) => (
                  <div
                    key={step.step}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-medium text-white/80">
                          {getSourceIcon(step.source)}
                          <span className="capitalize">{step.source}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">{step.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/40">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 pl-7">{step.description}</p>
                    {step.evidence && Object.keys(step.evidence).length > 0 && (
                      <div className="pl-7 pt-1">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-white/60 flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(step.evidence).map(([k, v]) => (
                            <span key={k}>
                              <span className="text-white/40">{k}:</span> {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Identifiers Matrix */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Shared Correlation Identifiers &amp; IOCs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* IPs */}
                {correlation.shared_identifiers?.ips && correlation.shared_identifiers.ips.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-blue-400" />
                      <span>Correlated IP Addresses</span>
                    </span>
                    <div className="space-y-1">
                      {correlation.shared_identifiers.ips.map((ip) => (
                        <div key={ip} className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-black/40 border border-white/5">
                          <span className="text-white/90">{ip}</span>
                          <button
                            onClick={() => handleCopy(ip, ip)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {copiedText === ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {correlation.shared_identifiers?.domains && correlation.shared_identifiers.domains.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Attributed Domains</span>
                    </span>
                    <div className="space-y-1">
                      {correlation.shared_identifiers.domains.map((dom) => (
                        <div key={dom} className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-black/40 border border-white/5">
                          <span className="text-cyan-300">{dom}</span>
                          <button
                            onClick={() => handleCopy(dom, dom)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {copiedText === dom ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usernames */}
                {correlation.shared_identifiers?.usernames && correlation.shared_identifiers.usernames.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Associated Accounts</span>
                    </span>
                    <div className="space-y-1">
                      {correlation.shared_identifiers.usernames.map((u) => (
                        <div key={u} className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-black/40 border border-white/5">
                          <span className="text-amber-300">{u}</span>
                          <button
                            onClick={() => handleCopy(u, u)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {copiedText === u ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UNIFIED CHRONOLOGICAL TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {/* Timeline Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-white/40 text-[11px] mr-1">Filter Source:</span>
              {["ALL", "endpoint", "email", "authentication", "dns", "network", "firewall", "cloud"].map((src) => (
                <button
                  key={src}
                  onClick={() => setTimelineSourceFilter(src)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 capitalize transition-colors ${
                    timelineSourceFilter === src
                      ? "bg-[#5B0A0A] text-white border border-[#E53935]/40"
                      : "bg-white/[0.02] text-white/50 border border-white/5 hover:text-white"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredTimeline.map((item) => {
                const isExpanded = expandedTimelineId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-white/80">
                          {getSourceIcon(item.source)}
                          <span className="capitalize">{item.source}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="text-[11px] font-mono text-white/40">
                          {new Date(item.occurredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-white/70">{item.summary}</p>

                    {/* Raw inspector button */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        onClick={() => setExpandedTimelineId(isExpanded ? null : item.id)}
                        className="text-white/40 hover:text-white flex items-center gap-1 font-mono transition-colors"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>{isExpanded ? "Hide Raw Payload" : "View Raw JSON"}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <pre className="p-3 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                        {JSON.stringify(item.rawPayload || item.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SOURCE TELEMETRY TABLES */}
        {activeTab === "sources" && (
          <div className="space-y-4">
            {/* DNS Records */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">DNS Queries &amp; Resolutions</h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-white/50 text-[11px] font-mono border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Domain</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Resolved IPs</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[11px]">
                    {investigation.dnsEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-white/30">No DNS events in cluster</td>
                      </tr>
                    ) : (
                      investigation.dnsEvents.map((dns) => (
                        <tr key={dns.id} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 text-cyan-300 font-bold">{dns.query_domain}</td>
                          <td className="p-2.5">{dns.query_type}</td>
                          <td className="p-2.5">{dns.resolved_ips?.join(", ") || "NXDOMAIN"}</td>
                          <td className="p-2.5">
                            <span className={dns.is_malicious ? "text-red-400" : "text-emerald-400"}>
                              {dns.response_code}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Email Records */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Email Messages</h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-white/50 text-[11px] font-mono border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Sender</th>
                      <th className="p-2.5">Recipient</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Attachment</th>
                      <th className="p-2.5">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[11px]">
                    {investigation.emailEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-white/30">No Email events in cluster</td>
                      </tr>
                    ) : (
                      investigation.emailEvents.map((mail) => (
                        <tr key={mail.id} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 text-purple-300">{mail.sender}</td>
                          <td className="p-2.5">{mail.recipient}</td>
                          <td className="p-2.5 text-white font-sans">{mail.subject}</td>
                          <td className="p-2.5 text-amber-300">{mail.attachment_name || "None"}</td>
                          <td className="p-2.5">
                            <span className={mail.is_phishing ? "text-red-400" : "text-emerald-400"}>
                              {mail.action}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Firewall Records */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Perimeter Firewall Traffic</h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-white/50 text-[11px] font-mono border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5">Destination</th>
                      <th className="p-2.5">Protocol</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Rule / Threat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[11px]">
                    {investigation.firewallEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-white/30">No Firewall events in cluster</td>
                      </tr>
                    ) : (
                      investigation.firewallEvents.map((fw) => (
                        <tr key={fw.id} className="hover:bg-white/[0.02]">
                          <td className="p-2.5">{fw.src_ip}:{fw.src_port}</td>
                          <td className="p-2.5 text-red-300">{fw.dst_ip}:{fw.dst_port}</td>
                          <td className="p-2.5">{fw.protocol}</td>
                          <td className="p-2.5 font-bold">
                            <span className={fw.action === "Blocked" ? "text-red-400" : "text-emerald-400"}>
                              {fw.action}
                            </span>
                          </td>
                          <td className="p-2.5 text-white/60">{fw.rule_name || fw.threat_name || "Default"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ENTITY CONTEXT */}
        {activeTab === "context" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Asset */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target Endpoint Host</h4>
              </div>
              {primaryAsset ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Hostname</span>
                    <span className="font-mono text-white">{primaryAsset.hostname}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">IP Address</span>
                    <span className="font-mono text-white">{primaryAsset.ip_address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Operating System</span>
                    <span className="text-white">{primaryAsset.os_type} {primaryAsset.os_version || ""}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Criticality</span>
                    <span className="font-mono text-red-400">{primaryAsset.criticality}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40">No primary asset assigned to this correlation cluster.</p>
              )}
            </div>

            {/* Primary Identity */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Attributed User Identity</h4>
              </div>
              {primaryIdentity ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Username</span>
                    <span className="font-mono text-white">{primaryIdentity.username}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Email</span>
                    <span className="font-mono text-white">{primaryIdentity.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Account Type</span>
                    <span className="text-white">{primaryIdentity.account_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Privileged</span>
                    <span className={primaryIdentity.is_privileged ? "text-red-400 font-bold" : "text-white/60"}>
                      {primaryIdentity.is_privileged ? "YES (Administrator)" : "Standard User"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40">No primary identity assigned to this correlation cluster.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RELATED ALERTS */}
        {activeTab === "alerts" && (
          <div className="space-y-2.5">
            {relatedAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40">No correlated alerts linked.</div>
            ) : (
              relatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white/90">{alert.alert_code}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">Risk: {alert.risk_score}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white">{alert.title}</h4>
                  </div>

                  <Link
                    href={`/alerts?query=${encodeURIComponent(alert.alert_code)}`}
                    className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Alert</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
