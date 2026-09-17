"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Select } from "@vrsoc/ui";
import { Plus, Trash2, AlertCircle, ShieldAlert } from "lucide-react";
import type {
  DetectionRule,
  SeverityLevel,
  DetectionRuleType,
  RuleOperator,
  FieldCondition,
  CreateDetectionRuleInput,
  LogicalConditionGroup,
  RuleCondition,
} from "@vrsoc/types";
import {
  createDetectionRuleAction,
  updateDetectionRuleAction,
} from "@/lib/detections/actions";

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleSaved: (savedRule: DetectionRule) => void;
  editingRule?: DetectionRule | null;
}

const FIELD_OPTIONS = [
  { value: "event_type", label: "Event Type (e.g. auth_failed, process_spawned)" },
  { value: "severity", label: "Severity (critical, high, medium, low)" },
  { value: "category", label: "Category (auth, process, file, network)" },
  { value: "source_type", label: "Source Type (windows_events, syslog, edr)" },
  { value: "process_name", label: "Process Name (e.g. powershell.exe, vssadmin.exe)" },
  { value: "command_line", label: "Command Line / Process Args" },
  { value: "parent_process_name", label: "Parent Process Name" },
  { value: "user", label: "Identity / Username (e.g. Administrator)" },
  { value: "target_user", label: "Target Username" },
  { value: "source_ip", label: "Source IP Address" },
  { value: "destination_ip", label: "Destination IP Address" },
  { value: "destination_port", label: "Destination Port (e.g. 445, 3389)" },
  { value: "file_path", label: "File Path (e.g. canary.docx, payload.exe)" },
  { value: "device_vendor", label: "Device Vendor (e.g. Sandisk, USB Storage)" },
  { value: "service_name", label: "Service Name" },
  { value: "raw_payload.reason", label: "Raw Reason / Substatus" },
];

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: "equals", label: "equals (==)" },
  { value: "not_equals", label: "does not equal (!=)" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "greater_than", label: "greater than (>)" },
  { value: "less_than", label: "less than (<)" },
  { value: "in", label: "in set (comma-separated)" },
  { value: "regex", label: "regex pattern" },
];

export function RuleEditorModal({
  isOpen,
  onClose,
  onRuleSaved,
  editingRule,
}: RuleEditorModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("high");
  const [category, setCategory] = useState("general");
  const [ruleType, setRuleType] = useState<DetectionRuleType>("single_event");
  const [thresholdCount, setThresholdCount] = useState(1);
  const [evaluationWindowMinutes, setEvaluationWindowMinutes] = useState(15);
  const [mitreTactic, setMitreTactic] = useState("");
  const [mitreTechniqueId, setMitreTechniqueId] = useState("");
  const [mitreTechniqueName, setMitreTechniqueName] = useState("");
  const [logicalOp, setLogicalOp] = useState<"AND" | "OR">("AND");
  const [fieldConditions, setFieldConditions] = useState<FieldCondition[]>([
    { field: "event_type", operator: "equals", value: "" },
  ]);
  const [tagsInput, setTagsInput] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setDescription(editingRule.description || "");
      setSeverity(editingRule.severity);
      setCategory(editingRule.category);
      setRuleType(editingRule.rule_type);
      setThresholdCount(editingRule.threshold_count || 1);
      setEvaluationWindowMinutes(editingRule.evaluation_window_minutes || 15);
      setMitreTactic(editingRule.mitre_tactic || "");
      setMitreTechniqueId(editingRule.mitre_technique_id || "");
      setMitreTechniqueName(editingRule.mitre_technique_name || "");
      setTagsInput(editingRule.tags?.join(", ") || "");

      // Extract field conditions
      const conds = editingRule.conditions;
      if (conds && typeof conds === "object") {
        if ("conditions" in conds && Array.isArray(conds.conditions)) {
          const group = conds as LogicalConditionGroup;
          setLogicalOp(group.operator === "OR" || group.logicalOperator === "OR" ? "OR" : "AND");
          const extracted: FieldCondition[] = [];
          for (const c of group.conditions) {
            if ("field" in c && "operator" in c) {
              extracted.push(c as FieldCondition);
            }
          }
          setFieldConditions(
            extracted.length > 0
              ? extracted
              : [{ field: "event_type", operator: "equals", value: "" }]
          );
        } else if ("field" in conds && "operator" in conds) {
          setFieldConditions([conds as FieldCondition]);
        }
      }
    } else {
      // Defaults for new rule
      setName("");
      setDescription("");
      setSeverity("high");
      setCategory("general");
      setRuleType("single_event");
      setThresholdCount(1);
      setEvaluationWindowMinutes(15);
      setMitreTactic("");
      setMitreTechniqueId("");
      setMitreTechniqueName("");
      setLogicalOp("AND");
      setFieldConditions([
        { field: "event_type", operator: "equals", value: "" },
      ]);
      setTagsInput("");
    }
    setErrorMsg(null);
  }, [editingRule, isOpen]);

  const handleAddCondition = () => {
    setFieldConditions([
      ...fieldConditions,
      { field: "event_type", operator: "equals", value: "" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    if (fieldConditions.length <= 1) return;
    setFieldConditions(fieldConditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (
    index: number,
    key: keyof FieldCondition,
    val: any
  ) => {
    setFieldConditions((prev) => {
      const updated = [...prev];
      const current = updated[index] || { field: "event_type", operator: "equals", value: "" };
      updated[index] = { ...current, [key]: val };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Rule name is required.");
      return;
    }

    const validConditions = fieldConditions.filter(
      (c) => c.field && String(c.value).trim() !== ""
    );

    if (validConditions.length === 0) {
      setErrorMsg("At least one valid field condition with a non-empty value is required.");
      return;
    }

    const firstCondition = validConditions[0]!;
    const conditionsPayload: RuleCondition =
      validConditions.length === 1
        ? firstCondition
        : {
            operator: logicalOp,
            conditions: validConditions,
          };

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const inputData: CreateDetectionRuleInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      severity,
      category,
      rule_type: ruleType,
      is_enabled: true,
      conditions: conditionsPayload,
      threshold_count: thresholdCount,
      evaluation_window_minutes: evaluationWindowMinutes,
      mitre_tactic: mitreTactic.trim() || undefined,
      mitre_technique_id: mitreTechniqueId.trim() || undefined,
      mitre_technique_name: mitreTechniqueName.trim() || undefined,
      tags,
    };

    setIsSubmitting(true);

    try {
      if (editingRule) {
        const res = await updateDetectionRuleAction({
          id: editingRule.id,
          ...inputData,
        });

        if (!res.success || !res.data) {
          setErrorMsg(res.error || "Failed to update detection rule.");
          setIsSubmitting(false);
          return;
        }

        onRuleSaved(res.data);
        onClose();
      } else {
        const res = await createDetectionRuleAction(inputData);

        if (!res.success || !res.data) {
          setErrorMsg(res.error || "Failed to create detection rule.");
          setIsSubmitting(false);
          return;
        }

        onRuleSaved(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRule ? "Edit Detection Rule" : "Create Custom Detection Rule"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm text-neutral-200">
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-md bg-red-950/40 border border-red-500/30 text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-mono">{errorMsg}</span>
          </div>
        )}

        {/* General Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-neutral-300">
              Rule Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suspicious PowerShell Encoded Execution"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-neutral-300">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detects command-line execution of PowerShell with hidden/encoded switches"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Severity</label>
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              options={[
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
                { value: "informational", label: "Informational" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Category</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "authentication", label: "Authentication" },
                { value: "process_execution", label: "Process Execution" },
                { value: "persistence", label: "Persistence" },
                { value: "privilege_escalation", label: "Privilege Escalation" },
                { value: "ransomware", label: "Ransomware" },
                { value: "network_scanning", label: "Network Scanning" },
                { value: "hardware_usb", label: "Removable Media / USB" },
                { value: "file_integrity", label: "File Integrity" },
                { value: "general", label: "General Security" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Rule Type</label>
            <Select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as DetectionRuleType)}
              options={[
                { value: "single_event", label: "Single Event Match" },
                { value: "threshold", label: "Threshold Event Count" },
                { value: "correlation", label: "Host / Identity Correlation" },
                { value: "sequence", label: "Sequential Event Match" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Threshold Count
              </label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={thresholdCount}
                onChange={(e) => setThresholdCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Window (Mins)
              </label>
              <Input
                type="number"
                min={1}
                max={1440}
                value={evaluationWindowMinutes}
                onChange={(e) =>
                  setEvaluationWindowMinutes(parseInt(e.target.value) || 15)
                }
              />
            </div>
          </div>
        </div>

        {/* MITRE ATT&CK Mapping */}
        <div className="p-3.5 rounded-lg bg-[#121212] border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-neutral-200">
              MITRE ATT&CK Framework Context
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Tactic</label>
              <Input
                value={mitreTactic}
                onChange={(e) => setMitreTactic(e.target.value)}
                placeholder="Execution, Persistence..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Technique ID</label>
              <Input
                value={mitreTechniqueId}
                onChange={(e) => setMitreTechniqueId(e.target.value)}
                placeholder="T1059.001"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Technique Name</label>
              <Input
                value={mitreTechniqueName}
                onChange={(e) => setMitreTechniqueName(e.target.value)}
                placeholder="PowerShell"
              />
            </div>
          </div>
        </div>

        {/* Condition Builder */}
        <div className="p-3.5 rounded-lg bg-[#121212] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200">
                Rule Conditions
              </span>
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10">
                <button
                  type="button"
                  onClick={() => setLogicalOp("AND")}
                  className={`px-2 py-0.5 text-xs rounded transition ${
                    logicalOp === "AND"
                      ? "bg-[#5B0A0A] text-white font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => setLogicalOp("OR")}
                  className={`px-2 py-0.5 text-xs rounded transition ${
                    logicalOp === "OR"
                      ? "bg-[#5B0A0A] text-white font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  OR
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="text-xs h-7 gap-1 border-white/10 hover:border-white/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Condition
            </Button>
          </div>

          <div className="space-y-2.5">
            {fieldConditions.map((cond, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-[#161616] p-2 rounded-md border border-white/5"
              >
                <div className="w-1/3">
                  <Select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(index, "field", e.target.value)}
                    options={FIELD_OPTIONS}
                  />
                </div>

                <div className="w-1/3">
                  <Select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateCondition(index, "operator", e.target.value as RuleOperator)
                    }
                    options={OPERATOR_OPTIONS}
                  />
                </div>

                <div className="w-1/3">
                  <Input
                    value={String(cond.value ?? "")}
                    onChange={(e) =>
                      handleUpdateCondition(index, "value", e.target.value)
                    }
                    placeholder="Match value..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCondition(index)}
                  disabled={fieldConditions.length <= 1}
                  className="p-1.5 text-neutral-400 hover:text-red-400 disabled:opacity-30 transition"
                  title="Remove condition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300">
            Tags (comma-separated)
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. simulation, defensive, powershell, credential_access"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-[#5B0A0A] hover:bg-[#8B0000] text-white border-red-500/30"
          >
            {isSubmitting
              ? "Saving..."
              : editingRule
              ? "Update Rule"
              : "Create Rule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
