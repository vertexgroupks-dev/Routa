import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { todayKs } from '@routa/shared';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const ws = await requireStaff();
  const supabase = await createClient();
  const org = ws.org.id;
  const today = todayKs();
  const head = { count: 'exact' as const, head: true };
  const [orders, inbound, returns, tickets, cash, live] = await Promise.all([
    supabase.from('orders').select('id', head).eq('org_id', org).eq('delivery_date', today),
    supabase.from('inbound_shipments').select('id', head).eq('org_id', org).in('status', ['expected', 'in_transit', 'receiving']),
    supabase.from('returns').select('id', head).eq('org_id', org).eq('status', 'expected'),
    supabase.from('tickets').select('id', head).eq('org_id', org).neq('status', 'resolved'),
    supabase.from('cash_handovers').select('id', head).eq('org_id', org).eq('status', 'pending'),
    supabase.from('driver_positions').select('driver_id', head).eq('org_id', org).gte('recorded_at', new Date(Date.now() - 15 * 60_000).toISOString())
  ]);
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        orgName={ws.org.name}
        hubLabel={ws.hub?.name ?? 'HQ'}
        userName={ws.fullName}
        role={ws.role}
        isDemo={ws.org.is_demo}
        counts={{ orders: orders.count ?? 0, inbound: inbound.count ?? 0, returns: returns.count ?? 0, tickets: tickets.count ?? 0, cash: cash.count ?? 0 }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar liveDrivers={live.count ?? 0} />
        <main className="flex flex-col gap-5 p-7">{children}</main>
      </div>
    </div>
  );
}
