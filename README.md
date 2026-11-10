# Routa

Delivery operations SaaS for couriers and e-commerce warehouses in Kosovo.

```
apps/web       Next.js 15 — landing page, sign in, staff dashboard, merchant portal, customer tracking (/t/CODE)
apps/driver    Expo (React Native) — driver app: today's route, stop, delivery / failed attempt, end of day cash code
packages/shared  Design tokens, status labels, formatters and types used by both apps
supabase       Backend notes (database, security, functions live in the Supabase project)
```

Backend: Supabase project `pfdidtlgmdtthobjuozk` (EU). The database, row-level security, functions, storage and realtime are already set up there.

## First run (Windows, PowerShell or VS Code terminal)

Needs **Node.js 20+** and **Git**.

```bash
cd "C:\Users\Dell\Desktop\Routa Official WebApp"
npm install
npm run dev:web          # http://localhost:3000
```

The `.env.local` (web) and `.env` (driver) files are already filled in with the Supabase URL and the public key.

### Try it
1. Open http://localhost:3000 → **Start free trial** → create an account.
   If Supabase asks you to confirm the email, open the link (or turn off *Confirm email* in Supabase → Authentication → Sign In / Providers → Email, for testing).
2. On the **Set up your company** screen either create your own company, or click a role under **Explore the demo** to join *Prishtina Express* (170 orders, 5 live routes).
3. Merchant view: join the demo as **Merchant (TechNova)** with a second account.
4. Tracking page: open any order → **Customer tracking page ↗**.

### Driver app
```bash
cd apps/driver
npm install                      # the driver app has its own packages (separate from the website)
npx expo install expo@latest     # match the Expo Go version on your phone
npx expo install --fix           # align the other Expo packages
npm run start                    # scan the QR with Expo Go (Android) or the Camera app (iPhone)
```
Sign in with **Use email instead (testing)** using an account you created on the website, then tap **Join the demo as a driver** — you become Blerim Kastrati with route PR-02.
Phone-number login works once an SMS provider (Infobip / Twilio) is connected in Supabase.

## What works now
- Sign up, sign in, Google button (needs Google enabled in Supabase), company onboarding, demo roles
- Staff: Overview, Orders (tabs, search, date filter, paging), Order detail (timeline, status changes, reschedule, notes), New order (zone + fees computed by the database), Dispatch (routes per day, publish), Fleet & Drivers, Helpdesk (resolve), Finance & COD, Merchants
- Merchant portal: dashboard, orders, create order with automatic fees
- Customer tracking page that refreshes itself
- Driver app: today's route with live updates, load parcel, navigate (Google Maps / Apple Maps), call, delivery with cash check, failed attempt with reason, end shift with 6-digit cash code
- Screens marked "built in Stage X" are designed and their database is ready; they follow the project plan.

## Database types
```bash
npx supabase login
npx supabase gen types typescript --project-id pfdidtlgmdtthobjuozk > packages/shared/src/database.types.ts
```

## Before a real customer uses it
- Remove the `join_demo_org` function (demo shortcut).
- Connect an SMS provider, Mapbox, and the routing server (Stage 3–4).
