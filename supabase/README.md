# Supabase backend

Project ref: `pfdidtlgmdtthobjuozk` · region eu-west-1 · Postgres 17 + PostGIS

Applied migrations (in the project's migration history):
001 extensions & types · 002 accounts & merchants · 003 people & fleet · 004 orders · 005 routing & delivery ·
006 warehouse · 007 money, people & system · 008 row-level security · 009 order logic (zones, fees, status rules, SMS queue) ·
010 app functions (RPCs) · 011 storage & realtime · 012 geometry compare fix · 013 lock rls_auto_enable

To copy the migration files into this folder:
```bash
npx supabase login
npx supabase link --project-ref pfdidtlgmdtthobjuozk
npx supabase migration fetch
```

Main RPCs: create_organization, accept_invitation, join_demo_org (demo only), set_order_status, reschedule_order,
publish_routes, driver_load_parcel, driver_start_route, driver_arrive, complete_delivery, record_failed_attempt,
driver_end_shift, get_cash_handover, confirm_cash_handover, check_in_return, track_lookup (public).
