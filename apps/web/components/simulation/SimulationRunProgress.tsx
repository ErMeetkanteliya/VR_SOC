"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@vrsoc/ui";
import {
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SimulationScenario, SimulationScenarioStep } from "@vrsoc/types";

interface SimulationRunProgressProps {
  scenario: SimulationScenario;
  runId: string;
  onFinished?: () => void;
  onRerun?: () => void;
}

export function SimulationRunProgress({
  scenario,
  runId,
  onFinished,
  onRerun,
}: SimulationRunProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executedLogs, setExecutedLogs] = useState<
    Array<{ step: SimulationScenarioStep; timestamp: string }>
  >([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const steps = scenario.event_sequence;

  useEffect(() => {
    setCurrentStepIndex(0);
    setExecutedLogs([]);
    setIsCompleted(false);

    let active = true;
    let stepIdx = 0;

    const executeNextStep = () => {
      if (!active) return;

      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        if (!step) return;
        const now = new Date().toLocaleTimeString();

        setCurrentStepIndex(stepIdx + 1);
        setExecutedLogs((prev) => [...prev, { step, timestamp: now }]);

        stepIdx++;
        if (stepIdx < steps.length) {
          setTimeout(executeNextStep, step.delay_ms || 800);
        } else {
          setIsCompleted(true);
          if (onFinished) onFinished();
        }
      }
    };

    const timeout = setTimeout(executeNextStep, 500);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, runId]);

  const progressPct = Math.round((currentStepIndex / Math.max(1, steps.length)) * 100);

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4 shadow-xl shadow-black/40">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-crimson-600/20 border border-crimson-500/30">
            <Play className={`w-4 h-4 text-crimson-400 ${!isCompleted ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{scenario.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
                {runId}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {isCompleted ? "Scenario telemetry successfully injected into pipeline." : "Simulating multi-stage attack telemetry stream..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Step {currentStepIndex} of {steps.length}
            </span>
          )}

          {onRerun && isCompleted && (
            <Button size="sm" variant="outline" onClick={onRerun} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Re-run
            </Button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span>Execution Progress: {progressPct}%</span>
          <span>
            {currentStepIndex}/{steps.length} Stages Emitted
          </span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted ? "bg-emerald-500" : "bg-crimson-600"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Live Stream Terminal */}
      {isExpanded && (
        <div className="rounded-lg bg-black/80 border border-white/10 p-3 font-mono text-xs space-y-2 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] text-gray-500 border-b border-white/5 pb-1">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-crimson-400" /> CANONICAL TELEMETRY STREAM
            </span>
            <span>UTF-8 / JSON NORMALIZED</span>
          </div>

          {executedLogs.length === 0 ? (
            <div className="text-gray-500 text-[11px] py-4 text-center">
              Initializing simulated endpoint telemetry engine...
            </div>
          ) : (
            executedLogs.map((log, idx) => (
              <div key={idx} className="space-y-1 animate-fadeIn border-l-2 border-crimson-500/50 pl-2.5 py-0.5">
                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      log.step.severity === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : log.step.severity === "High"
                        ? "bg-orange-500/20 text-orange-400"
                        : log.step.severity === "Medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {log.step.severity}
                  </span>
                  <span className="text-gray-300 font-semibold">{log.step.event_type}</span>
                  <span className="text-gray-500">[{log.step.source}]</span>
                  {log.step.mitre_technique && (
                    <span className="text-crimson-400 text-[10px]">({log.step.mitre_technique})</span>
                  )}
                </div>
                <p className="text-gray-300 text-[11px] font-sans pl-0.5">{log.step.log_message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
