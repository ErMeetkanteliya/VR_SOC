"use client";

import React, { useState } from "react";
import { CheckSquare, Square, Plus, BookOpen } from "lucide-react";
import { STAGE_LIFECYCLE_ORDER } from "@/lib/incident-response/catalog";
import type { IncidentTask, IncidentStage, IncidentTaskStatus } from "@vrsoc/types";

interface IncidentPlaybookPanelProps {
  tasks: IncidentTask[];
  playbookName?: string | null;
  onUpdateTaskStatus: (taskId: string, status: IncidentTaskStatus) => Promise<boolean>;
  onCreateTask: (stage: IncidentStage, title: string, description?: string) => Promise<boolean>;
  disabled?: boolean;
}

export const IncidentPlaybookPanel: React.FC<IncidentPlaybookPanelProps> = ({
  tasks,
  playbookName,
  onUpdateTaskStatus,
  onCreateTask,
  disabled = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStage, setNewStage] = useState<IncidentStage>("Detection");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    const ok = await onCreateTask(newStage, newTitle.trim(), newDescription.trim() || undefined);
    setIsSubmitting(false);
    if (ok) {
      setNewTitle("");
      setNewDescription("");
      setShowAddForm(false);
    }
  };

  // Group tasks by lifecycle stage
  const tasksByStage = STAGE_LIFECYCLE_ORDER.reduce<Record<IncidentStage, IncidentTask[]>>(
    (acc, stage) => {
      acc[stage] = tasks.filter((t) => t.stage === stage);
      return acc;
    },
    {} as Record<IncidentStage, IncidentTask[]>
  );

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  return (
    <div className="space-y-6" data-testid="incident-playbook-panel">
      {/* Playbook Header & Progress */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">
              {playbookName || "Standard Incident Checklist"}
            </h3>
          </div>
          <p className="text-xs text-white/50">
            Ordered operational checklists across all 6 NIST lifecycle phases.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right space-y-1">
            <span className="text-xs font-mono font-bold text-white">
              {completedCount} / {tasks.length} Tasks ({progressPercent}%)
            </span>
            <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              data-testid="add-task-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Custom Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="p-4 rounded-xl bg-[#161616] border border-red-500/30 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-red-300">Add Task to Checklist</h4>
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value as IncidentStage)}
              className="px-2.5 py-1 rounded-lg bg-[#111] border border-white/10 text-xs text-white"
            >
              {STAGE_LIFECYCLE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            data-testid="new-task-title-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title (e.g. Verify EDR containment state)..."
            required
            className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
          />

          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Operational description or guidance notes (optional)..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-task-btn"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors"
            >
              {isSubmitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      )}

      {/* Stage Grouped Tasks List */}
      <div className="space-y-6">
        {STAGE_LIFECYCLE_ORDER.filter((stage) => stage !== "Closed").map((stage) => {
          const stageTasks = tasksByStage[stage] || [];
          if (stageTasks.length === 0) return null;

          return (
            <div key={stage} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Phase: {stage}
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  ({stageTasks.filter((t) => t.status === "completed").length}/{stageTasks.length} done)
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {stageTasks.map((task) => {
                  const isDone = task.status === "completed";
                  const isSkipped = task.status === "skipped";

                  return (
                    <div
                      key={task.id}
                      data-testid={`task-item-${task.id}`}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isDone
                          ? "bg-[#121212] border-white/5 opacity-80"
                          : isSkipped
                          ? "bg-[#111111] border-white/5 opacity-50"
                          : "bg-[#141414] border-white/10 hover:border-white/20 shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            onUpdateTaskStatus(
                              task.id,
                              isDone ? "pending" : "completed"
                            )
                          }
                          className="mt-0.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-white/30" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <h5
                            className={`text-xs font-bold ${
                              isDone
                                ? "line-through text-white/50"
                                : isSkipped
                                ? "line-through text-white/40"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </h5>
                          {task.description && (
                            <p className="text-[11px] text-white/60 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          {task.notes && (
                            <p className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/20 p-1.5 rounded border border-cyan-500/20">
                              Note: {task.notes}
                            </p>
                          )}
                          {task.completed_by && (
                            <span className="text-[10px] text-emerald-400/80 font-mono block">
                              Completed by {task.completed_by} at{" "}
                              {new Date(task.completed_at || "").toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start">
                        {!disabled && !isDone && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateTaskStatus(
                                task.id,
                                isSkipped ? "pending" : "skipped"
                              )
                            }
                            className="px-2 py-1 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            {isSkipped ? "Unskip" : "Skip"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
