-- HeyCileng Agtech — initial schema
-- Security model:
--   * Row Level Security on every table. Users read only what they own or what is public.
--   * Every state change with business rules (orders, stock, reviews, logistics, tickets) runs in a
--     SECURITY DEFINER function that checks auth.uid() and role. Clients can't write those columns directly.
--   * Buyers and sellers never read each other's contact details: public seller data and anonymised
--     requirements are exposed through views with safe columns only.
--   * Admin role is never self-assigned. Promote an account manually:
--       select public.promote_to_admin('you@example.com');   (see 20261106130000_admin_promotion.sql)

-------------------------------------------------------------------------------- Types
create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.account_status as enum ('active', 'pending_verification', 'suspended');
create type public.listing_status as enum ('draft', 'pending_review', 'active', 'paused', 'sold_out', 'rejected', 'suspended');
create type public.requirement_status as enum ('active', 'paused', 'expired', 'fulfilled');
create type public.order_status as enum ('pending', 'accepted', 'declined', 'processing', 'dispatched', 'ready_for_collection', 'completed', 'cancelled', 'delivery_failed');
create type public.fulfilment_method as enum ('delivery', 'collection');
create type public.ticket_status as enum ('open', 'in_progress', 'awaiting_user', 'resolved', 'closed');
create type public.dispute_status as enum ('open', 'under_review', 'resolved', 'rejected');
create type public.notification_category as enum ('order', 'listing', 'match', 'delivery', 'account', 'announcement');
create type public.unit as enum ('kg', 'tonne', 'bag');

-------------------------------------------------------------------------------- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'buyer',
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  business_name text not null default '',
  state text not null default '',
  area text not null default '',
  industry text not null default '',
  description text not null default '',
  status public.account_status not null default 'active',
  suspension_reason text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active')
$$;

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- New auth users get a profile. Only buyer or seller can come from signup metadata — never admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, role, email, full_name, phone, business_name, state, area, description)
  values (
    new.id,
    case when meta->>'account_type' = 'seller' then 'seller'::public.user_role else 'buyer'::public.user_role end,
    coalesce(new.email, ''),
    coalesce(meta->>'full_name', ''),
    coalesce(meta->>'phone', ''),
    coalesce(meta->>'business_name', ''),
    coalesce(meta->>'business_state', ''),
    coalesce(meta->>'business_location', ''),
    coalesce(meta->>'business_description', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own contact/business fields, never role, status or verification.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('app.bypass_guard', true), '') <> 'on' then
    if new.role <> old.role or new.status <> old.status or new.verified <> old.verified
       or new.email <> old.email or new.suspension_reason is distinct from old.suspension_reason then
      raise exception 'You can’t change that field.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- What anyone may know about a seller: no names, phone or email.
create view public.sellers_public as
  select id, business_name, state, area, description, created_at::date as member_since, verified
  from public.profiles where role = 'seller' and status = 'active';
grant select on public.sellers_public to anon, authenticated;

-------------------------------------------------------------------------------- Settings
create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (data) values ('{
  "commission": { "ratePercent": 5, "chargedTo": "seller" },
  "marketplace": { "requireListingReview": true, "allowCollection": true, "maxImagesPerListing": 6 },
  "matching": { "weights": { "material": 30, "quantity": 20, "location": 15, "price": 15, "application": 10, "quality": 10 }, "minRecommendedScore": 40 },
  "notifications": { "emailOrderUpdates": true, "emailMatchAlerts": true, "emailAnnouncements": false },
  "platform": { "name": "HeyCileng Agtech", "supportEmail": "", "tagline": "Turning agricultural waste into valuable opportunities." }
}');
alter table public.platform_settings enable row level security;
create policy "settings: admin read" on public.platform_settings for select using (public.is_admin());

create or replace function public.setting(path text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select data #> path from public.platform_settings where id = 1
$$;

-- Safe subset any visitor may read.
create or replace function public.get_public_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'allowCollection', data #> '{marketplace,allowCollection}',
    'maxImagesPerListing', data #> '{marketplace,maxImagesPerListing}',
    'commissionRatePercent', data #> '{commission,ratePercent}',
    'matching', data -> 'matching'
  ) from public.platform_settings where id = 1
$$;
grant execute on function public.get_public_config() to anon, authenticated;

-------------------------------------------------------------------------------- Notifications & audit
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  title text not null,
  body text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notifications: read own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications: mark own read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify(p_user uuid, p_category public.notification_category, p_title text, p_body text, p_href text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, category, title, body, href) values (p_user, p_category, p_title, p_body, p_href)
$$;
revoke execute on function public.notify(uuid, public.notification_category, text, text, text) from public, anon, authenticated;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid references public.profiles (id),
  actor text not null,
  action text not null,
  target_type text not null,
  target_label text not null,
  detail text
);
alter table public.audit_log enable row level security;
create policy "audit: admin read" on public.audit_log for select using (public.is_admin());

create or replace function public.audit(p_action text, p_target_type text, p_target_label text, p_detail text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, actor, action, target_type, target_label, detail)
  select auth.uid(), coalesce(nullif(full_name, ''), email), p_action, p_target_type, p_target_label, nullif(p_detail, '')
  from public.profiles where id = auth.uid()
$$;
revoke execute on function public.audit(text, text, text, text) from public, anon, authenticated;

create or replace function public.require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only HeyCileng administrators can do this.'; end if;
end $$;

-------------------------------------------------------------------------------- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(name) between 3 and 120),
  category text not null check (category in ('crop_residues','husks_shells','peels_pulp','cobs_bagasse','tree_crop','processing','livestock','fibre')),
  description text not null default '',
  unit public.unit not null,
  listed_quantity numeric not null check (listed_quantity > 0),
  reserved_quantity numeric not null default 0 check (reserved_quantity >= 0),
  sold_quantity numeric not null default 0 check (sold_quantity >= 0),
  min_order_quantity numeric not null check (min_order_quantity > 0),
  price_per_unit numeric not null check (price_per_unit > 0),
  state text not null,
  area text not null,
  quality_tags text[] not null default '{}',
  quality_specifications text not null default '',
  applications text[] not null default '{}',
  images jsonb not null default '[]',
  status public.listing_status not null default 'pending_review',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_stock_ok check (reserved_quantity + sold_quantity <= listed_quantity)
);
create index listings_seller_idx on public.listings (seller_id);
create index listings_status_idx on public.listings (status, category);

-- Sellers manage content; stock counters, review fields and approval are server-controlled.
create or replace function public.guard_listing_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  bypass boolean := coalesce(current_setting('app.bypass_guard', true), '') = 'on';
begin
  if bypass or public.is_admin() then
    new.updated_at := now();
    return new;
  end if;
  if tg_op = 'INSERT' then
    if public.my_role() <> 'seller' then raise exception 'Only seller accounts can create listings.'; end if;
    if (select status from public.profiles where id = auth.uid()) = 'suspended' then raise exception 'Your account is suspended.'; end if;
    new.seller_id := auth.uid();
    new.reserved_quantity := 0;
    new.sold_quantity := 0;
    new.review_note := null;
    new.status := case when (public.setting('{marketplace,requireListingReview}'))::boolean then 'pending_review' else 'active' end;
    new.created_at := now();
  else
    if new.seller_id <> old.seller_id or new.reserved_quantity <> old.reserved_quantity or new.sold_quantity <> old.sold_quantity
       or new.review_note is distinct from old.review_note then
      raise exception 'Stock counters and review notes are managed by HeyCileng.';
    end if;
    if new.unit <> old.unit and old.reserved_quantity + old.sold_quantity > 0 then
      raise exception 'The unit can’t change once stock has been reserved or sold.';
    end if;
    if new.status <> old.status and not (old.status = 'active' and new.status = 'paused') and not (old.status = 'paused' and new.status = 'active') then
      raise exception 'You can only pause or resume a listing.';
    end if;
    -- Editing a rejected listing resubmits it for review.
    if old.status = 'rejected' then new.status := 'pending_review'; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger listings_guard before insert or update on public.listings
  for each row execute function public.guard_listing_write();

alter table public.listings enable row level security;
create policy "listings: public read" on public.listings for select using (
  (status in ('active', 'sold_out') and exists (select 1 from public.profiles p where p.id = seller_id and p.status = 'active'))
  or seller_id = auth.uid() or public.is_admin()
);
create policy "listings: seller insert" on public.listings for insert with check (seller_id = auth.uid());
create policy "listings: seller update" on public.listings for update using (seller_id = auth.uid() or public.is_admin());

create table public.saved_listings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.saved_listings enable row level security;
create policy "saved: own" on public.saved_listings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-------------------------------------------------------------------------------- Requirements
create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(title) between 4 and 140),
  category text not null,
  quantity numeric not null check (quantity > 0),
  unit public.unit not null,
  budget_min numeric,
  budget_max numeric not null check (budget_max > 0),
  preferred_location text not null,
  max_delivery_distance_km integer not null check (max_delivery_distance_km > 0),
  intended_application text not null,
  quality_requirements text[] not null default '{}',
  quality_specifications text not null default '',
  additional_specifications text not null default '',
  expires_at date not null,
  status public.requirement_status not null default 'active' check (status <> 'expired'),
  created_at timestamptz not null default now(),
  constraint requirements_budget_ok check (budget_min is null or budget_min <= budget_max)
);
create index requirements_buyer_idx on public.requirements (buyer_id);
alter table public.requirements enable row level security;
create policy "requirements: buyer own" on public.requirements for all
  using (buyer_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() and public.my_role() = 'buyer');

-- Anonymised active requirements for sellers' "potential buyers" — no buyer identity.
create view public.requirements_open as
  select r.id, r.title, r.category, r.quantity, r.unit, r.budget_min, r.budget_max, r.preferred_location,
         r.max_delivery_distance_km, r.intended_application, r.quality_requirements, r.quality_specifications,
         r.additional_specifications, r.expires_at, r.status, r.created_at
  from public.requirements r join public.profiles p on p.id = r.buyer_id
  where r.status = 'active' and r.expires_at >= current_date and p.status = 'active' and r.buyer_id <> auth.uid();
grant select on public.requirements_open to authenticated;

-------------------------------------------------------------------------------- Logistics partners
create table public.logistics_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 2),
  coverage_states text[] not null check (cardinality(coverage_states) > 0),
  vehicle_types text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text not null default '',
  created_at timestamptz not null default now()
);
alter table public.logistics_partners enable row level security;
create policy "partners: admin" on public.logistics_partners for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.audit_partner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.audit(
    case when tg_op = 'INSERT' then 'Added logistics partner'
         when new.status <> old.status then case when new.status = 'active' then 'Activated logistics partner' else 'Deactivated logistics partner' end
         else 'Edited logistics partner' end,
    'partner', new.name);
  return new;
end $$;
create trigger partners_audit after insert or update on public.logistics_partners for each row execute function public.audit_partner();

-------------------------------------------------------------------------------- Orders
create sequence public.order_ref_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('HC-' || nextval('public.order_ref_seq')),
  listing_id uuid not null references public.listings (id),
  listing jsonb not null,
  buyer_id uuid not null references public.profiles (id),
  buyer_business_name text not null,
  seller_id uuid not null references public.profiles (id),
  quantity numeric not null check (quantity > 0),
  subtotal numeric not null,
  fulfilment public.fulfilment_method not null,
  delivery_address text,
  preferred_date date,
  buyer_note text,
  status public.order_status not null default 'pending',
  delivery jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_seller_idx on public.orders (seller_id, created_at desc);
alter table public.orders enable row level security;
-- Buyers and admins read orders directly. Sellers use seller_orders (no address or buyer note).
create policy "orders: buyer or admin read" on public.orders for select using (buyer_id = auth.uid() or public.is_admin());

create view public.seller_orders as
  select id, reference, listing_id, listing, buyer_id, buyer_business_name, seller_id, quantity, subtotal,
         fulfilment, preferred_date, status, delivery, created_at, updated_at
  from public.orders where seller_id = auth.uid();
grant select on public.seller_orders to authenticated;

-- Defined after orders exist. Sellers may delete a listing only when nothing is reserved or open.
create policy "listings: seller delete when no open orders" on public.listings for delete using (
  listings.seller_id = auth.uid() and listings.reserved_quantity = 0
  and not exists (select 1 from public.orders o where o.listing_id = listings.id and o.status in ('pending','accepted','processing','dispatched','ready_for_collection','delivery_failed'))
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  at timestamptz not null default now(),
  status public.order_status,
  title text not null,
  description text,
  actor text not null check (actor in ('buyer', 'seller', 'heycileng', 'system'))
);
create index order_events_order_idx on public.order_events (order_id, at);
alter table public.order_events enable row level security;
create policy "events: parties read" on public.order_events for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid()))
  or public.is_admin()
);

create or replace function public.add_event(p_order uuid, p_title text, p_actor text, p_status public.order_status default null, p_description text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_events (order_id, title, actor, status, description) values (p_order, p_title, p_actor, p_status, nullif(p_description, ''));
  update public.orders set updated_at = now(), status = coalesce(p_status, status) where id = p_order;
end $$;
revoke execute on function public.add_event(uuid, text, text, public.order_status, text) from public, anon, authenticated;

create or replace function public.fmt_qty(q numeric, u public.unit) returns text language sql immutable as $$
  select trim(to_char(q, 'FM999G999G990D##'), '.') || ' ' || case u when 'kg' then 'kg' when 'tonne' then case when q = 1 then 'tonne' else 'tonnes' end else case when q = 1 then 'bag' else 'bags' end end
$$;

-- Buyer: request an order. Never reserves stock.
create or replace function public.request_order(p_listing uuid, p_quantity numeric, p_fulfilment public.fulfilment_method, p_address text, p_preferred date, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  l public.listings;
  s public.profiles;
  available numeric;
  new_id uuid;
  ref text;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.role is distinct from 'buyer' or me.status <> 'active' then raise exception 'Only active buyer accounts can request orders.'; end if;
  select * into l from public.listings where id = p_listing for update;
  select * into s from public.profiles where id = l.seller_id;
  if l.id is null or l.status <> 'active' or s.status <> 'active' then raise exception 'This listing isn’t available.'; end if;
  available := l.listed_quantity - l.reserved_quantity - l.sold_quantity;
  if p_quantity < l.min_order_quantity then raise exception 'The minimum order is %.', public.fmt_qty(l.min_order_quantity, l.unit); end if;
  if p_quantity > available then raise exception 'Only % is currently available.', public.fmt_qty(available, l.unit); end if;
  if p_fulfilment = 'collection' and not (public.setting('{marketplace,allowCollection}'))::boolean then raise exception 'Collection isn’t available right now.'; end if;
  if p_fulfilment = 'delivery' and length(coalesce(trim(p_address), '')) < 10 then raise exception 'Enter the full delivery address.'; end if;

  insert into public.orders (listing_id, listing, buyer_id, buyer_business_name, seller_id, quantity, subtotal, fulfilment, delivery_address, preferred_date, buyer_note, delivery)
  values (
    l.id,
    jsonb_build_object('name', l.name, 'category', l.category, 'unit', l.unit, 'pricePerUnit', l.price_per_unit,
      'sellerBusinessName', s.business_name, 'sellerLocation', jsonb_build_object('state', l.state, 'area', l.area)),
    me.id, coalesce(nullif(me.business_name, ''), me.full_name), l.seller_id, p_quantity, p_quantity * l.price_per_unit,
    p_fulfilment, case when p_fulfilment = 'delivery' then trim(p_address) end, p_preferred, nullif(trim(coalesce(p_note, '')), ''),
    case when p_fulfilment = 'delivery' then '{"status":"not_assigned","history":[]}'::jsonb end
  ) returning id, reference into new_id, ref;

  perform public.add_event(new_id, 'Order request sent', 'buyer', 'pending', 'Waiting for the seller to respond. Stock is not reserved until the seller accepts.');
  perform public.notify(me.id, 'order', 'Order request ' || ref || ' sent', l.name || ' · ' || public.fmt_qty(p_quantity, l.unit) || '. You’ll be notified when the seller responds.', '/buyer/orders/' || new_id);
  perform public.notify(l.seller_id, 'order', 'New order request ' || ref, l.name || ' · ' || public.fmt_qty(p_quantity, l.unit) || '. Review and accept or decline.', '/seller/orders/' || new_id);
  return new_id;
end $$;

-- Buyer: cancel a pending or accepted order (releases any reservation).
create or replace function public.buyer_cancel_order(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found.'; end if;
  if o.status not in ('pending', 'accepted') then raise exception 'This order can no longer be cancelled. Contact HeyCileng support for help.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  if o.status = 'accepted' then
    update public.listings set reserved_quantity = greatest(0, reserved_quantity - o.quantity) where id = o.listing_id;
  end if;
  perform public.add_event(o.id, 'Cancelled by buyer', 'buyer', 'cancelled', p_reason);
  perform public.notify(o.seller_id, 'order', 'Order ' || o.reference || ' was cancelled', 'The buyer cancelled this order. Any reserved stock has been released.', '/seller/orders/' || o.id);
end $$;

-- Seller: accept (reserves stock), decline, start processing.
create or replace function public.seller_respond(p_order uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  l public.listings;
  available numeric;
begin
  select * into o from public.orders where id = p_order and seller_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  if p_action = 'accept' then
    if o.status <> 'pending' then raise exception 'Only pending requests can be accepted.'; end if;
    select * into l from public.listings where id = o.listing_id for update;
    available := l.listed_quantity - l.reserved_quantity - l.sold_quantity;
    if o.quantity > available then
      raise exception 'Only % is available, but this order needs %. Update your listing or decline the request.', public.fmt_qty(available, l.unit), public.fmt_qty(o.quantity, l.unit);
    end if;
    update public.listings set reserved_quantity = reserved_quantity + o.quantity where id = l.id;
    perform public.add_event(o.id, 'Seller accepted the order', 'seller', 'accepted', 'The requested quantity is now reserved for this order.');
    if o.fulfilment = 'delivery' then
      perform public.add_event(o.id, 'Awaiting logistics assignment', 'heycileng', null, 'HeyCileng will assign a logistics partner and confirm the delivery fee.');
    end if;
    perform public.notify(o.buyer_id, 'order', 'Seller accepted order ' || o.reference, (o.listing->>'name') || '. HeyCileng will arrange the next steps.', '/buyer/orders/' || o.id);
  elsif p_action = 'decline' then
    if o.status <> 'pending' then raise exception 'Only pending requests can be declined.'; end if;
    perform public.add_event(o.id, 'Seller declined the order', 'seller', 'declined', p_reason);
    perform public.notify(o.buyer_id, 'order', 'Order ' || o.reference || ' was declined', 'The seller couldn’t fulfil this request. No stock was reserved and nothing was charged.', '/buyer/orders/' || o.id);
  elsif p_action = 'process' then
    if o.status <> 'accepted' then raise exception 'Only accepted orders can move to processing.'; end if;
    perform public.add_event(o.id, 'Order is being prepared', 'seller', 'processing');
    perform public.notify(o.buyer_id, 'order', 'Order ' || o.reference || ' is being prepared', 'The seller has started preparing your order.', '/buyer/orders/' || o.id);
  else
    raise exception 'Unknown action.';
  end if;
end $$;

create or replace function public.notify_parties(o public.orders, p_category public.notification_category, p_title text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(o.buyer_id, p_category, p_title, p_body, '/buyer/orders/' || o.id);
  perform public.notify(o.seller_id, p_category, p_title, p_body, '/seller/orders/' || o.id);
end $$;
revoke execute on function public.notify_parties(public.orders, public.notification_category, text, text) from public, anon, authenticated;

-- Reserved stock becomes sold.
create or replace function public.settle_stock(o public.orders) returns void
language sql security definer set search_path = public as $$
  update public.listings set reserved_quantity = greatest(0, reserved_quantity - o.quantity), sold_quantity = sold_quantity + o.quantity where id = o.listing_id
$$;
revoke execute on function public.settle_stock(public.orders) from public, anon, authenticated;

-- Admin: assign or update the logistics partner for a delivery order.
create or replace function public.admin_assign_delivery(p_order uuid, p_partner uuid, p_fee numeric, p_fee_payer text, p_estimated date, p_tracking text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  p public.logistics_partners;
  reassigning boolean;
  summary text;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.fulfilment <> 'delivery' then raise exception 'This is a collection order — it doesn’t need a logistics partner.'; end if;
  if o.status not in ('accepted', 'processing', 'delivery_failed') then raise exception 'Logistics can be assigned once the seller has accepted the order.'; end if;
  select * into p from public.logistics_partners where id = p_partner;
  if p.id is null then raise exception 'That logistics partner doesn’t exist.'; end if;
  if p.status <> 'active' then raise exception '% is inactive and can’t take new deliveries.', p.name; end if;
  if p_fee is null or p_fee < 0 then raise exception 'Enter a valid delivery fee.'; end if;
  if p_fee_payer not in ('buyer', 'seller', 'heycileng') then raise exception 'Choose who pays the delivery fee.'; end if;
  if p_estimated is null then raise exception 'Choose an estimated delivery date.'; end if;
  reassigning := o.delivery ? 'partnerId';
  update public.orders set delivery = coalesce(delivery, '{"history":[]}'::jsonb) || jsonb_build_object(
      'status', 'assigned', 'partnerId', p.id, 'partnerName', p.name, 'fee', p_fee, 'feePayer', p_fee_payer, 'estimatedDate', p_estimated,
      'trackingReference', coalesce(nullif(trim(p_tracking), ''), delivery->>'trackingReference'),
      'history', coalesce(delivery->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'status', 'assigned', 'note', coalesce(nullif(trim(p_note), ''), p.name || ' assigned by HeyCileng.'))))
  where id = o.id;
  summary := p.name || ' · delivery fee ₦' || to_char(p_fee, 'FM999G999G999') || ' paid by ' || case p_fee_payer when 'heycileng' then 'HeyCileng' else 'the ' || p_fee_payer end || ' · estimated ' || to_char(p_estimated, 'DD Mon YYYY');
  perform public.add_event(o.id, case when reassigning then 'Logistics partner updated' else 'Logistics partner assigned' end, 'heycileng', null, summary);
  perform public.notify_parties(o, 'delivery', 'Delivery arranged for ' || o.reference, summary);
  perform public.audit(case when reassigning then 'Updated logistics' else 'Assigned logistics partner' end, 'order', o.reference, summary);
end $$;

-- Admin: move a delivery forward. in_transit → dispatched; delivered → completed (stock sold); failed → delivery_failed.
create or replace function public.admin_update_delivery(p_order uuid, p_status text, p_note text, p_estimated date, p_tracking text)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  current_status text;
  allowed text[];
  rescheduled boolean;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.fulfilment <> 'delivery' or not (o.delivery ? 'partnerId') then raise exception 'Assign a logistics partner before updating the delivery.'; end if;
  current_status := o.delivery->>'status';
  allowed := case current_status
    when 'assigned' then array['scheduled', 'in_transit']
    when 'scheduled' then array['in_transit', 'failed']
    when 'in_transit' then array['delivered', 'failed']
    when 'failed' then array['scheduled', 'in_transit']
    else array[]::text[] end;
  if not p_status = any (allowed) then raise exception 'A % delivery can’t move to %.', replace(current_status, '_', ' '), replace(p_status, '_', ' '); end if;
  if p_status = 'failed' and length(coalesce(trim(p_note), '')) = 0 then raise exception 'Add a note explaining why the delivery failed.'; end if;
  rescheduled := o.status = 'delivery_failed';

  perform set_config('app.bypass_guard', 'on', true);
  update public.orders set delivery = delivery || jsonb_build_object(
      'status', p_status,
      'estimatedDate', coalesce(p_estimated::text, delivery->>'estimatedDate'),
      'trackingReference', coalesce(nullif(trim(p_tracking), ''), delivery->>'trackingReference'),
      'history', coalesce(delivery->'history', '[]'::jsonb) || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('at', now(), 'status', p_status, 'note', nullif(trim(p_note), '')))))
  where id = o.id;

  if p_status = 'in_transit' then
    perform public.add_event(o.id, 'Order dispatched', 'heycileng', 'dispatched', coalesce(nullif(trim(p_note), ''), 'Picked up by the assigned logistics partner.'));
    perform public.notify_parties(o, 'delivery', 'Order ' || o.reference || ' is on its way', 'Picked up by the logistics partner.');
  elsif p_status = 'delivered' then
    perform public.settle_stock(o);
    perform public.add_event(o.id, 'Delivered', 'heycileng', 'completed', coalesce(nullif(trim(p_note), ''), 'Delivery confirmed by HeyCileng.'));
    perform public.notify_parties(o, 'order', 'Order ' || o.reference || ' delivered', (o.listing->>'name') || ' delivered and confirmed by HeyCileng.');
  elsif p_status = 'failed' then
    perform public.add_event(o.id, 'Delivery failed', 'heycileng', 'delivery_failed', trim(p_note) || ' HeyCileng support will follow up.');
    perform public.notify_parties(o, 'delivery', 'Delivery problem with ' || o.reference, 'The delivery couldn’t be completed. HeyCileng support will contact you to rearrange.');
  else
    perform public.add_event(o.id, case when rescheduled then 'Delivery rescheduled' else 'Delivery scheduled' end, 'heycileng', case when rescheduled then 'processing'::public.order_status end, p_note);
    perform public.notify_parties(o, 'delivery', 'Delivery ' || case when rescheduled then 'rescheduled' else 'scheduled' end || ' for ' || o.reference, coalesce(nullif(trim(p_note), ''), 'Delivery schedule updated.'));
  end if;
  perform public.audit('Marked delivery ' || replace(p_status, '_', ' '), 'order', o.reference, p_note);
end $$;

-- Admin: collection orders.
create or replace function public.admin_collection(p_order uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.fulfilment <> 'collection' then raise exception 'Only collection orders can be marked ready for collection.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  if p_action = 'ready' then
    if o.status not in ('accepted', 'processing') then raise exception 'The order must be accepted or processing first.'; end if;
    update public.orders set delivery = jsonb_build_object('status', 'ready_for_collection', 'history', coalesce(delivery->'history', '[]'::jsonb) || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('at', now(), 'status', 'ready_for_collection', 'note', nullif(trim(p_note), ''))))) where id = o.id;
    perform public.add_event(o.id, 'Ready for collection', 'heycileng', 'ready_for_collection', coalesce(nullif(trim(p_note), ''), 'HeyCileng will share collection instructions with the buyer.'));
    perform public.notify_parties(o, 'order', 'Order ' || o.reference || ' is ready for collection', coalesce(nullif(trim(p_note), ''), 'HeyCileng will share the collection point and instructions.'));
    perform public.audit('Marked ready for collection', 'order', o.reference);
  elsif p_action = 'collected' then
    if o.status <> 'ready_for_collection' then raise exception 'Only orders that are ready for collection can be marked collected.'; end if;
    update public.orders set delivery = jsonb_build_object('status', 'collected', 'history', coalesce(delivery->'history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'status', 'collected'))) where id = o.id;
    perform public.settle_stock(o);
    perform public.add_event(o.id, 'Collected', 'heycileng', 'completed', 'Collection confirmed by HeyCileng.');
    perform public.notify_parties(o, 'order', 'Order ' || o.reference || ' completed', 'Collection confirmed by HeyCileng.');
    perform public.audit('Confirmed collection', 'order', o.reference);
  else
    raise exception 'Unknown action.';
  end if;
end $$;

-- Admin: cancel an open order, releasing any reservation.
create or replace function public.admin_cancel_order(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.status in ('completed', 'cancelled', 'declined') then raise exception 'This order is already closed.'; end if;
  if length(coalesce(trim(p_reason), '')) = 0 then raise exception 'Add a reason for cancelling.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  if o.status in ('accepted', 'processing', 'dispatched', 'ready_for_collection', 'delivery_failed') then
    update public.listings set reserved_quantity = greatest(0, reserved_quantity - o.quantity) where id = o.listing_id;
  end if;
  perform public.add_event(o.id, 'Cancelled by HeyCileng', 'heycileng', 'cancelled', trim(p_reason));
  perform public.notify_parties(o, 'order', 'Order ' || o.reference || ' was cancelled', 'HeyCileng cancelled this order. Any reserved stock has been released. Contact support for details.');
  perform public.audit('Cancelled order', 'order', o.reference, trim(p_reason));
end $$;

-------------------------------------------------------------------------------- Admin: users & listings
create or replace function public.admin_set_account_status(p_user uuid, p_status public.account_status, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare u public.profiles;
begin
  perform public.require_admin();
  select * into u from public.profiles where id = p_user for update;
  if u.id is null then raise exception 'Account not found.'; end if;
  if u.role = 'admin' then raise exception 'Administrator accounts are managed outside the dashboard.'; end if;
  if p_status = 'suspended' and length(coalesce(trim(p_reason), '')) = 0 then raise exception 'Add a reason for the suspension.'; end if;
  if u.status = p_status then raise exception 'This account is already %.', p_status; end if;
  update public.profiles set status = p_status, suspension_reason = case when p_status = 'suspended' then trim(p_reason) end where id = u.id;
  perform public.notify(u.id, 'account',
    case when p_status = 'suspended' then 'Your account has been suspended' else 'Your account is active again' end,
    case when p_status = 'suspended' then 'Reason: ' || trim(p_reason) || ' Contact HeyCileng support if you think this is a mistake.' else 'You can use HeyCileng as normal.' end);
  perform public.audit(case when p_status = 'suspended' then 'Suspended account' else 'Reactivated account' end, 'user', coalesce(nullif(u.business_name, ''), u.email), p_reason);
end $$;

create or replace function public.admin_review_listing(p_listing uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  l public.listings;
  next_status public.listing_status;
  label text;
begin
  perform public.require_admin();
  select * into l from public.listings where id = p_listing for update;
  if l.id is null then raise exception 'Listing not found.'; end if;
  if p_action = 'approve' and l.status = 'pending_review' then next_status := 'active'; label := 'approved';
  elsif p_action = 'reject' and l.status = 'pending_review' then next_status := 'rejected'; label := 'rejected';
  elsif p_action = 'suspend' and l.status in ('active', 'paused', 'sold_out') then next_status := 'suspended'; label := 'suspended';
  elsif p_action = 'reinstate' and l.status in ('suspended', 'rejected') then next_status := 'active'; label := 'reinstated';
  else raise exception 'A % listing can’t be %.', replace(l.status::text, '_', ' '), p_action || 'd'; end if;
  if p_action in ('reject', 'suspend') and length(coalesce(trim(p_reason), '')) = 0 then raise exception 'Add a reason — it’s shared with the seller.'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.listings set status = next_status, review_note = case when p_action in ('reject', 'suspend') then trim(p_reason) end where id = l.id;
  perform public.notify(l.seller_id, 'listing', 'Listing ' || label,
    '“' || l.name || '” ' || case label when 'approved' then 'is now live in the marketplace.' when 'reinstated' then 'is active again.'
      when 'rejected' then 'wasn’t approved. Reason: ' || trim(p_reason) else 'has been suspended by HeyCileng. Reason: ' || trim(p_reason) end,
    '/seller/listings/' || l.id || '/edit');
  perform public.audit(initcap(label) || ' listing', 'listing', l.name, p_reason);
end $$;

-------------------------------------------------------------------------------- Support
create sequence public.ticket_ref_seq start 201;
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('HC-SUP-' || nextval('public.ticket_ref_seq')),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  category text not null check (category in ('order', 'delivery', 'listing', 'account', 'payment', 'other')),
  order_id uuid references public.orders (id),
  order_reference text,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author text not null check (author in ('user', 'heycileng')),
  body text not null,
  at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
create policy "tickets: own or admin" on public.support_tickets for select using (requester_id = auth.uid() or public.is_admin());
create policy "messages: own or admin" on public.ticket_messages for select using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.requester_id = auth.uid() or public.is_admin()))
);

create or replace function public.create_ticket(p_subject text, p_category text, p_order uuid, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to contact support.'; end if;
  if length(trim(p_subject)) < 5 then raise exception 'Add a short subject.'; end if;
  if length(trim(p_message)) < 20 then raise exception 'Describe the issue in at least 20 characters.'; end if;
  if p_order is not null then
    select * into o from public.orders where id = p_order and (buyer_id = auth.uid() or seller_id = auth.uid());
    if o.id is null then raise exception 'That order isn’t yours.'; end if;
  end if;
  insert into public.support_tickets (requester_id, subject, category, order_id, order_reference)
  values (auth.uid(), trim(p_subject), p_category, o.id, o.reference) returning id into new_id;
  insert into public.ticket_messages (ticket_id, author, body) values (new_id, 'user', trim(p_message));
  return new_id;
end $$;

create or replace function public.user_ticket_action(p_ticket uuid, p_action text, p_message text default null)
returns void language plpgsql security definer set search_path = public as $$
declare t public.support_tickets;
begin
  select * into t from public.support_tickets where id = p_ticket and requester_id = auth.uid() for update;
  if t.id is null then raise exception 'Ticket not found.'; end if;
  if t.status = 'closed' then raise exception 'This ticket is closed. Open a new ticket if you need more help.'; end if;
  if p_action = 'reply' then
    if length(coalesce(trim(p_message), '')) < 2 then raise exception 'Write a message first.'; end if;
    insert into public.ticket_messages (ticket_id, author, body) values (t.id, 'user', trim(p_message));
    update public.support_tickets set updated_at = now(), status = case when status in ('awaiting_user', 'resolved') then 'open' else status end where id = t.id;
  elsif p_action = 'resolve' then
    if t.status = 'resolved' then raise exception 'This ticket is already resolved.'; end if;
    update public.support_tickets set status = 'resolved', updated_at = now() where id = t.id;
  else
    raise exception 'Unknown action.';
  end if;
end $$;

create or replace function public.admin_ticket_action(p_ticket uuid, p_status public.ticket_status, p_message text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.support_tickets;
  requester public.profiles;
begin
  perform public.require_admin();
  select * into t from public.support_tickets where id = p_ticket for update;
  if t.id is null then raise exception 'Ticket not found.'; end if;
  if p_message is not null then
    if t.status = 'closed' then raise exception 'This ticket is closed.'; end if;
    if length(trim(p_message)) < 2 then raise exception 'Write a reply first.'; end if;
    insert into public.ticket_messages (ticket_id, author, body) values (t.id, 'heycileng', trim(p_message));
    select * into requester from public.profiles where id = t.requester_id;
    perform public.notify(t.requester_id, 'account', 'HeyCileng replied to ' || t.reference, t.subject, '/' || requester.role || '/support/' || t.id);
    perform public.audit('Replied to support ticket', 'ticket', t.reference, replace(p_status::text, '_', ' '));
  else
    perform public.audit('Set ticket to ' || replace(p_status::text, '_', ' '), 'ticket', t.reference);
  end if;
  update public.support_tickets set status = p_status, updated_at = now() where id = t.id;
end $$;

-------------------------------------------------------------------------------- Disputes & announcements
create sequence public.dispute_ref_seq start 11;
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('HC-DSP-' || nextval('public.dispute_ref_seq')),
  order_id uuid not null references public.orders (id),
  raised_by text not null check (raised_by in ('buyer', 'seller')),
  reason text not null check (reason in ('quality', 'quantity', 'delivery', 'damaged', 'other')),
  description text not null,
  status public.dispute_status not null default 'open',
  resolution text,
  notes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.disputes enable row level security;
create policy "disputes: admin" on public.disputes for select using (public.is_admin());

create or replace function public.admin_open_dispute(p_order uuid, p_raised_by text, p_reason text, p_description text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; o public.orders;
begin
  perform public.require_admin();
  select * into o from public.orders where id = p_order;
  if o.id is null then raise exception 'Order not found.'; end if;
  insert into public.disputes (order_id, raised_by, reason, description) values (o.id, p_raised_by, p_reason, trim(p_description)) returning id into new_id;
  perform public.audit('Opened dispute', 'dispute', o.reference, p_description);
  return new_id;
end $$;

create or replace function public.admin_update_dispute(p_dispute uuid, p_status public.dispute_status, p_resolution text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.disputes;
begin
  perform public.require_admin();
  select * into d from public.disputes where id = p_dispute for update;
  if d.id is null then raise exception 'Dispute not found.'; end if;
  if p_status in ('resolved', 'rejected') and length(coalesce(trim(p_resolution), '')) = 0 then raise exception 'Record the outcome before closing the dispute.'; end if;
  update public.disputes set
    status = coalesce(p_status, status),
    resolution = coalesce(nullif(trim(p_resolution), ''), resolution),
    notes = case when length(coalesce(trim(p_note), '')) > 0 then notes || jsonb_build_array(jsonb_build_object('at', now(), 'body', trim(p_note))) else notes end,
    updated_at = now()
  where id = d.id;
  perform public.audit(case when p_status is not null and p_status <> d.status then 'Set dispute to ' || replace(p_status::text, '_', ' ') else 'Added dispute note' end,
    'dispute', d.reference, coalesce(nullif(trim(p_resolution), ''), p_note));
end $$;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null check (audience in ('all', 'buyers', 'sellers')),
  published_at timestamptz not null default now(),
  published_by text not null
);
alter table public.announcements enable row level security;
create policy "announcements: admin" on public.announcements for select using (public.is_admin());

create or replace function public.admin_publish_announcement(p_title text, p_body text, p_audience text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; me public.profiles;
begin
  perform public.require_admin();
  if length(trim(p_title)) < 5 then raise exception 'Add a title of at least 5 characters.'; end if;
  if length(trim(p_body)) < 20 then raise exception 'Write at least 20 characters.'; end if;
  select * into me from public.profiles where id = auth.uid();
  insert into public.announcements (title, body, audience, published_by) values (trim(p_title), trim(p_body), p_audience, coalesce(nullif(me.full_name, ''), me.email)) returning id into new_id;
  insert into public.notifications (user_id, category, title, body)
    select id, 'announcement', trim(p_title), trim(p_body) from public.profiles
    where role <> 'admin' and status <> 'suspended' and (p_audience = 'all' or (role::text || 's') = p_audience);
  perform public.audit('Published announcement', 'announcement', trim(p_title), 'Audience: ' || p_audience);
  return new_id;
end $$;

-------------------------------------------------------------------------------- Settings update & contact
create or replace function public.admin_update_settings(p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  total numeric;
  changed text;
begin
  perform public.require_admin();
  select sum(value::numeric) into total from jsonb_each_text(p_data #> '{matching,weights}');
  if total is distinct from 100 then raise exception 'Matching weights must add up to 100 (currently %).', coalesce(total, 0); end if;
  if (p_data #>> '{matching,weights,material}')::numeric < 1 then raise exception 'Material compatibility must keep some weight.'; end if;
  if (p_data #>> '{commission,ratePercent}')::numeric not between 0 and 30 then raise exception 'Commission must be between 0%% and 30%%.'; end if;
  if (p_data #>> '{matching,minRecommendedScore}')::numeric not between 0 and 100 then raise exception 'Minimum score must be between 0 and 100.'; end if;
  if (p_data #>> '{marketplace,maxImagesPerListing}')::numeric not between 1 and 12 then raise exception 'Images per listing must be between 1 and 12.'; end if;
  select string_agg(k, ', ') into changed from jsonb_object_keys(p_data) k, public.platform_settings s
    where s.id = 1 and s.data -> k is distinct from p_data -> k;
  update public.platform_settings set data = p_data, updated_at = now() where id = 1;
  perform public.audit('Updated platform settings', 'settings', coalesce(changed, 'No changes'));
end $$;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  organisation text,
  topic text not null,
  message text not null check (length(message) between 20 and 5000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "contact: anyone can send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "contact: admin read" on public.contact_messages for select using (public.is_admin());

-------------------------------------------------------------------------------- Function grants
grant execute on function
  public.request_order(uuid, numeric, public.fulfilment_method, text, date, text),
  public.buyer_cancel_order(uuid, text),
  public.seller_respond(uuid, text, text),
  public.admin_assign_delivery(uuid, uuid, numeric, text, date, text, text),
  public.admin_update_delivery(uuid, text, text, date, text),
  public.admin_collection(uuid, text, text),
  public.admin_cancel_order(uuid, text),
  public.admin_set_account_status(uuid, public.account_status, text),
  public.admin_review_listing(uuid, text, text),
  public.create_ticket(text, text, uuid, text),
  public.user_ticket_action(uuid, text, text),
  public.admin_ticket_action(uuid, public.ticket_status, text),
  public.admin_open_dispute(uuid, text, text, text),
  public.admin_update_dispute(uuid, public.dispute_status, text, text),
  public.admin_publish_announcement(text, text, text),
  public.admin_update_settings(jsonb)
to authenticated;

-------------------------------------------------------------------------------- Storage: listing images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "listing images: public read" on storage.objects for select using (bucket_id = 'listing-images');
create policy "listing images: sellers upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing images: sellers delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
