-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('workspace-files', 'workspace-files', false)
on conflict (id) do nothing;

-- Set up security policies
-- Allow authenticated users to upload files
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'workspace-files' );

-- Allow authenticated users to update their own files (or all files in bucket for now)
create policy "Authenticated users can update files"
on storage.objects for update
to authenticated
using ( bucket_id = 'workspace-files' );

-- Allow authenticated users to read files
create policy "Authenticated users can read files"
on storage.objects for select
to authenticated
using ( bucket_id = 'workspace-files' );

-- Allow authenticated users to delete files
create policy "Authenticated users can delete files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'workspace-files' );
