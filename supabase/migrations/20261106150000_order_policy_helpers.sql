-- Fix: two policies looked up public.orders, which sellers can't read under RLS (they use seller_orders).
--   * listing delete: the "no open orders" check always passed for sellers.
--   * order events: sellers couldn't read the timeline of their own orders.
create or replace function public.listing_has_open_orders(p_listing uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orders where listing_id = p_listing
    and status in ('pending','accepted','processing','dispatched','ready_for_collection','delivery_failed'))
$$;

create or replace function public.is_order_party(p_order uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orders where id = p_order and (buyer_id = auth.uid() or seller_id = auth.uid()))
$$;
revoke all on function public.listing_has_open_orders(uuid), public.is_order_party(uuid) from public, anon;
grant execute on function public.listing_has_open_orders(uuid), public.is_order_party(uuid) to authenticated;

drop policy "listings: seller delete when no open orders" on public.listings;
create policy "listings: seller delete when no open orders" on public.listings for delete using (
  listings.seller_id = auth.uid() and listings.reserved_quantity = 0 and not public.listing_has_open_orders(listings.id)
);

drop policy "events: parties read" on public.order_events;
create policy "events: parties read" on public.order_events for select using (public.is_order_party(order_id) or public.is_admin());
