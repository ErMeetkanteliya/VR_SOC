"use client";

import React, { useState } from "react";
import { Modal, Button, Badge } from "@vrsoc/ui";
import { updateMemberRoleAction, removeMemberAction } from "@/lib/rbac/actions";
import { ALL_USER_ROLES, type Membership, type UserRole } from "@vrsoc/types";
import { Shield, AlertCircle, CheckCircle2, Trash2, Crown } from "lucide-react";

export interface MemberRoleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  currentUserRole?: UserRole;
  currentUserId?: string;
  initialMembers: Membership[];
  onMembersUpdated?: () => void;
}

export function MemberRoleManager({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  currentUserRole,
  currentUserId,
  initialMembers,
  onMembersUpdated,
}: MemberRoleManagerProps) {
  const [members, setMembers] = useState<Membership[]>(initialMembers);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageRoles = currentUserRole === "Super Admin";

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setUpdatingUserId(targetUserId);

    try {
      const result = await updateMemberRoleAction({
        organizationId,
        targetUserId,
        newRole,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to update member role.");
        setUpdatingUserId(null);
        return;
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
      setSuccessMessage(`Updated member role to ${newRole}.`);
      if (onMembersUpdated) onMembersUpdated();
    } catch {
      setErrorMessage("Unexpected error occurred while updating role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setUpdatingUserId(targetUserId);

    try {
      const result = await removeMemberAction({
        organizationId,
        targetUserId,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to remove member.");
        setUpdatingUserId(null);
        return;
      }

      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
      setSuccessMessage("Member removed successfully.");
      if (onMembersUpdated) onMembersUpdated();
    } catch {
      setErrorMessage("Unexpected error occurred while removing member.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Members & Access Control"
      description={`Manage organization roles and access permissions for ${organizationName}.`}
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 text-left">
        {/* Alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Members List */}
        <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {members.length === 0 ? (
            <div className="p-6 text-center text-xs text-white/40">
              No organization members found.
            </div>
          ) : (
            members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const isUpdating = updatingUserId === member.user_id;

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5B0A0A] border border-[#E53935]/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {member.profile?.full_name?.charAt(0) || member.role.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {member.profile?.full_name || member.profile?.email || `User ${member.user_id.slice(0, 8)}`}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-white/60 rounded">
                            You
                          </span>
                        )}
                        {member.role === "Super Admin" && (
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 font-mono">
                        {member.profile?.email || `Status: ${member.status}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Role selector for Super Admins (disabled for own user to prevent self-elevation) */}
                    {canManageRoles && !isSelf ? (
                      <div className="flex items-center gap-2">
                        <select
                          aria-label="Change member role"
                          value={member.role}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleRoleChange(member.user_id, e.target.value as UserRole)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-[#161616] border border-white/10 text-xs text-white focus:outline-none focus:border-[#E53935]"
                        >
                          {ALL_USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Remove member"
                          disabled={isUpdating}
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge variant={member.role === "Super Admin" ? "burgundy" : "default"}>
                          {member.role}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-[11px] text-white/50">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Role changes take effect immediately across all database queries and server actions.
            Self-role elevation is blocked at both the PostgreSQL trigger and application layer.
          </p>
        </div>
      </div>
    </Modal>
  );
}
