create or replace function public.close_gig(target_gig uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  gig_row public.gigs%rowtype;
begin
  select * into gig_row from public.gigs where id = target_gig for update;
  if not found or gig_row.poster_id <> auth.uid() or gig_row.status <> 'open' then
    raise exception 'This opportunity cannot be closed';
  end if;

  update public.gigs
  set status = 'closed', closed_at = now(), updated_at = now()
  where id = target_gig;

  update public.applications
  set status = 'gig_closed', updated_at = now()
  where gig_id = target_gig and status = 'pending';

  insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
  values (gig_row.poster_id, 'gig_closed_manual', 'gig', target_gig,
    'You closed your opportunity to new applicants.')
  on conflict do nothing;

  insert into public.notifications (recipient_id, event_type, reference_type, reference_id, body)
  select distinct a.applicant_id, 'gig_closed_manual', 'gig', target_gig,
    'This opportunity was closed by the poster.'
  from public.applications a where a.gig_id = target_gig
  on conflict do nothing;
end;
$$;

revoke all on function public.close_gig(uuid) from public, anon;
grant execute on function public.close_gig(uuid) to authenticated;
