-- ==============================================================================
-- VRSOC — Phase 17: EDR Telemetry & Endpoint Investigation Migration
-- ==============================================================================
-- Description: Establishes normalized, tenant-isolated relational entities for
-- EDR endpoint telemetry: Registry Events, Endpoint Services, Scheduled Tasks,
-- Startup Items, and USB Device Events.
-- ==============================================================================

-- 1. REGISTRY EVENTS TABLE (Windows Registry Modifications & Auditing)
CREATE TABLE IF NOT EXISTS public.registry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  hive VARCHAR(64) NOT NULL DEFAULT 'HKLM' CHECK (hive IN ('HKLM', 'HKCU', 'HKCR', 'HKU', 'HKCC', 'HKPD')),
  key_path TEXT NOT NULL,
  value_name VARCHAR(255),
  value_data TEXT,
  value_type VARCHAR(64) DEFAULT 'REG_SZ',
  action VARCHAR(32) NOT NULL DEFAULT 'Modified' CHECK (action IN ('Created', 'Modified', 'Deleted', 'Queried', 'Renamed', 'SetSecurity')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_registry_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_registry_events_org_asset ON public.registry_events(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_registry_events_hive_key ON public.registry_events(organization_id, hive, key_path);
CREATE INDEX IF NOT EXISTS idx_registry_events_process_id ON public.registry_events(process_id);
CREATE INDEX IF NOT EXISTS idx_registry_events_event_id ON public.registry_events(event_id);

-- 2. ENDPOINT SERVICES TABLE (Windows/Linux Service Changes & Lifecycle)
CREATE TABLE IF NOT EXISTS public.endpoint_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  service_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  executable_path TEXT,
  start_type VARCHAR(64) DEFAULT 'Auto' CHECK (start_type IN ('Auto', 'Manual', 'Disabled', 'Boot', 'System', 'Delayed')),
  status VARCHAR(32) DEFAULT 'Running' CHECK (status IN ('Running', 'Stopped', 'Paused', 'StartPending', 'StopPending', 'Installed', 'Deleted')),
  action VARCHAR(32) NOT NULL DEFAULT 'Modified' CHECK (action IN ('Installed', 'Started', 'Stopped', 'Modified', 'Deleted', 'Configured')),
  account_name VARCHAR(128) DEFAULT 'LocalSystem',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_endpoint_services_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_endpoint_services_org_asset ON public.endpoint_services(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_endpoint_services_name ON public.endpoint_services(organization_id, service_name);

-- 3. SCHEDULED TASK EVENTS TABLE (Persistence & Cron/Task Scheduling)
CREATE TABLE IF NOT EXISTS public.scheduled_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  task_name VARCHAR(255) NOT NULL,
  task_path TEXT DEFAULT '\',
  action VARCHAR(32) NOT NULL DEFAULT 'Created' CHECK (action IN ('Created', 'Modified', 'Deleted', 'Triggered', 'Enabled', 'Disabled', 'Executed')),
  command TEXT,
  arguments TEXT,
  run_as_user VARCHAR(128) DEFAULT 'SYSTEM',
  trigger_type VARCHAR(64) DEFAULT 'Daily' CHECK (trigger_type IN ('AtLogon', 'AtStartup', 'Daily', 'Weekly', 'Interval', 'OnIdle', 'OnEvent', 'Custom')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_scheduled_tasks_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_org_asset ON public.scheduled_task_events(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_name ON public.scheduled_task_events(organization_id, task_name);

-- 4. STARTUP ITEMS TABLE (Autoruns, Run Keys & Boot Persistence)
CREATE TABLE IF NOT EXISTS public.startup_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  location_type VARCHAR(64) NOT NULL CHECK (location_type IN ('RegistryRun', 'StartupFolder', 'TaskScheduler', 'Service', 'Winlogon', 'BootExecute')),
  location_path TEXT NOT NULL,
  command TEXT NOT NULL,
  user_context VARCHAR(128) DEFAULT 'SYSTEM',
  action VARCHAR(32) NOT NULL DEFAULT 'Added' CHECK (action IN ('Added', 'Modified', 'Removed', 'Enabled', 'Disabled')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_startup_items_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_startup_items_org_asset ON public.startup_items(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_items_name ON public.startup_items(organization_id, name);

-- 5. USB EVENTS TABLE (Removable Storage Insertion & Exfiltration Tracking)
CREATE TABLE IF NOT EXISTS public.usb_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  vendor_id VARCHAR(32),
  product_id VARCHAR(32),
  device_name VARCHAR(255) NOT NULL,
  device_class VARCHAR(64) DEFAULT 'Mass Storage',
  serial_number VARCHAR(128),
  drive_letter VARCHAR(8),
  action VARCHAR(32) NOT NULL DEFAULT 'Connected' CHECK (action IN ('Connected', 'Disconnected', 'Mounted', 'Unmounted', 'FileRead', 'FileWritten', 'Blocked')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_usb_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_usb_events_org_asset ON public.usb_events(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usb_events_device ON public.usb_events(organization_id, device_name);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Registry Events RLS
ALTER TABLE public.registry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registry_events_select" ON public.registry_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = registry_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "registry_events_insert" ON public.registry_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = registry_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Instructor')
    )
  );

-- 2. Endpoint Services RLS
ALTER TABLE public.endpoint_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "endpoint_services_select" ON public.endpoint_services
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = endpoint_services.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "endpoint_services_insert" ON public.endpoint_services
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = endpoint_services.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Instructor')
    )
  );

-- 3. Scheduled Tasks RLS
ALTER TABLE public.scheduled_task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_task_events_select" ON public.scheduled_task_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = scheduled_task_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "scheduled_task_events_insert" ON public.scheduled_task_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = scheduled_task_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Instructor')
    )
  );

-- 4. Startup Items RLS
ALTER TABLE public.startup_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "startup_items_select" ON public.startup_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = startup_items.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "startup_items_insert" ON public.startup_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = startup_items.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Instructor')
    )
  );

-- 5. USB Events RLS
ALTER TABLE public.usb_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usb_events_select" ON public.usb_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = usb_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "usb_events_insert" ON public.usb_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = usb_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Instructor')
    )
  );
