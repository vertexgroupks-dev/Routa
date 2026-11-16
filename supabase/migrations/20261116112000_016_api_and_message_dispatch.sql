-- 016 · Webhook messages use the "queued" status; api_cancel_order for the merchant API; dispatch-messages runs every minute.
-- (Applied in Supabase; see migration history. The cron job calls the dispatch-messages edge function with the public anon key.)
create or replace function public.api_cancel_order(p_merchant uuid, p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order and merchant_id = p_merchant;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'confirmed' then raise exception 'Only orders that are still "confirmed" can be cancelled (now: %)', o.status; end if;
  perform set_config('routa.via_rpc', 'on', true);
  perform set_config('routa.event_note', 'Cancelled by the shop through the API', true);
  update public.orders set status = 'cancelled', cancelled_at = now() where id = p_order;
end $$;
revoke execute on function public.api_cancel_order from public, anon, authenticated;
grant execute on function public.api_cancel_order to service_role;
-- select cron.schedule('routa-dispatch-messages', '* * * * *', $$ select net.http_post(url := '<project>/functions/v1/dispatch-messages', ...) $$);
