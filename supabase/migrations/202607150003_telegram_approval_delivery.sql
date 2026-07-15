alter table public.approval_requests add column if not exists telegram_chat_id bigint;
alter table public.approval_requests add column if not exists telegram_message_id bigint;
create index if not exists idx_approval_pending_expiry on public.approval_requests(workspace_id, status, expires_at) where status = 'pending';
