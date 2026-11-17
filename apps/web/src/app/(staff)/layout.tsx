import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LiveRefresh } from '@/components/LiveRefresh';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const ws = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.rpc('nav_counts', { p_org: ws.org.id });
  const c = (data ?? {}) as Record<string, number>;
  return (
    <div className="flex min-h-screen">
      <div className="app-bg" aria-hidden="true" />
      <Sidebar orgName={ws.org.name} hubLabel={ws.hub?.name ?? 'HQ'} userName={ws.fullName} role={ws.role} isDemo={ws.org.is_demo} counts={c} />
      <div className="flex min-w-0 flex-1 flex-col pt-3">
        <LiveRefresh />
        <Topbar liveDrivers={c.live ?? 0} unread={c.unread ?? 0} role={ws.role} />
        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-3 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
