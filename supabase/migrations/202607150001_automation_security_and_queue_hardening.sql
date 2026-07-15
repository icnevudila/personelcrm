-- Automation OS hardening: explicit grants, role-aware RLS and worker recovery.
-- This migration is additive and can be applied after 202607140001_native_automation_core.sql.

create or replace function public.has_workspace_role(target_workspace uuid, minimum_role text)
returns boolean
language sql
stable
security invoker
set search_path = public, auth
as $$
  select coalesce((
    select case minimum_role
      when 'viewer' then true
      when 'analyst' then role in ('owner','admin','builder','operator','analyst')
      when 'operator' then role in ('owner','admin','builder','operator')
      when 'builder' then role in ('owner','admin','builder')
      when 'admin' then role in ('owner','admin')
      when 'owner' then role = 'owner'
      else false
    end
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = (select auth.uid())
  ), false);
$$;
revoke all on function public.has_workspace_role(uuid, text) from public;
grant execute on function public.has_workspace_role(uuid, text) to authenticated;

-- Tables accessed through authenticated server clients must be explicitly exposed.
grant select, insert, update, delete on table public.workspaces, public.workspace_members,
  public.workflows, public.workflow_versions, public.workflow_nodes, public.workflow_edges,
  public.workflow_variables, public.workflow_executions, public.node_executions,
  public.execution_logs, public.execution_artifacts, public.webhook_endpoints, public.schedules,
  public.audit_logs, public.brand_profiles, public.content_items, public.approval_requests,
  public.social_accounts, public.social_metrics, public.crm_tables, public.crm_fields,
  public.crm_records to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Credentials, jobs and job attempts are worker-only. The service role bypasses RLS but is
-- granted explicitly so this remains correct if that behavior changes in local environments.
grant select, insert, update, delete on table public.credentials, public.jobs, public.job_attempts to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Replace broad all-member write policies with least-privilege policies.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'workflows','workflow_versions','workflow_nodes','workflow_edges','workflow_variables',
    'workflow_executions','node_executions','execution_logs','execution_artifacts','jobs',
    'job_attempts','webhook_endpoints','schedules','audit_logs','brand_profiles','content_items',
    'approval_requests','social_accounts','social_metrics','crm_tables','crm_fields','crm_records'
  ] loop
    execute format('drop policy if exists workspace_isolation on public.%I', table_name);
  end loop;
end $$;

-- Read access is shared within a workspace. Write access is separated by product responsibility.
create policy workflow_read on public.workflows for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workflow_write on public.workflows for all to authenticated using (public.has_workspace_role(workspace_id, 'builder')) with check (public.has_workspace_role(workspace_id, 'builder'));
create policy workflow_versions_read on public.workflow_versions for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workflow_versions_write on public.workflow_versions for all to authenticated using (public.has_workspace_role(workspace_id, 'builder')) with check (public.has_workspace_role(workspace_id, 'builder'));
create policy workflow_nodes_read on public.workflow_nodes for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workflow_nodes_write on public.workflow_nodes for all to authenticated using (public.has_workspace_role(workspace_id, 'builder')) with check (public.has_workspace_role(workspace_id, 'builder'));
create policy workflow_edges_read on public.workflow_edges for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workflow_edges_write on public.workflow_edges for all to authenticated using (public.has_workspace_role(workspace_id, 'builder')) with check (public.has_workspace_role(workspace_id, 'builder'));
create policy workflow_variables_read on public.workflow_variables for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workflow_variables_write on public.workflow_variables for all to authenticated using (public.has_workspace_role(workspace_id, 'builder')) with check (public.has_workspace_role(workspace_id, 'builder'));

do $$
declare table_name text;
begin
  foreach table_name in array array['workflow_executions','node_executions','execution_logs','execution_artifacts','audit_logs','social_metrics'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', table_name || '_read', table_name);
  end loop;
  foreach table_name in array array['webhook_endpoints','schedules','brand_profiles','content_items','approval_requests','social_accounts','crm_tables','crm_fields','crm_records'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_workspace_role(workspace_id, ''builder'')) with check (public.has_workspace_role(workspace_id, ''builder''))', table_name || '_write', table_name);
  end loop;
end $$;

-- Browser roles never read or write encrypted credentials or internal queue rows.
drop policy if exists workspace_isolation on public.credentials;
drop policy if exists workspace_isolation on public.jobs;
drop policy if exists workspace_isolation on public.job_attempts;

create or replace function public.recover_stalled_automation_jobs(stale_after interval default interval '10 minutes')
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare recovered_count integer;
begin
  update public.jobs
  set status = case when attempts >= max_attempts then 'dead_letter' else 'queued' end,
      locked_at = null,
      locked_by = null,
      heartbeat_at = null,
      run_at = now(),
      updated_at = now(),
      last_error = coalesce(last_error, '{}'::jsonb) || jsonb_build_object('code', 'WORKER_STALLED', 'message', 'Worker heartbeat expired')
  where status = 'running'
    and coalesce(heartbeat_at, locked_at, created_at) < now() - stale_after;
  get diagnostics recovered_count = row_count;
  return recovered_count;
end $$;
revoke all on function public.recover_stalled_automation_jobs(interval) from public;
grant execute on function public.recover_stalled_automation_jobs(interval) to service_role;
