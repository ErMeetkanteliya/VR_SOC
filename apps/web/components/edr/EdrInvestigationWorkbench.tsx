"use client";

import React, { useState } from "react";
import { EndpointActivityTabs } from "./EndpointActivityTabs";
import { SimulateEdrModal } from "./SimulateEdrModal";
import { getEndpointInvestigationAction } from "@/lib/edr/actions";
import type { EndpointInvestigationPackage } from "@vrsoc/types";
import type { EndpointOption } from "@/lib/edr/investigation-service";
import {
  Server,
  ShieldAlert,
  Cpu,
  FileText,
  Network,
  Database,
  Sliders,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface EdrInvestigationWorkbenchProps {
  initialEndpoints: EndpointOption[];
  initialInvestigation: EndpointInvestigationPackage | null;
}

export function EdrInvestigationWorkbench({
  initialEndpoints,
  initialInvestigation,
}: EdrInvestigationWorkbenchProps) {
  const [endpoints] = useState<EndpointOption[]>(initialEndpoints);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialInvestigation?.asset.id || initialEndpoints[0]?.id || ""
  );
  const [investigation, setInvestigation] = useState<EndpointInvestigationPackage | null>(
    initialInvestigation
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  const currentEndpoint = endpoints.find((e) => e.id === selectedAssetId);

  const handleSelectEndpoint = async (assetId: string) => {
    setSelectedAssetId(assetId);
    setIsLoading(true);
    try {
      const res = await getEndpointInvestigationAction({ assetId });
      if (res.success && res.data) {
        setInvestigation(res.data);
      }
    } catch (err) {
      console.error("Failed to load endpoint investigation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedAssetId) {
      handleSelectEndpoint(selectedAssetId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Endpoint Selection Bar */}
      <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-100 tracking-tight">
                  EDR Endpoint Investigation Workbench
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  DEFENSIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspect process lineage trees, file modifications, network sockets, registry activity, and related alerts.
              </p>
            </div>
          </div>

          {/* Actions: Refresh & Simulate */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || !selectedAssetId}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-medium border border-white/10 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Forensics</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              disabled={!selectedAssetId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium shadow-lg shadow-red-950/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate EDR Telemetry</span>
            </button>
          </div>
        </div>

        {/* Endpoint Selector Dropdown / Search */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Selected Host:
            </span>

            <select
              value={selectedAssetId}
              onChange={(e) => handleSelectEndpoint(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-100 font-semibold focus:outline-none focus:border-red-500/50"
            >
              {endpoints.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.hostname} ({e.ipAddress || "No IP"}) - {e.osType} [{e.status}]
                </option>
              ))}
            </select>

            {currentEndpoint && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 font-mono">
                  {currentEndpoint.osType} {currentEndpoint.osVersion || ""}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-300 border border-green-500/30 font-medium">
                  {currentEndpoint.agentStatus || "Online"}
                </span>
                {currentEndpoint.isIsolated && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    ISOLATED
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Agent Version: <span className="text-gray-200">{currentEndpoint?.agentVersion || "1.4.2-edr"}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      {investigation && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">Processes</span>
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-100 font-mono">
                {investigation.summary.totalProcesses}
              </span>
              {investigation.summary.suspiciousProcesses > 0 && (
                <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded">
                  {investigation.summary.suspiciousProcesses} suspicious
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">File Modifications</span>
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold text-gray-100 font-mono">
              {investigation.summary.fileModifications}
            </span>
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">Network Sockets</span>
              <Network className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-lg font-bold text-gray-100 font-mono">
              {investigation.summary.networkConnections}
            </span>
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">Registry Changes</span>
              <Database className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-bold text-gray-100 font-mono">
              {investigation.summary.registryChanges}
            </span>
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">Services & Tasks</span>
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-gray-100 font-mono">
              {investigation.summary.servicesInstalled + investigation.summary.scheduledTasks}
            </span>
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px]">Active Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="text-lg font-bold text-red-400 font-mono">
              {investigation.summary.activeAlerts}
            </span>
          </div>
        </div>
      )}

      {/* Main Forensic Activity Tabs */}
      {investigation ? (
        <EndpointActivityTabs investigation={investigation} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-white/5 bg-[#161616]">
          <Server className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="text-base font-semibold text-gray-200">No Endpoint Selected</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md">
            Please select an active endpoint from the fleet selector above to load comprehensive EDR telemetry and forensic artifacts.
          </p>
        </div>
      )}

      {/* Simulation Modal */}
      {selectedAssetId && currentEndpoint && (
        <SimulateEdrModal
          isOpen={isSimulateModalOpen}
          onClose={() => setIsSimulateModalOpen(false)}
          assetId={selectedAssetId}
          hostname={currentEndpoint.hostname}
          onSimulationComplete={handleRefresh}
        />
      )}
    </div>
  );
}
