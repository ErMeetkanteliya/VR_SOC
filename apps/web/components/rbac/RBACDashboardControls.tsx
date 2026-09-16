"use client";

import React, { useState } from "react";
import { Button } from "@vrsoc/ui";
import { Users } from "lucide-react";
import { MemberRoleManager } from "./MemberRoleManager";
import type { Membership, UserRole } from "@vrsoc/types";

export interface RBACDashboardControlsProps {
  organizationId: string;
  organizationName: string;
  currentUserRole?: UserRole;
  currentUserId?: string;
  initialMembers: Membership[];
}

export function RBACDashboardControls({
  organizationId,
  organizationName,
  currentUserRole,
  currentUserId,
  initialMembers,
}: RBACDashboardControlsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        leftIcon={<Users className="w-3.5 h-3.5 text-[#E53935]" />}
      >
        Manage Roles
      </Button>

      <MemberRoleManager
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationId={organizationId}
        organizationName={organizationName}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
        initialMembers={initialMembers}
      />
    </>
  );
}
