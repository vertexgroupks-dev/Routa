import { requireStaff } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Pill, Empty, StatCard, Avatar } from "@/components/ui";
import { ROLE_LABEL } from '@routa/shared';
export const metadata = { title: 'Team & roles' };
export default async function Page() {
  const ws = await requireStaff(); const sb = await createClient();
  const { data: mem } = await sb.from('memberships').select('id, user_id, role, active, created_at').eq('org_id', ws.org.id).order('role');
  const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', (mem ?? []).map((m: any) => m.user_id));
  const data = (mem ?? []).map((m: any) => ({ ...m, user: (profs ?? []).find((p: any) => p.id === m.user_id) }));
  return (<>
    <PageHeader title="Team & roles" subtitle="Everyone with access to this company. Each role sees only the screens and data it needs." />
    <section className="card overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-[13px]">
      <thead className="bg-[#FAFBFD]"><tr><th className="th pl-5">Person</th><th className="th">Role</th><th className="th">Since</th><th className="th pr-5">Status</th></tr></thead>
      <tbody>{((data ?? []) as any[]).map((m) => <tr key={m.id} className="border-t border-line"><td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={m.user?.full_name} size={28} /><span className="font-medium">{m.user?.full_name ?? '—'}</span></span></td><td className="td">{ROLE_LABEL[m.role] ?? m.role}</td><td className="td font-mono text-ink-2">{m.created_at.slice(0, 10)}</td><td className="td pr-5">{m.active ? <Pill bg="#E8F8EF" ink="#067647">Active</Pill> : <Pill bg="#F0F2F7" ink="#5B6378">Disabled</Pill>}</td></tr>)}</tbody></table>
      {(data ?? []).length === 0 && <Empty title="Only you so far" />}</section>
    <p className="text-[13px] text-ink-3">Email invites are part of the next stage. For now, people join through the demo roles on the setup screen.</p>
  </>);
}
