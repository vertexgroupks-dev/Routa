-- 015 · Payouts, invoices, payroll, nightly close, expiry alerts, cleanup, scheduled jobs

create or replace function private.do_generate_payouts(p_org uuid, p_until date) returns int
language plpgsql security definer set search_path = '' as $$
declare m record; v_payout uuid; n int := 0;
begin
  for m in
    select l.merchant_id, sum(l.amount) amt, count(distinct l.order_id) orders, min(l.created_at)::date first_day, me.payout_iban
      from public.merchant_ledger l join public.merchants me on me.id = l.merchant_id
     where l.org_id = p_org and l.payout_id is null and l.type <> 'payout' and l.created_at < (p_until + 1)
     group by l.merchant_id, me.payout_iban having sum(l.amount) > 0
  loop
    insert into public.payouts (org_id, merchant_id, period_start, period_end, amount, orders_count, status, scheduled_for, iban)
    values (p_org, m.merchant_id, m.first_day, p_until, round(m.amt, 2), m.orders, 'scheduled', p_until + 2, m.payout_iban)
    returning id into v_payout;
    update public.merchant_ledger set payout_id = v_payout
     where org_id = p_org and merchant_id = m.merchant_id and payout_id is null and type <> 'payout' and created_at < (p_until + 1);
    insert into public.merchant_ledger (org_id, merchant_id, type, amount, payout_id, description)
    values (p_org, m.merchant_id, 'payout', -round(m.amt, 2), v_payout, 'Payout ' || m.first_day || ' → ' || p_until);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.generate_payouts(p_org uuid, p_until date default current_date) returns int
language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_role(p_org, private.role_set('finance')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return private.do_generate_payouts(p_org, p_until);
end $$;

create or replace function public.mark_payout_paid(p_payout uuid, p_reference text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.payouts;
begin
  select * into p from public.payouts where id = p_payout;
  if p.id is null or not private.has_role(p.org_id, private.role_set('finance')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.payouts set status = 'paid', paid_at = now(), reference = coalesce(p_reference, reference) where id = p_payout;
  update public.orders o set cod_status = 'paid_out'
   where o.id in (select order_id from public.merchant_ledger where payout_id = p_payout and order_id is not null) and o.cod_status in ('handed_in', 'settled');
  insert into public.notifications (org_id, user_id, type, title, body, link)
  select p.org_id, mu.user_id, 'payout_paid', 'Payout sent: €' || p.amount, 'Period ' || p.period_start || ' → ' || p.period_end, '/merchant/payouts'
    from public.merchant_users mu where mu.merchant_id = p.merchant_id;
end $$;

create or replace function private.do_generate_invoices(p_org uuid, p_month date) returns int
language plpgsql security definer set search_path = '' as $$
declare v_start date := date_trunc('month', p_month)::date; v_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
        m record; v_inv uuid; v_no int; v_vat numeric; v_ret_fee numeric; n int := 0; v_sub numeric;
begin
  select coalesce((settings->>'vat_rate')::numeric, 0), coalesce((settings->>'return_fee')::numeric, 1.5) into v_vat, v_ret_fee
    from public.organizations where id = p_org;
  for m in
    select o.merchant_id,
           count(*) filter (where o.status = 'delivered') deliveries,
           coalesce(sum(o.delivery_fee) filter (where o.status = 'delivered'), 0) delivery,
           coalesce(sum(o.weight_fee) filter (where o.status = 'delivered'), 0) weight,
           coalesce(sum(o.cod_fee) filter (where o.status = 'delivered'), 0) cod,
           count(*) filter (where o.status = 'returned_to_merchant') returns
      from public.orders o
     where o.org_id = p_org and o.merchant_id is not null and o.delivery_date between v_start and v_end
     group by o.merchant_id
    having count(*) filter (where o.status in ('delivered', 'returned_to_merchant')) > 0
  loop
    continue when exists (select 1 from public.invoices where merchant_id = m.merchant_id and period_start = v_start and status <> 'void');
    select coalesce(max(nullif(regexp_replace(number, '^.*-', ''), '')::int), 1000) + 1 into v_no
      from public.invoices where org_id = p_org and number like 'INV-' || extract(year from v_start) || '-%';
    v_sub := round(m.delivery + m.weight + m.cod + m.returns * v_ret_fee, 2);
    insert into public.invoices (org_id, merchant_id, number, period_start, period_end, subtotal, vat_rate, vat_amount, total, status, issued_at, due_at)
    values (p_org, m.merchant_id, 'INV-' || extract(year from v_start) || '-' || v_no, v_start, v_end, v_sub, v_vat,
            round(v_sub * v_vat / 100, 2), round(v_sub * (1 + v_vat / 100), 2), 'issued', now(), current_date + 14)
    returning id into v_inv;
    insert into public.invoice_lines (org_id, invoice_id, description, qty, unit_price, amount)
    select p_org, v_inv, d, q, round(a / nullif(q, 0), 2), round(a, 2)
      from (values ('Deliveries', m.deliveries::numeric, m.delivery), ('Extra weight', 1, m.weight), ('Cash-on-delivery handling', 1, m.cod),
                   ('Returns to merchant', m.returns::numeric, m.returns * v_ret_fee)) x(d, q, a)
     where a > 0;
    insert into public.notifications (org_id, user_id, type, title, body, link)
    select p_org, mu.user_id, 'invoice_ready', 'Invoice ready', to_char(v_start, 'Month YYYY'), '/merchant/payouts'
      from public.merchant_users mu where mu.merchant_id = m.merchant_id;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.generate_invoices(p_org uuid, p_month date default (current_date - interval '1 month')::date) returns int
language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_role(p_org, private.role_set('finance')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return private.do_generate_invoices(p_org, p_month);
end $$;

-- Payroll: salary + per-stop bonus + hours − cash shortages
create or replace function public.run_payroll(p_org uuid, p_start date, p_end date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_run uuid; e record; v_stops int; v_hours numeric; v_short numeric; v_base numeric; v_bonus numeric; v_net numeric; v_total numeric := 0;
begin
  if not private.has_role(p_org, private.role_set('fin_hr')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_end < p_start then raise exception 'End date is before start date'; end if;
  delete from public.payroll_runs where org_id = p_org and period_start = p_start and period_end = p_end and status = 'draft';
  insert into public.payroll_runs (org_id, period_start, period_end, status) values (p_org, p_start, p_end, 'draft') returning id into v_run;
  for e in select em.*, d.id driver_id from public.employees em left join public.drivers d on d.employee_id = em.id
            where em.org_id = p_org and coalesce(em.status, 'active') = 'active' loop
    select count(*) into v_stops from public.pods p where p.driver_id = e.driver_id and p.delivered_at >= p_start and p.delivered_at < p_end + 1;
    select coalesce(sum(extract(epoch from (end_time - start_time)) / 3600), 0) into v_hours
      from public.shifts where employee_id = e.id and date between p_start and p_end and type in ('morning', 'afternoon', 'full');
    select coalesce(-sum(difference), 0) into v_short from public.cash_handovers
     where driver_id = e.driver_id and status in ('confirmed', 'disputed') and difference < 0 and date between p_start and p_end;
    v_base := case when e.pay_model in ('salary', 'salary_plus_stop') then coalesce(e.base_salary, 0) else 0 end;
    v_bonus := round(coalesce(e.per_stop_rate, 0) * v_stops, 2);
    v_net := round(v_base + v_bonus + case when e.pay_model = 'hourly' then coalesce(e.hourly_rate, 0) * v_hours else 0 end - v_short, 2);
    insert into public.payslips (org_id, run_id, employee_id, pay_model, base, stop_count, stop_bonus, hours, deductions, deductions_detail, net)
    values (p_org, v_run, e.id, coalesce(e.pay_model, 'salary'), v_base, v_stops, v_bonus, round(v_hours, 1), v_short,
            case when v_short > 0 then jsonb_build_object('cash_shortages', v_short) else '{}'::jsonb end, v_net);
    v_total := v_total + v_net;
  end loop;
  update public.payroll_runs set total = v_total where id = v_run;
  return v_run;
end $$;

create or replace function public.approve_payroll(p_run uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.payroll_runs;
begin
  select * into r from public.payroll_runs where id = p_run;
  if r.id is null or not private.has_role(r.org_id, array['owner', 'admin', 'finance']::public.app_role[]) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.payroll_runs set status = 'approved', approved_by = (select auth.uid()), approved_at = now() where id = p_run and status = 'draft';
end $$;

-- Nightly close: routes still open at the end of the day are closed; undelivered parcels go back to the queue.
create or replace function private.nightly_close(p_date date default (now() at time zone 'Europe/Belgrade')::date) returns int
language plpgsql security definer set search_path = '' as $$
declare r record; s record; n int := 0;
begin
  perform set_config('routa.bypass', 'on', true);
  for r in select * from public.routes where date <= p_date and status in ('published', 'loading', 'in_progress') loop
    for s in select rs.id, o.id order_id, o.status, o.code from public.route_stops rs join public.orders o on o.id = rs.order_id
              where rs.route_id = r.id and rs.status in ('pending', 'loaded', 'arrived') loop
      update public.route_stops set status = 'skipped', completed_at = now() where id = s.id;
      if s.status = 'out_for_delivery' then
        update public.orders set status = 'failed_attempt' where id = s.order_id;
        insert into public.order_events (org_id, order_id, type, from_status, to_status, note, internal)
        values (r.org_id, s.order_id, 'status', 'out_for_delivery', 'failed_attempt', 'Not delivered by end of day (automatic close)', true);
        insert into public.tickets (org_id, order_id, type, title, description, priority)
        values (r.org_id, s.order_id, 'other', 'Not delivered · ' || s.code, 'Route ' || r.code || ' closed automatically at the end of the day', 2);
      elsif s.status = 'assigned' then
        update public.orders set status = 'packed' where id = s.order_id;
      end if;
    end loop;
    update public.routes set status = 'completed', actual_end = coalesce(actual_end, now()) where id = r.id;
    n := n + 1;
  end loop;
  perform set_config('routa.bypass', 'off', true);
  return n;
end $$;

-- Daily warnings for documents that expire in the next 14 days.
create or replace function private.expiry_alerts() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with due as (
    select org_id, 'Driving licence · ' || full_name t, licence_expires d, '/fleet' l from public.drivers where licence_expires between current_date and current_date + 14
    union all select org_id, 'Registration · ' || plate, registration_expires, '/fleet' from public.vehicles where registration_expires between current_date and current_date + 14
    union all select org_id, 'Service due · ' || plate, next_service_date, '/fleet' from public.vehicles where next_service_date between current_date and current_date + 14
    union all select org_id, title, expires_on, '/hr' from public.documents where expires_on between current_date and current_date + 14
  )
  insert into public.notifications (org_id, user_id, type, title, body, link)
  select due.org_id, m.user_id, 'expiry', due.t, 'Expires on ' || to_char(due.d, 'DD Mon YYYY'), due.l
    from due join public.memberships m on m.org_id = due.org_id and m.active and m.role in ('owner', 'admin', 'hr')
   where not exists (select 1 from public.notifications x where x.user_id = m.user_id and x.type = 'expiry' and x.title = due.t and x.created_at > now() - interval '6 days');
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function private.cleanup() returns void
language sql security definer set search_path = '' as $$
  delete from public.driver_locations where recorded_at < now() - interval '90 days';
  delete from public.notifications where read_at is not null and created_at < now() - interval '120 days';
$$;

create or replace function private.cron_payouts() returns void language plpgsql security definer set search_path = '' as $$
declare o record; begin for o in select id from public.organizations loop perform private.do_generate_payouts(o.id, current_date - 1); end loop; end $$;
create or replace function private.cron_invoices() returns void language plpgsql security definer set search_path = '' as $$
declare o record; begin for o in select id from public.organizations loop perform private.do_generate_invoices(o.id, (current_date - interval '1 month')::date); end loop; end $$;

revoke execute on function public.generate_payouts, public.mark_payout_paid, public.generate_invoices, public.run_payroll, public.approve_payroll from public, anon;
grant execute on function public.generate_payouts, public.mark_payout_paid, public.generate_invoices, public.run_payroll, public.approve_payroll to authenticated;

-- Scheduled jobs (times in UTC; Kosovo is UTC+1 in winter)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('routa-nightly-close', '30 22 * * *', $$select private.nightly_close()$$);
select cron.schedule('routa-weekly-payouts', '0 5 * * 1', $$select private.cron_payouts()$$);
select cron.schedule('routa-monthly-invoices', '0 4 1 * *', $$select private.cron_invoices()$$);
select cron.schedule('routa-expiry-alerts', '0 6 * * *', $$select private.expiry_alerts()$$);
select cron.schedule('routa-cleanup', '0 3 * * 0', $$select private.cleanup()$$);
