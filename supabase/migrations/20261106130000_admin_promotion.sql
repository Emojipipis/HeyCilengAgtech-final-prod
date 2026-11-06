-- Owner-only helper to promote an existing account to admin (the profile guard blocks direct role edits).
-- Run in the Supabase SQL editor:  select public.promote_to_admin('you@example.com');
create or replace function public.promote_to_admin(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare
  target public.profiles;
begin
  select * into target from public.profiles where lower(email) = lower(trim(p_email));
  if target.id is null then raise exception 'No account with email %. Sign up and verify the email first.', p_email; end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.profiles set role = 'admin', status = 'active' where id = target.id;
  perform set_config('app.bypass_guard', '', true);
  insert into public.audit_log (actor, action, target_type, target_label, detail)
    values ('Database owner', 'Promoted account to admin', 'user', target.email, null);
  return target.email || ' is now an admin.';
end $$;
revoke all on function public.promote_to_admin(text) from public, anon, authenticated;
