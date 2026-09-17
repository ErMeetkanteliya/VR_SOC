"use client";

import React, { useState } from "react";
import { Drawer, Button, SeverityBadge, Badge, Select } from "@vrsoc/ui";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Activity,
  User,
  Server,
  RefreshCw,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import type { DetectionExecutionResult, DetectionRule } from "@vrsoc/types";
import { evaluateDetectionRuleAction } from "@/lib/detections/actions";

interface RuleEvaluationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rule: DetectionRule | null;
  initialResult: DetectionExecutionResult | null;
}

export function RuleEvaluationDrawer({
  isOpen,
  onClose,
  rule,
  initialResult,
}: RuleEvaluationDrawerProps) {
  const [result, setResult] = useState<DetectionExecutionResult | null>(initialResult);
  const [selectedWindow, setSelectedWindow] = useState<number>(
    rule?.evaluation_window_minutes || 15
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);

  React.useEffect(() => {
    setResult(initialResult);
    if (rule?.evaluation_window_minutes) {
      setSelectedWindow(rule.evaluation_window_minutes);
    }
  }, [initialResult, rule]);

  const handleReevaluate = async () => {
    if (!rule) return;
    setIsEvaluating(true);
    try {
      const res = await evaluateDetectionRuleAction({
        rule_id: rule.id,
        time_window_minutes: selectedWindow,
      });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      console.error("Re-evaluation failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!rule) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-red-500" />
          <span className="font-mono text-sm font-semibold truncate">
            Rule Evaluation: {rule.name}
          </span>
        </div>
      }
      width="lg"
    >
      <div className="space-y-5 text-neutral-200">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#141414] border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Evaluation Window:</span>
            <div className="w-36">
              <Select
                value={String(selectedWindow)}
                onChange={(e) => setSelectedWindow(parseInt(e.target.value))}
                options={[
                  { value: "5", label: "Last 5 mins" },
                  { value: "15", label: "Last 15 mins" },
                  { value: "30", label: "Last 30 mins" },
                  { value: "60", label: "Last 1 hour" },
                  { value: "120", label: "Last 2 hours" },
                  { value: "1440", label: "Last 24 hours" },
                ]}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReevaluate}
            disabled={isEvaluating}
            className="gap-1.5 border-white/10 hover:border-red-500/40 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            {isEvaluating ? "Evaluating..." : "Run Evaluation"}
          </Button>
        </div>

        {/* Rule Summary & Metadata Header */}
        <div className="p-4 rounded-lg bg-[#161616] border border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
              {rule.description && (
                <p className="text-xs text-neutral-400 mt-0.5">{rule.description}</p>
              )}
            </div>
            <SeverityBadge severity={rule.severity} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs text-neutral-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10">
              Type: <strong className="text-neutral-200">{rule.rule_type}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10">
              Category: <strong className="text-neutral-200">{rule.category}</strong>
            </span>
            {rule.mitre_technique_id && (
              <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20 text-red-300">
                MITRE: <strong>{rule.mitre_technique_id}</strong> (
                {rule.mitre_technique_name || rule.mitre_tactic})
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10">
              Threshold: &gt;= {rule.threshold_count || 1}
            </span>
          </div>
        </div>

        {/* Evaluation Match Banner */}
        {result ? (
          <div
            className={`p-4 rounded-lg border ${
              result.matched
                ? "bg-red-950/20 border-red-500/30 text-red-300"
                : "bg-neutral-900/40 border-white/10 text-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {result.matched ? (
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-neutral-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {result.matched ? "RULE MATCH DETECTED" : "NO DETECTION MATCH"}
                    </span>
                    <Badge
                      variant={result.matched ? "error" : "default"}
                      className="text-[10px] uppercase font-mono"
                    >
                      {result.matched
                        ? `${result.matchedEvents.length} Matched Events`
                        : "0 Matches"}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    {result.explanation.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps & Evaluation Scope */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-neutral-400">
              <div>
                <span className="text-neutral-500 block">Evaluated At</span>
                {new Date(result.evaluatedAt).toLocaleTimeString()}
              </div>
              <div>
                <span className="text-neutral-500 block">Window Scanned</span>
                {selectedWindow} minutes
              </div>
              <div>
                <span className="text-neutral-500 block">Events Evaluated</span>
                {result.explanation.evaluatedCount}
              </div>
              <div>
                <span className="text-neutral-500 block">Matching Events</span>
                {result.explanation.matchedCount}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#141414] rounded-lg border border-white/5 text-neutral-400">
            <Activity className="w-8 h-8 mx-auto mb-2 text-neutral-600 animate-pulse" />
            <p className="text-xs">Click &quot;Run Evaluation&quot; to evaluate against canonical telemetry.</p>
          </div>
        )}

        {/* Structured Explanation Breakdown */}
        {result && result.explanation.details.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
              Condition Match Explanation
            </h4>
            <div className="space-y-1.5 bg-[#121212] p-3 rounded-lg border border-white/5">
              {result.explanation.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-neutral-300 p-2 rounded bg-black/40 border border-white/5"
                >
                  {detail}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Telemetry Events List */}
        {result && result.matchedEvents.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                Matched Canonical Events ({result.matchedEvents.length})
              </h4>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {result.matchedEvents.map((event) => {
                const isExpanded = expandedPayloadId === event.id;
                return (
                  <div
                    key={event.id}
                    className="p-3 rounded-md bg-[#161616] border border-white/5 hover:border-white/10 transition text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">
                            {event.event_type}
                          </span>
                          <SeverityBadge severity={event.severity} />
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {new Date(event.occurred_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                          {event.asset?.hostname && (
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3 text-neutral-500" />
                              {event.asset.hostname}
                            </span>
                          )}
                          {event.identity?.username && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-neutral-500" />
                              {event.identity.username}
                            </span>
                          )}
                          <span className="text-neutral-500">
                            Source: {event.source_type}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPayloadId(isExpanded ? null : event.id)
                        }
                        className="p-1 text-neutral-400 hover:text-white rounded bg-black/30 border border-white/5 transition text-[11px] flex items-center gap-1"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        {isExpanded ? "Hide Payload" : "Inspect Payload"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 rounded bg-black/80 border border-white/10 font-mono text-[11px] text-neutral-300 overflow-x-auto space-y-2">
                        <div>
                          <span className="text-neutral-500 block mb-1">
                            Normalized Fields:
                          </span>
                          <pre className="text-emerald-400 whitespace-pre-wrap">
                            {JSON.stringify(event.normalized_fields, null, 2)}
                          </pre>
                        </div>
                        {event.raw_payload && (
                          <div>
                            <span className="text-neutral-500 block mb-1">
                              Raw Payload:
                            </span>
                            <pre className="text-neutral-400 whitespace-pre-wrap">
                              {JSON.stringify(event.raw_payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Downstream Phase 16 Boundary Note */}
        <div className="p-3 rounded-lg bg-neutral-900/50 border border-white/5 text-[11px] text-neutral-400">
          <p className="font-semibold text-neutral-300">Phase 16 Hand-off Boundary</p>
          <p className="mt-0.5">
            This structured execution result provides stable rule attribution, matched
            event references, and explanation context ready for alert generation and
            deduplication in Phase 16.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
