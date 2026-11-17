-- Full end-to-end smoke test, run as the real demo users. Everything is rolled back at the end (RAISE).
create or replace function pg_temp.as_user(p_email text) returns void language plpgsql as $$
declare v uuid;
begin
  execute 'reset role';
  select id into v from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

do $$
declare
  org uuid := 'e9a9479f-c70a-4205-8556-d90d77a7c04d';
  mer uuid := '5fba6848-d877-47ff-b1ba-a6012df0d6b8';
  hub uuid; d date := (now() at time zone 'Europe/Belgrade')::date;
  arben uuid; van uuid; o1 public.orders; o2 public.orders; rt uuid; rt2 uuid; s1 uuid; s2 uuid;
  j jsonb; code text; n int; ok text := ''; bad text := ''; step text;
  sku uuid; bin uuid; sl uuid; inb uuid; line uuid; run uuid; inv uuid; pay uuid; key jsonb; emp uuid;
begin
  select id into hub from public.hubs where org_id = org limit 1;
  select id, default_vehicle_id into arben, van from public.drivers where org_id = org and full_name = 'Arben Krasniqi';

  -- 1. Front desk creates two orders (cash on delivery)
  step := 'frontdesk: create orders';
  begin
    perform pg_temp.as_user('frontdesk@routa.demo');
    insert into public.orders (org_id, merchant_id, source, customer_name, customer_phone, address_line, city, weight_kg, parcels, cod_amount, fee_payer, delivery_date)
    values (org, mer, 'front_desk', 'Smoke One', '+38344999001', 'Rruga Agim Ramadani 10', 'Prishtinë', 1, 1, 20, 'merchant', d) returning * into o1;
    insert into public.orders (org_id, merchant_id, source, customer_name, customer_phone, address_line, city, weight_kg, parcels, cod_amount, fee_payer, delivery_date)
    values (org, mer, 'front_desk', 'Smoke Two', '+38344999002', 'Ulpiana', 'Prishtinë', 1, 1, 0, 'recipient', d) returning * into o2;
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'frontdesk: set_order_pin';
  begin perform pg_temp.as_user('frontdesk@routa.demo');
    perform public.set_order_pin(o1.id, 42.6610, 21.1622, 1, false); perform public.set_order_pin(o2.id, 42.6504, 21.1607, 1, false); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'warehouse: set_order_status received';
  begin perform pg_temp.as_user('warehouse@routa.demo');
    perform public.set_order_status(o1.id, 'received', null); perform public.set_order_status(o2.id, 'received', null); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 2. Dispatcher builds a route by hand and publishes
  step := 'dispatcher: create_route/assign/update/resequence/publish';
  begin perform pg_temp.as_user('dispatcher@routa.demo');
    rt := public.create_route(org, d, null, null);
    s1 := public.assign_order_to_route(o1.id, rt, null);
    s2 := public.assign_order_to_route(o2.id, rt, null);
    perform public.update_route(rt, arben, van);
    perform public.resequence_route(rt, array[s2, s1]);
    n := public.publish_routes(org, d);
    ok := ok || step || ' (published ' || n || '); ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'dispatcher: planning_data/day_map/nav_counts';
  begin perform pg_temp.as_user('dispatcher@routa.demo');
    perform public.planning_data(org, d); perform public.day_map(org, d, null); perform public.nav_counts(org); perform public.my_workspace(); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'dispatcher: apply_route_plan (empty plan, other day)';
  begin perform pg_temp.as_user('dispatcher@routa.demo');
    perform public.apply_route_plan(org, d + 30, '{"routes":[],"unassigned":[],"summary":{}}'::jsonb); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 3. Driver
  step := 'driver: load, start, gps, arrive';
  begin perform pg_temp.as_user('arben@routa.demo');
    j := public.driver_load_parcel(rt, o1.code); if (j->>'ok')::boolean is not true then raise exception 'load1 %', j; end if;
    j := public.driver_load_parcel(rt, o2.tracking_code); if (j->>'ok')::boolean is not true then raise exception 'load2 %', j; end if;
    perform public.driver_start_route(rt);
    perform public.record_locations('[{"lat":42.66,"lng":21.16,"speed":20}]'::jsonb);
    perform public.driver_arrive(s1, 42.6610, 21.1622);
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'driver: complete_delivery with photo + signature';
  begin perform pg_temp.as_user('arben@routa.demo');
    j := public.complete_delivery(s1, gen_random_uuid(), 'customer', 'Smoke', org || '/' || o1.id || '/sig.svg', array[org || '/' || o1.id || '/p1.jpg'], 42.6610, 21.1622, 20, 'cash', now());
    ok := ok || step || ' ' || j::text || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'driver: complete_delivery with bad path (must fail)';
  begin perform pg_temp.as_user('arben@routa.demo');
    perform public.complete_delivery(s2, gen_random_uuid(), 'customer', 'X', 'other-org/x/sig.svg', '{}', null, null, 0, 'cash', now());
    bad := bad || step || ': NOT BLOCKED' || E'\n';
  exception when others then ok := ok || step || ' blocked; '; end;

  step := 'driver: record_failed_attempt';
  begin perform pg_temp.as_user('arben@routa.demo');
    perform public.record_failed_attempt(s2, gen_random_uuid(), 'no_answer', 'smoke', org || '/' || o2.id || '/door.jpg', 42.65, 21.16, '[]'::jsonb, now());
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'driver: end shift';
  begin perform pg_temp.as_user('arben@routa.demo');
    j := public.driver_end_shift(rt); code := j->>'short_code';
    ok := ok || step || ' cash=' || (j->>'expected_cash') || ' returns=' || (j->>'returns') || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 4. Warehouse receives the return
  step := 'warehouse: check_in_return';
  begin perform pg_temp.as_user('warehouse@routa.demo');
    j := public.check_in_return(org, o2.code); ok := ok || step || ' ' || j::text || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 5. Finance
  step := 'finance: cash handover';
  begin perform pg_temp.as_user('finance@routa.demo');
    j := public.get_cash_handover(code); if (j->>'ok')::boolean is not true then raise exception 'lookup %', j; end if;
    j := public.confirm_cash_handover(code, 15, '{}'::jsonb, 'smoke short');
    ok := ok || step || ' ' || (j->>'status') || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  step := 'finance: payouts + invoices';
  begin perform pg_temp.as_user('finance@routa.demo');
    perform public.generate_payouts(org, d);
    select id into pay from public.payouts where org_id = org order by created_at desc limit 1;
    if pay is not null then perform public.mark_payout_paid(pay, 'SMOKE-REF'); end if;
    perform public.generate_invoices(org, date_trunc('month', d)::date);
    ok := ok || step || ' (payout ' || coalesce(pay::text, 'none') || '); ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 6. HR payroll
  step := 'hr: employee + payroll';
  begin perform pg_temp.as_user('hr@routa.demo');
    insert into public.employees (org_id, full_name, job_title, pay_model, base_salary, status) values (org, 'Smoke Employee', 'Driver', 'salary', 600, 'active') returning id into emp;
    j := to_jsonb(public.run_payroll(org, date_trunc('month', d)::date, d));
    select id into run from public.payroll_runs where org_id = org order by created_at desc limit 1;
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;
  step := 'owner: approve payroll';
  begin perform pg_temp.as_user('owner@routa.demo');
    perform public.approve_payroll(run); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 7. Warehouse stock
  step := 'warehouse: sku, stock, inbound';
  begin perform pg_temp.as_user('warehouse@routa.demo');
    insert into public.skus (org_id, merchant_id, sku, name) values (org, mer, 'SMOKE-1', 'Smoke item') returning id into sku;
    select id into bin from public.bins where org_id = org limit 1;
    insert into public.inbound_shipments (org_id, merchant_id, hub_id, code) values (org, mer, hub, 'IN-SMOKE') returning id into inb;
    insert into public.inbound_lines (org_id, inbound_id, sku_id, expected_qty) values (org, inb, sku, 10) returning id into line;
    perform public.receive_inbound_line(line, 9, 1, bin);
    select id into sl from public.stock_levels where sku_id = sku limit 1;
    perform public.adjust_stock(sl, -2, 'smoke');
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 8. Dispatcher: reschedule / remove / delete route
  step := 'dispatcher: reschedule, remove_stop, delete_route';
  begin perform pg_temp.as_user('dispatcher@routa.demo');
    insert into public.orders (org_id, merchant_id, source, customer_name, customer_phone, address_line, city, fee_payer, delivery_date)
    values (org, mer, 'front_desk', 'Smoke Three', '+38344999003', 'Velania', 'Prishtinë', 'merchant', d) returning * into o1;
    rt2 := public.create_route(org, d + 1, null, null);
    s1 := public.assign_order_to_route(o1.id, rt2, null);
    perform public.remove_stop(s1);
    perform public.reschedule_order(o1.id, d + 2, 'smoke');
    perform public.delete_route(rt2);
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 9. Owner: team + merchant API key
  step := 'owner: invitation';
  begin perform pg_temp.as_user('owner@routa.demo');
    j := to_jsonb(public.create_invitation(org, 'helpdesk', 'smoke@example.com', null, hub));
    perform public.revoke_invitation((select id from public.invitations where email = 'smoke@example.com' order by created_at desc limit 1));
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;
  step := 'merchant: api key';
  begin perform pg_temp.as_user('merchant@routa.demo');
    key := to_jsonb(public.create_api_key(mer, 'smoke'));
    perform public.revoke_api_key((select id from public.api_keys where merchant_id = mer and name = 'smoke' order by created_at desc limit 1));
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;
  step := 'owner: set_hub_location';
  begin perform pg_temp.as_user('owner@routa.demo');
    perform public.set_hub_location(hub, 42.661, 21.1655, null); ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 10. Public tracking (signed-out)
  step := 'anon: track_lookup';
  begin execute 'reset role'; perform set_config('request.jwt.claims', '{"role":"anon"}', true); execute 'set local role anon';
    j := public.track_lookup(o2.tracking_code); if (j->>'found')::boolean is not true then raise exception '%', j; end if;
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  -- 11. Role walls: HR must not read orders, front desk must not publish
  step := 'walls';
  begin perform pg_temp.as_user('hr@routa.demo');
    select count(*) into n from public.orders; if n > 0 then bad := bad || 'HR CAN READ ORDERS' || E'\n'; end if;
    perform pg_temp.as_user('frontdesk@routa.demo');
    begin perform public.publish_routes(org, d); bad := bad || 'FRONT DESK CAN PUBLISH' || E'\n'; exception when others then null; end;
    ok := ok || step || '; ';
  exception when others then bad := bad || step || ': ' || sqlerrm || E'\n'; end;

  execute 'reset role';
  raise exception E'SMOKE RESULT (all rolled back)\nOK: %\nFAILED:\n%', ok, coalesce(nullif(bad, ''), 'none');
end $$;
