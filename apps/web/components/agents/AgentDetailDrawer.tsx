"use client";

import React, { useState } from "react";
import { Drawer, StatusBadge, Button, Select } from "@vrsoc/ui";
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  HardDrive,
  Activity,
  Server,
  Network,
  Clock,
  RefreshCw,
  Zap,
  FolderTree,
  Terminal,
  Layers,
} from "lucide-react";
import { simulateAgentState, updateAgentGroup } from "@/lib/agents/actions";
import type { AgentWithAsset, AssetGroup, AgentStatus } from "@vrsoc/types";

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentWithAsset | null;
  assetGroups: AssetGroup[];
  onOpenIsolateModal: (agent: AgentWithAsset) => void;
  onRefresh: () => void;
}

export function AgentDetailDrawer({
  isOpen,
  onClose,
  agent,
  assetGroups,
  onOpenIsolateModal,
  onRefresh,
}: AgentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "simulation" | "config">("overview");
  const [simulating, setSimulating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(agent?.asset?.asset_group_id || "");
  const [groupUpdating, setGroupUpdating] = useState(false);

  if (!agent) return null;

  const asset = agent.asset;

  const handleSimulate = async (newStatus: AgentStatus, cpu?: number, ram?: number, disk?: number) => {
    setSimulating(true);
    await simulateAgentState({
      agentId: agent.id,
      newStatus,
      cpuUsagePct: cpu,
      ramUsagePct: ram,
      diskUsagePct: disk,
    });
    setSimulating(false);
    onRefresh();
  };

  const handleUpdateGroup = async (newGroupId: string) => {
    if (!asset) return;
    setGroupUpdating(true);
    setSelectedGroupId(newGroupId);
    await updateAgentGroup({
      assetId: asset.id,
      assetGroupId: newGroupId || null,
    });
    setGroupUpdating(false);
    onRefresh();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={asset?.hostname || "Endpoint Sensor"}
      subtitle={asset?.ip_address ? `IP: ${asset.ip_address} • ${asset.os_type || "Endpoint"}` : "Endpoint Fleet Sensor"}
      width="xl"
    >
      <div className="space-y-6">
        {/* Top Status & Isolation Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-gray-400">Agent Status:</span>
            <StatusBadge status={agent.status} pulse={agent.status === "Online"} />
          </div>

          <div className="flex items-center gap-2">
            {asset?.is_isolated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                NETWORK ISOLATED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Network Connected
              </span>
            )}

            <Button
              size="sm"
              variant={asset?.is_isolated ? "outline" : "destructive"}
              onClick={() => onOpenIsolateModal(agent)}
            >
              {asset?.is_isolated ? "Release Isolation" : "Isolate Host"}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-crimson-500 text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "simulation"
                ? "border-crimson-500 text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Simulation & Actions
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "config"
                ? "border-crimson-500 text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Config & Metadata
          </button>
        </div>

        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Health & Performance Gauges */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-crimson-400" />
                Live Sensor Performance
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* CPU */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {agent.cpu_usage_pct || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        Number(agent.cpu_usage_pct || 0) > 80
                          ? "bg-red-500"
                          : Number(agent.cpu_usage_pct || 0) > 50
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(agent.cpu_usage_pct || 0)))}%` }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> RAM
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {agent.ram_usage_pct || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        Number(agent.ram_usage_pct || 0) > 85
                          ? "bg-red-500"
                          : Number(agent.ram_usage_pct || 0) > 60
                          ? "bg-amber-500"
                          : "bg-purple-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(agent.ram_usage_pct || 0)))}%` }}
                    />
                  </div>
                </div>

                {/* Disk */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Disk
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {agent.disk_usage_pct || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        Number(agent.disk_usage_pct || 0) > 90
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(agent.disk_usage_pct || 0)))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Host Identity Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-crimson-400" />
                Endpoint Identification
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/5 text-xs">
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Hostname</span>
                  <span className="font-mono text-white font-medium">{asset?.hostname}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Display Name</span>
                  <span className="text-white">{asset?.display_name || "—"}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Asset Type</span>
                  <span className="text-white">{asset?.asset_type}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">OS / Platform</span>
                  <span className="text-white">
                    {asset?.os_type} ({asset?.os_version || "Standard"})
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Primary IP Address</span>
                  <span className="font-mono text-crimson-300">{asset?.ip_address || "—"}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">MAC Address</span>
                  <span className="font-mono text-gray-300">{asset?.mac_address || "—"}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Criticality Tier</span>
                  <span className="font-medium text-white">{asset?.criticality}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5 items-center">
                  <span className="text-gray-400">Asset Group</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-200">
                    {asset?.group?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Engine & Heartbeat */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-crimson-400" />
                Sensor Runtime & Heartbeat
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/5 text-xs">
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Agent ID</span>
                  <span className="font-mono text-gray-400 text-[11px] truncate max-w-[220px]">
                    {agent.id}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Sensor Version</span>
                  <span className="font-mono text-emerald-400">v{agent.agent_version}</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Heartbeat Interval</span>
                  <span className="text-white">{agent.heartbeat_interval_seconds}s</span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Last Telemetry Heartbeat</span>
                  <span className="font-mono text-gray-300">
                    {agent.last_seen_at ? new Date(agent.last_seen_at).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3.5">
                  <span className="text-gray-400">Enrolled Date</span>
                  <span className="font-mono text-gray-300">
                    {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="py-2.5 px-3.5">
                  <span className="text-gray-400 block mb-1.5">Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(agent.capabilities) && agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded bg-crimson-500/15 border border-crimson-500/30 text-crimson-300 text-[11px] font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATION & ACTIONS */}
        {activeTab === "simulation" && (
          <div className="space-y-6">
            {/* Group Assignment */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-crimson-400" />
                Asset Group Assignment
              </h4>
              <p className="text-xs text-gray-400">
                Categorize this host into organizational policy clusters for threat hunting and incident scoping.
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedGroupId}
                  onChange={(e) => handleUpdateGroup(e.target.value)}
                  disabled={groupUpdating}
                  className="flex-1 text-xs"
                  options={[
                    { value: "", label: "-- Unassigned --" },
                    ...assetGroups.map((g) => ({
                      value: g.id,
                      label: `${g.name} (${g.criticality})`,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Safe Educational Simulation Controls */}
            <div className="p-4 bg-crimson-950/20 border border-crimson-500/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-crimson-400" />
                  Educational Lab Simulation Controls
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-crimson-500/20 text-crimson-300 border border-crimson-500/30 font-medium">
                  Safe Lab State
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Trigger state transitions to test SOC dashboard responsiveness, alert pipelines, and offline sensor workflows.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={simulating}
                  onClick={() => handleSimulate("Online", 12.0, 42.0, 30.0)}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
                  className="justify-start text-xs"
                >
                  Simulate Heartbeat (Online)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  isLoading={simulating}
                  onClick={() => handleSimulate("Warning", 92.5, 88.0, 75.0)}
                  leftIcon={<Activity className="w-3.5 h-3.5 text-amber-400" />}
                  className="justify-start text-xs"
                >
                  Simulate CPU Spike (Warning)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  isLoading={simulating}
                  onClick={() => handleSimulate("Offline", 0, 0, 30.0)}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-gray-400" />}
                  className="justify-start text-xs"
                >
                  Simulate Sensor Disconnect
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  isLoading={simulating}
                  onClick={() => handleSimulate("Updating", 35.0, 48.0, 32.0)}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-blue-400" />}
                  className="justify-start text-xs"
                >
                  Simulate Agent Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIG & METADATA */}
        {activeTab === "config" && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-crimson-400" />
              Runtime Configuration & Sensor JSON
            </h3>
            <div className="p-3.5 bg-black/60 border border-white/10 rounded-lg font-mono text-[11px] text-gray-300 overflow-x-auto max-h-[350px]">
              <pre>
                {JSON.stringify(
                  {
                    agent_id: agent.id,
                    organization_id: agent.organization_id,
                    asset_id: agent.asset_id,
                    version: agent.agent_version,
                    status: agent.status,
                    capabilities: agent.capabilities,
                    heartbeat_interval_seconds: agent.heartbeat_interval_seconds,
                    metadata: agent.metadata,
                    asset_metadata: asset?.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
