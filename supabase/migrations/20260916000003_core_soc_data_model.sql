-- ==============================================================================
-- VRSOC — Phase 10: Core SOC Data Model Migration
-- ==============================================================================
-- Description: Establishes foundational normalized, tenant-isolated relational entities
-- for Asset Management, Agent Fleet, Security Identities, Telemetry Events,
-- Logs, Processes, Files, and Network Connections.
-- ==============================================================================

-- 1. ASSET GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.asset_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  criticality VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_asset_groups_org_name UNIQUE (organization_id, name),
  CONSTRAINT uq_asset_groups_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_groups_org_id ON public.asset_groups(organization_id);

-- 2. ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_group_id UUID,
  hostname VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  asset_type VARCHAR(64) NOT NULL DEFAULT 'Endpoint' CHECK (asset_type IN ('Endpoint', 'Server', 'Domain Controller', 'Firewall', 'Cloud VM', 'Container')),
  os_type VARCHAR(64) NOT NULL DEFAULT 'Linux' CHECK (os_type IN ('Windows', 'Linux', 'macOS', 'NetworkOS', 'Cloud')),
  os_version VARCHAR(128),
  ip_address VARCHAR(45),
  mac_address VARCHAR(48),
  criticality VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Warning', 'Critical', 'Isolated', 'Decommissioned', 'Offline')),
  is_isolated BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_assets_org_hostname UNIQUE (organization_id, hostname),
  CONSTRAINT uq_assets_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_assets_group_org FOREIGN KEY (asset_group_id, organization_id) 
    REFERENCES public.asset_groups(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_org_id ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_status ON public.assets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_org_hostname ON public.assets(organization_id, hostname);
CREATE INDEX IF NOT EXISTS idx_assets_group_id ON public.assets(asset_group_id);

-- 3. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  agent_version VARCHAR(32) NOT NULL DEFAULT '1.4.2',
  status VARCHAR(32) NOT NULL DEFAULT 'Online' CHECK (status IN ('Online', 'Warning', 'Critical', 'Offline', 'Updating', 'Pending', 'Error')),
  cpu_usage_pct NUMERIC(5,2) DEFAULT 0.00,
  ram_usage_pct NUMERIC(5,2) DEFAULT 0.00,
  disk_usage_pct NUMERIC(5,2) DEFAULT 0.00,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  heartbeat_interval_seconds INTEGER NOT NULL DEFAULT 30,
  capabilities JSONB NOT NULL DEFAULT '["edr", "fim", "telemetry", "isolation"]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_agents_asset UNIQUE (asset_id),
  CONSTRAINT uq_agents_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_agents_asset_org FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agents_org_id ON public.agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_org_status ON public.agents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON public.agents(organization_id, last_seen_at DESC);

-- 4. SECURITY IDENTITIES TABLE (Simulated / Monitored User Accounts)
CREATE TABLE IF NOT EXISTS public.soc_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(128) NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255),
  domain VARCHAR(128) NOT NULL DEFAULT 'CORP.INTERNAL',
  department VARCHAR(128),
  account_type VARCHAR(32) NOT NULL DEFAULT 'User' CHECK (account_type IN ('User', 'Admin', 'Service', 'System')),
  is_privileged BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_soc_identities_org_domain_user UNIQUE (organization_id, domain, username),
  CONSTRAINT uq_soc_identities_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_soc_identities_org_id ON public.soc_identities(organization_id);
CREATE INDEX IF NOT EXISTS idx_soc_identities_username ON public.soc_identities(organization_id, username);

-- 5. TELEMETRY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  source VARCHAR(64) NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'Informational' CHECK (severity IN ('Informational', 'Low', 'Medium', 'High', 'Critical')),
  asset_id UUID,
  agent_id UUID,
  identity_id UUID,
  raw_payload JSONB,
  normalized_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_events_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_events_asset_org FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_events_agent_org FOREIGN KEY (agent_id, organization_id)
    REFERENCES public.agents(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_events_identity_org FOREIGN KEY (identity_id, organization_id)
    REFERENCES public.soc_identities(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_org_occurred ON public.events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_source ON public.events(organization_id, source, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_category ON public.events(organization_id, category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_type ON public.events(organization_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_asset_id ON public.events(asset_id);
CREATE INDEX IF NOT EXISTS idx_events_identity_id ON public.events(identity_id);
CREATE INDEX IF NOT EXISTS idx_events_normalized_gin ON public.events USING GIN (normalized_fields);

-- 6. LOGS TABLE (Raw / Normalized Ingestion)
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  facility VARCHAR(64) DEFAULT 'user',
  log_level VARCHAR(32) NOT NULL DEFAULT 'INFO' CHECK (log_level IN ('DEBUG', 'INFO', 'NOTICE', 'WARN', 'ERROR', 'CRIT', 'ALERT', 'EMERG')),
  source_host VARCHAR(255),
  service_name VARCHAR(128),
  message TEXT NOT NULL,
  raw_log TEXT,
  parse_status VARCHAR(32) NOT NULL DEFAULT 'Parsed' CHECK (parse_status IN ('Raw', 'Parsed', 'Failed', 'Dropped')),
  parser_name VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_logs_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_logs_event_org FOREIGN KEY (event_id, organization_id)
    REFERENCES public.events(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_org_logged ON public.logs(organization_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_org_level ON public.logs(organization_id, log_level, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_service ON public.logs(organization_id, service_name);
CREATE INDEX IF NOT EXISTS idx_logs_event_id ON public.logs(event_id);

-- 7. PROCESSES TABLE (Endpoint EDR Process Tree)
CREATE TABLE IF NOT EXISTS public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  agent_id UUID,
  pid INTEGER NOT NULL,
  ppid INTEGER,
  process_guid VARCHAR(64),
  parent_process_guid VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  executable_path TEXT NOT NULL,
  command_line TEXT,
  identity_id UUID,
  username VARCHAR(128),
  sha256 VARCHAR(64),
  md5 VARCHAR(32),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ,
  integrity_level VARCHAR(32) DEFAULT 'Medium' CHECK (integrity_level IN ('Low', 'Medium', 'High', 'System')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_processes_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_processes_asset_org FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT fk_processes_agent_org FOREIGN KEY (agent_id, organization_id)
    REFERENCES public.agents(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_processes_identity_org FOREIGN KEY (identity_id, organization_id)
    REFERENCES public.soc_identities(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_processes_org_asset ON public.processes(organization_id, asset_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_processes_name ON public.processes(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_processes_sha256 ON public.processes(organization_id, sha256);
CREATE INDEX IF NOT EXISTS idx_processes_guid ON public.processes(organization_id, process_guid);

-- 8. FILES TABLE (Monitored Endpoint Files & FIM)
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  path TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  extension VARCHAR(32),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  sha256 VARCHAR(64),
  md5 VARCHAR(32),
  is_signed BOOLEAN NOT NULL DEFAULT FALSE,
  signer_name VARCHAR(255),
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_executable BOOLEAN NOT NULL DEFAULT FALSE,
  permissions VARCHAR(32),
  owner VARCHAR(128),
  file_created_at TIMESTAMPTZ,
  file_modified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_files_id_org UNIQUE (id, organization_id),
  CONSTRAINT uq_files_asset_path UNIQUE (asset_id, path),
  CONSTRAINT fk_files_asset_org FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_org_asset ON public.files(organization_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_files_sha256 ON public.files(organization_id, sha256);
CREATE INDEX IF NOT EXISTS idx_files_name ON public.files(organization_id, name);

-- 9. NETWORK CONNECTIONS TABLE (NetFlow / Sessions)
CREATE TABLE IF NOT EXISTS public.network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID,
  process_id UUID,
  src_ip VARCHAR(45) NOT NULL,
  dst_ip VARCHAR(45) NOT NULL,
  src_port INTEGER NOT NULL,
  dst_port INTEGER NOT NULL,
  protocol VARCHAR(16) NOT NULL DEFAULT 'TCP' CHECK (protocol IN ('TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'TLS')),
  direction VARCHAR(16) NOT NULL DEFAULT 'Outbound' CHECK (direction IN ('Inbound', 'Outbound', 'Internal', 'Lateral')),
  status VARCHAR(32) NOT NULL DEFAULT 'Established' CHECK (status IN ('Established', 'Closed', 'Blocked', 'Listening', 'SYN_SENT', 'Time_Wait')),
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_network_connections_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_netconn_asset_org FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_netconn_process_org FOREIGN KEY (process_id, organization_id)
    REFERENCES public.processes(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_net_conn_org_started ON public.network_connections(organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_net_conn_src_dst ON public.network_connections(organization_id, src_ip, dst_ip);
CREATE INDEX IF NOT EXISTS idx_net_conn_dst_port ON public.network_connections(organization_id, dst_port);
CREATE INDEX IF NOT EXISTS idx_net_conn_asset_id ON public.network_connections(asset_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Asset Groups RLS
ALTER TABLE public.asset_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_groups_select" ON public.asset_groups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = asset_groups.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "asset_groups_insert" ON public.asset_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = asset_groups.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  );

CREATE POLICY "asset_groups_update" ON public.asset_groups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = asset_groups.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = asset_groups.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  );

CREATE POLICY "asset_groups_delete" ON public.asset_groups
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = asset_groups.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role = 'Super Admin'
    )
  );

-- 2. Assets RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select" ON public.assets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = assets.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "assets_insert" ON public.assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = assets.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  );

CREATE POLICY "assets_update" ON public.assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = assets.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = assets.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  );

CREATE POLICY "assets_delete" ON public.assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = assets.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role = 'Super Admin'
    )
  );

-- 3. Agents RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select" ON public.agents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = agents.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "agents_insert" ON public.agents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = agents.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  );

CREATE POLICY "agents_update" ON public.agents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = agents.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = agents.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Instructor')
    )
  );

CREATE POLICY "agents_delete" ON public.agents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = agents.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role = 'Super Admin'
    )
  );

-- 4. Security Identities RLS
ALTER TABLE public.soc_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soc_identities_select" ON public.soc_identities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = soc_identities.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "soc_identities_insert" ON public.soc_identities
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = soc_identities.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  );

CREATE POLICY "soc_identities_update" ON public.soc_identities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = soc_identities.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = soc_identities.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Instructor')
    )
  );

CREATE POLICY "soc_identities_delete" ON public.soc_identities
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = soc_identities.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role = 'Super Admin'
    )
  );

-- 5. Telemetry Events RLS (Append-Only & Read)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 6. Logs RLS (Append-Only & Read)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_select" ON public.logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = logs.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "logs_insert" ON public.logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = logs.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 7. Processes RLS
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processes_select" ON public.processes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = processes.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "processes_insert" ON public.processes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = processes.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 8. Files RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select" ON public.files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = files.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "files_insert" ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = files.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 9. Network Connections RLS
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "network_connections_select" ON public.network_connections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = network_connections.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "network_connections_insert" ON public.network_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = network_connections.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );
