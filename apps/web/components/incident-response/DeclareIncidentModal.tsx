"use client";

import React, { useState } from "react";
import { Modal } from "@vrsoc/ui";
import { Flame } from "lucide-react";
import type { SeverityLevel, IncidentPriority, IncidentPlaybook } from "@vrsoc/types";

interface DeclareIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbooks: IncidentPlaybook[];
  onDeclare: (data: {
    title: string;
    description: string;
    severity: SeverityLevel;
    priority: IncidentPriority;
    playbook_id?: string;
    source_alert_id?: string;
  }) => Promise<boolean>;
  prefilledAlertId?: string;
  prefilledTitle?: string;
}

export const DeclareIncidentModal: React.FC<DeclareIncidentModalProps> = ({
  isOpen,
  onClose,
  playbooks,
  onDeclare,
  prefilledAlertId,
  prefilledTitle,
}) => {
  const [title, setTitle] = useState(prefilledTitle || "");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("High");
  const [priority, setPriority] = useState<IncidentPriority>("P2");
  const [playbookId, setPlaybookId] = useState(playbooks[0]?.id || "PB-MAL-001");
  const [sourceAlertId, setSourceAlertId] = useState(prefilledAlertId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (prefilledTitle) setTitle(prefilledTitle);
    if (prefilledAlertId) setSourceAlertId(prefilledAlertId);
  }, [prefilledTitle, prefilledAlertId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const ok = await onDeclare({
      title: title.trim(),
      description: description.trim(),
      severity,
      priority,
      playbook_id: playbookId || undefined,
      source_alert_id: sourceAlertId.trim() || undefined,
    });
    setIsSubmitting(false);

    if (ok) {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Declare Cybersecurity Incident">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="declare-incident-modal">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          <Flame className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Declaring an incident establishes a formal response dossier and initiates standard operational playbooks.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/80 block mb-1">
            Incident Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            data-testid="declare-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Active Cobalt Strike C2 Outbreak on Finance Subnet"
            required
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Severity</label>
            <select
              data-testid="declare-severity-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Priority SLA</label>
            <select
              data-testid="declare-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as IncidentPriority)}
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50"
            >
              <option value="P1">P1 (Immediate Action - 15m MTTC)</option>
              <option value="P2">P2 (High Priority - 1h MTTC)</option>
              <option value="P3">P3 (Medium Priority - 4h MTTC)</option>
              <option value="P4">P4 (Low Priority - Standard SLA)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">
              Response Playbook
            </label>
            <select
              data-testid="declare-playbook-select"
              value={playbookId}
              onChange={(e) => setPlaybookId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50"
            >
              {playbooks.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">
              Source Trigger Alert ID (Optional)
            </label>
            <input
              type="text"
              data-testid="declare-alert-id-input"
              value={sourceAlertId}
              onChange={(e) => setSourceAlertId(e.target.value)}
              placeholder="e.g. alert-hunt-001"
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/80 block mb-1">
            Summary / Incident Scope Description
          </label>
          <textarea
            data-testid="declare-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Document observed adversary tactics, affected hosts, indicators of compromise, and initial impact..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="confirm-declare-btn"
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>{isSubmitting ? "Declaring..." : "Declare Incident"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
