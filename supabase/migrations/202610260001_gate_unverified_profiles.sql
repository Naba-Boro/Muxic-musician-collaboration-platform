-- Keep profiles, demos, portfolio links, and uploaded media private until the
-- account has completed email verification and onboarding.

drop policy if exists profiles_member_read on public.profiles;
create policy profiles_member_read on public.profiles for select to authenticated
using (
  id = auth.uid() or (
    onboarding_completed
    and deletion_requested_at is null
    and not public.is_blocked_between(auth.uid(), id)
  )
);

drop policy if exists demos_member_read on public.demos;
create policy demos_member_read on public.demos for select to authenticated
using (
  user_id = auth.uid() or (
    not public.is_blocked_between(auth.uid(), user_id)
    and exists (
      select 1 from public.profiles p
      where p.id = user_id
        and p.onboarding_completed
        and p.deletion_requested_at is null
    )
  )
);

drop policy if exists portfolio_member_read on public.portfolio_links;
create policy portfolio_member_read on public.portfolio_links for select to authenticated
using (
  user_id = auth.uid() or (
    not public.is_blocked_between(auth.uid(), user_id)
    and exists (
      select 1 from public.profiles p
      where p.id = user_id
        and p.onboarding_completed
        and p.deletion_requested_at is null
    )
  )
);

drop policy if exists demo_objects_owner_read on storage.objects;
create policy demo_objects_owner_read on storage.objects for select to authenticated
using (
  bucket_id = 'demos'
  and exists (
    select 1 from public.demos d
    join public.profiles p on p.id = d.user_id
    where d.object_path = name
      and (
        d.user_id = auth.uid()
        or (
          p.onboarding_completed
          and p.deletion_requested_at is null
          and not public.is_blocked_between(auth.uid(), d.user_id)
        )
      )
  )
);

drop policy if exists avatar_objects_member_read on storage.objects;
create policy avatar_objects_member_read on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1 from public.profiles p
    where p.id = (storage.foldername(name))[1]::uuid
      and (
        p.id = auth.uid()
        or (
          p.onboarding_completed
          and p.deletion_requested_at is null
          and not public.is_blocked_between(auth.uid(), p.id)
        )
      )
  )
);
