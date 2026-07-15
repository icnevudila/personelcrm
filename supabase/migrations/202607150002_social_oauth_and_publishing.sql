-- Social publishing credentials never cross the browser boundary.
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('x','instagram')),
  state_hash text not null unique,
  verifier_ciphertext text not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('x','instagram')),
  external_account_id text not null,
  display_name text,
  encrypted_payload text not null,
  scopes text[] not null default array[]::text[],
  status text not null default 'connected' check (status in ('connected','needs_reauth','revoked','error')),
  expires_at timestamptz,
  last_refreshed_at timestamptz,
  last_error jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider, external_account_id)
);
alter table public.social_accounts add column if not exists oauth_connection_id uuid references public.oauth_connections(id) on delete set null;
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete restrict,
  provider text not null,
  external_id text not null,
  external_url text,
  published_at timestamptz not null default now(),
  provider_response jsonb not null default '{}'::jsonb,
  unique(content_item_id, provider),
  unique(provider, external_id)
);
create index if not exists idx_oauth_connections_workspace_provider on public.oauth_connections(workspace_id, provider, status);
create index if not exists idx_social_posts_content on public.social_posts(content_item_id, published_at desc);

alter table public.oauth_states enable row level security;
alter table public.oauth_connections enable row level security;
alter table public.social_posts enable row level security;

-- OAuth states and encrypted connections are server-only. Account/post metadata is safe for members to read.
create policy social_posts_read on public.social_posts for select to authenticated using (public.is_workspace_member(workspace_id));
grant select on table public.social_posts to authenticated;
grant select, insert, update, delete on table public.oauth_states, public.oauth_connections, public.social_posts to service_role;
