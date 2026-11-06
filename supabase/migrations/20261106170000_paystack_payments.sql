-- Paystack payments.
-- Flow: the buyer pays after the seller accepts (and, for deliveries, once HeyCileng has set the delivery fee).
-- Money is collected into HeyCileng's Paystack account. HeyCileng pays sellers manually after completion,
-- minus the commission recorded at payment time. Payments are never described as escrow.
--
-- Only the backend marks a payment successful: the paystack edge functions verify each transaction with
-- Paystack (webhook signature or the verify API) and call record_payment() with the service-role key.

-------------------------------------------------------------------------------- Order payment state
alter table public.orders
  add column payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refund_pending', 'refunded')),
  add column paid_at timestamptz,
  add column amount_paid numeric,
  add column commission_rate numeric,
  add column payout_status text not null default 'not_due'
    check (payout_status in ('not_due', 'due', 'paid')),
  add column payout_reference text,
  add column payout_paid_at timestamptz;

-- What the buyer pays: goods, plus the delivery fee when the buyer is the fee payer.
create or replace function public.order_amount_due(o public.orders) returns numeric
language sql immutable as $$
  select o.subtotal + case when o.fulfilment = 'delivery' and o.delivery->>'feePayer' = 'buyer'
                           then coalesce((o.delivery->>'fee')::numeric, 0) else 0 end
$$;

-- Payable once the seller has accepted and, for deliveries, HeyCileng has set the fee.
create or replace function public.order_is_payable(o public.orders) returns boolean
language sql immutable as $$
  select o.payment_status = 'unpaid'
     and o.status in ('accepted', 'processing', 'delivery_failed')
     and (o.fulfilment = 'collection' or (o.delivery ? 'feePayer' and o.delivery ? 'fee'))
$$;

-- Payment rules enforced on every order update, whichever function makes it.
create or replace function public.guard_order_payment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Fulfilment starts only after payment is confirmed.
  if new.status in ('dispatched', 'ready_for_collection') and new.status is distinct from old.status and new.payment_status <> 'paid' then
    raise exception 'The buyer hasn’t paid for order % yet. Dispatch and collection can start once payment is confirmed.', old.reference;
  end if;

  -- A paid order's buyer charge can't change afterwards.
  if old.payment_status = 'paid' and new.delivery is distinct from old.delivery
     and public.order_amount_due(new) <> public.order_amount_due(old) then
    raise exception 'Order % is already paid, so the buyer’s delivery fee can’t change. Set HeyCileng or the seller as the fee payer for any difference.', old.reference;
  end if;

  -- Cancelling a paid order: only HeyCileng can, and the money is then owed back to the buyer.
  if new.status = 'cancelled' and old.status <> 'cancelled' and old.payment_status = 'paid' then
    if not public.is_admin() then
      raise exception 'Order % has been paid. Contact HeyCileng support to cancel it and arrange a refund.', old.reference;
    end if;
    new.payment_status := 'refund_pending';
  end if;

  -- Completed and paid: the seller's payout becomes due.
  if new.status = 'completed' and old.status <> 'completed' and new.payment_status = 'paid' then
    new.payout_status := 'due';
  end if;
  return new;
end $$;
create trigger orders_payment_guard before update on public.orders
  for each row execute function public.guard_order_payment();

-- Sellers see payment and payout progress (still no address or buyer note).
create or replace view public.seller_orders as
  select id, reference, listing_id, listing, buyer_id, buyer_business_name, seller_id, quantity, subtotal,
         fulfilment, preferred_date, status, delivery, created_at, updated_at,
         payment_status, paid_at, commission_rate, payout_status, payout_reference, payout_paid_at
  from public.orders where seller_id = auth.uid();

-------------------------------------------------------------------------------- Payments
create sequence public.payment_ref_seq start 1;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  buyer_id uuid not null references public.profiles (id),
  reference text not null unique,
  amount numeric not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'initialized' check (status in ('initialized', 'successful', 'failed')),
  provider text not null default 'paystack',
  provider_transaction_id text,
  channel text,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id, created_at desc);
alter table public.payments enable row level security;
-- Read-only for clients; rows are written by database functions and the edge functions only.
create policy "payments: buyer or admin read" on public.payments for select using (buyer_id = auth.uid() or public.is_admin());

-- Buyer starts a payment: checks the order, fixes the amount on the server and returns what Paystack needs.
-- Called by the paystack edge function with the buyer's own token, so auth.uid() is the buyer.
create or replace function public.prepare_payment(p_order uuid)
returns table (reference text, amount numeric, email text, order_reference text)
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  buyer public.profiles;
  ref text;
  due numeric;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found.'; end if;
  if o.payment_status = 'paid' then raise exception 'Order % is already paid.', o.reference; end if;
  if not public.order_is_payable(o) then
    raise exception 'Order % can’t be paid yet. You can pay once the seller has accepted it and HeyCileng has confirmed any delivery fee.', o.reference;
  end if;
  select * into buyer from public.profiles where id = o.buyer_id;
  if buyer.status <> 'active' then raise exception 'Your account isn’t active. Contact HeyCileng support.'; end if;
  due := public.order_amount_due(o);
  ref := 'HCP-' || o.reference || '-' || nextval('public.payment_ref_seq');
  insert into public.payments (order_id, buyer_id, reference, amount) values (o.id, o.buyer_id, ref, due);
  return query select ref, due, buyer.email, o.reference;
end $$;
revoke all on function public.prepare_payment(uuid) from public, anon;
grant execute on function public.prepare_payment(uuid) to authenticated;

-- Audit entries written by the backend on Paystack's behalf (no signed-in user).
create or replace function public.audit_system(p_action text, p_target_type text, p_target_label text, p_detail text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, action, target_type, target_label, detail)
  values ('Paystack (automatic)', p_action, p_target_type, p_target_label, nullif(p_detail, ''))
$$;
revoke all on function public.audit_system(text, text, text, text) from public, anon, authenticated;

-- Backend only: record a transaction that Paystack has confirmed. Idempotent; checks amount and currency.
create or replace function public.record_payment(p_reference text, p_amount_kobo bigint, p_currency text, p_transaction_id text, p_channel text, p_paid_at timestamptz)
returns text language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
  o public.orders;
  rate numeric;
begin
  select * into pay from public.payments where reference = p_reference for update;
  if pay.id is null then return 'unknown_reference'; end if;
  if pay.status = 'successful' then return 'already_recorded'; end if;

  if p_amount_kobo <> round(pay.amount * 100) or upper(p_currency) <> pay.currency then
    update public.payments set status = 'failed', updated_at = now(),
      note = format('Amount or currency mismatch: Paystack reported %s %s kobo, expected %s kobo. Refund needed.', p_currency, p_amount_kobo, round(pay.amount * 100))
    where id = pay.id;
    perform public.audit_system('Payment mismatch', 'order', p_reference, 'Paystack amount or currency didn’t match the order. Refund needed.');
    return 'mismatch';
  end if;

  update public.payments set status = 'successful', provider_transaction_id = p_transaction_id, channel = p_channel,
    paid_at = coalesce(p_paid_at, now()), updated_at = now() where id = pay.id;

  select * into o from public.orders where id = pay.order_id for update;
  perform set_config('app.bypass_guard', 'on', true);

  -- Paid twice, or the order closed before the money arrived: keep the record and flag the refund.
  if o.payment_status <> 'unpaid' or o.status in ('cancelled', 'declined') then
    update public.payments set note = 'Received after the order was already paid or closed. Refund needed.' where id = pay.id;
    perform public.add_event(o.id, 'Extra payment received', 'heycileng', null, 'HeyCileng will refund payment ' || p_reference || '.');
    perform public.notify(o.buyer_id, 'order', 'Refund due for ' || o.reference, 'We received a payment we didn’t need. HeyCileng will refund it.', '/buyer/orders/' || o.id);
    perform public.audit_system('Refund needed (extra payment)', 'order', o.reference, p_reference);
    return 'refund_needed';
  end if;

  rate := coalesce((public.setting('{commission,ratePercent}'))::numeric, 0);
  update public.orders set payment_status = 'paid', paid_at = coalesce(p_paid_at, now()), amount_paid = pay.amount,
    commission_rate = rate, updated_at = now() where id = o.id;
  perform public.add_event(o.id, 'Payment received', 'heycileng', null, 'Paid through Paystack (' || p_reference || '). HeyCileng will now arrange ' ||
    case when o.fulfilment = 'delivery' then 'dispatch.' else 'collection.' end);
  perform public.notify(o.buyer_id, 'order', 'Payment received for ' || o.reference, 'Thank you — HeyCileng has received your payment and will arrange the next steps.', '/buyer/orders/' || o.id);
  perform public.notify(o.seller_id, 'order', 'Order ' || o.reference || ' has been paid', 'The buyer has paid HeyCileng. Prepare the goods — HeyCileng will arrange ' ||
    case when o.fulfilment = 'delivery' then 'pickup.' else 'collection.' end, '/seller/orders/' || o.id);
  perform public.audit_system('Payment received', 'order', o.reference, p_reference);
  return 'recorded';
end $$;
revoke all on function public.record_payment(text, bigint, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_payment(text, bigint, text, text, text, timestamptz) to service_role;

-- Backend only: a transaction Paystack reports as failed or abandoned.
create or replace function public.record_payment_failure(p_reference text, p_reason text)
returns void language sql security definer set search_path = public as $$
  update public.payments set status = 'failed', note = p_reason, updated_at = now()
  where reference = p_reference and status = 'initialized'
$$;
revoke all on function public.record_payment_failure(text, text) from public, anon, authenticated;
grant execute on function public.record_payment_failure(text, text) to service_role;

-------------------------------------------------------------------------------- Admin: payouts and refunds (money moved outside the app)
create or replace function public.admin_mark_payout_paid(p_order uuid, p_reference text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Order not found.'; end if;
  if o.payout_status <> 'due' then raise exception 'There is no payout due on order %.', o.reference; end if;
  if length(coalesce(trim(p_reference), '')) = 0 then raise exception 'Enter the bank transfer reference.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.orders set payout_status = 'paid', payout_reference = trim(p_reference), payout_paid_at = now(), updated_at = now() where id = o.id;
  perform public.notify(o.seller_id, 'order', 'Payout sent for ' || o.reference, 'HeyCileng has transferred your payout (reference ' || trim(p_reference) || ').', '/seller/orders/' || o.id);
  perform public.audit('Marked seller payout paid', 'order', o.reference, trim(p_reference));
end $$;

create or replace function public.admin_mark_refunded(p_order uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Order not found.'; end if;
  if o.payment_status <> 'refund_pending' then raise exception 'Order % has no refund pending.', o.reference; end if;
  if length(coalesce(trim(p_note), '')) = 0 then raise exception 'Add a note, such as the Paystack refund reference.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.orders set payment_status = 'refunded', updated_at = now() where id = o.id;
  perform public.add_event(o.id, 'Payment refunded', 'heycileng', null, trim(p_note));
  perform public.notify(o.buyer_id, 'order', 'Refund issued for ' || o.reference, 'HeyCileng has refunded your payment. ' || trim(p_note), '/buyer/orders/' || o.id);
  perform public.audit('Marked payment refunded', 'order', o.reference, trim(p_note));
end $$;

revoke all on function public.admin_mark_payout_paid(uuid, text), public.admin_mark_refunded(uuid, text) from public, anon;
grant execute on function public.admin_mark_payout_paid(uuid, text), public.admin_mark_refunded(uuid, text) to authenticated;
