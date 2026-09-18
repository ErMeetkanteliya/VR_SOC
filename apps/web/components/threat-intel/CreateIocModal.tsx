"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2, Tag, ShieldAlert } from "lucide-react";
import { normalizeIoc, detectIocType } from "@/lib/threat-intel/normalization";
import type { IocType, IocSeverity, IocStatus, CreateIocInput } from "@vrsoc/types";

interface CreateIocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateIocInput) => Promise<boolean>;
}

const COMMON_THREAT_TYPES = [
  "c2",
  "ransomware",
  "phishing",
  "dropper",
  "botnet",
  "scanner",
  "credential_theft",
  "hacktool",
  "persistence",
  "tor_exit",
];

export const CreateIocModal: React.FC<CreateIocModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [iocType, setIocType] = useState<IocType>("ip");
  const [value, setValue] = useState("");
  const [severity, setSeverity] = useState<IocSeverity>("high");
  const [confidence, setConfidence] = useState(85);
  const [threatTypes, setThreatTypes] = useState<string[]>(["c2"]);
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IocStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live normalization preview
  const normResult = value.trim() ? normalizeIoc(iocType, value) : null;

  // Auto-detect type suggestion when value changes if user is on default
  useEffect(() => {
    if (value.trim().length > 3) {
      const detected = detectIocType(value);
      if (detected !== iocType) {
        // Can optionally suggest or update
      }
    }
  }, [value, iocType]);

  if (!isOpen) return null;

  const handleAddThreatType = (tt: string) => {
    if (threatTypes.includes(tt)) {
      setThreatTypes(threatTypes.filter((t) => t !== tt));
    } else {
      setThreatTypes([...threatTypes, tt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("Indicator value is required.");
      return;
    }

    if (normResult && !normResult.isValid) {
      setError(normResult.error || "Indicator format is invalid.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const input: CreateIocInput = {
      ioc_type: iocType,
      value: value.trim(),
      severity,
      confidence,
      threat_types: threatTypes,
      tags,
      description: description.trim(),
      status,
      source: "manual",
    };

    const success = await onSubmit(input);
    setIsSubmitting(false);

    if (success) {
      // Reset form and close
      setValue("");
      setDescription("");
      setTagsInput("");
      setError(null);
      onClose();
    } else {
      setError("Failed to create threat indicator. Please check permissions and input values.");
    }
  };

  return (
    <div
      data-testid="create-ioc-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 data-testid="create-ioc-modal-title" className="text-base font-bold text-white">
                Create Threat Indicator
              </h3>
              <p className="text-xs text-white/50">Add a canonical IOC to your tenant intelligence catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* IOC Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Indicator Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(["ip", "domain", "url", "hash", "email", "file"] as IocType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`modal-type-${type}`}
                  onClick={() => setIocType(type)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                    iocType === type
                      ? "bg-red-600 text-white border border-red-400 shadow-md shadow-red-500/20"
                      : "bg-[#181818] text-white/60 hover:text-white border border-white/5 hover:border-white/15"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Value Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Indicator Value (or Defanged)
              </label>
              <span className="text-[11px] text-white/40">Defanged syntax auto-resolved</span>
            </div>
            <input
              type="text"
              data-testid="ioc-value-input"
              required
              placeholder={
                iocType === "ip"
                  ? "e.g. 185[.]220[.]101[.]5 or 192.168.1.1"
                  : iocType === "domain"
                  ? "e.g. evil-c2[.]com or botnet.ru"
                  : iocType === "url"
                  ? "e.g. hxxps://evil[.]com/payload.bin"
                  : iocType === "hash"
                  ? "e.g. 44d88612fea8a8f36de82e1278abb02f"
                  : iocType === "email"
                  ? "e.g. phish[@]target-domain[.]com"
                  : "e.g. Invoke-Mimikatz.ps1"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white font-mono placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Live Normalization Preview Box */}
          {value.trim() && normResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 transition-all ${
                normResult.isValid
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/20 border-red-500/30 text-red-300"
              }`}
            >
              {normResult.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 overflow-hidden">
                <div className="font-semibold text-[11px] uppercase tracking-wider">
                  {normResult.isValid ? "Normalized Canonical Output:" : "Validation Error:"}
                </div>
                <div className="break-all font-bold">
                  {normResult.isValid ? normResult.normalizedValue : normResult.error}
                </div>
              </div>
            </div>
          )}

          {/* Severity, Status & Confidence Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IocSeverity)}
                className="w-full px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                <option value="critical" className="bg-[#181818]">Critical</option>
                <option value="high" className="bg-[#181818]">High</option>
                <option value="medium" className="bg-[#181818]">Medium</option>
                <option value="low" className="bg-[#181818]">Low</option>
                <option value="informational" className="bg-[#181818]">Informational</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IocStatus)}
                className="w-full px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                <option value="active" className="bg-[#181818]">Active</option>
                <option value="watchlist" className="bg-[#181818]">Watchlist</option>
                <option value="deprecated" className="bg-[#181818]">Deprecated</option>
                <option value="false_positive" className="bg-[#181818]">False Positive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Confidence
                </label>
                <span className="text-xs font-mono font-bold text-white">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Threat Categories Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Threat Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_THREAT_TYPES.map((tt) => {
                const isSelected = threatTypes.includes(tt);
                return (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => handleAddThreatType(tt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase transition-all ${
                      isSelected
                        ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                        : "bg-[#181818] text-white/50 hover:text-white border border-white/5"
                    }`}
                  >
                    {tt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Analyst Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CobaltStrike, ActiveCampaign, Incident-402"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Investigation Narrative / Context
            </label>
            <textarea
              rows={3}
              placeholder="Describe adversary behavior, observed campaign context, or forensic analysis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (normResult !== null && !normResult.isValid)}
              data-testid="submit-ioc-btn"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/50 shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? <span>Saving...</span> : <span>Save Indicator</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
