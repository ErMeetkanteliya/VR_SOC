"use client";

import React, { useState, useMemo } from "react";
import {
  MetricCard,
  Button,
  Breadcrumbs,
  SeverityBadge,
  Input,
  Select,
  Toggle,
  Badge,
} from "@vrsoc/ui";
import {
  Shield,
  ShieldAlert,
  Play,
  Plus,
  Search,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type {
  DetectionRule,
  DetectionExecutionResult,
} from "@vrsoc/types";
import {
  getDetectionRulesAction,
  deleteDetectionRuleAction,
  toggleDetectionRuleAction,
  evaluateDetectionRuleAction,
  evaluateAllDetectionRulesAction,
} from "@/lib/detections/actions";
import { RuleEditorModal } from "./RuleEditorModal";
import { RuleEvaluationDrawer } from "./RuleEvaluationDrawer";

interface DetectionRulesDashboardProps {
  initialRules: DetectionRule[];
}

export function DetectionRulesDashboard({
  initialRules = [],
}: DetectionRulesDashboardProps) {
  const [rules, setRules] = useState<DetectionRule[]>(initialRules);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [originFilter, setOriginFilter] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Evaluation Drawer
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [evaluatingRule, setEvaluatingRule] = useState<DetectionRule | null>(null);
  const [evaluationResult, setEvaluationResult] =
    useState<DetectionExecutionResult | null>(null);

  // Batch evaluation state
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);
  const [batchResults, setBatchResults] = useState<DetectionExecutionResult[] | null>(
    null
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await getDetectionRulesAction();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh rules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (rule: DetectionRule, enabled: boolean) => {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: enabled } : r))
    );

    try {
      const res = await toggleDetectionRuleAction({
        id: rule.id,
        is_enabled: enabled,
      });
      if (!res.success) {
        // Revert on failure
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id ? { ...r, is_enabled: !enabled } : r
          )
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: !enabled } : r))
      );
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this custom detection rule?")) {
      return;
    }

    try {
      const res = await deleteDetectionRuleAction({ id: ruleId });
      if (res.success) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      } else {
        alert(res.error || "Failed to delete rule.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete rule.");
    }
  };

  const handleEvaluateSingle = async (rule: DetectionRule) => {
    setEvaluatingRule(rule);
    setIsDrawerOpen(true);
    setEvaluationResult(null);

    try {
      const res = await evaluateDetectionRuleAction({
        rule_id: rule.id,
        time_window_minutes: rule.evaluation_window_minutes || 15,
      });
      if (res.success && res.data) {
        setEvaluationResult(res.data);
      }
    } catch (err) {
      console.error("Single evaluation failed:", err);
    }
  };

  const handleEvaluateAll = async () => {
    setIsBatchEvaluating(true);
    setBatchResults(null);
    try {
      const res = await evaluateAllDetectionRulesAction({
        time_window_minutes: 15,
      });
      if (res.success && res.data) {
        setBatchResults(res.data);
      }
    } catch (err) {
      console.error("Batch evaluation failed:", err);
    } finally {
      setIsBatchEvaluating(false);
    }
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (categoryFilter !== "ALL" && rule.category !== categoryFilter) return false;
      if (severityFilter !== "ALL" && rule.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
      if (originFilter === "SYSTEM" && !rule.is_system) return false;
      if (originFilter === "CUSTOM" && rule.is_system) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = rule.name.toLowerCase().includes(q);
        const matchesDesc = rule.description?.toLowerCase().includes(q);
        const matchesMitreId = rule.mitre_technique_id?.toLowerCase().includes(q);
        const matchesMitreName = rule.mitre_technique_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesMitreId && !matchesMitreName) {
          return false;
        }
      }

      return true;
    });
  }, [rules, categoryFilter, severityFilter, originFilter, searchQuery]);

  // KPIs
  const totalRules = rules.length;
  const activeRules = rules.filter((r) => r.is_enabled).length;
  const systemRules = rules.filter((r) => r.is_system).length;
  const customRules = rules.filter((r) => !r.is_system).length;
  const criticalHighRules = rules.filter(
    (r) => r.severity.toLowerCase() === "critical" || r.severity.toLowerCase() === "high"
  ).length;

  const matchedBatchCount =
    batchResults?.filter((r) => r.matched).length || 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Detection & Correlation Rules", href: "/detections" },
            ]}
          />
          <h1 className="text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Detection &amp; Correlation Engine
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic rule evaluation and correlation over canonical telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-1.5 border-white/10 hover:border-white/20 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEvaluateAll}
            disabled={isBatchEvaluating}
            className="gap-1.5 border-red-500/30 hover:bg-red-950/30 text-red-300 text-xs"
          >
            <Play
              className={`w-3.5 h-3.5 ${isBatchEvaluating ? "animate-spin" : ""}`}
            />
            {isBatchEvaluating ? "Evaluating All..." : "Evaluate All Rules"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setIsEditorOpen(true);
            }}
            className="gap-1.5 bg-[#5B0A0A] hover:bg-[#8B0000] text-white border-red-500/40 text-xs"
          >
            <Plus className="w-4 h-4" />
            Create Custom Rule
          </Button>
        </div>
      </div>

      {/* Metric Cards KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Rules"
          value={totalRules}
          icon={<Shield className="w-4 h-4 text-neutral-400" />}
        />
        <MetricCard
          label="Active / Enabled"
          value={activeRules}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          label="System Baselines"
          value={systemRules}
          icon={<Layers className="w-4 h-4 text-red-400" />}
        />
        <MetricCard
          label="Custom Tenant Rules"
          value={customRules}
          icon={<Terminal className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="Critical / High"
          value={criticalHighRules}
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
        />
      </div>

      {/* Batch Evaluation Results Banner */}
      {batchResults && (
        <div className="p-4 rounded-lg bg-[#141414] border border-red-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Batch Evaluation Run Complete
                </h3>
                <p className="text-xs text-neutral-400">
                  Evaluated {batchResults.length} active rules against telemetry in
                  the last 15 minutes.
                </p>
              </div>
            </div>
            <Badge
              variant={matchedBatchCount > 0 ? "error" : "success"}
              className="text-xs uppercase font-mono"
            >
              {matchedBatchCount} Detections Fired
            </Badge>
          </div>

          {matchedBatchCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-white/5">
              {batchResults
                .filter((r) => r.matched)
                .map((res) => {
                  const matchingRule = rules.find((r) => r.id === res.ruleId);
                  return (
                    <div
                      key={res.ruleId}
                      className="p-2.5 rounded bg-black/40 border border-red-500/20 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white truncate block">
                          {res.ruleName}
                        </span>
                        <span className="text-[11px] text-red-400 font-mono">
                          {res.explanation.matchedCount} events matched
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (matchingRule) {
                            setEvaluatingRule(matchingRule);
                            setEvaluationResult(res);
                            setIsDrawerOpen(true);
                          }
                        }}
                        className="text-xs h-7 text-neutral-300 hover:text-white"
                      >
                        Inspect Result
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by rule name, description, or MITRE technique..."
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="w-36">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Categories" },
              { value: "authentication", label: "Authentication" },
              { value: "process_execution", label: "Process Exec" },
              { value: "persistence", label: "Persistence" },
              { value: "privilege_escalation", label: "Privilege Esc" },
              { value: "ransomware", label: "Ransomware" },
              { value: "network_scanning", label: "Network Scan" },
              { value: "hardware_usb", label: "USB / Hardware" },
              { value: "file_integrity", label: "File Integrity" },
            ]}
          />
        </div>

        <div className="w-32">
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Severities" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
              { value: "informational", label: "Informational" },
            ]}
          />
        </div>

        <div className="w-32">
          <Select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            options={[
              { value: "ALL", label: "All Origins" },
              { value: "SYSTEM", label: "System Only" },
              { value: "CUSTOM", label: "Custom Only" },
            ]}
          />
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-lg border border-white/5 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#161616] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Status</th>
                <th className="py-3 px-4">Rule Name &amp; Description</th>
                <th className="py-3 px-4 w-40">Category &amp; MITRE</th>
                <th className="py-3 px-4 w-32">Type / Threshold</th>
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4 w-24">Origin</th>
                <th className="py-3 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No detection rules matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <Toggle
                        checked={rule.is_enabled}
                        onChange={(checked) => handleToggleRule(rule, checked)}
                      />
                    </td>

                    {/* Rule Info */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-white truncate">
                        {rule.name}
                      </div>
                      {rule.description && (
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {rule.description}
                        </div>
                      )}
                    </td>

                    {/* Category & MITRE */}
                    <td className="py-3 px-4 space-y-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/10 text-neutral-300">
                        {rule.category}
                      </span>
                      {rule.mitre_technique_id && (
                        <div className="text-[10px] font-mono text-red-400">
                          {rule.mitre_technique_id}
                        </div>
                      )}
                    </td>

                    {/* Type & Threshold */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-neutral-200">
                        {rule.rule_type}
                      </span>
                      {rule.threshold_count && rule.threshold_count > 1 && (
                        <div className="text-[11px] text-neutral-500 font-mono">
                          &gt;= {rule.threshold_count} events
                        </div>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4">
                      <SeverityBadge severity={rule.severity} />
                    </td>

                    {/* Origin */}
                    <td className="py-3 px-4">
                      {rule.is_system ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-500/20">
                          SYSTEM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/40 text-blue-300 border border-blue-500/20">
                          CUSTOM
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEvaluateSingle(rule)}
                          className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          title="Evaluate Rule against canonical telemetry"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Test
                        </Button>

                        {!rule.is_system && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRule(rule);
                                setIsEditorOpen(true);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-white/5 transition"
                              title="Edit Custom Rule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-white/5 transition"
                              title="Delete Custom Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Evaluation Drawer */}
      <RuleEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRule(null);
        }}
        onRuleSaved={(savedRule) => {
          if (editingRule) {
            setRules((prev) =>
              prev.map((r) => (r.id === savedRule.id ? savedRule : r))
            );
          } else {
            setRules((prev) => [savedRule, ...prev]);
          }
        }}
        editingRule={editingRule}
      />

      <RuleEvaluationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEvaluatingRule(null);
          setEvaluationResult(null);
        }}
        rule={evaluatingRule}
        initialResult={evaluationResult}
      />
    </div>
  );
}
