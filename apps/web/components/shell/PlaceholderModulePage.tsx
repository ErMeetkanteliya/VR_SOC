import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveOrganization, listUserOrganizationsAction } from "@/lib/tenant/actions";
import { AppShellWrapper } from "./AppShellWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyState, Badge } from "@vrsoc/ui";
import { redirect } from "next/navigation";

export interface PlaceholderModulePageProps {
  currentPath: string;
  title: string;
  category: "Core SOC" | "SOAR Orchestration" | "Intelligence & Training" | "Administration";
  description: string;
  plannedPhase: string;
}

export async function PlaceholderModulePage({
  currentPath,
  title,
  category,
  description,
  plannedPhase,
}: PlaceholderModulePageProps) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isE2ESession = (await import("next/headers")).cookies().get("vrsoc_e2e_session")?.value;
  if (!user && !isE2ESession) {
    redirect("/login");
  }

  const userEmail = user?.email || "analyst@vrsoc.app";
  const { organization: activeOrg, role: activeRole } = await getActiveOrganization();
  const membershipsResult = await listUserOrganizationsAction();
  const memberships = membershipsResult.data || [];

  return (
    <AppShellWrapper
      currentPath={currentPath}
      userEmail={userEmail}
      userRole={activeRole}
      activeOrganization={activeOrg}
      memberships={memberships}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="burgundy">{category}</Badge>
              <span className="text-xs font-mono text-white/40">Roadmap Surface</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <p className="text-xs text-white/50 mt-1">
              {description}
            </p>
          </div>
        </div>

        {/* Roadmap Placeholder State */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{title} Module Workspace</CardTitle>
            <CardDescription>Target milestone implementation boundary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmptyState
              title={`${title} Module Under Active Development`}
              description={`This workspace surface is scheduled for production implementation in ${plannedPhase} per the VRSOC engineering blueprint.`}
            />
            <div className="flex justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                Return to SOC Dashboard
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShellWrapper>
  );
}
