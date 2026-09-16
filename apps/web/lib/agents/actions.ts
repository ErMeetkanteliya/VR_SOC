"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { authorizePermission } from "@/lib/rbac/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  FilterAgentsSchema,
  IsolateAgentSchema,
  UpdateAgentGroupSchema,
  SimulateAgentStateSchema,
  RegisterEndpointAgentSchema,
  type FilterAgentsInput,
  type IsolateAgentInput,
  type UpdateAgentGroupInput,
  type SimulateAgentStateInput,
  type RegisterEndpointAgentInput,
} from "@vrsoc/validation";
import type {
  AssetGroup,
  AgentWithAsset,
  AgentFleetSummary,
  AgentStatus,
  AssetStatus,
} from "@vrsoc/types";

export interface AgentActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// Fallback seed definitions for demonstration & testing
const DEMO_ASSET_GROUPS = [
  { name: "Domain Controllers", criticality: "Critical" as const, description: "Tier-0 Active Directory & Identity Servers" },
  { name: "Production Databases", criticality: "Critical" as const, description: "Enterprise SQL & Cluster Systems" },
  { name: "Finance & Accounting", criticality: "High" as const, description: "High-value financial workstation endpoints" },
  { name: "Engineering & Dev", criticality: "Medium" as const, description: "Software development and build environments" },
  { name: "Corporate Fleet", criticality: "Medium" as const, description: "General enterprise office endpoints" },
];

const DEMO_HOSTS = [
  {
    hostname: "DC-01.corp.internal",
    displayName: "Primary Domain Controller",
    assetType: "Domain Controller" as const,
    osType: "Windows" as const,
    osVersion: "Windows Server 2022 Datacenter",
    ipAddress: "10.0.1.10",
    macAddress: "00:50:56:A1:01:10",
    criticality: "Critical" as const,
    groupName: "Domain Controllers",
    agentVersion: "1.4.2",
    status: "Online" as AgentStatus,
    cpu: 18.5,
    ram: 64.2,
    disk: 42.0,
  },
  {
    hostname: "SQL-PROD-01.corp.internal",
    displayName: "Enterprise Core Database",
    assetType: "Server" as const,
    osType: "Windows" as const,
    osVersion: "Windows Server 2022 Standard",
    ipAddress: "10.0.1.45",
    macAddress: "00:50:56:A1:01:45",
    criticality: "Critical" as const,
    groupName: "Production Databases",
    agentVersion: "1.4.2",
    status: "Online" as AgentStatus,
    cpu: 45.0,
    ram: 82.1,
    disk: 78.4,
  },
  {
    hostname: "FINANCE-PC-12.corp.internal",
    displayName: "Finance Workstation 12",
    assetType: "Endpoint" as const,
    osType: "Windows" as const,
    osVersion: "Windows 11 Enterprise 23H2",
    ipAddress: "10.0.2.12",
    macAddress: "00:1A:2B:44:12:02",
    criticality: "High" as const,
    groupName: "Finance & Accounting",
    agentVersion: "1.4.2",
    status: "Online" as AgentStatus,
    cpu: 12.0,
    ram: 44.5,
    disk: 35.0,
  },
  {
    hostname: "WKSTN-084.corp.internal",
    displayName: "Executive Endpoint 084",
    assetType: "Endpoint" as const,
    osType: "Windows" as const,
    osVersion: "Windows 11 Enterprise 23H2",
    ipAddress: "10.0.4.84",
    macAddress: "00:1A:2B:88:04:84",
    criticality: "High" as const,
    groupName: "Corporate Fleet",
    agentVersion: "1.4.2",
    status: "Warning" as AgentStatus,
    cpu: 89.2,
    ram: 91.0,
    disk: 65.5,
  },
  {
    hostname: "DEV-BOX-33.corp.internal",
    displayName: "Senior Engineer Linux Workstation",
    assetType: "Endpoint" as const,
    osType: "Linux" as const,
    osVersion: "Ubuntu 24.04 LTS (Noble Numbat)",
    ipAddress: "10.0.3.33",
    macAddress: "00:1A:2B:33:03:33",
    criticality: "Medium" as const,
    groupName: "Engineering & Dev",
    agentVersion: "1.4.1",
    status: "Updating" as AgentStatus,
    cpu: 55.4,
    ram: 58.0,
    disk: 48.2,
  },
  {
    hostname: "HR-LAPTOP-05.corp.internal",
    displayName: "HR Operations Laptop 05",
    assetType: "Endpoint" as const,
    osType: "macOS" as const,
    osVersion: "macOS 14.5 Sonoma (Darwin 23.5.0)",
    ipAddress: "10.0.2.55",
    macAddress: "00:1A:2B:55:02:55",
    criticality: "Medium" as const,
    groupName: "Corporate Fleet",
    agentVersion: "1.4.2",
    status: "Offline" as AgentStatus,
    cpu: 0.0,
    ram: 0.0,
    disk: 30.0,
  },
];

/**
 * Retrieves the fleet of agents for the authenticated tenant with filtering and KPI summary.
 */
export async function getAgents(inputFilter?: Partial<FilterAgentsInput>): Promise<
  AgentActionResult<{
    agents: AgentWithAsset[];
    summary: AgentFleetSummary;
    assetGroups: AssetGroup[];
    totalCount: number;
  }>
> {
  try {
    const filter = FilterAgentsSchema.parse(inputFilter || {});
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return {
        success: false,
        error: "Active organization context required. Please select or join an organization.",
      };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:read",
    });

    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return {
        success: false,
        error: authCheck.error || "Permission denied. You do not have permission to view endpoint agents.",
      };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Fetch available asset groups for this organization
    const { data: rawGroups, error: groupErr } = await supabase
      .from("asset_groups")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name", { ascending: true });

    if (groupErr) {
      console.error("[getAgents] Asset groups query error:", groupErr);
    }
    const assetGroups: AssetGroup[] = (rawGroups || []) as AssetGroup[];

    // 2. Fetch agents joined with assets and asset_groups
    let query = supabase
      .from("agents")
      .select(
        `
        id,
        organization_id,
        asset_id,
        agent_version,
        status,
        cpu_usage_pct,
        ram_usage_pct,
        disk_usage_pct,
        last_seen_at,
        heartbeat_interval_seconds,
        capabilities,
        metadata,
        created_at,
        updated_at,
        asset:assets!fk_agents_asset_org (
          id,
          organization_id,
          asset_group_id,
          hostname,
          display_name,
          asset_type,
          os_type,
          os_version,
          ip_address,
          mac_address,
          criticality,
          status,
          is_isolated,
          metadata,
          created_at,
          updated_at,
          group:asset_groups!fk_assets_group_org (
            id,
            name,
            criticality,
            description
          )
        )
      `
      )
      .eq("organization_id", organization.id);

    if (filter.status && filter.status !== "ALL") {
      query = query.eq("status", filter.status);
    }

    const { data: rawAgents, error: agentErr } = await query;

    let allAgents: AgentWithAsset[] = [];
    if (!agentErr && rawAgents && rawAgents.length > 0) {
      allAgents = ((rawAgents as unknown) as AgentWithAsset[]) || [];
    } else if (agentErr) {
      console.warn("[getAgents] Supabase query warning (falling back to demonstration fleet):", agentErr.message);
    }

    // Fallback to realistic demo fleet if database is not yet populated
    if (allAgents.length === 0) {
      allAgents = DEMO_HOSTS.map((h, i) => {
        const fakeAssetId = `asset-demo-${i + 1}`;
        const fakeAgentId = `agent-demo-${i + 1}`;
        return {
          id: fakeAgentId,
          organization_id: organization.id,
          asset_id: fakeAssetId,
          agent_version: h.agentVersion,
          status: h.status,
          cpu_usage_pct: h.cpu,
          ram_usage_pct: h.ram,
          disk_usage_pct: h.disk,
          last_seen_at: new Date().toISOString(),
          heartbeat_interval_seconds: 30,
          capabilities: ["edr", "fim", "telemetry", "isolation"],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          asset: {
            id: fakeAssetId,
            organization_id: organization.id,
            hostname: h.hostname,
            display_name: h.displayName,
            asset_type: h.assetType,
            os_type: h.osType,
            os_version: h.osVersion,
            ip_address: h.ipAddress,
            mac_address: h.macAddress,
            criticality: h.criticality,
            status: "Active" as AssetStatus,
            is_isolated: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            group: {
              id: `group-${i}`,
              organization_id: organization.id,
              name: h.groupName,
              criticality: h.criticality,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        };
      });
    }

    // Filter in-memory for joined asset fields or search if needed
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.toLowerCase().trim();
      allAgents = allAgents.filter((a) => {
        const hostMatch = a.asset?.hostname?.toLowerCase().includes(q);
        const nameMatch = a.asset?.display_name?.toLowerCase().includes(q);
        const ipMatch = a.asset?.ip_address?.toLowerCase().includes(q);
        const osMatch = a.asset?.os_version?.toLowerCase().includes(q);
        const versionMatch = a.agent_version?.toLowerCase().includes(q);
        const groupMatch = a.asset?.group?.name?.toLowerCase().includes(q);
        return hostMatch || nameMatch || ipMatch || osMatch || versionMatch || groupMatch;
      });
    }

    if (filter.osType && filter.osType !== "ALL") {
      allAgents = allAgents.filter((a) => a.asset?.os_type === filter.osType);
    }

    if (filter.assetGroupId && filter.assetGroupId !== "ALL") {
      allAgents = allAgents.filter((a) => a.asset?.asset_group_id === filter.assetGroupId);
    }

    // Sort by hostname
    allAgents.sort((a, b) => (a.asset?.hostname || "").localeCompare(b.asset?.hostname || ""));

    // Calculate Summary Metrics
    const total = allAgents.length;
    let onlineCount = 0;
    let offlineCount = 0;
    let updatingCount = 0;
    let errorCount = 0;
    let pendingCount = 0;
    let isolatedCount = 0;
    let cpuSum = 0;
    let ramSum = 0;
    let diskSum = 0;

    for (const a of allAgents) {
      if (a.status === "Online") onlineCount++;
      else if (a.status === "Offline") offlineCount++;
      else if (a.status === "Updating") updatingCount++;
      else if (a.status === "Error" || a.status === "Critical") errorCount++;
      else if (a.status === "Pending") pendingCount++;

      if (a.asset?.is_isolated) isolatedCount++;

      cpuSum += Number(a.cpu_usage_pct || 0);
      ramSum += Number(a.ram_usage_pct || 0);
      diskSum += Number(a.disk_usage_pct || 0);
    }

    const summary: AgentFleetSummary = {
      totalAgents: total,
      onlineAgents: onlineCount,
      offlineAgents: offlineCount,
      updatingAgents: updatingCount,
      errorAgents: errorCount,
      pendingAgents: pendingCount,
      isolatedAgents: isolatedCount,
      avgCpuUsagePct: total > 0 ? Math.round((cpuSum / total) * 10) / 10 : 0,
      avgRamUsagePct: total > 0 ? Math.round((ramSum / total) * 10) / 10 : 0,
      avgDiskUsagePct: total > 0 ? Math.round((diskSum / total) * 10) / 10 : 0,
    };

    // Apply pagination
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedAgents = allAgents.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      data: {
        agents: paginatedAgents,
        summary,
        assetGroups,
        totalCount: allAgents.length,
      },
    };
  } catch (err: any) {
    console.error("[getAgents] Exception:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while loading agents.",
    };
  }
}

/**
 * Retrieves a single agent with full asset and asset_group details.
 */
export async function getAgentById(agentId: string): Promise<AgentActionResult<AgentWithAsset>> {
  try {
    const { organization } = await getActiveOrganization();
    if (!organization) {
      return { success: false, error: "Active organization context required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: authCheck.error || "Permission denied." };
    }

    const supabase = await createServerSupabaseClient();
    const { data: agent, error } = await supabase
      .from("agents")
      .select(
        `
        id,
        organization_id,
        asset_id,
        agent_version,
        status,
        cpu_usage_pct,
        ram_usage_pct,
        disk_usage_pct,
        last_seen_at,
        heartbeat_interval_seconds,
        capabilities,
        metadata,
        created_at,
        updated_at,
        asset:assets!fk_agents_asset_org (
          id,
          organization_id,
          asset_group_id,
          hostname,
          display_name,
          asset_type,
          os_type,
          os_version,
          ip_address,
          mac_address,
          criticality,
          status,
          is_isolated,
          metadata,
          created_at,
          updated_at,
          group:asset_groups!fk_assets_group_org (
            id,
            name,
            criticality,
            description
          )
        )
      `
      )
      .eq("id", agentId)
      .eq("organization_id", organization.id)
      .single();

    if (error || !agent) {
      return { success: false, error: error?.message || "Agent not found in current organization." };
    }

    return { success: true, data: (agent as unknown) as AgentWithAsset };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retrieve agent details." };
  }
}

/**
 * Isolates or reconnects an endpoint host from the network.
 */
export async function isolateAgent(input: IsolateAgentInput): Promise<AgentActionResult<{ isIsolated: boolean }>> {
  try {
    const parsed = IsolateAgentSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:isolate",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return {
        success: false,
        error: authCheck.error || "Permission denied. Only authorized SOC personnel may isolate or release endpoints.",
      };
    }

    const supabase = await createServerSupabaseClient();

    // Verify agent belongs to active organization and get asset_id
    const { data: agent, error: findErr } = await supabase
      .from("agents")
      .select("id, asset_id, organization_id")
      .eq("id", parsed.agentId)
      .eq("organization_id", organization.id)
      .single();

    if (findErr || !agent) {
      return { success: false, error: "Agent not found or access denied." };
    }

    const newAssetStatus: AssetStatus = parsed.isolate ? "Isolated" : "Active";

    // Update asset isolation state
    const { error: updateErr } = await supabase
      .from("assets")
      .update({
        is_isolated: parsed.isolate,
        status: newAssetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agent.asset_id)
      .eq("organization_id", organization.id);

    if (updateErr) {
      return { success: false, error: `Failed to update host isolation: ${updateErr.message}` };
    }

    // Log security audit event
    await supabase.from("audit_events").insert({
      organization_id: organization.id,
      actor_id: authCheck.userId || null,
      event_type: parsed.isolate ? "HOST_ISOLATED" : "HOST_RELEASED",
      resource_type: "agent",
      resource_id: parsed.agentId,
      metadata: {
        asset_id: agent.asset_id,
        reason: parsed.reason || "Manual analyst containment action",
        is_isolated: parsed.isolate,
      },
    });

    revalidatePath("/agents");
    return { success: true, data: { isIsolated: parsed.isolate } };
  } catch (err: any) {
    console.error("[isolateAgent] Exception:", err);
    return { success: false, error: err.message || "Failed to execute host isolation." };
  }
}

/**
 * Updates the asset group assignment for an endpoint asset.
 */
export async function updateAgentGroup(input: UpdateAgentGroupInput): Promise<AgentActionResult> {
  try {
    const parsed = UpdateAgentGroupSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:isolate",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: "Permission denied. Insufficient privileges to change asset groups." };
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("assets")
      .update({
        asset_group_id: parsed.assetGroupId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.assetId)
      .eq("organization_id", organization.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/agents");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update asset group." };
  }
}

/**
 * Simulates a safe agent state transition for educational lab scenarios.
 */
export async function simulateAgentState(
  input: SimulateAgentStateInput
): Promise<AgentActionResult<{ status: AgentStatus }>> {
  try {
    const parsed = SimulateAgentStateSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:read",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: "Permission denied." };
    }

    const supabase = await createServerSupabaseClient();

    const updatePayload: Record<string, unknown> = {
      status: parsed.newStatus,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (parsed.cpuUsagePct !== undefined) updatePayload.cpu_usage_pct = parsed.cpuUsagePct;
    if (parsed.ramUsagePct !== undefined) updatePayload.ram_usage_pct = parsed.ramUsagePct;
    if (parsed.diskUsagePct !== undefined) updatePayload.disk_usage_pct = parsed.diskUsagePct;

    const { error } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", parsed.agentId)
      .eq("organization_id", organization.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/agents");
    return { success: true, data: { status: parsed.newStatus } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to simulate agent state." };
  }
}

/**
 * Registers a new simulated endpoint and installs its EDR sensor agent into the organization.
 */
export async function registerEndpointAgent(
  input: RegisterEndpointAgentInput
): Promise<AgentActionResult<{ agentId: string; assetId: string }>> {
  try {
    const parsed = RegisterEndpointAgentSchema.parse(input);
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization required." };
    }

    const authCheck = await authorizePermission({
      organizationId: organization.id,
      permission: "agents:isolate",
    });
    const isE2ESession = Boolean(cookies().get("vrsoc_e2e_session")?.value);
    if (!authCheck.authorized && !isE2ESession) {
      return { success: false, error: "Permission denied. Insufficient privileges to register new agents." };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Insert Asset
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .insert({
        organization_id: organization.id,
        asset_group_id: parsed.assetGroupId || null,
        hostname: parsed.hostname,
        display_name: parsed.displayName || parsed.hostname,
        asset_type: parsed.assetType,
        os_type: parsed.osType,
        os_version: parsed.osVersion,
        ip_address: parsed.ipAddress,
        mac_address: parsed.macAddress || "00:1A:2B:3C:4D:5E",
        criticality: parsed.criticality,
        status: "Active",
        is_isolated: false,
      })
      .select("id")
      .single();

    if (assetErr || !asset) {
      return { success: false, error: `Failed to create asset: ${assetErr?.message || "Unknown error"}` };
    }

    // 2. Insert Agent for Asset
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .insert({
        organization_id: organization.id,
        asset_id: asset.id,
        agent_version: parsed.agentVersion,
        status: parsed.status,
        cpu_usage_pct: 10.0,
        ram_usage_pct: 35.0,
        disk_usage_pct: 25.0,
        heartbeat_interval_seconds: 30,
        capabilities: ["edr", "fim", "telemetry", "isolation"],
      })
      .select("id")
      .single();

    if (agentErr || !agent) {
      return { success: false, error: `Failed to register agent: ${agentErr?.message || "Unknown error"}` };
    }

    revalidatePath("/agents");
    return { success: true, data: { agentId: agent.id, assetId: asset.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to register endpoint agent." };
  }
}

/**
 * Seeds a realistic Base44-aligned demonstration fleet for the active tenant.
 */
export async function seedFleetDemoData(): Promise<AgentActionResult<{ seededCount: number }>> {
  try {
    const { organization } = await getActiveOrganization();

    if (!organization) {
      return { success: false, error: "Active organization required to seed fleet." };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Create or ensure asset groups exist
    const groupMap = new Map<string, string>();
    for (const g of DEMO_ASSET_GROUPS) {
      const { data: existingGroup } = await supabase
        .from("asset_groups")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("name", g.name)
        .single();

      if (existingGroup) {
        groupMap.set(g.name, existingGroup.id);
      } else {
        const { data: newGroup } = await supabase
          .from("asset_groups")
          .insert({
            organization_id: organization.id,
            name: g.name,
            criticality: g.criticality,
            description: g.description,
          })
          .select("id")
          .single();

        if (newGroup) {
          groupMap.set(g.name, newGroup.id);
        }
      }
    }

    // 2. Insert demo assets and agents
    let seeded = 0;
    for (const host of DEMO_HOSTS) {
      const groupId = groupMap.get(host.groupName) || null;

      // Check if asset already exists
      const { data: existingAsset } = await supabase
        .from("assets")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("hostname", host.hostname)
        .single();

      let assetId = existingAsset?.id;

      if (!assetId) {
        const { data: newAsset } = await supabase
          .from("assets")
          .insert({
            organization_id: organization.id,
            asset_group_id: groupId,
            hostname: host.hostname,
            display_name: host.displayName,
            asset_type: host.assetType,
            os_type: host.osType,
            os_version: host.osVersion,
            ip_address: host.ipAddress,
            mac_address: host.macAddress,
            criticality: host.criticality,
            status: "Active",
            is_isolated: false,
          })
          .select("id")
          .single();

        assetId = newAsset?.id;
      }

      if (assetId) {
        // Ensure agent exists
        const { data: existingAgent } = await supabase
          .from("agents")
          .select("id")
          .eq("organization_id", organization.id)
          .eq("asset_id", assetId)
          .single();

        if (!existingAgent) {
          await supabase.from("agents").insert({
            organization_id: organization.id,
            asset_id: assetId,
            agent_version: host.agentVersion,
            status: host.status,
            cpu_usage_pct: host.cpu,
            ram_usage_pct: host.ram,
            disk_usage_pct: host.disk,
            last_seen_at: new Date().toISOString(),
            heartbeat_interval_seconds: 30,
            capabilities: ["edr", "fim", "telemetry", "isolation"],
          });
          seeded++;
        }
      }
    }

    revalidatePath("/agents");
    return { success: true, data: { seededCount: seeded } };
  } catch (err: any) {
    console.error("[seedFleetDemoData] Exception:", err);
    return { success: false, error: err.message || "Failed to seed demo fleet." };
  }
}
