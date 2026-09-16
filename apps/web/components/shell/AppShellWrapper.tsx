"use client";

import React from "react";
import { AppShell } from "@vrsoc/ui";
import { OrganizationSwitcher } from "@/components/tenant/OrganizationSwitcher";
import { getAccessibleNavGroups } from "@/lib/navigation/config";
import { generateBreadcrumbs } from "@/lib/navigation/breadcrumbs";
import { logoutAction } from "@/lib/auth/actions";
import type { Organization, Membership, UserRole } from "@vrsoc/types";
import { useRouter } from "next/navigation";

export interface AppShellWrapperProps {
  currentPath: string;
  userEmail: string;
  userRole?: UserRole | null;
  activeOrganization: Organization | null;
  memberships: Membership[];
  children: React.ReactNode;
}

export function AppShellWrapper({
  currentPath,
  userEmail,
  userRole = "Super Admin",
  activeOrganization,
  memberships,
  children,
}: AppShellWrapperProps) {
  const router = useRouter();

  // 1. Resolve RBAC-accessible navigation groups
  const accessibleGroups = getAccessibleNavGroups(userRole);

  // 2. Generate hierarchical breadcrumbs
  const breadcrumbs = generateBreadcrumbs(currentPath);

  // 3. Preload command items from accessible routes
  const commandItems = accessibleGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: `nav-${item.id}`,
      label: item.label,
      category: group.title || "Navigation",
      icon: item.icon,
      onSelect: () => {
        router.push(item.href);
      },
    }))
  );

  return (
    <AppShell
      currentPath={currentPath}
      breadcrumbs={breadcrumbs}
      navGroups={accessibleGroups}
      organizationName={activeOrganization?.name || "Cyber Defense Academy"}
      organizationSlot={
        <OrganizationSwitcher
          currentOrganization={activeOrganization}
          memberships={memberships}
        />
      }
      userEmail={userEmail}
      userRole={userRole || "Super Admin"}
      commandItems={commandItems}
      onLogout={() => {
        const form = document.createElement("form");
        form.action = "/login";
        form.method = "POST";
        logoutAction();
      }}
    >
      {children}
    </AppShell>
  );
}
