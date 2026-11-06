-- Fix: the public listing policy checked the seller's status through profiles, but viewers can't read
-- other people's profiles under RLS, so approved listings were hidden from buyers and visitors.
-- This helper reveals only whether a seller account is active.
create or replace function public.seller_is_active(p_seller uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_seller and role = 'seller' and status = 'active')
$$;
grant execute on function public.seller_is_active(uuid) to anon, authenticated;

drop policy "listings: public read" on public.listings;
create policy "listings: public read" on public.listings for select using (
  (status in ('active', 'sold_out') and public.seller_is_active(seller_id))
  or seller_id = auth.uid() or public.is_admin()
);
