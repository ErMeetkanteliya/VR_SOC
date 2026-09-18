"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Cloud,
  Network,
  Terminal,
} from "lucide-react";
import { Button } from "@vrsoc/ui";
import { runXdrSimulationAction } from "@/lib/xdr/actions";
import type { XdrSimulationScenarioType } from "@vrsoc/types";

interface SimulateXdrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ScenarioOption {
  type: XdrSimulationScenarioType;
  title: string;
  description: string;
  sources: string[];
  severity: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SCENARIOS: ScenarioOption[] = [
  {
    type: "phishing_to_endpoint_c2",
    title: "Spear Phishing to Endpoint C2 Callback",
    description: "Inbound phishing email -> User logon -> Process masquerading in %TEMP% -> DNS C2 resolution -> Perimeter Firewall egress.",
    sources: ["Email", "Auth", "Endpoint", "DNS", "Network", "Firewall"],
    severity: "Critical",
    icon: Mail,
  },
  {
    type: "cloud_credential_theft_and_exfil",
    title: "Cloud Credential Theft & S3 Exfiltration",
    description: "Brute force authentication -> Anomalous IAM AccessKey creation -> S3 financial bucket bulk download.",
    sources: ["Auth", "Identity", "Cloud"],
    severity: "High",
    icon: Cloud,
  },
  {
    type: "lateral_movement_and_domain_recon",
    title: "Lateral Movement & Domain Controller Recon",
    description: "Kerberos TGS request -> Remote PsExec service installation -> Internal SMB port 445 sweep.",
    sources: ["Auth", "Endpoint", "Network", "DNS"],
    severity: "High",
    icon: Network,
  },
  {
    type: "ransomware_precursor_chain",
    title: "Ransomware Precursor: USB Drop to Perimeter Block",
    description: "USB storage insertion -> VSSAdmin shadow copy deletion -> Registry Run key persistence -> Perimeter Firewall block.",
    sources: ["Endpoint", "DNS", "Firewall"],
    severity: "Critical",
    icon: Terminal,
  },
];

export function SimulateXdrModal({ isOpen, onClose, onSuccess }: SimulateXdrModalProps) {
  const [selectedType, setSelectedType] = useState<XdrSimulationScenarioType>("phishing_to_endpoint_c2");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await runXdrSimulationAction({
        scenarioType: selectedType,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to launch simulation.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Successfully ingested ${res.data?.processed || 5} multi-source events into the canonical pipeline.`);
      setIsLoading(false);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Simulation trigger failed.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-4"
      >
        {/* Modal Header */}
        <div className="p-5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4 text-red-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Simulate Safe Multi-Source XDR Attack</h3>
              <p className="text-xs text-white/50">Educational &amp; defensive synthetic telemetry generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 pt-0 space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {SCENARIOS.map((sc) => {
              const isSelected = sc.type === selectedType;
              const Icon = sc.icon;

              return (
                <div
                  key={sc.type}
                  onClick={() => setSelectedType(sc.type)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 space-y-1.5 ${
                    isSelected
                      ? "bg-[#5B0A0A]/30 border-[#E53935]/60 shadow-lg"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">{sc.title}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        sc.severity === "Critical"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }`}
                    >
                      {sc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">{sc.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1 text-[10px] font-mono">
                    {sc.sources.map((src) => (
                      <span key={src} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleLaunch}
            isLoading={isLoading}
            className="text-xs flex items-center gap-1.5 bg-[#5B0A0A] hover:bg-[#720E0E] text-white border border-[#E53935]/40"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch Simulation</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
