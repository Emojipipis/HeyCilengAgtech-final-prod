-- Buyers and sellers must not be able to reach each other outside HeyCileng.
--   1. Contact details (phone numbers, emails, links, social handles) are rejected in every free-text
--      field the other side can read: listings, seller profiles and buyer requirements.
--   2. Reasons typed when cancelling or declining go to HeyCileng only, not the other party's timeline.
--   3. Identities are hidden: buyers see "HeyCileng seller", sellers see "HeyCileng buyer".
--      Administrators still see real names.

-------------------------------------------------------------------------------- 1. Contact-detail filter
create or replace function public.contact_details_found(p_text text) returns boolean
language plpgsql immutable as $$
declare
  t text := lower(coalesce(p_text, ''));
  digits text;
begin
  if t = '' then return false; end if;
  -- Emails, links and domains.
  if t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return true; end if;
  if t ~ '(https?://|www\.|wa\.me|t\.me/|bit\.ly)' then return true; end if;
  if t ~ '[a-z0-9-]+\.(com|ng|net|org|io|info|biz)(\.ng)?\M' then return true; end if;
  -- Messaging apps, social handles and "contact me" phrasing.
  if t ~ '(whats\s*app|telegram|instagram|facebook|snapchat|tiktok|twitter|signal app)' then return true; end if;
  if t ~ '(^|\s)@[a-z0-9_.]{3,}' then return true; end if;
  if t ~ '\m(call|text|dm|message|ring|reach|contact|whatsapp)\s+(me|us)\M' then return true; end if;
  -- Phone numbers: ignore spaces, dashes, dots and brackets, then look for long digit runs.
  digits := regexp_replace(t, '[\s\-\.\(\)]', '', 'g');
  if digits ~ '(\+?234|0)[789][01][0-9]{8}' then return true; end if;
  if digits ~ '[0-9]{10,}' then return true; end if;
  return false;
end $$;

create or replace function public.reject_contact_details() returns trigger
language plpgsql as $$
declare
  field text;
  value text;
begin
  foreach field in array tg_argv loop
    value := to_jsonb(new) ->> field;
    -- Array columns arrive as JSON text; check them as plain text.
    if public.contact_details_found(value) then
      raise exception 'Please remove contact details (phone numbers, emails, links or social handles). HeyCileng handles all communication between buyers and sellers.'
        using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

create trigger listings_no_contact_details before insert or update on public.listings
  for each row execute function public.reject_contact_details('name', 'description', 'quality_specifications', 'applications', 'quality_tags');
create trigger profiles_no_contact_details before insert or update of business_name, description, area on public.profiles
  for each row execute function public.reject_contact_details('business_name', 'description', 'area');
create trigger requirements_no_contact_details before insert or update on public.requirements
  for each row execute function public.reject_contact_details('title', 'intended_application', 'quality_specifications', 'additional_specifications', 'quality_requirements');

-------------------------------------------------------------------------------- 2. Party reasons are private to HeyCileng
create table public.order_private_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  actor text not null check (actor in ('buyer', 'seller')),
  title text not null,
  note text not null,
  at timestamptz not null default now()
);
alter table public.order_private_notes enable row level security;
create policy "private notes: admin read" on public.order_private_notes for select using (public.is_admin());

-- Any timeline entry written by a buyer or seller keeps its free text for HeyCileng only.
create or replace function public.privatise_party_note() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.actor in ('buyer', 'seller') and nullif(trim(coalesce(new.description, '')), '') is not null then
    insert into public.order_private_notes (order_id, actor, title, note, at) values (new.order_id, new.actor, new.title, trim(new.description), new.at);
    new.description := 'Reason shared with HeyCileng.';
  end if;
  return new;
end $$;
create trigger order_events_private_party_notes before insert on public.order_events
  for each row execute function public.privatise_party_note();

-- Move reasons already on timelines.
insert into public.order_private_notes (order_id, actor, title, note, at)
  select order_id, actor, title, trim(description), at from public.order_events
  where actor in ('buyer', 'seller') and nullif(trim(coalesce(description, '')), '') is not null
    and description <> 'Reason shared with HeyCileng.';
update public.order_events set description = 'Reason shared with HeyCileng.'
  where actor in ('buyer', 'seller') and nullif(trim(coalesce(description, '')), '') is not null;

-------------------------------------------------------------------------------- 3. Anonymous identities
-- Public seller profile: no business name (still no person name, phone or email).
create or replace view public.sellers_public as
  select id, 'HeyCileng seller'::text as business_name, state, area, description, created_at::date as member_since, verified
  from public.profiles where role = 'seller' and status = 'active';

-- Order snapshots store the seller as "HeyCileng seller"; admins read the real name from profiles.
create or replace function public.anonymise_order_seller() returns trigger
language plpgsql as $$
begin
  new.listing := jsonb_set(new.listing, '{sellerBusinessName}', '"HeyCileng seller"');
  return new;
end $$;
create trigger orders_anonymise_seller before insert on public.orders
  for each row execute function public.anonymise_order_seller();
update public.orders set listing = jsonb_set(listing, '{sellerBusinessName}', '"HeyCileng seller"')
  where listing->>'sellerBusinessName' is distinct from 'HeyCileng seller';

-- Sellers' order view: the buyer is anonymous.
create or replace view public.seller_orders as
  select id, reference, listing_id, listing, buyer_id, 'HeyCileng buyer'::text as buyer_business_name, seller_id, quantity, subtotal,
         fulfilment, preferred_date, status, delivery, created_at, updated_at,
         payment_status, paid_at, commission_rate, payout_status, payout_reference, payout_paid_at
  from public.orders where seller_id = auth.uid();
