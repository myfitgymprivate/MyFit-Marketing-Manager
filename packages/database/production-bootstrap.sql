-- Nahraďte obě hodnoty skutečnými UUID před spuštěním v Supabase SQL Editoru.
do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000000';
  workspace_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  insert into public.profiles (user_id, display_name, onboarding_completed_at)
  values (owner_id, 'Majitelka MyFit', now())
  on conflict (user_id) do update set display_name = excluded.display_name;

  insert into public.workspaces (id, name, slug, owner_user_id)
  values (workspace_id, 'MyFit', 'myfit', owner_id)
  on conflict (id) do update set owner_user_id = excluded.owner_user_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, owner_id, 'OWNER')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.automation_jobs (
    workspace_id, name, job_type, schedule, timezone, configuration_json
  ) values (
    workspace_id,
    'Hodinová kontrola rezervací',
    'RESERVATION_CAPACITY_CHECK',
    '@hourly',
    'Europe/Prague',
    '{"daysAhead":4,"alertFreeRatio":0.45}'::jsonb
  ) on conflict (workspace_id, name) do update
    set is_active = true, configuration_json = excluded.configuration_json;
end $$;
