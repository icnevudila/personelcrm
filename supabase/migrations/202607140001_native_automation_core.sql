-- Native Automation OS: multi-tenant core. Apply with Supabase CLI before enabling /dashboard/automations.
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  name text not null, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','builder','operator','analyst','viewer')) default 'viewer',
  created_at timestamptz not null default now(), primary key (workspace_id, user_id)
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text not null default '', status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  draft_definition jsonb not null default '{"nodes":[],"edges":[],"variables":{},"settings":{}}'::jsonb,
  active_version_id uuid, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_number integer not null, definition jsonb not null, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), published_at timestamptz, unique(workflow_id, version_number)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'workflows_active_version_fk') then
    alter table public.workflows add constraint workflows_active_version_fk foreign key (active_version_id) references public.workflow_versions(id) on delete set null;
  end if;
end $$;
create table if not exists public.workflow_nodes (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_id uuid references public.workflow_versions(id) on delete cascade, node_key text not null, node_type text not null, name text not null,
  position jsonb not null default '{"x":0,"y":0}'::jsonb, config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workflow_id, version_id, node_key)
);
create table if not exists public.workflow_edges (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_id uuid references public.workflow_versions(id) on delete cascade, edge_key text not null, source_node_key text not null, source_handle text, target_node_key text not null, target_handle text, condition jsonb, created_at timestamptz not null default now(), unique(workflow_id, version_id, edge_key)
);
create table if not exists public.workflow_variables (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_id uuid references public.workflows(id) on delete cascade, key text not null, value jsonb not null default 'null'::jsonb, is_secret boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workflow_id,key)
);

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade, workflow_version_id uuid references public.workflow_versions(id) on delete set null,
  trigger_type text not null default 'manual', status text not null default 'queued' check (status in ('queued','running','waiting','succeeded','partially_succeeded','failed','cancelled','timed_out')),
  input_preview jsonb, output_preview jsonb, error jsonb, correlation_id uuid not null default gen_random_uuid(), started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz, finished_at timestamptz, duration_ms integer, retry_count integer not null default 0, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.node_executions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  execution_id uuid not null references public.workflow_executions(id) on delete cascade, node_key text not null, node_type text not null, node_name text not null,
  status text not null check (status in ('pending','queued','running','waiting','succeeded','skipped','failed','cancelled','timed_out')),
  input_preview jsonb, output_preview jsonb, error jsonb, started_at timestamptz, finished_at timestamptz, duration_ms integer, retry_count integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.execution_logs (
  id bigint generated always as identity primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade,
  execution_id uuid not null references public.workflow_executions(id) on delete cascade, node_execution_id uuid references public.node_executions(id) on delete cascade,
  level text not null check (level in ('debug','info','warn','error')), message text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.execution_artifacts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  storage_path text not null, content_type text, byte_size bigint, sha256 text, created_at timestamptz not null default now()
);
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, execution_id uuid references public.workflow_executions(id) on delete cascade,
  type text not null, status text not null default 'queued' check (status in ('queued','running','waiting','succeeded','failed','cancelled','dead_letter')),
  priority integer not null default 0, payload jsonb not null default '{}'::jsonb, run_at timestamptz not null default now(), locked_at timestamptz, locked_by text, heartbeat_at timestamptz,
  attempts integer not null default 0, max_attempts integer not null default 3, idempotency_key text, last_error jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id, idempotency_key)
);
create table if not exists public.job_attempts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade, attempt_number integer not null, status text not null, error jsonb, started_at timestamptz not null default now(), finished_at timestamptz, unique(job_id,attempt_number)
);
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid not null references public.workflows(id) on delete cascade,
  path text not null, secret_hash text not null, methods text[] not null default array['POST'], response_mode text not null default 'immediate', active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,path)
);
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid not null references public.workflows(id) on delete cascade,
  cron_expression text not null, timezone text not null default 'Europe/Istanbul', active boolean not null default true, next_run_at timestamptz, last_run_at timestamptz, missed_policy text not null default 'skip', created_at timestamptz not null default now()
);
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, type text not null,
  encrypted_payload bytea not null, key_version smallint not null default 1, status text not null default 'not_tested', last_tested_at timestamptz, expires_at timestamptz, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade, actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.brand_profiles (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, voice jsonb not null default '{}'::jsonb, content_pillars jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.content_items (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, workflow_id uuid references public.workflows(id) on delete set null, platform text not null, format text not null, status text not null default 'draft', title text, body jsonb not null default '{}'::jsonb, scheduled_at timestamptz, published_at timestamptz, external_id text, idempotency_key text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,idempotency_key));
create table if not exists public.approval_requests (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, execution_id uuid references public.workflow_executions(id) on delete cascade, content_item_id uuid references public.content_items(id) on delete cascade, status text not null default 'pending', token_hash text not null unique, expires_at timestamptz not null, resolved_by uuid references auth.users(id) on delete set null, resolved_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.social_accounts (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, provider text not null, external_account_id text, display_name text, status text not null default 'not_configured', credential_id uuid references public.credentials(id) on delete set null, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,provider,external_account_id));
create table if not exists public.social_metrics (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, content_item_id uuid not null references public.content_items(id) on delete cascade, measured_at timestamptz not null default now(), metrics jsonb not null default '{}'::jsonb);
create table if not exists public.crm_tables (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, name text not null, slug text not null, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,slug));
create table if not exists public.crm_fields (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, table_id uuid not null references public.crm_tables(id) on delete cascade, name text not null, field_type text not null, config jsonb not null default '{}'::jsonb, sort_order integer not null default 0, created_at timestamptz not null default now());
create table if not exists public.crm_records (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, table_id uuid not null references public.crm_tables(id) on delete cascade, values jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);

create index if not exists idx_workspace_members_user on public.workspace_members(user_id, workspace_id);
create index if not exists idx_workflows_workspace_status on public.workflows(workspace_id,status,updated_at desc) where deleted_at is null;
create index if not exists idx_executions_workspace_created on public.workflow_executions(workspace_id,created_at desc);
create index if not exists idx_node_executions_execution on public.node_executions(execution_id,created_at);
create index if not exists idx_jobs_claim on public.jobs(status,run_at,priority desc) where status = 'queued';
create index if not exists idx_logs_execution on public.execution_logs(execution_id,created_at);
create index if not exists idx_content_workspace_schedule on public.content_items(workspace_id,status,scheduled_at);
create index if not exists idx_crm_records_workspace_table on public.crm_records(workspace_id,table_id,updated_at desc) where deleted_at is null;

-- Atomic claim for a separately deployed worker. It is deliberately not callable by browser roles.
create or replace function public.claim_automation_job(worker_id text)
returns setof public.jobs language plpgsql security definer set search_path = public, pg_temp as $$
declare claimed public.jobs;
begin
  select * into claimed from public.jobs where status = 'queued' and run_at <= now() order by priority desc, run_at asc for update skip locked limit 1;
  if found then
    update public.jobs set status = 'running', locked_at = now(), locked_by = worker_id, heartbeat_at = now(), attempts = attempts + 1, updated_at = now() where id = claimed.id returning * into claimed;
    return next claimed;
  end if;
end $$;
revoke all on function public.claim_automation_job(text) from public;
grant execute on function public.claim_automation_job(text) to service_role;

alter table public.workspaces enable row level security; alter table public.workspace_members enable row level security;
alter table public.workflows enable row level security; alter table public.workflow_versions enable row level security; alter table public.workflow_nodes enable row level security; alter table public.workflow_edges enable row level security; alter table public.workflow_variables enable row level security;
alter table public.workflow_executions enable row level security; alter table public.node_executions enable row level security; alter table public.execution_logs enable row level security; alter table public.execution_artifacts enable row level security; alter table public.jobs enable row level security; alter table public.job_attempts enable row level security; alter table public.webhook_endpoints enable row level security; alter table public.schedules enable row level security; alter table public.credentials enable row level security; alter table public.audit_logs enable row level security; alter table public.brand_profiles enable row level security; alter table public.content_items enable row level security; alter table public.approval_requests enable row level security; alter table public.social_accounts enable row level security; alter table public.social_metrics enable row level security; alter table public.crm_tables enable row level security; alter table public.crm_fields enable row level security; alter table public.crm_records enable row level security;

create or replace function public.is_workspace_member(target_workspace uuid) returns boolean language sql stable security invoker set search_path = public, auth as $$ select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = (select auth.uid())) $$;
revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

drop policy if exists workspace_member_read on public.workspace_members; create policy workspace_member_read on public.workspace_members for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists workspace_read on public.workspaces; create policy workspace_read on public.workspaces for select to authenticated using (public.is_workspace_member(id));
drop policy if exists workspace_write on public.workspaces; create policy workspace_write on public.workspaces for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
do $$ declare t text; begin foreach t in array array['workflows','workflow_versions','workflow_nodes','workflow_edges','workflow_variables','workflow_executions','node_executions','execution_logs','execution_artifacts','jobs','job_attempts','webhook_endpoints','schedules','audit_logs','brand_profiles','content_items','approval_requests','social_accounts','social_metrics','crm_tables','crm_fields','crm_records'] loop execute format('drop policy if exists workspace_isolation on public.%I',t); execute format('create policy workspace_isolation on public.%I for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))',t); end loop; end $$;
-- Secrets are server/worker only; intentionally no authenticated policies.
