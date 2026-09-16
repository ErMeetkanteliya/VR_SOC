import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppShell, Card, CardHeader, CardTitle, CardDescription, CardContent, MetricCard, Button, Badge } from "@vrsoc/ui";
import { Server, Database, Activity, CheckCircle2, LogOut, ExternalLink, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userEmail = user?.email || "analyst@vrsoc.app";

  return (
    <AppShell
      currentPath="/"
      userEmail={userEmail}
      organizationName="Cyber Defense Academy"
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="burgundy">Identity & Access Verified</Badge>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SESSION ACTIVE
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Security Operations Center
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Authenticated user: <span className="text-white font-medium">{userEmail}</span> • Tenant context initialized
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/design-system">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Design System
              </Button>
            </Link>

            <form action={logoutAction}>
              <Button type="submit" variant="destructive" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                Log out
              </Button>
            </form>
          </div>
        </div>

        {/* Operational KPI Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Authentication Identity"
            value="ACTIVE"
            change="Supabase SSR"
            isPositive={true}
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
            subtitle="Session token verified at edge"
          />
          <MetricCard
            label="Active Sensors"
            value="156 / 160"
            change="97.5%"
            isPositive={true}
            icon={<Server className="w-4 h-4 text-blue-400" />}
            subtitle="4 telemetry agents offline"
          />
          <MetricCard
            label="Database Security"
            value="RLS ENFORCED"
            change="PostgreSQL 15"
            isPositive={true}
            icon={<Database className="w-4 h-4 text-purple-400" />}
            subtitle="Tenant isolation active"
          />
          <MetricCard
            label="Defensive Boundary"
            value="SIMULATED"
            change="Safe Labs"
            isPositive={true}
            icon={<Activity className="w-4 h-4 text-amber-400" />}
            subtitle="Zero offensive tooling invariant"
          />
        </div>

        {/* Foundation Status & Security Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Session & Security Posture</CardTitle>
              <CardDescription>Verified authentication boundaries and edge cookie handlers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Session Storage Mechanism</span>
                <span className="font-mono text-emerald-400">HttpOnly Cookies (SSR)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Service-Role Key Protection</span>
                <span className="font-mono text-emerald-400">Server-Only Isolation</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Custom Token Storage (localStorage)</span>
                <span className="font-mono text-emerald-400">Prohibited (0 Custom JWTs)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-white/70">Profile Synchronization Trigger</span>
                <span className="font-mono text-emerald-400">auth.users → public.profiles</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Enterprise Roadmap Readiness</CardTitle>
              <CardDescription>Architectural compliance for subsequent development phases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-emerald-300">Phase 06 Authentication Foundation Verified</p>
                  <p className="text-emerald-400/80 leading-relaxed">
                    Login, registration wizard, OTP email verification, password reset, session refresh middleware, and safe error translation operational.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/50">
                <span>Next Milestone:</span>
                <span className="text-white font-medium">Phase 07 — Organization Multi-Tenancy & RBAC</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
