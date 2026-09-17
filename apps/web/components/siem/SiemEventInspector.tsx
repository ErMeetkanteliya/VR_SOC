"use client";

import React, { useState } from "react";
import { Drawer, SeverityBadge, Button } from "@vrsoc/ui";
import {
  Clock,
  Server,
  User,
  Shield,
  FileCode,
  Network,
  Cpu,
  Copy,
  Check,
  Zap,
  Activity,
} from "lucide-react";
import type { TelemetryEvent, LogRecord, SiemCorrelatedGroup } from "@vrsoc/types";
import { getEventCorrelationsAction, getSiemEventDetailsAction } from "@/lib/siem/actions";

interface SiemEventInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  event?: TelemetryEvent | null;
  log?: LogRecord | null;
  onSelectCorrelatedEvent?: (event: TelemetryEvent) => void;
}

export function SiemEventInspector({
  isOpen,
  onClose,
  event,
  log,
  onSelectCorrelatedEvent,
}: SiemEventInspectorProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "normalized" | "auxiliary" | "raw" | "correlated">("overview");
  const [copied, setCopied] = useState(false);
  const [isLoadingCorrelations, setIsLoadingCorrelations] = useState(false);
  const [correlations, setCorrelations] = useState<SiemCorrelatedGroup[]>([]);
  const [deepDetails, setDeepDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load deep details whenever open
  React.useEffect(() => {
    if (isOpen && event?.id) {
      setIsLoadingDetails(true);
      getSiemEventDetailsAction(event.id)
        .then((res) => {
          if (res.success && res.data) {
            setDeepDetails(res.data);
          }
        })
        .finally(() => setIsLoadingDetails(false));
    }
  }, [isOpen, event?.id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchCorrelations = async () => {
    if (!event?.id) return;
    setActiveTab("correlated");
    setIsLoadingCorrelations(true);
    try {
      const res = await getEventCorrelationsAction({
        organizationId: event.organization_id,
        eventId: event.id,
        timeWindowMinutes: 30,
      });
      if (res.success && res.data) {
        setCorrelations(res.data);
      }
    } finally {
      setIsLoadingCorrelations(false);
    }
  };

  if (!event && !log) {
    return null;
  }

  const title = event
    ? `${event.category}: ${event.event_type}`
    : log
    ? `Log Record: ${log.service_name || log.facility}`
    : "Telemetry Inspection";

  const rawJson = event
    ? JSON.stringify({ ...event, ...deepDetails }, null, 2)
    : log
    ? JSON.stringify(log, null, 2)
    : "{}";

  const occurredAt = event?.occurred_at || log?.logged_at || "";
  const createdAt = event?.created_at || log?.created_at || "";

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} width="xl">
      <div className="space-y-4 text-xs">
        {/* Top Summary Card */}
        <div className="bg-charcoal-900 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {event && <SeverityBadge severity={event.severity} />}
              {log && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-crimson-950 text-crimson-400 border border-crimson-800/40">
                  {log.log_level}
                </span>
              )}
              <span className="font-mono text-gray-400 text-[11px]">
                ID: {event?.id || log?.id}
              </span>
            </div>

            {event && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleFetchCorrelations}
                className="text-[11px] h-7 gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                Correlate Telemetry
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-crimson-400" />
                Occurrence Time (occurred_at)
              </span>
              <p className="font-mono text-gray-200 text-xs">{occurredAt}</p>
              <p className="text-[10px] text-gray-500">Authoritative telemetry event timestamp</p>
            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Persistence Time (created_at)
              </span>
              <p className="font-mono text-gray-200 text-xs">{createdAt}</p>
              <p className="text-[10px] text-gray-500">Pipeline storage & ingestion timestamp</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === "overview"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("normalized")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === "normalized"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Normalized Fields
          </button>
          <button
            onClick={() => setActiveTab("auxiliary")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === "auxiliary"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Auxiliary Entities
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === "raw"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Raw JSON Payload
          </button>
          {event && (
            <button
              onClick={handleFetchCorrelations}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "correlated"
                  ? "bg-crimson-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Correlated Streams
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-charcoal-900 border border-white/5 p-3 rounded-lg space-y-2">
                <span className="text-gray-400 font-semibold block text-[11px] uppercase tracking-wider">
                  Source & Taxonomy
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Source:</span>
                    <span className="font-semibold text-white">{event?.source || log?.service_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Source Type:</span>
                    <span className="text-gray-300">{event?.source_type || log?.facility}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-300">{event?.category || "System"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Pipeline Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      {event?.pipeline_status || log?.parse_status || "Stored"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-charcoal-900 border border-white/5 p-3 rounded-lg space-y-2">
                <span className="text-gray-400 font-semibold block text-[11px] uppercase tracking-wider">
                  Attribution Context
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Server className="w-3 h-3 text-crimson-400" /> Hostname:
                    </span>
                    <span className="font-semibold text-white">
                      {(event as any)?.asset?.hostname || event?.source_host || log?.source_host || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" /> User:
                    </span>
                    <span className="font-semibold text-white">
                      {(event as any)?.identity?.username || (event?.normalized_fields as any)?.user || "SYSTEM / N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-400" /> Agent:
                    </span>
                    <span className="text-gray-300">
                      {(event as any)?.agent?.agent_version ? `v${(event as any).agent.agent_version}` : "Agentless / Syslog"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Ingestion Batch ID:</span>
                    <span className="font-mono text-gray-400 text-[10px]">
                      {event?.ingestion_id || "direct-stream"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw message preview */}
            <div className="bg-black/50 border border-white/5 p-3 rounded-lg space-y-1">
              <span className="text-gray-400 font-semibold text-[11px] block">Raw Message Summary:</span>
              <p className="font-mono text-gray-300 text-xs break-all">
                {log?.message || (event?.normalized_fields as any)?.message || log?.raw_log || event?.event_type}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Normalized Fields */}
        {activeTab === "normalized" && (
          <div className="bg-charcoal-900 border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-semibold text-[11px]">
                <tr>
                  <th className="py-2 px-3">Field Name</th>
                  <th className="py-2 px-3">Normalized Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {Object.entries((event?.normalized_fields as Record<string, unknown>) || {}).map(
                  ([key, val]) => (
                    <tr key={key} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-crimson-300 font-semibold">{key}</td>
                      <td className="py-2 px-3 text-gray-200 break-all">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Auxiliary Entities */}
        {activeTab === "auxiliary" && (
          <div className="space-y-3">
            {isLoadingDetails ? (
              <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 text-crimson-500 animate-spin" /> Fetching auxiliary entities...
              </div>
            ) : (
              <>
                {/* Process Entity */}
                <div className="bg-charcoal-900 border border-white/5 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-white/5 pb-2">
                    <Cpu className="w-4 h-4 text-blue-400" /> Process Execution
                  </div>
                  {deepDetails?.process ? (
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Process Name:</span>
                        <span className="text-gray-200">{deepDetails.process.name} (PID: {deepDetails.process.pid})</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-gray-500 block mb-0.5">Command Line:</span>
                        <p className="bg-black/50 p-1.5 rounded text-gray-300 break-all">{deepDetails.process.command_line}</p>
                      </div>
                      {deepDetails.process.sha256 && (
                        <div className="text-[10px] text-gray-500">SHA256: {deepDetails.process.sha256}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">No dedicated process entity linked to this event.</p>
                  )}
                </div>

                {/* File Entity */}
                <div className="bg-charcoal-900 border border-white/5 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-white/5 pb-2">
                    <FileCode className="w-4 h-4 text-amber-400" /> File Mutation
                  </div>
                  {deepDetails?.file ? (
                    <div className="space-y-1 text-xs font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">File Name:</span>
                        <span className="text-gray-200">{deepDetails.file.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Path:</span>
                        <span className="text-gray-200 break-all">{deepDetails.file.path}</span>
                      </div>
                      {deepDetails.file.sha256 && (
                        <div className="text-[10px] text-gray-500">SHA256: {deepDetails.file.sha256}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">No file modification recorded with this event.</p>
                  )}
                </div>

                {/* Network Connection */}
                <div className="bg-charcoal-900 border border-white/5 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-white/5 pb-2">
                    <Network className="w-4 h-4 text-emerald-400" /> Network Flow
                  </div>
                  {deepDetails?.network ? (
                    <div className="space-y-1 text-xs font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="text-gray-200">{deepDetails.network.src_ip}:{deepDetails.network.src_port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Destination:</span>
                        <span className="text-gray-200">{deepDetails.network.dst_ip}:{deepDetails.network.dst_port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Protocol:</span>
                        <span className="text-gray-200">{deepDetails.network.protocol} ({deepDetails.network.direction})</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">No network connection flow attached.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === "raw" && (
          <div className="relative">
            <button
              onClick={() => handleCopy(rawJson)}
              className="absolute right-3 top-3 px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <pre className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-[11px] text-gray-300 overflow-x-auto max-h-96">
              {rawJson}
            </pre>
          </div>
        )}

        {/* Tab 5: Correlated Streams */}
        {activeTab === "correlated" && (
          <div className="space-y-3">
            {isLoadingCorrelations ? (
              <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 text-crimson-500 animate-spin" /> Calculating telemetry correlations...
              </div>
            ) : correlations.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No correlated activity clusters detected for this event within the ±30m window.
              </div>
            ) : (
              correlations.map((group, gIdx) => (
                <div key={gIdx} className="bg-charcoal-900 border border-white/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> {group.label}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded">
                      {group.count} events
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{group.reason}</p>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    {group.events.slice(0, 5).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onSelectCorrelatedEvent?.(ev)}
                        className="p-2 bg-black/40 hover:bg-white/5 rounded border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={ev.severity} />
                          <span className="text-xs text-gray-200 font-semibold">{ev.event_type}</span>
                          <span className="text-[10px] text-gray-500 font-mono">({ev.source})</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">{ev.occurred_at.substring(11, 19)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
