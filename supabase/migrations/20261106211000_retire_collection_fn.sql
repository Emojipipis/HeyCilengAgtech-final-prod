-- admin_collection was executable through PUBLIC as well; retire it fully.
revoke execute on function public.admin_collection(uuid, text, text) from public, anon, authenticated;
