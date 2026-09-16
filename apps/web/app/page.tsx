import { Shield, CheckCircle2, Server, Database, Activity } from "lucide-react";
import { VRSOC_CONFIG } from "@vrsoc/config";

export default function BootstrapPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white selection:bg-[#E53935] selection:text-white">
      <div className="max-w-2xl w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5B0A0A] border border-[#E53935]/30 shadow-lg shadow-red-950/50 mb-2">
            <span className="text-2xl font-bold tracking-wider text-white">VS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {VRSOC_CONFIG.appName}
          </h1>
          <p className="text-sm font-medium tracking-wide uppercase text-[#E53935]/90">
            {VRSOC_CONFIG.tagline}
          </p>
        </div>

        {/* Foundation Status Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide text-white/90">
                SYSTEM OPERATIONAL — BOOTSTRAP READY
              </span>
            </div>
            <span className="text-xs font-mono uppercase bg-white/5 text-white/60 px-2.5 py-1 rounded-md border border-white/10">
              v{VRSOC_CONFIG.version}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Server className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Next.js App Router</h2>
                <p className="text-xs text-white/50 mt-0.5">TypeScript strict mode active</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Database className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Supabase Foundation</h2>
                <p className="text-xs text-white/50 mt-0.5">Multi-tenant RLS ready</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Shield className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Defensive Architecture</h2>
                <p className="text-xs text-white/50 mt-0.5">Zero offensive tooling invariant</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Activity className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Shared Telemetry</h2>
                <p className="text-xs text-white/50 mt-0.5">Canonical simulation pipeline</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300 leading-relaxed">
              Repository bootstrap verified. Monorepo packages, strict TypeScript, Tailwind design tokens, and testing harnesses initialized cleanly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40">
          VRSOC SaaS Rebuild • Phase 03 Bootstrap Verified
        </p>
      </div>
    </main>
  );
}
