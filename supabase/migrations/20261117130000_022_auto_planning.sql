-- 022 Automatic route planning + map pins
-- * set_order_pin: put an order on the map (by hand or from the address lookup); remembers the
--   address so the same customer/address is found instantly next time.
-- * find_cached_address: looks up remembered addresses (by phone or address text).
-- * apply_route_plan: saves a plan made by the plan-routes function. Replaces the day's DRAFT
--   routes; published / running routes are never touched.

create or replace function private.address_key(p_text text)
returns text language sql immutable set search_path = '' as $$
  select trim(regexp_replace(lower(translate(coalesce(p_text, ''), 'ëçËÇ', 'ecec')), '[^a-z0-9]+', ' ', 'g'))
$$;

create or replace function public.set_order_pin(p_order uuid, p_lat double precision, p_lng double precision, p_confidence numeric default 1, p_remember boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; v_key text;
begin
  select * into o from public.orders where id = p_order;
  if o.id is null or not private.has_role(o.org_id, private.role_set('orders_write')) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'Invalid coordinates'; end if;
  perform set_config('routa.via_rpc', 'on', true);
  update public.orders
     set location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326),
         geocode_confidence = least(greatest(coalesce(p_confidence, 1), 0), 1)
   where id = p_order
   returning * into o;
  if p_remember then
    v_key := private.address_key(concat_ws(' ', o.address_line, o.city));
    delete from public.address_cache where org_id = o.org_id and address_key = v_key and coalesce(phone, '') = coalesce(o.customer_phone, '');
    insert into public.address_cache (org_id, phone, address_key, normalized, location, confidence, confirmed)
    values (o.org_id, o.customer_phone, v_key, jsonb_build_object('address_line', o.address_line, 'city', o.city, 'landmark', o.landmark),
            o.location, o.geocode_confidence, coalesce(p_confidence, 1) >= 0.99);
  end if;
  return jsonb_build_object('zone', (select name from public.zones where id = o.zone_id), 'needs_pin', o.needs_pin);
end $$;

create or replace function public.find_cached_address(p_org uuid, p_address text, p_phone text default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when private.has_role(p_org, private.role_set('orders_write')) then (
    select jsonb_build_object('lat', extensions.st_y(location), 'lng', extensions.st_x(location), 'confidence', confidence, 'confirmed', confirmed)
      from public.address_cache
     where org_id = p_org
       and (address_key = private.address_key(p_address) or (p_phone is not null and phone = p_phone and confirmed))
     order by (address_key = private.address_key(p_address)) desc, confirmed desc, created_at desc
     limit 1) end
$$;

create or replace function public.apply_route_plan(p_org uuid, p_date date, p_plan jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_run uuid; v_hub uuid; v_route uuid; v_n int; r jsonb; s jsonb; v_seq int; v_routes int := 0; v_stops int := 0;
  v_colors text[] := array['#5B5CF6','#0F9F5F','#D9740B','#1D72D8','#7C3AED','#DB2777','#0891B2','#65A30D'];
begin
  if not private.has_role(p_org, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select id into v_hub from public.hubs where org_id = p_org order by is_default desc, created_at limit 1;

  -- clear the day's drafts (their orders go back to "not on a route")
  delete from public.route_stops s using public.routes x where s.route_id = x.id and x.org_id = p_org and x.date = p_date and x.status = 'draft';
  delete from public.pick_lists p using public.routes x where p.route_id = x.id and x.org_id = p_org and x.date = p_date and x.status = 'draft';
  delete from public.routes where org_id = p_org and date = p_date and status = 'draft';

  insert into public.optimization_runs (org_id, hub_id, date, status, settings, summary, unassigned, created_by, finished_at)
  values (p_org, v_hub, p_date, 'done', coalesce(p_plan -> 'settings', '{}'), coalesce(p_plan -> 'summary', '{}'), coalesce(p_plan -> 'unassigned', '[]'), (select auth.uid()), now())
  returning id into v_run;

  select count(*) into v_n from public.routes where org_id = p_org and date = p_date;
  for r in select * from jsonb_array_elements(coalesce(p_plan -> 'routes', '[]')) loop
    -- driver / vehicle must belong to this company
    if (r ->> 'driver_id') is not null and not exists (select 1 from public.drivers where id = (r ->> 'driver_id')::uuid and org_id = p_org) then continue; end if;
    if (r ->> 'vehicle_id') is not null and not exists (select 1 from public.vehicles where id = (r ->> 'vehicle_id')::uuid and org_id = p_org) then continue; end if;
    loop
      v_n := v_n + 1;
      begin
        insert into public.routes (org_id, hub_id, run_id, date, code, driver_id, vehicle_id, status, color, planned_km, planned_minutes, planned_start, planned_end, geometry)
        values (p_org, v_hub, v_run, p_date, 'PR-' || lpad(v_n::text, 2, '0'), (r ->> 'driver_id')::uuid, (r ->> 'vehicle_id')::uuid, 'draft',
                coalesce((select color from public.drivers where id = (r ->> 'driver_id')::uuid), v_colors[1 + (v_n - 1) % 8]),
                round((r ->> 'km')::numeric, 1), (r ->> 'minutes')::int, (r ->> 'start')::timestamptz, (r ->> 'end')::timestamptz,
                case when r ? 'geometry' and jsonb_typeof(r -> 'geometry') = 'object'
                     then extensions.st_setsrid(extensions.st_geomfromgeojson((r -> 'geometry')::text), 4326) end)
        returning id into v_route;
        exit;
      exception when unique_violation then null;
      end;
    end loop;
    v_seq := 0;
    for s in select * from jsonb_array_elements(coalesce(r -> 'stops', '[]')) loop
      -- only open orders of this company that are not on a live route
      if not exists (select 1 from public.orders o where o.id = (s ->> 'order_id')::uuid and o.org_id = p_org
                       and o.status in ('confirmed', 'received', 'packed', 'rescheduled'))
         or exists (select 1 from public.route_stops x join public.routes y on y.id = x.route_id
                     where x.order_id = (s ->> 'order_id')::uuid and y.status not in ('draft', 'completed', 'cancelled')) then
        continue;
      end if;
      v_seq := v_seq + 1;
      insert into public.route_stops (org_id, route_id, order_id, sequence, status, eta, planned_arrival, distance_from_prev_m, duration_from_prev_s)
      values (p_org, v_route, (s ->> 'order_id')::uuid, v_seq, 'pending', (s ->> 'eta')::timestamptz, (s ->> 'eta')::timestamptz,
              (s ->> 'distance_m')::int, (s ->> 'duration_s')::int);
      v_stops := v_stops + 1;
    end loop;
    if v_seq = 0 then delete from public.routes where id = v_route; continue; end if;
    perform private.resequence(v_route);
    v_routes := v_routes + 1;
  end loop;
  -- orders planned for another day move to this day
  update public.orders o set delivery_date = p_date
    from public.route_stops s join public.routes x on x.id = s.route_id
   where s.order_id = o.id and x.run_id = v_run and o.delivery_date is distinct from p_date;
  return jsonb_build_object('run_id', v_run, 'routes', v_routes, 'stops', v_stops);
end $$;

revoke execute on function public.set_order_pin(uuid, double precision, double precision, numeric, boolean) from anon, public;
revoke execute on function public.find_cached_address(uuid, text, text) from anon, public;
revoke execute on function public.apply_route_plan(uuid, date, jsonb) from anon, public;
grant execute on function public.set_order_pin(uuid, double precision, double precision, numeric, boolean) to authenticated;
grant execute on function public.find_cached_address(uuid, text, text) to authenticated;
grant execute on function public.apply_route_plan(uuid, date, jsonb) to authenticated;

-- Everything the planner needs for one day, with plain lat/lng numbers.
create or replace function public.planning_data(p_org uuid, p_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_role(p_org, private.role_set('dispatch')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'settings', (select settings from public.organizations where id = p_org),
    'timezone', (select timezone from public.organizations where id = p_org),
    'hub', (select jsonb_build_object('id', id, 'name', name, 'lat', extensions.st_y(location), 'lng', extensions.st_x(location))
              from public.hubs where org_id = p_org order by is_default desc, created_at limit 1),
    'orders', (select coalesce(jsonb_agg(jsonb_build_object(
                 'id', o.id, 'code', o.code, 'lat', extensions.st_y(o.location), 'lng', extensions.st_x(o.location),
                 'confidence', o.geocode_confidence, 'address_line', o.address_line, 'city', o.city, 'landmark', o.landmark,
                 'phone', o.customer_phone, 'kg', coalesce(o.weight_kg, 1), 'parcels', coalesce(o.parcels, 1),
                 'window_start', o.window_start, 'window_end', o.window_end, 'delivery_date', o.delivery_date) order by o.created_at), '[]')
                 from public.orders o
                where o.org_id = p_org and o.delivery_date <= p_date
                  and o.status in ('confirmed', 'received', 'packed', 'rescheduled')
                  and not exists (select 1 from public.route_stops s join public.routes r on r.id = s.route_id
                                   where s.order_id = o.id and r.status not in ('completed', 'cancelled')
                                     and (r.status <> 'draft' or r.date <> p_date))),
    'drivers', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.full_name, 'vehicle_id', d.default_vehicle_id) order by d.full_name), '[]')
                  from public.drivers d
                 where d.org_id = p_org and d.status = 'active'
                   and not exists (select 1 from public.routes r where r.driver_id = d.id and r.date = p_date and r.status not in ('draft', 'cancelled'))),
    'vehicles', (select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'plate', v.plate, 'type', v.type, 'kg', v.capacity_kg,
                    'parcels', v.capacity_parcels, 'fuel', v.fuel_l_per_100km) order by v.capacity_kg desc nulls last), '[]')
                   from public.vehicles v
                  where v.org_id = p_org and v.active
                    and not exists (select 1 from public.routes r where r.vehicle_id = v.id and r.date = p_date and r.status not in ('draft', 'cancelled')))
  );
end $$;

create or replace function public.hub_point(p_org uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when private.has_role(p_org, private.role_set('staff')) then (
    select jsonb_build_object('lat', extensions.st_y(location), 'lng', extensions.st_x(location))
      from public.hubs where org_id = p_org order by is_default desc, created_at limit 1) end
$$;

revoke execute on function public.planning_data(uuid, date) from anon, public;
revoke execute on function public.hub_point(uuid) from anon, public;
grant execute on function public.planning_data(uuid, date) to authenticated;
grant execute on function public.hub_point(uuid) to authenticated;

-- Map data for a day (or one route): hub, route lines and numbered stops, as plain numbers.
create or replace function public.day_map(p_org uuid, p_date date, p_route uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_role(p_org, private.role_set('routes_read')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'hub', (select jsonb_build_object('lat', extensions.st_y(location), 'lng', extensions.st_x(location), 'name', name)
              from public.hubs where org_id = p_org order by is_default desc, created_at limit 1),
    'routes', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'code', r.code, 'color', r.color, 'status', r.status, 'driver', d.full_name,
        'line', case when r.geometry is not null then extensions.st_asgeojson(r.geometry)::jsonb end,
        'stops', (select coalesce(jsonb_agg(jsonb_build_object('seq', s.sequence, 'status', s.status, 'eta', s.eta,
                     'order_id', o.id, 'code', o.code, 'name', o.customer_name, 'address', o.address_line,
                     'lat', extensions.st_y(o.location), 'lng', extensions.st_x(o.location)) order by s.sequence), '[]')
                    from public.route_stops s join public.orders o on o.id = s.order_id
                   where s.route_id = r.id and o.location is not null)) order by r.code), '[]')
        from public.routes r left join public.drivers d on d.id = r.driver_id
       where r.org_id = p_org and r.date = p_date and r.status <> 'cancelled' and (p_route is null or r.id = p_route)),
    'open', case when p_route is null then (select coalesce(jsonb_agg(jsonb_build_object('order_id', o.id, 'code', o.code, 'name', o.customer_name,
                     'address', o.address_line, 'lat', extensions.st_y(o.location), 'lng', extensions.st_x(o.location))), '[]')
               from public.orders o
              where o.org_id = p_org and o.delivery_date = p_date and o.location is not null
                and o.status in ('confirmed', 'received', 'packed', 'rescheduled')
                and not exists (select 1 from public.route_stops s join public.routes r on r.id = s.route_id
                                 where s.order_id = o.id and r.status not in ('completed', 'cancelled'))) else '[]'::jsonb end
  );
end $$;

create or replace function public.order_point(p_order uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('lat', extensions.st_y(o.location), 'lng', extensions.st_x(o.location), 'confidence', o.geocode_confidence,
           'hub', (select jsonb_build_object('lat', extensions.st_y(h.location), 'lng', extensions.st_x(h.location)) from public.hubs h where h.id = o.hub_id))
    from public.orders o
   where o.id = p_order and private.has_role(o.org_id, private.role_set('orders_read'))
$$;

revoke execute on function public.day_map(uuid, date, uuid) from anon, public;
revoke execute on function public.order_point(uuid) from anon, public;
grant execute on function public.day_map(uuid, date, uuid) to authenticated;
grant execute on function public.order_point(uuid) to authenticated;
