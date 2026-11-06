-- Buyers never collect from a seller's site: every order is delivered by a HeyCileng logistics partner,
-- so buyers and sellers never meet or contact each other.

-- New orders must be delivery orders.
create or replace function public.require_delivery() returns trigger
language plpgsql as $$
begin
  if new.fulfilment <> 'delivery' then
    raise exception 'Every order is delivered by a HeyCileng logistics partner. Enter a delivery address.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger orders_delivery_only before insert or update of fulfilment on public.orders
  for each row execute function public.require_delivery();

-- Collection handling is retired.
revoke execute on function public.admin_collection(uuid, text, text) from authenticated;

-- Payable once the seller has accepted and HeyCileng has set the delivery fee.
create or replace function public.order_is_payable(o public.orders) returns boolean
language sql immutable as $$
  select o.payment_status = 'unpaid'
     and o.status in ('accepted', 'processing', 'delivery_failed')
     and o.fulfilment = 'delivery' and o.delivery ? 'feePayer' and o.delivery ? 'fee'
$$;

-- Settings: collection off for good (kept in the data so older clients read "false").
update public.platform_settings set data = jsonb_set(data, '{marketplace,allowCollection}', 'false'), updated_at = now() where id = 1;
