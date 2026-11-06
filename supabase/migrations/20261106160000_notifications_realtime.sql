-- Stream new notifications to signed-in users. Realtime applies the table's RLS,
-- so each user only receives their own rows.
alter publication supabase_realtime add table public.notifications;
