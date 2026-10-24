-- Initial Muxics schema. Apply through Supabase migrations before enabling signup.
create type public.gig_kind as enum ('collaboration', 'hiring');
create type public.gig_status as enum ('open', 'closed');
create type public.application_status as enum ('pending', 'accepted', 'not_selected', 'withdrawn', 'gig_closed');
create type public.proposal_status as enum ('open', 'accepted', 'terminated');
create type public.project_status as enum ('active', 'complete');
create type public.project_member_status as enum ('active', 'left', 'removed');

create table public.profiles (
  -- Keep this stable profile ID as a tombstone after auth.users is deleted so
  -- another participant's project history can still refer to Account unavailable.
  id uuid primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null,
  city text not null,
  state text not null,
  country text not null,
  main_specialty text not null,
  secondary_specialties text[] not null default '{}',
  genres text[] not null default '{}',
  bio text not null default '',
  avatar_path text,
  avatar_doodle text not null default 'note-1' check (avatar_doodle in ('note-1', 'note-2', 'note-3', 'note-4')),
  onboarding_completed boolean not null default false,
  deletion_requested_at timestamptz,
  permanent_deletion_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(secondary_specialties) <= 6),
  check (permanent_deletion_at is null or deletion_requested_at is not null),
  check (auth_user_id is null or auth_user_id = id)
);

-- This table is intentionally inaccessible to anon/authenticated roles. It is used
-- only by the server-side username-login action with SUPABASE_SECRET_KEY.
create table public.login_aliases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  normalized_username text not null unique check (normalized_username = lower(normalized_username)),
  email text not null unique
);

create table public.demos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  object_path text not null unique,
  duration_seconds numeric(6,2) not null check (duration_seconds > 0 and duration_seconds <= 60),
  mime_type text not null check (mime_type in ('audio/mpeg', 'audio/mp4', 'audio/x-m4a')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 15728640),
  position smallint not null check (position between 1 and 2),
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

create table public.portfolio_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null check (url ~* '^https://'),
  platform text not null default 'other',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  expectations text not null,
  required_specialty text not null,
  estimated_duration text not null,
  kind public.gig_kind not null,
  payment_amount_inr numeric(12,2),
  city text not null,
  state text not null,
  country text not null default 'India',
  remote_allowed boolean not null default false,
  deadline_at timestamptz not null,
  status public.gig_status not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'hiring' and payment_amount_inr > 0) or (kind = 'collaboration' and payment_amount_inr is null))
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (length(trim(message)) between 1 and 2000),
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, applicant_id)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  kind public.gig_kind not null,
  topic text not null,
  status public.proposal_status not null default 'open',
  creator_accepted_at timestamptz,
  recipient_accepted_at timestamptz,
  terminated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (creator_id <> recipient_id)
);

create table public.proposal_messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.proposal_history_hidden (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  source_gig_id uuid unique references public.gigs(id) on delete set null,
  source_proposal_id uuid unique references public.proposals(id) on delete set null,
  title text not null,
  status public.project_status not null default 'active',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (num_nonnulls(source_gig_id, source_proposal_id) = 1)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('poster', 'collaborator')),
  status public.project_member_status not null default 'active',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  primary key (project_id, user_id)
);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table public.project_exit_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  poster_id uuid not null references public.profiles(id) on delete restrict,
  collaborator_id uuid not null references public.profiles(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  category text not null,
  reason text not null check (length(trim(reason)) >= 100),
  other_party_response text check (other_party_response is null or length(trim(other_party_response)) between 1 and 10000),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (poster_id <> collaborator_id),
  check (actor_id in (poster_id, collaborator_id))
);

create table public.project_exit_record_hidden (
  record_id uuid not null references public.project_exit_records(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (record_id, user_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  reference_type text,
  reference_id uuid,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.gig_deadline_reminders (
  gig_id uuid not null references public.gigs(id) on delete cascade,
  deadline_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (gig_id, deadline_at)
);


create index gigs_discovery_idx on public.gigs (status, deadline_at desc, created_at desc);
create index gigs_location_idx on public.gigs (country, state, city);
create index applications_applicant_idx on public.applications (applicant_id, created_at desc);
create index applications_gig_status_idx on public.applications (gig_id, status, created_at);
create index project_messages_timeline_idx on public.project_messages (project_id, created_at);
create index proposal_messages_timeline_idx on public.proposal_messages (proposal_id, created_at);

create or replace function public.is_blocked_between(user_a uuid, user_b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  );
$$;

create or replace function public.is_gig_owner(target_gig uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.gigs g where g.id = target_gig and g.poster_id = auth.uid()); $$;

create or replace function public.has_applied_to_gig(target_gig uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.applications a where a.gig_id = target_gig and a.applicant_id = auth.uid()); $$;

create or replace function public.is_proposal_participant(target_proposal uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.proposals p where p.id = target_proposal and auth.uid() in (p.creator_id, p.recipient_id)); $$;

create or replace function public.is_project_member(target_project uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members m where m.project_id = target_project and m.user_id = auth.uid()); $$;

create or replace function public.is_project_active_member(target_project uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members m where m.project_id = target_project and m.user_id = auth.uid() and m.status = 'active'); $$;

create or replace function public.project_participant_cards(target_project uuid)
returns table(user_id uuid, display_name text, avatar_doodle text, member_status public.project_member_status)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_project_member(target_project) then raise exception 'Only project members can view participant cards'; end if;
  return query
  select m.user_id,
    case when p.auth_user_id is null or p.deletion_requested_at is not null then 'Account unavailable' else p.display_name end,
    p.avatar_doodle, m.status
  from public.project_members m join public.profiles p on p.id = m.user_id
  where m.project_id = target_project order by m.joined_at;
end;
$$;

create or replace function public.can_view_exit_record(target_record uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.project_exit_records r
    where r.id = target_record and auth.uid() in (r.poster_id, r.collaborator_id)
      and not exists (select 1 from public.project_exit_record_hidden h where h.record_id = r.id and h.user_id = auth.uid())
  );
$$;

create or replace function public.lock_gig_after_acceptance()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.applications a where a.gig_id = old.id and a.status = 'accepted')
     and (new.title, new.description, new.expectations, new.required_specialty, new.estimated_duration,
          new.kind, new.payment_amount_inr, new.city, new.state, new.country, new.remote_allowed, new.deadline_at)
         is distinct from
         (old.title, old.description, old.expectations, old.required_specialty, old.estimated_duration,
          old.kind, old.payment_amount_inr, old.city, old.state, old.country, old.remote_allowed, old.deadline_at) then
    raise exception 'Gig details are locked after the first contributor is accepted';
  end if;
  return new;
end;
$$;

create or replace function public.create_proposal(target_recipient uuid, proposal_kind public.gig_kind, proposal_topic text, opening_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_proposal_id uuid;
begin
  if auth.uid() is null or target_recipient = auth.uid() then raise exception 'Choose another member'; end if;
  if length(trim(proposal_topic)) < 1 or length(trim(proposal_topic)) > 150 then raise exception 'Topic must be 1–150 characters'; end if;
  if length(trim(opening_message)) < 1 or length(trim(opening_message)) > 10000 then raise exception 'Message must be 1–10000 characters'; end if;
  if public.is_blocked_between(auth.uid(), target_recipient) then raise exception 'This member is unavailable for proposals'; end if;
  if not exists (select 1 from public.profiles p where p.id = target_recipient and p.auth_user_id is not null and p.deletion_requested_at is null) then
    raise exception 'This member is unavailable for proposals';
  end if;
  insert into public.proposals (creator_id, recipient_id, kind, topic)
  values (auth.uid(), target_recipient, proposal_kind, trim(proposal_topic)) returning id into new_proposal_id;
  insert into public.proposal_messages (proposal_id, sender_id, body)
  values (new_proposal_id, auth.uid(), trim(opening_message));
  insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
  values (target_recipient, 'proposal_received', 'proposal', new_proposal_id, 'You received a new project proposal.');
  return new_proposal_id;
end;
$$;

create trigger gigs_lock_after_acceptance
before update on public.gigs for each row execute function public.lock_gig_after_acceptance();

alter table public.profiles enable row level security;
alter table public.login_aliases enable row level security;
alter table public.demos enable row level security;
alter table public.portfolio_links enable row level security;
alter table public.gigs enable row level security;
alter table public.applications enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_messages enable row level security;
alter table public.proposal_history_hidden enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_exit_records enable row level security;
alter table public.project_exit_record_hidden enable row level security;
alter table public.blocks enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on public.login_aliases from anon, authenticated;
grant all on public.login_aliases to service_role;
revoke all on public.gig_deadline_reminders from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.demos, public.portfolio_links,
  public.gigs, public.applications, public.proposals, public.proposal_messages, public.projects,
  public.proposal_history_hidden,
  public.project_members, public.project_messages, public.project_exit_records,
  public.project_exit_record_hidden, public.blocks, public.notifications,
  public.notification_preferences to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, city, state, country, main_specialty, secondary_specialties,
  genres, bio, avatar_path, avatar_doodle, onboarding_completed, updated_at)
  on public.profiles to authenticated;
revoke all on function public.is_blocked_between(uuid, uuid), public.is_gig_owner(uuid),
  public.has_applied_to_gig(uuid), public.is_proposal_participant(uuid),
  public.is_project_member(uuid), public.is_project_active_member(uuid),
  public.project_participant_cards(uuid), public.can_view_exit_record(uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid), public.is_gig_owner(uuid),
  public.has_applied_to_gig(uuid), public.is_proposal_participant(uuid),
  public.is_project_member(uuid), public.is_project_active_member(uuid),
  public.project_participant_cards(uuid), public.can_view_exit_record(uuid) to authenticated;

create policy profiles_member_read on public.profiles for select to authenticated
using (
  id = auth.uid() or (
    deletion_requested_at is null and not public.is_blocked_between(auth.uid(), id)
  )
);
create policy profiles_owner_insert on public.profiles for insert to authenticated with check (id = auth.uid() and auth_user_id = auth.uid());
create policy profiles_owner_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy demos_member_read on public.demos for select to authenticated
using (user_id = auth.uid() or (not public.is_blocked_between(auth.uid(), user_id) and exists (
  select 1 from public.profiles p where p.id = user_id and p.deletion_requested_at is null
)));
create policy demos_owner_insert on public.demos for insert to authenticated with check (user_id = auth.uid());
create policy demos_owner_update on public.demos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy demos_owner_delete on public.demos for delete to authenticated using (user_id = auth.uid());

create policy portfolio_member_read on public.portfolio_links for select to authenticated
using (user_id = auth.uid() or (not public.is_blocked_between(auth.uid(), user_id) and exists (
  select 1 from public.profiles p where p.id = user_id and p.deletion_requested_at is null
)));
create policy portfolio_owner_insert on public.portfolio_links for insert to authenticated with check (user_id = auth.uid());
create policy portfolio_owner_update on public.portfolio_links for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy portfolio_owner_delete on public.portfolio_links for delete to authenticated using (user_id = auth.uid());

create policy gigs_member_read on public.gigs for select to authenticated
using (
  poster_id = auth.uid() or public.has_applied_to_gig(id) or
  (status = 'open' and not public.is_blocked_between(auth.uid(), poster_id)
    and exists (select 1 from public.profiles p where p.id = poster_id and p.deletion_requested_at is null))
);
create policy gigs_owner_insert on public.gigs for insert to authenticated with check (poster_id = auth.uid());
create policy gigs_owner_update on public.gigs for update to authenticated using (poster_id = auth.uid()) with check (poster_id = auth.uid());
create policy gigs_owner_delete on public.gigs for delete to authenticated using (poster_id = auth.uid() and status = 'open');

create policy applications_parties_read on public.applications for select to authenticated
using (applicant_id = auth.uid() or public.is_gig_owner(gig_id));
create policy applications_applicant_insert on public.applications for insert to authenticated
with check (
  applicant_id = auth.uid() and status = 'pending' and exists (
    select 1 from public.gigs g where g.id = gig_id and g.status = 'open'
      and g.deadline_at > now() and g.poster_id <> auth.uid()
      and not public.is_blocked_between(auth.uid(), g.poster_id)
  )
);

create policy proposals_parties_read on public.proposals for select to authenticated
using (auth.uid() in (creator_id, recipient_id) and not exists (
  select 1 from public.proposal_history_hidden h where h.proposal_id = id and h.user_id = auth.uid()
));
create policy proposals_creator_insert on public.proposals for insert to authenticated
with check (creator_id = auth.uid() and recipient_id <> auth.uid() and not public.is_blocked_between(creator_id, recipient_id));
create policy proposal_messages_parties_read on public.proposal_messages for select to authenticated
using (public.is_proposal_participant(proposal_id) and not exists (
  select 1 from public.proposal_history_hidden h where h.proposal_id = proposal_id and h.user_id = auth.uid()
));
create policy proposal_messages_participant_insert on public.proposal_messages for insert to authenticated
with check (sender_id = auth.uid() and public.is_proposal_participant(proposal_id) and exists (
  select 1 from public.proposals p where p.id = proposal_id and p.status = 'open'
    and not public.is_blocked_between(p.creator_id, p.recipient_id)
));
create policy proposal_history_owner_read on public.proposal_history_hidden for select to authenticated using (user_id = auth.uid());
create policy proposal_history_owner_hide on public.proposal_history_hidden for insert to authenticated
with check (user_id = auth.uid() and public.is_proposal_participant(proposal_id));

create policy projects_members_read on public.projects for select to authenticated using (public.is_project_member(id));
create policy project_members_members_read on public.project_members for select to authenticated using (public.is_project_member(project_id));
create policy project_messages_members_read on public.project_messages for select to authenticated using (public.is_project_member(project_id));
create policy project_messages_active_member_insert on public.project_messages for insert to authenticated
with check (sender_id = auth.uid() and public.is_project_active_member(project_id) and exists (
  select 1 from public.projects p where p.id = project_id and p.status = 'active'
));

create policy project_exit_pair_read on public.project_exit_records for select to authenticated
using (auth.uid() in (poster_id, collaborator_id) and public.can_view_exit_record(id));
create policy project_exit_pair_hide on public.project_exit_record_hidden for insert to authenticated
with check (user_id = auth.uid() and public.can_view_exit_record(record_id));
create policy project_exit_pair_hidden_read on public.project_exit_record_hidden for select to authenticated
using (user_id = auth.uid());

create policy blocks_owner_read on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_owner_insert on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy blocks_owner_delete on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy notifications_owner_read on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy notifications_owner_update on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notification_preferences_owner_read on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy notification_preferences_owner_insert on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
create policy notification_preferences_owner_update on public.notification_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- State transitions are handled in database transactions so clients cannot skip
-- acceptance, mutual-consent, or project-participant checks.
create or replace function public.withdraw_application(target_application uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.applications a set status = 'withdrawn', updated_at = now()
  where a.id = target_application and a.applicant_id = auth.uid() and a.status = 'pending';
  if not found then raise exception 'Application cannot be withdrawn'; end if;
end;
$$;

create or replace function public.decide_application(target_application uuid, decision public.application_status)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  application_row public.applications%rowtype;
  gig_row public.gigs%rowtype;
  result_project uuid;
begin
  select * into application_row from public.applications where id = target_application for update;
  if not found or application_row.status <> 'pending' then raise exception 'Application is no longer pending'; end if;
  select * into gig_row from public.gigs where id = application_row.gig_id for update;
  if not found or gig_row.poster_id <> auth.uid() then raise exception 'Only the poster can decide applications'; end if;

  if decision = 'not_selected' then
    update public.applications set status = 'not_selected', updated_at = now() where id = target_application;
    insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
    values (application_row.applicant_id, 'application_not_selected', 'gig', application_row.gig_id, 'The poster updated your application.');
    return null;
  end if;
  if decision <> 'accepted' then raise exception 'Unsupported decision'; end if;
  if gig_row.status <> 'open' or gig_row.deadline_at <= now() then raise exception 'This gig is closed'; end if;
  if public.is_blocked_between(gig_row.poster_id, application_row.applicant_id) then raise exception 'This application cannot be accepted'; end if;

  update public.applications set status = 'accepted', updated_at = now() where id = target_application;
  insert into public.projects (owner_id, source_gig_id, title)
  values (gig_row.poster_id, gig_row.id, gig_row.title)
  on conflict (source_gig_id) do nothing;
  select id into result_project from public.projects where source_gig_id = gig_row.id;
  insert into public.project_members (project_id, user_id, role)
  values (result_project, gig_row.poster_id, 'poster'), (result_project, application_row.applicant_id, 'collaborator')
  on conflict (project_id, user_id) do nothing;
  insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
  values (application_row.applicant_id, 'application_accepted', 'project', result_project, 'Your application was accepted. Your project space is ready.');
  return result_project;
end;
$$;

create or replace function public.accept_proposal(target_proposal uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  proposal_row public.proposals%rowtype;
  result_project uuid;
begin
  select * into proposal_row from public.proposals where id = target_proposal for update;
  if not found or proposal_row.status <> 'open' then raise exception 'Proposal is no longer open'; end if;
  if auth.uid() not in (proposal_row.creator_id, proposal_row.recipient_id) then raise exception 'Only proposal participants can accept'; end if;
  if public.is_blocked_between(proposal_row.creator_id, proposal_row.recipient_id) then raise exception 'This proposal cannot be accepted'; end if;

  if auth.uid() = proposal_row.creator_id then
    update public.proposals set creator_accepted_at = coalesce(creator_accepted_at, now()), updated_at = now() where id = target_proposal;
  else
    update public.proposals set recipient_accepted_at = coalesce(recipient_accepted_at, now()), updated_at = now() where id = target_proposal;
  end if;
  select * into proposal_row from public.proposals where id = target_proposal;
  if proposal_row.creator_accepted_at is null or proposal_row.recipient_accepted_at is null then
    insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
    values (case when auth.uid() = proposal_row.creator_id then proposal_row.recipient_id else proposal_row.creator_id end,
      'proposal_accepted_once', 'proposal', target_proposal, 'The other participant accepted. Confirm to create the project.');
    return null;
  end if;

  update public.proposals set status = 'accepted', updated_at = now() where id = target_proposal;
  insert into public.projects (owner_id, source_proposal_id, title)
  values (proposal_row.creator_id, proposal_row.id, proposal_row.topic)
  on conflict (source_proposal_id) do nothing;
  select id into result_project from public.projects where source_proposal_id = proposal_row.id;
  insert into public.project_members (project_id, user_id, role)
  values (result_project, proposal_row.creator_id, 'poster'), (result_project, proposal_row.recipient_id, 'collaborator')
  on conflict (project_id, user_id) do nothing;
  insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
  values (proposal_row.creator_id, 'project_created', 'project', result_project, 'Your proposal became a shared project.'),
         (proposal_row.recipient_id, 'project_created', 'project', result_project, 'Your proposal became a shared project.');
  return result_project;
end;
$$;

create or replace function public.terminate_proposal(target_proposal uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.proposals set status = 'terminated', terminated_by = auth.uid(), updated_at = now()
  where id = target_proposal and status = 'open' and auth.uid() in (creator_id, recipient_id);
  if not found then raise exception 'Proposal cannot be terminated'; end if;
end;
$$;

create or replace function public.complete_project(target_project uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.projects set status = 'complete', completed_at = now()
  where id = target_project and owner_id = auth.uid() and status = 'active';
  if not found then raise exception 'Only the project poster can complete an active project'; end if;
end;
$$;

create or replace function public.record_project_exit(target_project uuid, target_user uuid, reason_category text, reason_details text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  poster uuid;
  actor uuid := auth.uid();
  record_id uuid;
begin
  select owner_id into poster from public.projects where id = target_project and status = 'active';
  if poster is null then raise exception 'Project is not active'; end if;
  if length(trim(reason_details)) < 100 then raise exception 'Please provide a detailed, fact-based explanation'; end if;
  if actor = poster then
    if target_user = poster or not exists (
      select 1 from public.project_members where project_id = target_project and user_id = target_user and role = 'collaborator' and status = 'active'
    ) then raise exception 'Only an active collaborator can be removed'; end if;
  elsif actor = target_user and exists (
    select 1 from public.project_members where project_id = target_project and user_id = actor and role = 'collaborator' and status = 'active'
  ) then
    null;
  else
    raise exception 'Only the poster may remove a collaborator, or a collaborator may leave';
  end if;

  insert into public.project_exit_records (project_id, poster_id, collaborator_id, actor_id, category, reason)
  values (target_project, poster, target_user, actor, reason_category, trim(reason_details))
  returning id into record_id;
  update public.project_members set status = case when actor = poster then 'removed'::public.project_member_status else 'left'::public.project_member_status end,
    ended_at = now()
  where project_id = target_project and user_id = target_user;
  return record_id;
end;
$$;

create or replace function public.respond_to_project_exit(target_record uuid, response_text text)
returns void language plpgsql security definer set search_path = ''
as $$
declare record_row public.project_exit_records%rowtype;
begin
  select * into record_row from public.project_exit_records where id = target_record for update;
  if not found or auth.uid() not in (record_row.poster_id, record_row.collaborator_id) or auth.uid() = record_row.actor_id then
    raise exception 'Only the other party may respond to this record';
  end if;
  if record_row.other_party_response is not null then raise exception 'A response has already been recorded'; end if;
  if length(trim(response_text)) < 1 then raise exception 'Response cannot be empty'; end if;
  update public.project_exit_records set other_party_response = trim(response_text), responded_at = now() where id = target_record;
end;
$$;

create or replace function public.extend_gig_deadline(target_gig uuid, new_deadline timestamptz)
returns void language plpgsql security definer set search_path = ''
as $$
declare gig_row public.gigs%rowtype;
begin
  select * into gig_row from public.gigs where id = target_gig for update;
  if not found or gig_row.poster_id <> auth.uid() or gig_row.status <> 'open'
      or gig_row.deadline_at <= now() or new_deadline <= gig_row.deadline_at then
    raise exception 'This gig cannot be extended';
  end if;
  if exists (select 1 from public.applications where gig_id = target_gig and status = 'accepted') then
    raise exception 'Gig details are locked after the first contributor is accepted';
  end if;
  update public.gigs set deadline_at = new_deadline, updated_at = now() where id = target_gig;
end;
$$;

create or replace function public.process_gig_deadlines()
returns void language plpgsql security definer set search_path = ''
as $$
declare gig_row public.gigs%rowtype;
begin
  for gig_row in
    select * from public.gigs g where g.status = 'open'
      and g.deadline_at > now() and g.deadline_at <= now() + interval '24 hours'
  loop
    insert into public.gig_deadline_reminders (gig_id, deadline_at)
    values (gig_row.id, gig_row.deadline_at) on conflict do nothing;
    if found then
      insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
      values (gig_row.poster_id, 'gig_deadline_24h', 'gig', gig_row.id,
        'Your opportunity closes within 24 hours. Extend the deadline before it closes if you still need applicants.');
    end if;
  end loop;

  for gig_row in
    select * from public.gigs g where g.status = 'open' and g.deadline_at <= now() for update
  loop
    update public.gigs set status = 'closed', closed_at = now(), updated_at = now() where id = gig_row.id;
    update public.applications set status = 'gig_closed', updated_at = now()
      where gig_id = gig_row.id and status = 'pending';
    insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
    values (gig_row.poster_id, 'gig_closed_deadline', 'gig', gig_row.id, 'Your opportunity closed at its application deadline.')
    on conflict do nothing;
    insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
    select distinct a.applicant_id, 'gig_closed_deadline', 'gig', gig_row.id,
      'This opportunity closed at its application deadline.'
    from public.applications a where a.gig_id = gig_row.id
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.withdraw_application(uuid), public.decide_application(uuid, public.application_status),
  public.create_proposal(uuid, public.gig_kind, text, text), public.accept_proposal(uuid),
  public.terminate_proposal(uuid), public.complete_project(uuid),
  public.record_project_exit(uuid, uuid, text, text), public.respond_to_project_exit(uuid, text),
  public.extend_gig_deadline(uuid, timestamptz), public.process_gig_deadlines()
  from public, anon;
grant execute on function public.withdraw_application(uuid), public.decide_application(uuid, public.application_status),
  public.create_proposal(uuid, public.gig_kind, text, text), public.accept_proposal(uuid),
  public.terminate_proposal(uuid), public.complete_project(uuid),
  public.record_project_exit(uuid, uuid, text, text), public.respond_to_project_exit(uuid, text),
  public.extend_gig_deadline(uuid, timestamptz)
  to authenticated;
revoke all on function public.process_gig_deadlines() from public, anon, authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke update, insert on public.project_exit_records from authenticated;
revoke insert on public.proposals from authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demos', 'demos', false, 15728640, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a'])
on conflict (id) do update set public = false, file_size_limit = 15728640,
  allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/x-m4a'];

-- Enable pg_cron in the Supabase Dashboard's Integrations > Cron section before
-- applying this migration to schedule hourly reminder and automatic close work.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('Muxics-gig-deadlines', '15 * * * *', 'select public.process_gig_deadlines();');
  end if;
end
$$;

create policy demo_objects_owner_read on storage.objects for select to authenticated
using (bucket_id = 'demos' and exists (
  select 1 from public.demos d where d.object_path = name and (
    d.user_id = auth.uid() or not public.is_blocked_between(auth.uid(), d.user_id)
  )
));
create policy demo_objects_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy demo_objects_owner_update on storage.objects for update to authenticated
using (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy demo_objects_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Enable project chat and proposal replies for Supabase Realtime subscriptions.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_messages') then
      alter publication supabase_realtime add table public.project_messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'proposal_messages') then
      alter publication supabase_realtime add table public.proposal_messages;
    end if;
  end if;
end
$$;
