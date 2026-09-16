import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, MetricCard, Button, Badge } from "@vrsoc/ui";
import { Server, Database, Activity, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { getActiveOrganization, listUserOrganizationsAction } from "@/lib/tenant/actions";
import { listOrganizationMembersAction } from "@/lib/rbac/actions";
import { RBACDashboardControls } from "@/components/rbac/RBACDashboardControls";
import { AppShellWrapper } from "@/components/shell/AppShellWrapper";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userEmail = user?.email || "analyst@vrsoc.app";

  const { organization: activeOrg, role: activeRole } = await getActiveOrganization();
  const membershipsResult = await listUserOrganizationsAction();
  const memberships = membershipsResult.data || [];

  const orgName = activeOrg?.name || "Cyber Defense Academy";
  const orgId = activeOrg?.id || "org-default-01";

  const membersResult = activeOrg?.id ? await listOrganizationMembersAction(activeOrg.id) : { success: true, data: [] };
  const orgMembers = membersResult.data || [];

  return (
    <AppShellWrapper
      currentPath="/"
      userEmail={userEmail}
      userRole={activeRole}
      activeOrganization={activeOrg}
      memberships={memberships}
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Page Header with RBAC Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="burgundy">Enterprise Shell</Badge>
              <Badge variant="burgundy">Multi-Tenant</Badge>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                RLS ISOLATED
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Security Operations Center
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Active Organization: <span className="text-white font-medium">{orgName}</span> • Verified Role: <span className="text-emerald-400 font-mono font-medium">{activeRole || "Super Admin"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* RBAC Role & Member Management */}
            <RBACDashboardControls
              organizationId={orgId}
              organizationName={orgName}
              currentUserRole={activeRole || undefined}
              currentUserId={user?.id}
              initialMembers={orgMembers}
            />

            <Link href="/design-system">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Design System
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational KPI Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Tenant Isolation"
            value="ENFORCED"
            change="PostgreSQL RLS"
            isPositive={true}
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
            subtitle="Tenant partition locked"
          />
          <MetricCard
            label="Active Sensors"
            value="156 / 160"
            change="97.5%"
            isPositive={true}
            icon={<Server className="w-4 h-4 text-blue-400" />}
            subtitle="Scoped to active tenant"
          />
          <MetricCard
            label="Database Security"
            value="ZERO LEAKAGE"
            change="Schema Verified"
            isPositive={true}
            icon={<Database className="w-4 h-4 text-purple-400" />}
            subtitle="Cross-tenant access blocked"
          />
          <MetricCard
            label="Simulation Boundary"
            value="DEFENSIVE"
            change="Synthetic"
            isPositive={true}
            icon={<Activity className="w-4 h-4 text-amber-400" />}
            subtitle="Zero offensive tooling invariant"
          />
        </div>

        {/* Shell Integration & Security Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Base44 Shell Architecture</CardTitle>
              <CardDescription>Enterprise SOC & SOAR workspace navigation hierarchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Sidebar Structure</span>
                <span className="font-mono text-emerald-400">240px Collapsible (Core + SOAR)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Command Palette</span>
                <span className="font-mono text-emerald-400">Ctrl+K / Cmd+K Preloaded</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Navigation Filtering</span>
                <span className="font-mono text-emerald-400">RBAC Permission Scoped</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Dynamic Breadcrumbs</span>
                <span className="font-mono text-emerald-400">Segment Hierarchy Engine</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Security & Multi-Tenancy Invariants</CardTitle>
              <CardDescription>Platform security state and authorization perimeter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-emerald-300">Phase 09 Authenticated Shell Active</p>
                  <p className="text-emerald-400/80 leading-relaxed">
                    Authenticated application shell connecting design system, multi-tenancy context, and centralized RBAC permissions into a unified workspace.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/50">
                <span>Next Milestone:</span>
                <span className="text-white font-medium">Phase 10 — Synthetic Telemetry Engine</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShellWrapper>
  );
}
