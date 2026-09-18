"use client";

import React, { useState } from "react";
import { runEdrSimulationAction } from "@/lib/edr/actions";
import type { EdrSimulationScenarioType } from "@vrsoc/types";
import {
  Sparkles,
  X,
  Play,
  Terminal,
  Database,
  FileText,
  Network,
  Sliders,
  Clock,
  HardDrive,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface SimulateEdrModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  hostname: string;
  onSimulationComplete?: () => void;
}

const SCENARIOS: Array<{
  id: EdrSimulationScenarioType;
  title: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  tactics: string[];
}> = [
  {
    id: "process_masquerading",
    title: "Process Masquerading (svchost.exe)",
    category: "Defense Evasion",
    icon: <Terminal className="w-4 h-4 text-orange-400" />,
    description: "Simulates powershell.exe spawning svchost.exe from a non-standard user temporary directory.",
    tactics: ["T1036.005 Masquerading", "T1059.001 PowerShell"],
  },
  {
    id: "registry_run_persistence",
    title: "Registry Run Key Persistence",
    category: "Persistence",
    icon: <Database className="w-4 h-4 text-purple-400" />,
    description: "Simulates an autorun registry modification in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.",
    tactics: ["T1547.001 Registry Run Keys", "T1112 Modify Registry"],
  },
  {
    id: "suspicious_file_drop",
    title: "Suspicious File Drop & Encryption Simulation",
    category: "Impact / Ransomware",
    icon: <FileText className="w-4 h-4 text-red-400" />,
    description: "Drops an executable with double extension in AppData Temp followed by simulated .locked batch modifications.",
    tactics: ["T1486 Data Encrypted for Impact", "T1027 Obfuscation"],
  },
  {
    id: "c2_network_beaconing",
    title: "Command & Control Network Beaconing",
    category: "Command & Control",
    icon: <Network className="w-4 h-4 text-blue-400" />,
    description: "Simulates repeated outbound HTTPS beacon connections to a suspicious external IP on port 8443.",
    tactics: ["T1071.001 Web Protocols", "T1573 Encrypted Channel"],
  },
  {
    id: "malicious_service_install",
    title: "Unquoted Service Path Installation",
    category: "Persistence / Privilege Escalation",
    icon: <Sliders className="w-4 h-4 text-amber-400" />,
    description: "Installs a simulated Windows service running with LocalSystem privileges pointing to an unquoted path in Public.",
    tactics: ["T1543.003 Windows Service", "T1574.009 Unquoted Service Path"],
  },
  {
    id: "scheduled_task_creation",
    title: "Scheduled Task Persistence (At Logon)",
    category: "Persistence",
    icon: <Clock className="w-4 h-4 text-emerald-400" />,
    description: "Creates a hidden scheduled task configured to execute encoded PowerShell commands at user logon.",
    tactics: ["T1053.005 Scheduled Task", "T1059.001 PowerShell"],
  },
  {
    id: "startup_folder_hijack",
    title: "Startup Folder Shortcut Hijacking",
    category: "Persistence",
    icon: <HardDrive className="w-4 h-4 text-cyan-400" />,
    description: "Creates a shortcut (.lnk) inside the user's Startup folder executing a background VBScript.",
    tactics: ["T1547.001 Startup Folder"],
  },
  {
    id: "unauthorized_usb_insertion",
    title: "Unauthorized USB Storage & Exfiltration",
    category: "Exfiltration",
    icon: <HardDrive className="w-4 h-4 text-rose-400" />,
    description: "Simulates removable mass storage drive insertion followed by confidential file copy operations.",
    tactics: ["T1052.001 Exfiltration over USB", "T1200 Hardware Additions"],
  },
  {
    id: "multi_stage_endpoint_attack",
    title: "Multi-Stage Attack Chain (All Vectors)",
    category: "Full Kill Chain",
    icon: <Layers className="w-4 h-4 text-red-500" />,
    description: "Executes a multi-stage synthetic attack combining file drop, masqueraded execution, registry persistence, and C2 beaconing.",
    tactics: ["Execution", "Persistence", "Defense Evasion", "Command and Control"],
  },
];

export function SimulateEdrModal({
  isOpen,
  onClose,
  assetId,
  hostname,
  onSimulationComplete,
}: SimulateEdrModalProps) {
  const [selectedScenario, setSelectedScenario] = useState<EdrSimulationScenarioType>("process_masquerading");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setIsRunning(true);
    setResultMessage(null);

    try {
      const res = await runEdrSimulationAction({
        assetId,
        scenarioType: selectedScenario,
      });

      if (res.success && res.data) {
        setResultMessage({
          type: "success",
          text: `Simulation executed successfully! Ingested ${res.data.succeeded} telemetry records into the canonical SOC pipeline.`,
        });
        onSimulationComplete?.();
      } else {
        setResultMessage({
          type: "error",
          text: res.error || "Failed to execute simulation.",
        });
      }
    } catch (err: unknown) {
      setResultMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Simulation execution encountered an error.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100">
                Simulate Educational EDR Telemetry
              </h3>
              <p className="text-xs text-gray-400">
                Target Endpoint: <span className="font-mono text-gray-200 font-medium">{hostname}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-300">
            <span className="font-semibold block mb-0.5">Defensive Training Boundary Notice</span>
            All scenarios generate synthetic, normalized telemetry directly ingested into the Phase 13 pipeline. No real malware or malicious payloads are executed on any system.
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
              Select Educational Scenario
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {SCENARIOS.map((s) => {
                const isSelected = selectedScenario === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#5B0A0A]/30 border-red-500/60 shadow-md shadow-red-950/20"
                        : "bg-[#121212] border-white/5 hover:border-white/15 hover:bg-[#181818]"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 shrink-0 mt-0.5">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-gray-100 truncate">{s.title}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-gray-400">
                          {s.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.tactics.map((t, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {resultMessage && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
                resultMessage.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {resultMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#121212]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 rounded-lg hover:bg-white/5 transition"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isRunning}
            onClick={handleLaunch}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Simulating Telemetry..." : "Launch Scenario Telemetry"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
