-- 014 · Operations functions: invitations, route editing, stock, API keys, GPS batches, webhooks

alter table public.vehicles add column if not exists fuel_l_per_100km numeric(4,1) default 7.5;

-- ---------- Webhook endpoints (merchant gets order status updates) ----------
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  events text[] not null default array['out_for_delivery','delivered','failed_attempt','returned_to_merchant','cancelled'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_merchant_idx on public.webhook_endpoints(merchant_id);
create index if not exists webhook_endpoints_org_idx on public.webhook_endpoints(org_id);
alter table public.webhook_endpoints enable row level security;
create policy staff_all on public.webhook_endpoints for all to authenticated
  using (private.has_role(org_id, private.role_set('mgr'))) with check (private.has_role(org_id, private.role_set('mgr')));
create policy merchant_all on public.webhook_endpoints for all to authenticated
  using (merchant_id in (select private.merchant_ids())) with check (merchant_id in (select private.merchant_ids()));

-- Queue a webhook message for every matching endpoint when an order changes status.
create or replace function private.queue_webhooks() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.merchant_id is null or new.status is not distinct from old.status then return new; end if;
  insert into public.outbound_messages (org_id, order_id, channel, template_key, to_address, body, status)
  select new.org_id, new.id, 'webhook', 'order.' || new.status, w.url,
         jsonb_build_object('event', 'order.' || new.status, 'order', jsonb_build_object(
           'code', new.code, 'tracking_code', new.tracking_code, 'merchant_ref', new.merchant_ref,
           'status', new.status, 'previous_status', old.status, 'cod_amount', new.cod_amount,
           'delivered_at', new.delivered_at, 'attempts', new.attempts), 'sent_at', now(), 'endpoint_id', w.id)::text,
         'pending'
    from public.webhook_endpoints w
   where w.merchant_id = new.merchant_id and w.active and new.status::text = any (w.events);
  return new;
end $$;
drop trigger if exists orders_webhooks on public.orders;
create trigger orders_webhooks after update of status on public.orders for each row execute function private.queue_webhooks();

-- ---------- Invitations ----------
create or replace function public.create_invitation(p_org uuid, p_role public.app_role, p_email text default null, p_phone text default null, p_hub uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_token text := encode(extensions.gen_random_bytes(20), 'hex'); v_id uuid;
begin
  if not private.has_role(p_org, private.role_set('mgr')) and not (p_role in ('driver','warehouse') and private.has_role(p_org, private.role_set('hr'))) then
    raise exception 'Only owners and admins can invite (HR can invite drivers and warehouse staff)' using errcode = '42501';
  end if;
  if p_role = 'owner' and not private.has_role(p_org, array['owner']::public.app_role[]) then
    raise exception 'Only an owner can invite another owner' using errcode = '42501';
  end if;
  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_phone), '') = '' then raise exception 'Give an email or a phone number'; end if;
  insert into public.invitations (org_id, email, phone, role, hub_id, token, invited_by, expires_at)
  values (p_org, nullif(lower(trim(p_email)), ''), nullif(regexp_replace(coalesce(p_phone, ''), '\s', '', 'g'), ''), p_role, p_hub, v_token, (select auth.uid()), now() + interval '7 days')
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'token', v_token, 'expires_at', now() + interval '7 days');
end $$;

create or replace function public.get_invitation(p_token text)
returns jsonb language sql security definer set search_path = '' stable as $$
  select jsonb_build_object('company', o.name, 'role', i.role, 'email', i.email, 'phone', i.phone,
                            'valid', i.accepted_at is null and i.expires_at > now())
    from public.invitations i join public.organizations o on o.id = i.org_id where i.token = p_token
$$;

create or replace function public.revoke_invitation(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.invitations i where i.id = p_id and i.accepted_at is null and private.has_role(i.org_id, private.role_set('mgr'));
end $$;

create or replace function public.set_member_role(p_membership uuid, p_role public.app_role, p_active boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.memberships;
begin
  select * into m from public.memberships where id = p_membership;
  if m.id is null or not private.has_role(m.org_id, private.role_set('mgr')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if m.user_id = (select auth.uid()) then raise exception 'You cannot change your own role'; end if;
  if (m.role = 'owner' or p_role = 'owner') and not private.has_role(m.org_id, array['owner']::public.app_role[]) then
    raise exception 'Only an owner can change owners' using errcode = '42501';
  end if;
  update public.memberships set role = p_role, active = p_active where id = p_membership;
end $$;

-- ---------- Route editing (dispatch) ----------
create or replace function private.resequence(p_route uuid) returns void
language sql security definer set search_path = '' as $$
  update public.route_stops s set sequence = x.rn
    from (select id, row_number() over (order by sequence, created_at) rn from public.route_stops where route_id = p_route) x
   where s.id = x.id and s.sequence is distinct from x.rn;
  update public.routes r set load_kg = (select coalesce(sum(o.weight_kg), 0) from public.route_stops s join public.orders o on o.id = s.order_id where s.route_id = p_route)
   where r.id = p_route;
$$;

create or replace function public.create_route(p_org uuid, p_date date, p_driver uuid default null, p_vehicle uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_n int; v_hub uuid; v_color text;
begin
  if not private.has_role(p_org, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select count(*) + 1 into v_n from public.routes where org_id = p_org and date = p_date;
  select id into v_hub from public.hubs where org_id = p_org order by is_default desc limit 1;
  select color, coalesce(p_vehicle, default_vehicle_id) into v_color, p_vehicle from public.drivers where id = p_driver;
  loop
    begin
      insert into public.routes (org_id, hub_id, date, code, driver_id, vehicle_id, status, color, planned_start)
      values (p_org, v_hub, p_date, 'PR-' || lpad(v_n::text, 2, '0'), p_driver, p_vehicle, 'draft',
              coalesce(v_color, (array['#5B5CF6','#0F9F5F','#D9740B','#1D72D8','#7C3AED','#DB2777','#0891B2','#65A30D'])[1 + (v_n - 1) % 8]),
              (p_date + time '08:30') at time zone 'Europe/Belgrade')
      returning id into v_id;
      exit;
    exception when unique_violation then v_n := v_n + 1;
    end;
  end loop;
  return v_id;
end $$;

create or replace function public.update_route(p_route uuid, p_driver uuid, p_vehicle uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.routes;
begin
  select * into r from public.routes where id = p_route;
  if r.id is null or not private.has_role(r.org_id, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.routes set driver_id = p_driver, vehicle_id = p_vehicle,
         color = coalesce((select color from public.drivers where id = p_driver), color) where id = p_route;
end $$;

-- Put an order on a route (or move it to another route) at a position (null = end).
create or replace function public.assign_order_to_route(p_order uuid, p_route uuid, p_position int default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.routes; o public.orders; v_old uuid; v_stop uuid;
begin
  select * into r from public.routes where id = p_route;
  select * into o from public.orders where id = p_order;
  if r.id is null or o.id is null or r.org_id <> o.org_id or not private.has_role(r.org_id, private.role_set('dispatch')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if r.status in ('completed', 'cancelled') then raise exception 'Route % is closed', r.code; end if;
  if o.status in ('delivered', 'cancelled', 'returned_to_merchant') then raise exception 'Order % is already closed', o.code; end if;
  select s.route_id into v_old from public.route_stops s join public.routes x on x.id = s.route_id
   where s.order_id = p_order and x.status not in ('completed', 'cancelled') limit 1;
  delete from public.route_stops s using public.routes x
   where s.order_id = p_order and x.id = s.route_id and x.status not in ('completed', 'cancelled') and s.status in ('pending', 'loaded');
  update public.route_stops set sequence = sequence + 1 where route_id = p_route and p_position is not null and sequence >= p_position;
  insert into public.route_stops (org_id, route_id, order_id, sequence, status)
  values (r.org_id, p_route, p_order, coalesce(p_position, (select coalesce(max(sequence), 0) + 1 from public.route_stops where route_id = p_route)), 'pending')
  returning id into v_stop;
  update public.orders set delivery_date = r.date where id = p_order and delivery_date is distinct from r.date;
  -- A route that is already out: the order goes straight to "assigned" so the driver sees it.
  if r.status in ('published', 'loading', 'in_progress') and o.status in ('confirmed', 'received', 'packed', 'rescheduled') then
    perform set_config('routa.via_rpc', 'on', true);
    update public.orders set status = 'assigned' where id = p_order;
    insert into public.notifications (org_id, user_id, type, title, body, link)
    select r.org_id, d.user_id, 'route_changed', 'New stop on ' || r.code, o.customer_name || ' · ' || coalesce(o.address_line, ''), '/'
      from public.drivers d where d.id = r.driver_id and d.user_id is not null;
  end if;
  perform private.resequence(p_route);
  if v_old is not null and v_old <> p_route then perform private.resequence(v_old); end if;
  return v_stop;
end $$;

create or replace function public.remove_stop(p_stop uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.route_stops; o public.orders;
begin
  select * into s from public.route_stops where id = p_stop;
  if s.id is null or not private.has_role(s.org_id, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if s.status not in ('pending', 'loaded') then raise exception 'This stop is already done'; end if;
  select * into o from public.orders where id = s.order_id;
  delete from public.route_stops where id = p_stop;
  if o.status = 'assigned' then
    perform set_config('routa.via_rpc', 'on', true);
    update public.orders set status = 'packed' where id = o.id;
  end if;
  perform private.resequence(s.route_id);
end $$;

-- Set the full order of a route's stops.
create or replace function public.resequence_route(p_route uuid, p_stop_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.routes;
begin
  select * into r from public.routes where id = p_route;
  if r.id is null or not private.has_role(r.org_id, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.route_stops s set sequence = x.ord
    from unnest(p_stop_ids) with ordinality as x(id, ord)
   where s.id = x.id and s.route_id = p_route;
  perform private.resequence(p_route);
end $$;

create or replace function public.delete_route(p_route uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.routes;
begin
  select * into r from public.routes where id = p_route;
  if r.id is null or not private.has_role(r.org_id, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if r.status <> 'draft' then raise exception 'Only draft routes can be deleted'; end if;
  delete from public.routes where id = p_route;
end $$;

-- ---------- Stock: reserve on order, pick on delivery, release on cancel ----------
create or replace function private.order_items_reserve() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_hub uuid; v_left int := new.qty; sl record; v_take int;
begin
  if new.sku_id is null or coalesce(new.qty, 0) <= 0 then return new; end if;
  select hub_id into v_hub from public.orders where id = new.order_id;
  for sl in select * from public.stock_levels where sku_id = new.sku_id and (v_hub is null or hub_id = v_hub) and on_hand - reserved > 0 order by on_hand - reserved desc loop
    v_take := least(v_left, sl.on_hand - sl.reserved);
    update public.stock_levels set reserved = reserved + v_take, updated_at = now() where id = sl.id;
    insert into public.stock_movements (org_id, sku_id, hub_id, bin_id, type, qty, order_id, actor_id, note)
    values (new.org_id, new.sku_id, sl.hub_id, sl.bin_id, 'reserve', v_take, new.order_id, (select auth.uid()), 'Reserved for order');
    v_left := v_left - v_take;
    exit when v_left = 0;
  end loop;
  if v_left > 0 then
    insert into public.tickets (org_id, order_id, type, title, description, priority)
    values (new.org_id, new.order_id, 'missing_parcel', 'Not enough stock', v_left || ' × item missing for this order', 1);
  end if;
  return new;
end $$;
drop trigger if exists order_items_reserve on public.order_items;
create trigger order_items_reserve after insert on public.order_items for each row execute function private.order_items_reserve();

create or replace function private.orders_stock_flow() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m record; v_type public.stock_movement_type;
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'delivered' then v_type := 'pick';
  elsif new.status = 'cancelled' then v_type := 'release';
  else return new; end if;
  for m in select sku_id, hub_id, bin_id, sum(case type when 'reserve' then qty when 'release' then -qty when 'pick' then -qty else 0 end) q
             from public.stock_movements where order_id = new.id group by 1, 2, 3 loop
    continue when m.q <= 0;
    update public.stock_levels set reserved = greatest(reserved - m.q, 0),
           on_hand = case when v_type = 'pick' then greatest(on_hand - m.q, 0) else on_hand end, updated_at = now()
     where sku_id = m.sku_id and hub_id = m.hub_id and bin_id is not distinct from m.bin_id;
    insert into public.stock_movements (org_id, sku_id, hub_id, bin_id, type, qty, order_id, note)
    values (new.org_id, m.sku_id, m.hub_id, m.bin_id, v_type, m.q, new.id, case v_type when 'pick' then 'Delivered' else 'Order cancelled' end);
  end loop;
  return new;
end $$;
drop trigger if exists orders_stock_flow on public.orders;
create trigger orders_stock_flow after update of status on public.orders for each row execute function private.orders_stock_flow();

-- Receive one inbound line into a bin.
create or replace function public.receive_inbound_line(p_line uuid, p_received int, p_damaged int default 0, p_bin uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare l public.inbound_lines; i public.inbound_shipments; v_bin uuid; v_delta int; v_dmg int;
begin
  select * into l from public.inbound_lines where id = p_line;
  select * into i from public.inbound_shipments where id = l.inbound_id;
  if l.id is null or not private.has_role(l.org_id, private.role_set('warehouse')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_received < 0 or p_damaged < 0 then raise exception 'Quantities cannot be negative'; end if;
  v_bin := coalesce(p_bin, l.bin_id);
  v_delta := p_received - coalesce(l.received_qty, 0);
  v_dmg := p_damaged - coalesce(l.damaged_qty, 0);
  update public.inbound_lines set received_qty = p_received, damaged_qty = p_damaged, bin_id = v_bin where id = p_line;
  if v_delta <> 0 then
    insert into public.stock_levels (org_id, sku_id, bin_id, hub_id, on_hand, reserved)
    values (l.org_id, l.sku_id, v_bin, i.hub_id, greatest(v_delta, 0), 0)
    on conflict (sku_id, hub_id, bin_id) do update set on_hand = greatest(public.stock_levels.on_hand + v_delta, 0), updated_at = now();
    insert into public.stock_movements (org_id, sku_id, hub_id, bin_id, type, qty, inbound_id, actor_id, note)
    values (l.org_id, l.sku_id, i.hub_id, v_bin, 'inbound', v_delta, i.id, (select auth.uid()), 'Received ' || i.code);
  end if;
  if v_dmg <> 0 then
    insert into public.stock_movements (org_id, sku_id, hub_id, bin_id, type, qty, inbound_id, actor_id, note)
    values (l.org_id, l.sku_id, i.hub_id, v_bin, 'damage', v_dmg, i.id, (select auth.uid()), 'Damaged on arrival ' || i.code);
  end if;
  if i.status in ('expected', 'in_transit') then update public.inbound_shipments set status = 'receiving', arrived_at = coalesce(arrived_at, now()) where id = i.id; end if;
end $$;

create or replace function public.adjust_stock(p_stock_level uuid, p_delta int, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.stock_levels;
begin
  select * into s from public.stock_levels where id = p_stock_level;
  if s.id is null or not private.has_role(s.org_id, private.role_set('warehouse')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'A reason is required'; end if;
  if s.on_hand + p_delta < s.reserved then raise exception 'Stock cannot go below what is reserved (%)', s.reserved; end if;
  update public.stock_levels set on_hand = on_hand + p_delta, updated_at = now() where id = p_stock_level;
  insert into public.stock_movements (org_id, sku_id, hub_id, bin_id, type, qty, actor_id, note)
  values (s.org_id, s.sku_id, s.hub_id, s.bin_id, 'adjust', p_delta, (select auth.uid()), p_note);
end $$;

-- ---------- API keys for the merchant API ----------
create or replace function public.create_api_key(p_merchant uuid, p_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare m public.merchants; v_key text := 'rk_live_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  select * into m from public.merchants where id = p_merchant;
  if m.id is null or not (m.id in (select private.merchant_ids()) or private.has_role(m.org_id, private.role_set('mgr'))) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  insert into public.api_keys (org_id, merchant_id, name, key_prefix, key_hash)
  values (m.org_id, m.id, coalesce(nullif(trim(p_name), ''), 'API key'), left(v_key, 14), encode(extensions.digest(v_key, 'sha256'), 'hex'));
  return v_key; -- shown once; only the hash is stored
end $$;

create or replace function public.revoke_api_key(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.api_keys k set revoked_at = now()
   where k.id = p_id and k.revoked_at is null
     and (k.merchant_id in (select private.merchant_ids()) or private.has_role(k.org_id, private.role_set('mgr')));
  if not found then raise exception 'Key not found' using errcode = '42501'; end if;
end $$;

-- ---------- Driver GPS in batches (offline-friendly) ----------
create or replace function public.record_locations(p_points jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare d public.drivers; v_route uuid; n int;
begin
  select * into d from public.drivers where user_id = (select auth.uid());
  if d.id is null then raise exception 'Not a driver' using errcode = '42501'; end if;
  select id into v_route from public.routes where driver_id = d.id and status in ('loading', 'in_progress') order by date desc limit 1;
  insert into public.driver_locations (org_id, driver_id, route_id, location, speed_kmh, heading, accuracy_m, battery, recorded_at)
  select d.org_id, d.id, v_route, extensions.st_setsrid(extensions.st_makepoint((p->>'lng')::float8, (p->>'lat')::float8), 4326),
         (p->>'speed')::numeric, (p->>'heading')::int, (p->>'accuracy')::numeric, (p->>'battery')::int,
         coalesce((p->>'at')::timestamptz, now())
    from jsonb_array_elements(p_points) p
   where (p->>'lat') is not null and (p->>'lng') is not null
   order by coalesce((p->>'at')::timestamptz, now());
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.create_invitation, public.revoke_invitation, public.set_member_role, public.create_route, public.update_route,
  public.assign_order_to_route, public.remove_stop, public.resequence_route, public.delete_route, public.receive_inbound_line,
  public.adjust_stock, public.create_api_key, public.revoke_api_key, public.record_locations from public, anon;
grant execute on function public.create_invitation, public.revoke_invitation, public.set_member_role, public.create_route, public.update_route,
  public.assign_order_to_route, public.remove_stop, public.resequence_route, public.delete_route, public.receive_inbound_line,
  public.adjust_stock, public.create_api_key, public.revoke_api_key, public.record_locations to authenticated;
grant execute on function public.get_invitation to anon, authenticated;
