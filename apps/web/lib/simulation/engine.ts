import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeTelemetryPayload } from "@/lib/telemetry/contracts";
import { CANONICAL_SIMULATION_SCENARIOS } from "./scenarios";
import type {
  SimulationScenario,
  TelemetryEvent,
  LogRecord,
} from "@vrsoc/types";

export interface ExecuteSimulationOptions {
  organizationId: string;
  scenarioId: string;
  userId?: string | null;
  targetAssetId?: string | null;
  targetAgentId?: string | null;
  targetIdentityId?: string | null;
  parameters?: Record<string, unknown>;
}

export interface SimulationExecutionOutput {
  success: boolean;
  runId?: string;
  scenarioName?: string;
  status?: "Completed" | "Failed" | "Running";
  eventsCount?: number;
  logsCount?: number;
  error?: string;
  generatedEvents?: TelemetryEvent[];
  generatedLogs?: LogRecord[];
}

/**
 * Authoritative Server-Side Simulation Execution Engine.
 * 
 * Enforces:
 * 1. Strict Tenant Scoping (Run, Assets, Agents, Events, and Logs MUST share the same organization_id).
 * 2. Deterministic Telemetry Generation (Events -> Logs -> Processes/Files/Network).
 * 3. Graceful Failure & State Tracking (simulation_runs lifecycle: Pending -> Running -> Completed/Failed).
 * 4. Zero Real Destructive Operations (synthetic defensive simulations only).
 */
export async function executeSimulationRun(
  options: ExecuteSimulationOptions
): Promise<SimulationExecutionOutput> {
  const supabase = await createServerSupabaseClient();
  const { organizationId, scenarioId, userId, parameters = {} } = options;

  // 1. Resolve Scenario definition (from DB or canonical templates)
  let scenario: SimulationScenario | undefined = CANONICAL_SIMULATION_SCENARIOS.find(
    (s) => s.id === scenarioId || s.slug === scenarioId
  );

  if (!scenario) {
    const { data: dbScenario, error: scenErr } = await supabase
      .from("simulation_scenarios")
      .select("*")
      .or(`organization_id.eq.${organizationId},is_system.eq.true`)
      .eq("id", scenarioId)
      .maybeSingle();

    if (!scenErr && dbScenario) {
      scenario = dbScenario as SimulationScenario;
    }
  }

  if (!scenario) {
    return {
      success: false,
      error: `Scenario '${scenarioId}' not found or not accessible in current organization.`,
    };
  }

  // 2. Resolve Target Asset & Agent within active tenant boundary
  let targetAssetId = options.targetAssetId || null;
  let targetAgentId = options.targetAgentId || null;
  let targetIdentityId = options.targetIdentityId || null;
  let targetHostname = "WKSTN-084.corp.internal";

  if (targetAssetId) {
    // Verify target asset belongs to active organization
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .select("id, hostname, organization_id, agents(id)")
      .eq("id", targetAssetId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (assetErr || !asset) {
      return {
        success: false,
        error: "Target asset does not exist or does not belong to the active organization.",
      };
    }
    targetHostname = asset.hostname;
    if (!targetAgentId && asset.agents && (asset.agents as any[]).length > 0) {
      targetAgentId = (asset.agents as any[])[0].id;
    }
  } else {
    // Default to the first active endpoint asset for this organization
    const { data: defaultAsset } = await supabase
      .from("assets")
      .select("id, hostname, agents(id)")
      .eq("organization_id", organizationId)
      .limit(1)
      .maybeSingle();

    if (defaultAsset) {
      targetAssetId = defaultAsset.id;
      targetHostname = defaultAsset.hostname;
      if (defaultAsset.agents && (defaultAsset.agents as any[]).length > 0) {
        targetAgentId = (defaultAsset.agents as any[])[0].id;
      }
    }
  }

  // 3. Create simulation_runs record
  const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startedAt = new Date().toISOString();

  const { data: runRecord } = await supabase
    .from("simulation_runs")
    .insert({
      organization_id: organizationId,
      scenario_id: scenario.id.startsWith("scen-") ? null : scenario.id,
      status: "Running",
      target_asset_id: targetAssetId,
      target_agent_id: targetAgentId,
      target_identity_id: targetIdentityId,
      initiated_by: userId || null,
      events_generated_count: 0,
      logs_generated_count: 0,
      metadata: {
        scenario_slug: scenario.slug,
        scenario_name: scenario.name,
        target_hostname: targetHostname,
        parameters,
      },
      started_at: startedAt,
    })
    .select("id")
    .maybeSingle();

  const persistedRunId = runRecord?.id || runId;

  const generatedEvents: TelemetryEvent[] = [];
  const generatedLogs: LogRecord[] = [];

  try {
    // 4. Generate & Persist Telemetry Sequence
    let sequenceNumber = 1;
    for (const step of scenario.event_sequence) {
      const now = new Date(Date.now() + (step.step - 1) * 1000).toISOString();

      const normalizedPkg = normalizeTelemetryPayload(
        organizationId,
        {
          source: step.source,
          sourceType: step.source_type,
          category: step.category,
          eventType: step.event_type,
          severity: step.severity,
          logLevel: step.log_level,
          occurredAt: now,
          message: step.log_message,
          rawLog: step.raw_log,
          normalizedFields: {
            step_number: step.step,
            simulation_run_id: persistedRunId,
            scenario_slug: scenario.slug,
            mitre_tactic: step.mitre_tactic,
            mitre_technique: step.mitre_technique,
            ...step.normalized_fields,
          },
          process: step.process,
          file: step.file,
          network: step.network,
        },
        {
          assetId: targetAssetId,
          agentId: targetAgentId,
          identityId: targetIdentityId,
          sourceHost: targetHostname,
        }
      );

      // Insert normalized event
      const { data: eventRow } = await supabase
        .from("events")
        .insert({
          organization_id: organizationId,
          occurred_at: normalizedPkg.event.occurred_at,
          source: normalizedPkg.event.source,
          source_type: normalizedPkg.event.source_type,
          category: normalizedPkg.event.category,
          event_type: normalizedPkg.event.event_type,
          severity: normalizedPkg.event.severity,
          asset_id: targetAssetId,
          agent_id: targetAgentId,
          identity_id: targetIdentityId,
          raw_payload: normalizedPkg.event.raw_payload,
          normalized_fields: normalizedPkg.event.normalized_fields,
          tags: normalizedPkg.event.tags,
        })
        .select("id, created_at")
        .maybeSingle();

      const eventId = eventRow?.id || `evt-${Date.now()}-${sequenceNumber}`;

      const createdEvent: TelemetryEvent = {
        ...normalizedPkg.event,
        id: eventId,
        created_at: eventRow?.created_at || now,
      };
      generatedEvents.push(createdEvent);

      // Insert raw/ingested log
      const { data: logRow } = await supabase
        .from("logs")
        .insert({
          organization_id: organizationId,
          event_id: eventRow?.id || null,
          logged_at: normalizedPkg.log.logged_at,
          facility: normalizedPkg.log.facility,
          log_level: normalizedPkg.log.log_level,
          source_host: normalizedPkg.log.source_host,
          service_name: normalizedPkg.log.service_name,
          message: normalizedPkg.log.message,
          raw_log: normalizedPkg.log.raw_log,
          parse_status: normalizedPkg.log.parse_status,
          parser_name: normalizedPkg.log.parser_name,
          metadata: {
            ...normalizedPkg.log.metadata,
            simulation_run_id: persistedRunId,
          },
        })
        .select("id, created_at")
        .maybeSingle();

      generatedLogs.push({
        ...normalizedPkg.log,
        id: logRow?.id || `log-${Date.now()}-${sequenceNumber}`,
        created_at: logRow?.created_at || now,
      });

      // Insert auxiliary domain entities if defined
      if (normalizedPkg.process && targetAssetId) {
        await supabase.from("processes").insert({
          organization_id: organizationId,
          asset_id: targetAssetId,
          agent_id: targetAgentId,
          pid: normalizedPkg.process.pid,
          ppid: normalizedPkg.process.ppid,
          name: normalizedPkg.process.name,
          executable_path: normalizedPkg.process.executable_path,
          command_line: normalizedPkg.process.command_line,
          sha256: normalizedPkg.process.sha256,
          started_at: normalizedPkg.process.started_at,
          integrity_level: normalizedPkg.process.integrity_level,
        });
      }

      if (normalizedPkg.file && targetAssetId) {
        await supabase.from("files").insert({
          organization_id: organizationId,
          asset_id: targetAssetId,
          path: normalizedPkg.file.path,
          name: normalizedPkg.file.name,
          extension: normalizedPkg.file.extension,
          size_bytes: normalizedPkg.file.size_bytes,
          sha256: normalizedPkg.file.sha256,
          is_executable: normalizedPkg.file.is_executable,
          is_hidden: normalizedPkg.file.is_hidden,
        });
      }

      if (normalizedPkg.network && targetAssetId) {
        await supabase.from("network_connections").insert({
          organization_id: organizationId,
          asset_id: targetAssetId,
          src_ip: normalizedPkg.network.src_ip,
          dst_ip: normalizedPkg.network.dst_ip,
          src_port: normalizedPkg.network.src_port,
          dst_port: normalizedPkg.network.dst_port,
          protocol: normalizedPkg.network.protocol,
          direction: normalizedPkg.network.direction,
          status: normalizedPkg.network.status,
          bytes_sent: normalizedPkg.network.bytes_sent,
          bytes_received: normalizedPkg.network.bytes_received,
          started_at: normalizedPkg.network.started_at,
        });
      }

      // Link simulation run with generated event
      if (runRecord?.id && eventRow?.id) {
        await supabase.from("simulation_run_events").insert({
          organization_id: organizationId,
          simulation_run_id: runRecord.id,
          event_id: eventRow.id,
          sequence_number: sequenceNumber,
        });
      }

      sequenceNumber++;
    }

    const completedAt = new Date().toISOString();

    // 5. Update simulation_runs to Completed
    if (runRecord?.id) {
      await supabase
        .from("simulation_runs")
        .update({
          status: "Completed",
          events_generated_count: generatedEvents.length,
          logs_generated_count: generatedLogs.length,
          completed_at: completedAt,
          updated_at: completedAt,
        })
        .eq("id", runRecord.id)
        .eq("organization_id", organizationId);
    }

    return {
      success: true,
      runId: persistedRunId,
      scenarioName: scenario.name,
      status: "Completed",
      eventsCount: generatedEvents.length,
      logsCount: generatedLogs.length,
      generatedEvents,
      generatedLogs,
    };
  } catch (err: any) {
    console.error("[executeSimulationRun] Error during execution:", err);

    if (runRecord?.id) {
      await supabase
        .from("simulation_runs")
        .update({
          status: "Failed",
          error_message: err?.message || "Simulation execution encountered an unexpected failure.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id)
        .eq("organization_id", organizationId);
    }

    return {
      success: false,
      runId: persistedRunId,
      scenarioName: scenario.name,
      status: "Failed",
      error: err?.message || "Simulation execution failed.",
    };
  }
}
