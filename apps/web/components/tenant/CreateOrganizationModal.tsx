"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button } from "@vrsoc/ui";
import { createOrganizationAction } from "@/lib/tenant/actions";
import { Building2, AlertCircle } from "lucide-react";

export interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateOrganizationModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await createOrganizationAction({ name, slug });
      if (!result.success) {
        setErrorMessage(result.error || "Unable to create organization.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setName("");
      setSlug("");
      onClose();
      if (onCreated) onCreated();
      router.refresh();
    } catch {
      setErrorMessage("Unexpected error during organization creation.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Organization"
      description="Provision a multi-tenant workspace with isolated detection rules, alerts, and teams."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<Building2 className="w-3.5 h-3.5" />}
          >
            Create Organization
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/80">Organization Name</label>
          <input
            type="text"
            required
            autoFocus
            placeholder="e.g. Cyber Defense Academy"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/80">Workspace URL Slug</label>
          <div className="flex items-center rounded-xl bg-white/[0.02] border border-white/10 px-3 py-2 text-xs">
            <span className="text-white/40 font-mono">vrsoc.app/org/</span>
            <input
              type="text"
              required
              placeholder="cyber-defense-academy"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isLoading}
              className="w-full bg-transparent text-white placeholder:text-white/20 focus:outline-none font-mono"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
