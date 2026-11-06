-- Fix: only the free text people type (buyer cancellation, seller decline) is private.
-- System-written timeline text such as "Waiting for the seller to respond" stays visible.
create or replace function public.privatise_party_note() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.title in ('Cancelled by buyer', 'Seller declined the order')
     and nullif(trim(coalesce(new.description, '')), '') is not null then
    insert into public.order_private_notes (order_id, actor, title, note, at) values (new.order_id, new.actor, new.title, trim(new.description), new.at);
    new.description := 'Reason shared with HeyCileng.';
  end if;
  return new;
end $$;

-- Restore system text that the first version hid.
update public.order_events set description = 'Waiting for the seller to respond. Stock is not reserved until the seller accepts.'
  where title = 'Order request sent' and description = 'Reason shared with HeyCileng.';
update public.order_events set description = 'The requested quantity is now reserved for this order.'
  where title = 'Seller accepted the order' and description = 'Reason shared with HeyCileng.';
delete from public.order_private_notes where title not in ('Cancelled by buyer', 'Seller declined the order');
