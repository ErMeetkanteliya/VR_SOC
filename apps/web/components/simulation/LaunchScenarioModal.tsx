"use client";

import React, { useState } from "react";
import { Modal, Button, Select, SeverityBadge } from "@vrsoc/ui";
import { Play, Shield, Terminal, Target, AlertTriangle, Clock } from "lucide-react";
import type { SimulationScenario, Asset } from "@vrsoc/types";
import { launchSimulationAction } from "@/lib/simulation/actions";

interface LaunchScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: SimulationScenario | null;
  assets: Asset[];
  onSuccess: (runId: string, scenarioName: string, eventsCount: number) => void;
}

export function LaunchScenarioModal({
  isOpen,
  onClose,
  scenario,
  assets,
  onSuccess,
}: LaunchScenarioModalProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!scenario) return null;

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await launchSimulationAction({
        scenarioId: scenario.id || scenario.slug,
        targetAssetId: selectedAssetId || undefined,
        parameters: {},
      });

      if (res.success && res.data) {
        onSuccess(res.data.runId, res.data.scenarioName, res.data.eventsCount);
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to launch simulation scenario.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred launching the scenario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Launch Simulated Security Scenario">
      <div className="space-y-4 text-xs">
        {/* Scenario Header Summary */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">{scenario.name}</span>
            <SeverityBadge severity={scenario.severity} />
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">{scenario.description}</p>

          <div className="flex items-center gap-4 pt-1 text-[11px] text-gray-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Duration: {scenario.duration_seconds}s
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Steps: {scenario.event_sequence.length} Events
            </span>
          </div>
        </div>

        {/* MITRE ATT&CK Mapping */}
        {scenario.mitre_techniques && scenario.mitre_techniques.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-gray-300 font-medium text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-crimson-400" />
              MITRE ATT&CK Mappings
            </label>
            <div className="flex flex-wrap gap-1.5">
              {scenario.mitre_techniques.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-md bg-crimson-950/60 border border-crimson-800/40 text-crimson-300 text-[10px] font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Outcome */}
        <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/30 text-blue-300 text-xs space-y-1">
          <span className="font-semibold block text-[11px] uppercase tracking-wider text-blue-400">
            SOC Learning Objective:
          </span>
          <p className="text-[11px] text-gray-300 leading-normal">{scenario.learning_outcome}</p>
        </div>

        {/* Target Asset Selection */}
        <div className="space-y-1.5">
          <label className="block text-gray-300 font-medium text-xs flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            Target Endpoint Asset (Optional)
          </label>
          <Select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full text-xs"
            options={[
              { value: "", label: "Default: Auto-select compatible fleet host" },
              ...assets.map((a) => ({
                value: a.id,
                label: `${a.hostname} (${a.ip_address || "No IP"}) — ${a.asset_type}`,
              })),
            ]}
          />
          <p className="text-[10px] text-gray-400">
            Generated telemetry events will be attributed to this tenant host.
          </p>
        </div>

        {/* Safety Boundary Notice */}
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-gray-400 text-[11px] flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Strict Defensive Boundary: Execution generates safe synthetic telemetry events inside
            your tenant database. No commands are dispatched to live external machines.
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleLaunch}
            isLoading={isSubmitting}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Execute Scenario
          </Button>
        </div>
      </div>
    </Modal>
  );
}
