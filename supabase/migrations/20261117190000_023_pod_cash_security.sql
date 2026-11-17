-- 023 Hub location, proof-of-delivery file checks, cash + POD write lock-down

-- Hub location (Settings → Hub location). Owners / admins only.
create or replace function public.set_hub_location(p_hub uuid, p_lat double precision, p_lng double precision, p_address text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare h public.hubs;
begin
  select * into h from public.hubs where id = p_hub;
  if h.id is null or not private.has_role(h.org_id, private.role_set('mgr')) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'Invalid coordinates'; end if;
  update public.hubs set location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326),
                         address = coalesce(nullif(trim(p_address), ''), address)
   where id = p_hub;
end $$;
revoke execute on function public.set_hub_location(uuid, double precision, double precision, text) from anon, public;
grant execute on function public.set_hub_location(uuid, double precision, double precision, text) to authenticated;

-- Photos / signatures must live in the order's own folder: {org_id}/{order_id}/...
create or replace function private.check_pod_path() returns trigger language plpgsql set search_path = '' as $$
declare v_org uuid; v_order uuid; v_path text;
begin
  if tg_table_name = 'pod_photos' then
    select p.org_id, p.order_id into v_org, v_order from public.pods p where p.id = new.pod_id;
    if v_org is null then select a.org_id, a.order_id into v_org, v_order from public.delivery_attempts a where a.id = new.attempt_id; end if;
    v_path := new.path;
  elsif tg_table_name = 'pods' then
    v_org := new.org_id; v_order := new.order_id; v_path := new.signature_path;
  else -- delivery_attempts
    v_org := new.org_id; v_order := new.order_id; v_path := new.photo_path;
  end if;
  if v_path is not null and (v_path not like v_org::text || '/' || v_order::text || '/%' or v_path like '%..%') then
    raise exception 'File path must be inside the order folder' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists check_pod_path on public.pod_photos;
create trigger check_pod_path before insert or update of path on public.pod_photos for each row execute function private.check_pod_path();
drop trigger if exists check_pod_path on public.pods;
create trigger check_pod_path before insert or update of signature_path on public.pods for each row execute function private.check_pod_path();
drop trigger if exists check_pod_path on public.delivery_attempts;
create trigger check_pod_path before insert or update of photo_path on public.delivery_attempts for each row execute function private.check_pod_path();

-- Proof of delivery: the office may only review it (approve / reject), never change the evidence.
create or replace function private.pods_review_only() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if (to_jsonb(new) - array['review_status','review_note','reviewed_by','reviewed_at']) is distinct from (to_jsonb(old) - array['review_status','review_note','reviewed_by','reviewed_at']) then
      raise exception 'Only the review can be changed on a proof of delivery' using errcode = '42501';
    end if;
    if new.review_status not in ('approved', 'rejected', 'flagged', 'auto_ok') then raise exception 'Invalid review status'; end if;
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists pods_review_only on public.pods;
create trigger pods_review_only before update on public.pods for each row execute function private.pods_review_only();
-- PODs and their photos are only created by the driver app's delivery functions.
drop policy if exists staff_insert on public.pods;
drop policy if exists staff_insert on public.pod_photos;
drop policy if exists staff_update on public.pod_photos;

-- Cash handovers: created by "End shift", closed by "Cash received" — no direct edits (amounts can't be changed by hand).
drop policy if exists staff_insert on public.cash_handovers;
drop policy if exists staff_update on public.cash_handovers;
drop policy if exists staff_delete on public.cash_handovers;

-- Customer photos and signatures: only roles that work with orders (not HR).
drop policy if exists "staff read org files" on storage.objects;
create policy "staff read org files" on storage.objects for select to authenticated using (
  ((bucket_id = any (array['labels', 'invoices', 'imports'])) and private.is_staff(private.folder_org(name)))
  or ((bucket_id = any (array['pod-photos', 'signatures'])) and private.has_role(private.folder_org(name), private.role_set('orders_read')))
  or ((bucket_id = 'documents') and private.has_role(private.folder_org(name), private.role_set('people_read')))
);
