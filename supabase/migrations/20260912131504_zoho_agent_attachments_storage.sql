-- Private staging area used by the server-side Zoho importer. Objects are
-- written with the service role and exposed only through short-lived signed
-- URLs returned to the authenticated caller.
insert into storage.buckets (id, name, public, file_size_limit)
values ('zoho-agent-files', 'zoho-agent-files', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;
