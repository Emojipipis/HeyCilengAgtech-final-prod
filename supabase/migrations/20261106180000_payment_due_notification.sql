-- Tell the buyer as soon as an order becomes payable (seller accepted a collection order,
-- or HeyCileng set the delivery fee). Covers every path that changes an order.
create or replace function public.notify_payment_due() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.order_is_payable(new) and not public.order_is_payable(old) then
    perform public.notify(new.buyer_id, 'order', 'Payment due for ' || new.reference,
      'Pay ₦' || to_char(public.order_amount_due(new), 'FM999G999G999G990D00') || ' through Paystack so HeyCileng can arrange ' ||
      case when new.fulfilment = 'delivery' then 'dispatch.' else 'collection.' end,
      '/buyer/orders/' || new.id);
  end if;
  return null;
end $$;
create trigger orders_payment_due_notice after update on public.orders
  for each row execute function public.notify_payment_due();
