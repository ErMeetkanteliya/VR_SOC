"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { switchOrganizationAction } from "@/lib/tenant/actions";
import { CreateOrganizationModal } from "./CreateOrganizationModal";
import type { Organization, Membership } from "@vrsoc/types";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrganizationSwitcherProps {
  currentOrganization: Organization | null;
  memberships: Membership[];
}

export function OrganizationSwitcher({
  currentOrganization,
  memberships,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelectOrg = async (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    setIsOpen(false);

    try {
      const res = await switchOrganizationAction(orgId);
      if (res.success) {
        router.refresh();
      }
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/90 hover:bg-white/[0.08] transition-colors focus:outline-none"
      >
        <Building2 className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
        <span className="font-medium max-w-[150px] truncate">
          {currentOrganization?.name || "Select Organization"}
        </span>
        <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#161616] border border-white/15 shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono tracking-wider text-white/40">
              Organizations ({memberships.length})
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {memberships.map((m) => {
                const org = m.organization;
                if (!org) return null;
                const isSelected = org.id === currentOrganization?.id;

                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org.id)}
                    className={cn(
                      "w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors text-left",
                      isSelected
                        ? "bg-[#5B0A0A] text-white border border-[#E53935]/30"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{org.name}</p>
                      <p className="text-[10px] text-white/40 capitalize">{m.role}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#E53935] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#E53935]" />
                <span>Create Organization</span>
              </button>
            </div>
          </div>
        </>
      )}

      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
