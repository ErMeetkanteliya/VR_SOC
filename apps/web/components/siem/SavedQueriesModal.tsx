"use client";

import React, { useState } from "react";
import { Modal, Input, Button } from "@vrsoc/ui";
import { Bookmark, Pin, Trash2, Check, Search } from "lucide-react";
import type { SavedQuery, SiemFilterParams } from "@vrsoc/types";
import {
  createSavedQueryAction,
  deleteSavedQueryAction,
  updateSavedQueryAction,
} from "@/lib/siem/actions";

interface SavedQueriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: SiemFilterParams;
  savedQueries: SavedQuery[];
  onLoadQuery: (query: SavedQuery) => void;
  onRefreshQueries: () => void;
}

export function SavedQueriesModal({
  isOpen,
  onClose,
  currentFilters,
  savedQueries,
  onLoadQuery,
  onRefreshQueries,
}: SavedQueriesModalProps) {
  const [activeTab, setActiveTab] = useState<"save" | "browse">("save");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for this search.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await createSavedQueryAction({
        name: name.trim(),
        description: description.trim() || undefined,
        queryType: "events",
        filters: currentFilters,
        isPinned,
      });

      if (res.success) {
        setSaveSuccess(true);
        setName("");
        setDescription("");
        onRefreshQueries();
        setTimeout(() => {
          setSaveSuccess(false);
          setActiveTab("browse");
        }, 1200);
      } else {
        setError(res.error || "Failed to save query.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (queryId: string) => {
    if (!confirm("Are you sure you want to delete this saved query?")) return;
    const res = await deleteSavedQueryAction({ id: queryId });
    if (res.success) {
      onRefreshQueries();
    }
  };

  const handleTogglePin = async (query: SavedQuery) => {
    const res = await updateSavedQueryAction({
      id: query.id,
      isPinned: !query.is_pinned,
    });
    if (res.success) {
      onRefreshQueries();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SIEM Saved Queries & Investigation Presets"
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("save")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "save"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Save Current Search
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "browse"
                ? "bg-crimson-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Saved Queries ({savedQueries.length})
          </button>
        </div>

        {/* Tab 1: Save Current Query */}
        {activeTab === "save" && (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-[11px] mb-1 font-semibold">
                Query Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Critical Brute Force Investigations"
                className="w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-[11px] mb-1 font-semibold">
                Description (Optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Identifies failed auth surges on domain controllers"
                className="w-full text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-white/20 bg-charcoal-900 text-crimson-600 focus:ring-crimson-500"
              />
              <label htmlFor="isPinned" className="text-gray-300 text-xs flex items-center gap-1 cursor-pointer">
                <Pin className="w-3 h-3 text-amber-400" /> Pin query to quick filters
              </label>
            </div>

            {/* Current filters preview */}
            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                Parameters Captured:
              </span>
              <pre className="font-mono text-[11px] text-gray-300 overflow-x-auto">
                {JSON.stringify(currentFilters, null, 2)}
              </pre>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {saveSuccess && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Query saved successfully!
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving} size="sm">
                {isSaving ? "Saving..." : "Save Query"}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Browse Saved Queries */}
        {activeTab === "browse" && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {savedQueries.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No saved queries found. Use the &quot;Save Current Search&quot; tab to store investigation filters.
              </div>
            ) : (
              savedQueries.map((sq) => (
                <div
                  key={sq.id}
                  className="bg-charcoal-900 border border-white/10 p-3 rounded-lg flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {sq.is_pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      <span className="font-semibold text-white text-xs truncate">{sq.name}</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {sq.query_type}
                      </span>
                    </div>
                    {sq.description && (
                      <p className="text-[11px] text-gray-400 truncate">{sq.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onLoadQuery(sq);
                        onClose();
                      }}
                      className="text-[11px] h-7 px-2.5"
                    >
                      Run
                    </Button>
                    <button
                      onClick={() => handleTogglePin(sq)}
                      className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                        sq.is_pinned ? "text-amber-400" : "text-gray-500 hover:text-gray-300"
                      }`}
                      title={sq.is_pinned ? "Unpin query" : "Pin query"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sq.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                      title="Delete query"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
