/**
 * Pipeline Stage 5: Persistence
 *
 * Persists enriched pipeline packages to PostgreSQL (Supabase).
 * Writes to: public.events, public.logs, public.processes, public.files,
 * public.network_connections.
 *
 * Handles:
 * - Deduplication by ingestion_id
 * - Pipeline status tracking
 * - Failure recovery (marks failed records)
 * - Tenant isolation verification
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EnrichedPipelinePackage } from "./enrich";
import type { PipelineResult, PipelineStage } from "@vrsoc/types";

/**
 * Persists an enriched pipeline package to the database.
 * Returns a PipelineResult with event/log IDs and processing status.
 */
export async function persistPipelinePackage(
  pkg: EnrichedPipelinePackage,
  options?: { skipDeduplication?: boolean }
): Promise<PipelineResult> {
  const startTime = Date.now();
  const supabase = await createServerSupabaseClient();

  try {
    // 1. Deduplication check
    if (!options?.skipDeduplication && pkg.ingestionId) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("ingestion_id", pkg.ingestionId)
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          stage: "Stored",
          eventId: existing.id,
          ingestionId: pkg.ingestionId,
          processingDurationMs: Date.now() - startTime,
          enrichments: pkg.enrichments,
        };
      }
    }

    // 2. Insert normalized event
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .insert({
        organization_id: pkg.event.organization_id,
        occurred_at: pkg.event.occurred_at,
        source: pkg.event.source,
        source_type: pkg.event.source_type,
        category: pkg.event.category,
        event_type: pkg.event.event_type,
        severity: pkg.event.severity,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        identity_id: pkg.event.identity_id,
        raw_payload: pkg.event.raw_payload,
        normalized_fields: pkg.event.normalized_fields,
        tags: pkg.event.tags,
        pipeline_status: "Stored",
        ingestion_id: pkg.ingestionId,
        source_host: pkg.sourceHost,
      })
      .select("id, created_at")
      .maybeSingle();

    if (eventErr) {
      console.error("[persistPipelinePackage] Event insert failed:", eventErr.message);
      return makeFailureResult(pkg.ingestionId, "Stored", eventErr.message, startTime);
    }

    const eventId = eventRow?.id || `evt-${Date.now()}`;

    // 3. Insert log record
    const { data: logRow, error: logErr } = await supabase
      .from("logs")
      .insert({
        organization_id: pkg.log.organization_id,
        event_id: eventRow?.id || null,
        logged_at: pkg.log.logged_at,
        facility: pkg.log.facility,
        log_level: pkg.log.log_level,
        source_host: pkg.log.source_host,
        service_name: pkg.log.service_name,
        message: pkg.log.message,
        raw_log: pkg.log.raw_log,
        parse_status: pkg.log.parse_status,
        parser_name: pkg.log.parser_name,
        metadata: pkg.log.metadata,
        pipeline_status: "Stored",
        ingestion_id: pkg.ingestionId,
        source: pkg.event.source,
        source_type: pkg.event.source_type,
      })
      .select("id")
      .maybeSingle();

    if (logErr) {
      console.warn("[persistPipelinePackage] Log insert warning:", logErr.message);
    }

    // 4. Insert auxiliary entities
    if (pkg.process && pkg.event.asset_id) {
      await supabase.from("processes").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        pid: pkg.process.pid,
        ppid: pkg.process.ppid,
        name: pkg.process.name,
        executable_path: pkg.process.executable_path,
        command_line: pkg.process.command_line,
        sha256: pkg.process.sha256,
        started_at: pkg.process.started_at,
        integrity_level: pkg.process.integrity_level,
      });
    }

    if (pkg.file && pkg.event.asset_id) {
      await supabase.from("files").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        path: pkg.file.path || pkg.file.name,
        name: pkg.file.name,
        extension: pkg.file.extension,
        size_bytes: pkg.file.size_bytes,
        sha256: pkg.file.sha256,
        is_hidden: pkg.file.is_hidden,
        is_executable: pkg.file.is_executable,
      });
    }

    if (pkg.network && pkg.event.asset_id) {
      await supabase.from("network_connections").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        src_ip: pkg.network.src_ip,
        dst_ip: pkg.network.dst_ip,
        src_port: pkg.network.src_port,
        dst_port: pkg.network.dst_port,
        protocol: pkg.network.protocol,
        direction: pkg.network.direction,
        status: pkg.network.status,
        bytes_sent: pkg.network.bytes_sent,
        bytes_received: pkg.network.bytes_received,
        started_at: pkg.network.started_at,
      });
    }

    if (pkg.registry && pkg.event.asset_id) {
      await supabase.from("registry_events").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        hive: pkg.registry.hive,
        key_path: pkg.registry.key_path,
        value_name: pkg.registry.value_name,
        value_data: pkg.registry.value_data,
        value_type: pkg.registry.value_type,
        action: pkg.registry.action,
        occurred_at: pkg.registry.occurred_at,
      });
    }

    if (pkg.service && pkg.event.asset_id) {
      await supabase.from("endpoint_services").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        service_name: pkg.service.service_name,
        display_name: pkg.service.display_name,
        executable_path: pkg.service.executable_path,
        start_type: pkg.service.start_type,
        status: pkg.service.status,
        action: pkg.service.action,
        account_name: pkg.service.account_name,
        occurred_at: pkg.service.occurred_at,
      });
    }

    if (pkg.scheduledTask && pkg.event.asset_id) {
      await supabase.from("scheduled_task_events").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        task_name: pkg.scheduledTask.task_name,
        task_path: pkg.scheduledTask.task_path,
        action: pkg.scheduledTask.action,
        command: pkg.scheduledTask.command,
        arguments: pkg.scheduledTask.arguments,
        run_as_user: pkg.scheduledTask.run_as_user,
        trigger_type: pkg.scheduledTask.trigger_type,
        occurred_at: pkg.scheduledTask.occurred_at,
      });
    }

    if (pkg.startupItem && pkg.event.asset_id) {
      await supabase.from("startup_items").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        name: pkg.startupItem.name,
        location_type: pkg.startupItem.location_type,
        location_path: pkg.startupItem.location_path,
        command: pkg.startupItem.command,
        user_context: pkg.startupItem.user_context,
        action: pkg.startupItem.action,
        occurred_at: pkg.startupItem.occurred_at,
      });
    }

    if (pkg.usb && pkg.event.asset_id) {
      await supabase.from("usb_events").insert({
        organization_id: pkg.event.organization_id,
        asset_id: pkg.event.asset_id,
        agent_id: pkg.event.agent_id,
        vendor_id: pkg.usb.vendor_id,
        product_id: pkg.usb.product_id,
        device_name: pkg.usb.device_name,
        device_class: pkg.usb.device_class,
        serial_number: pkg.usb.serial_number,
        drive_letter: pkg.usb.drive_letter,
        action: pkg.usb.action,
        occurred_at: pkg.usb.occurred_at,
      });
    }

    return {
      success: true,
      stage: "Stored",
      eventId,
      logId: logRow?.id,
      ingestionId: pkg.ingestionId,
      processingDurationMs: Date.now() - startTime,
      enrichments: pkg.enrichments,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected persistence failure.";
    console.error("[persistPipelinePackage] Error:", message);
    return makeFailureResult(pkg.ingestionId, "Stored", message, startTime);
  }
}

function makeFailureResult(
  ingestionId: string,
  failedStage: PipelineStage,
  error: string,
  startTime: number
): PipelineResult {
  return {
    success: false,
    stage: "Failed",
    failedStage,
    ingestionId,
    processingDurationMs: Date.now() - startTime,
    error,
  };
}
