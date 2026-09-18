"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProcessTreeView } from "./ProcessTreeView";
import type {
  EndpointInvestigationPackage,
  EdrProcessTreeNode,
} from "@vrsoc/types";
import {
  Cpu,
  FileText,
  Network,
  Database,
  Sliders,
  HardDrive,
  Clock,
  AlertTriangle,
  Search,
  ExternalLink,
  Terminal,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface EndpointActivityTabsProps {
  investigation: EndpointInvestigationPackage;
}

export function EndpointActivityTabs({ investigation }: EndpointActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<
    | "tree"
    | "processes"
    | "files"
    | "network"
    | "registry"
    | "services_tasks"
    | "startup_usb"
    | "timeline"
    | "alerts"
  >("tree");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProcess, setSelectedProcess] = useState<EdrProcessTreeNode | null>(null);

  const {
    processes,
    processTree,
    files,
    networkConnections,
    registryEvents,
    services,
    scheduledTasks,
    startupItems,
    usbEvents,
    timeline,
    relatedAlerts,
    asset,
  } = investigation;

  const tabs = [
    { id: "tree", label: "Process Tree", icon: <Cpu className="w-4 h-4" />, count: processes.length },
    { id: "processes", label: "Process List", icon: <Terminal className="w-4 h-4" />, count: processes.length },
    { id: "files", label: "File Activity", icon: <FileText className="w-4 h-4" />, count: files.length },
    { id: "network", label: "Network Sockets", icon: <Network className="w-4 h-4" />, count: networkConnections.length },
    { id: "registry", label: "Registry Changes", icon: <Database className="w-4 h-4" />, count: registryEvents.length },
    { id: "services_tasks", label: "Services & Tasks", icon: <Sliders className="w-4 h-4" />, count: services.length + scheduledTasks.length },
    { id: "startup_usb", label: "Startup & USB", icon: <HardDrive className="w-4 h-4" />, count: startupItems.length + usbEvents.length },
    { id: "timeline", label: "Forensic Timeline", icon: <Clock className="w-4 h-4" />, count: timeline.length },
    { id: "alerts", label: "Related Alerts", icon: <AlertTriangle className="w-4 h-4" />, count: relatedAlerts.length, badgeColor: "text-red-400" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#5B0A0A]/40 text-red-300 border border-red-500/40 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive ? "bg-red-500/20 text-red-200" : "bg-white/5 text-gray-400"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Filter Search within Tab */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter tab records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#161616] border border-white/5 rounded-xl p-5 min-h-[480px]">
        {/* Tab 1: Process Tree */}
        {activeTab === "tree" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProcessTreeView
                tree={processTree}
                onSelectProcess={(node) => setSelectedProcess(node)}
                selectedPid={selectedProcess?.pid}
              />
            </div>

            {/* Selected Process Detail Panel */}
            <div className="bg-[#121212] border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                  Process Inspector
                </h4>
                {selectedProcess?.is_suspicious && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    Suspicious Activity
                  </span>
                )}
              </div>

              {selectedProcess ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Process Name</span>
                    <span className="font-mono text-gray-200 font-semibold text-sm">
                      {selectedProcess.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 block">PID</span>
                      <span className="font-mono text-gray-300">{selectedProcess.pid}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Parent PID</span>
                      <span className="font-mono text-gray-300">{selectedProcess.ppid ?? "None"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Command Line</span>
                    <div className="font-mono text-[11px] text-gray-300 bg-black/40 p-2 rounded border border-white/5 break-all mt-1">
                      {selectedProcess.command_line || selectedProcess.executable_path}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Executable Path</span>
                    <span className="font-mono text-gray-400 break-all">{selectedProcess.executable_path}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">User Context</span>
                    <span className="text-gray-300">{selectedProcess.username || "SYSTEM"}</span>
                  </div>

                  {selectedProcess.sha256 && (
                    <div>
                      <span className="text-gray-500 block">SHA-256 Hash</span>
                      <span className="font-mono text-[10px] text-gray-400 break-all">{selectedProcess.sha256}</span>
                    </div>
                  )}

                  {selectedProcess.suspicious_reasons && selectedProcess.suspicious_reasons.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <span className="text-red-400 font-medium block">Detection Findings:</span>
                      {selectedProcess.suspicious_reasons.map((r, i) => (
                        <div key={i} className="text-red-300/90 text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pivot link to SIEM logs for this process */}
                  <div className="pt-3 border-t border-white/5">
                    <Link
                      href={`/logs?query=${encodeURIComponent(selectedProcess.name)}&assetId=${asset.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg text-xs font-medium transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      <span>Pivot to SIEM Logs for Process</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Select any node in the process tree to inspect its command arguments, execution hashes, and security tags.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Process List Table */}
        {activeTab === "processes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">PID / PPID</th>
                  <th className="py-2.5 px-3">Process Name</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Command Line</th>
                  <th className="py-2.5 px-3">Integrity</th>
                  <th className="py-2.5 px-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processes
                  .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.command_line?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2 px-3 font-mono text-gray-400">{p.pid} / {p.ppid ?? "-"}</td>
                      <td className="py-2 px-3 font-semibold text-gray-100 font-mono">{p.name}</td>
                      <td className="py-2 px-3 text-gray-300">{p.username || "SYSTEM"}</td>
                      <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-xs">{p.command_line || p.executable_path}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-300">
                          {p.integrity_level || "Medium"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400">{new Date(p.started_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: File Activity Table */}
        {activeTab === "files" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Path</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Executable</th>
                  <th className="py-2.5 px-3">SHA-256</th>
                  <th className="py-2.5 px-3">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {files
                  .filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((f) => (
                    <tr key={f.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2 px-3 font-semibold text-gray-100 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>{f.name}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-sm">{f.path}</td>
                      <td className="py-2 px-3 text-gray-400">{(f.size_bytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2 px-3">
                        {f.is_executable ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">YES</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-500 truncate max-w-[140px]">{f.sha256 || "-"}</td>
                      <td className="py-2 px-3 text-gray-400">{new Date(f.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Network Connections Table */}
        {activeTab === "network" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Source (Local)</th>
                  <th className="py-2.5 px-3">Destination (Remote)</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Traffic</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {networkConnections
                  .filter((n) => !searchQuery || n.dst_ip.includes(searchQuery) || n.src_ip.includes(searchQuery))
                  .map((n) => (
                    <tr key={n.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2 px-3">
                        <span className="flex items-center gap-1 font-medium">
                          {n.direction === "Outbound" ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
                          )}
                          <span>{n.direction}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-300">{n.src_ip}:{n.src_port}</td>
                      <td className="py-2 px-3 font-mono text-gray-100 font-semibold">{n.dst_ip}:{n.dst_port}</td>
                      <td className="py-2 px-3 font-mono text-gray-400">{n.protocol}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/15 text-green-300 border border-green-500/30">
                          {n.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400">{(n.bytes_sent || 0) + (n.bytes_received || 0)} B</td>
                      <td className="py-2 px-3 text-gray-400">{new Date(n.started_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Registry Events Table */}
        {activeTab === "registry" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Hive</th>
                  <th className="py-2.5 px-3">Key Path</th>
                  <th className="py-2.5 px-3">Value Name</th>
                  <th className="py-2.5 px-3">Value Data</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registryEvents
                  .filter((r) => !searchQuery || r.key_path.toLowerCase().includes(searchQuery.toLowerCase()) || r.value_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {r.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-gray-200">{r.hive}</td>
                      <td className="py-2 px-3 font-mono text-gray-300 truncate max-w-sm">{r.key_path}</td>
                      <td className="py-2 px-3 font-mono text-gray-100">{r.value_name || "-"}</td>
                      <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-xs">{r.value_data || "-"}</td>
                      <td className="py-2 px-3 text-gray-400">{new Date(r.occurred_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Services & Scheduled Tasks */}
        {activeTab === "services_tasks" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Installed & Modified Services ({services.length})
              </h4>
              <div className="overflow-x-auto border border-white/5 rounded-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Service Name</th>
                      <th className="py-2 px-3">Display Name</th>
                      <th className="py-2 px-3">Binary Path</th>
                      <th className="py-2 px-3">Start Type</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-mono font-semibold text-gray-100">{s.service_name}</td>
                        <td className="py-2 px-3 text-gray-300">{s.display_name}</td>
                        <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-xs">{s.executable_path || "-"}</td>
                        <td className="py-2 px-3 text-gray-400">{s.start_type}</td>
                        <td className="py-2 px-3 text-green-400">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Scheduled Tasks & Persistence ({scheduledTasks.length})
              </h4>
              <div className="overflow-x-auto border border-white/5 rounded-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Task Name</th>
                      <th className="py-2 px-3">Path</th>
                      <th className="py-2 px-3">Command Executed</th>
                      <th className="py-2 px-3">Trigger</th>
                      <th className="py-2 px-3">Run As User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {scheduledTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-mono font-semibold text-gray-100">{t.task_name}</td>
                        <td className="py-2 px-3 text-gray-400 font-mono">{t.task_path || "\\"}</td>
                        <td className="py-2 px-3 font-mono text-gray-300 truncate max-w-sm">{t.command} {t.arguments}</td>
                        <td className="py-2 px-3 text-gray-300">{t.trigger_type}</td>
                        <td className="py-2 px-3 text-gray-400">{t.run_as_user || "SYSTEM"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Startup Items & USB Devices */}
        {activeTab === "startup_usb" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Startup Items & Autoruns ({startupItems.length})
              </h4>
              <div className="overflow-x-auto border border-white/5 rounded-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Location Type</th>
                      <th className="py-2 px-3">Command / Binary</th>
                      <th className="py-2 px-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {startupItems.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-mono font-semibold text-gray-100">{st.name}</td>
                        <td className="py-2 px-3 text-gray-300">{st.location_type}</td>
                        <td className="py-2 px-3 font-mono text-gray-400 truncate max-w-sm">{st.command}</td>
                        <td className="py-2 px-3 text-gray-400">{st.user_context || "SYSTEM"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                USB & Removable Storage Devices ({usbEvents.length})
              </h4>
              <div className="overflow-x-auto border border-white/5 rounded-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Device Name</th>
                      <th className="py-2 px-3">Drive</th>
                      <th className="py-2 px-3">Serial Number</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usbEvents.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-medium text-amber-300">{u.action}</td>
                        <td className="py-2 px-3 font-semibold text-gray-100">{u.device_name}</td>
                        <td className="py-2 px-3 font-mono text-gray-300">{u.drive_letter || "-"}</td>
                        <td className="py-2 px-3 font-mono text-gray-500 truncate max-w-xs">{u.serial_number || "-"}</td>
                        <td className="py-2 px-3 text-gray-400">{new Date(u.occurred_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Chronological Forensic Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {timeline
              .filter((item) => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.summary.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-[#121212] hover:bg-[#181818] transition"
                >
                  <div className="shrink-0 mt-1">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-gray-300 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-gray-100 truncate">{item.title}</h5>
                      <span className="text-[11px] font-mono text-gray-500 shrink-0">
                        {new Date(item.occurredAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.summary}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Tab 9: Related Alerts & SIEM Pivots */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Active alerts triggered on this endpoint by Phase 15 detection rules
              </span>
              <Link
                href={`/logs?assetId=${asset.id}`}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
              >
                <span>View all raw telemetry in SIEM</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {relatedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {alert.severity}
                      </span>
                      <h5 className="text-xs font-semibold text-gray-100">{alert.title}</h5>
                    </div>
                    <p className="text-xs text-gray-400">{alert.description}</p>
                  </div>

                  <Link
                    href={`/alerts?query=${encodeURIComponent(alert.title)}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-medium transition"
                  >
                    <span>Triage Alert</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
