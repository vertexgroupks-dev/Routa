-- Removes the TEST orders (merchant_ref TEST-01..15), TEST drivers and TEST vehicles and the routes built from them.
-- Run in the Supabase SQL editor, or ask Claude to run it.
do $$
declare v_org uuid := (select id from public.organizations where is_demo limit 1);
begin
  delete from public.route_stops s using public.orders o where s.order_id = o.id and o.org_id = v_org and o.merchant_ref like 'TEST-%';
  delete from public.pick_lists p using public.routes r where p.route_id = r.id and r.org_id = v_org and not exists (select 1 from public.route_stops s where s.route_id = r.id);
  delete from public.routes r where r.org_id = v_org and not exists (select 1 from public.route_stops s where s.route_id = r.id);
  delete from public.orders where org_id = v_org and merchant_ref like 'TEST-%';
  delete from public.drivers where org_id = v_org and 'test' = any(skills);
  delete from public.vehicles where org_id = v_org and notes = 'TEST';
end $$;
