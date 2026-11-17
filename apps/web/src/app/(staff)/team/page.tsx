import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill, Empty, Avatar } from '@/components/ui';
import { ROLE_LABEL } from '@routa/shared';
import { InviteForm, MemberRole, RevokeInvite } from './TeamActions';

export const metadata = { title: 'Team & roles' };

export default async function Page() {
  const ws = await requireStaff('/team');
  const sb = await createClient();
  const [{ data: mem }, { data: invites }] = await Promise.all([
    sb.from('memberships').select('id, user_id, role, active, created_at').eq('org_id', ws.org.id).order('role'),
    sb.from('invitations').select('id, email, phone, role, token, expires_at, accepted_at').eq('org_id', ws.org.id).is('accepted_at', null).order('created_at', { ascending: false })
  ]);
  const { data: profs } = await sb.from('profiles').select('id, full_name, phone').in('id', (mem ?? []).map((m: any) => m.user_id));
  const rows = (mem ?? []).map((m: any) => ({ ...m, user: (profs ?? []).find((p: any) => p.id === m.user_id) }));
  const canManage = ['owner', 'admin'].includes(ws.role);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://routalogistics.netlify.app';
  return (
    <>
      <PageHeader title="Team & roles" subtitle="Everyone with access to this company. Each role sees only the screens and data it needs." />
      {(canManage || ws.role === 'hr') && <InviteForm orgId={ws.org.id} canInviteAll={canManage} />}
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[13px]">
          <thead className="bg-white/30"><tr><th className="th pl-5">Person</th><th className="th">Role</th><th className="th">Since</th><th className="th pr-5">Status</th></tr></thead>
          <tbody>{rows.map((m) => (
            <tr key={m.id} className="border-t border-line">
              <td className="td pl-5"><span className="flex items-center gap-2.5"><Avatar name={m.user?.full_name} size={28} /><span className="font-medium">{m.user?.full_name ?? '—'}{m.user_id === ws.userId && <span className="ml-1.5 text-xs text-ink-3">(you)</span>}</span></span></td>
              <td className="td">{canManage && m.user_id !== ws.userId ? <MemberRole id={m.id} role={m.role} active={m.active} /> : ROLE_LABEL[m.role] ?? m.role}</td>
              <td className="td font-mono text-ink-2">{m.created_at.slice(0, 10)}</td>
              <td className="td pr-5">{m.active ? <Pill bg="#E8F8EF" ink="#067647">Active</Pill> : <Pill bg="#F0F2F7" ink="#5B6378">Disabled</Pill>}</td>
            </tr>))}</tbody>
        </table>
      </section>
      <section className="card flex flex-col p-5">
        <h2 className="mb-2 text-base font-semibold">Pending invitations</h2>
        {(invites ?? []).map((i: any) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 border-t border-line py-2.5 text-[13px]">
            <span className="flex-1 font-medium">{i.email ?? i.phone}</span>
            <span className="text-ink-2">{ROLE_LABEL[i.role]}</span>
            <span className="font-mono text-xs text-ink-3">expires {i.expires_at.slice(0, 10)}</span>
            <input readOnly value={`${site}/invite/${i.token}`} className="input w-[280px] py-1.5 font-mono text-xs" />
            {canManage && <RevokeInvite id={i.id} />}
          </div>
        ))}
        {(invites ?? []).length === 0 && <Empty title="No pending invitations" />}
      </section>
    </>
  );
}
