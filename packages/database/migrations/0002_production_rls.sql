-- Custom SQL migration file, put your code below! --
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.content_items enable row level security;
alter table public.story_frames enable row level security;
alter table public.reel_scenes enable row level security;
alter table public.task_series enable row level security;
alter table public.task_occurrences enable row level security;
alter table public.campaigns enable row level security;
alter table public.audit_log enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.content_variants enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_assets enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_runs enable row level security;
alter table public.marketing_memory enable row level security;
alter table public.trend_signals enable row level security;
alter table public.reservation_snapshots enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.notifications enable row level security;
alter table public.automation_jobs enable row level security;
alter table public.automation_job_runs enable row level security;

create policy profiles_owner_access on public.profiles
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy workspaces_member_access on public.workspaces
for all to authenticated
using (owner_user_id = (select auth.uid()) or public.is_workspace_member(id))
with check (owner_user_id = (select auth.uid()));

create policy workspace_members_member_access on public.workspace_members
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.workspaces
    where id = workspace_id and owner_user_id = (select auth.uid())
  )
);

create policy content_items_workspace_access on public.content_items
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy task_series_workspace_access on public.task_series
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy campaigns_workspace_access on public.campaigns
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy audit_log_workspace_access on public.audit_log
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy idempotency_keys_workspace_access on public.idempotency_keys
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy monthly_plans_workspace_access on public.monthly_plans
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy media_assets_workspace_access on public.media_assets
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy ai_conversations_workspace_access on public.ai_conversations
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy ai_runs_workspace_access on public.ai_runs
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy marketing_memory_workspace_access on public.marketing_memory
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy trend_signals_workspace_access on public.trend_signals
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy reservation_snapshots_workspace_access on public.reservation_snapshots
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy notifications_workspace_access on public.notifications
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy automation_jobs_workspace_access on public.automation_jobs
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy story_frames_content_access on public.story_frames
for all to authenticated using (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
));
create policy reel_scenes_content_access on public.reel_scenes
for all to authenticated using (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
));
create policy content_variants_content_access on public.content_variants
for all to authenticated using (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
));
create policy content_assets_content_access on public.content_assets
for all to authenticated using (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.content_items where id = content_item_id and public.is_workspace_member(workspace_id)
));
create policy task_occurrences_series_access on public.task_occurrences
for all to authenticated using (exists (
  select 1 from public.task_series where id = task_series_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.task_series where id = task_series_id and public.is_workspace_member(workspace_id)
));
create policy ai_messages_conversation_access on public.ai_messages
for all to authenticated using (exists (
  select 1 from public.ai_conversations where id = conversation_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.ai_conversations where id = conversation_id and public.is_workspace_member(workspace_id)
));
create policy reservation_slots_snapshot_access on public.reservation_slots
for all to authenticated using (exists (
  select 1 from public.reservation_snapshots where id = snapshot_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.reservation_snapshots where id = snapshot_id and public.is_workspace_member(workspace_id)
));
create policy automation_job_runs_job_access on public.automation_job_runs
for all to authenticated using (exists (
  select 1 from public.automation_jobs where id = job_id and public.is_workspace_member(workspace_id)
)) with check (exists (
  select 1 from public.automation_jobs where id = job_id and public.is_workspace_member(workspace_id)
));
