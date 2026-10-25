-- Profile photos are served with short-lived signed URLs to authenticated members.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 262144, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 262144,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy avatar_objects_member_read on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and not public.is_blocked_between(auth.uid(), (storage.foldername(name))[1]::uuid)
);
