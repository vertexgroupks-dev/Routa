'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from '@/components/useAction';
import { ROLE_LABEL } from '@routa/shared';

const ROLES = ['admin', 'dispatcher', 'front_desk', 'warehouse', 'helpdesk', 'finance', 'hr', 'driver', 'owner'];

export function InviteForm({ orgId, canInviteAll }: { orgId: string; canInviteAll: boolean }) {
  const [f, setF] = useState({ email: '', phone: '', role: 'dispatcher' });
  const [link, setLink] = useState<string | null>(null);
  const a = useAction();
  return (
    <form className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_200px_auto]" onSubmit={async (e) => {
      e.preventDefault(); setLink(null);
      const res = await a.run(() => createClient().functions.invoke('send-invite', { body: { org_id: orgId, role: f.role, email: f.email, phone: f.phone } }).then(async (r) => {
        if (r.error) { const body = await (r.error as any).context?.json?.().catch(() => null); return { error: { message: body?.error ?? r.error.message }, data: null }; }
        return { error: null, data: r.data };
      }), (d: any) => d.emailed ? `Invitation emailed to ${f.email}.` : d.note ?? 'Invitation created. Send this link by WhatsApp or SMS.');
      if (res && typeof res === 'object') { setLink((res as any).link); setF({ ...f, email: '', phone: '' }); }
    }}>
      <h2 className="text-base font-semibold sm:col-span-4">Invite someone</h2>
      <label className="label">Email<input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@company.com" /></label>
      <label className="label">or phone (drivers)<input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+383 44 …" /></label>
      <label className="label">Role<select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
        {ROLES.filter((r) => canInviteAll || ['driver', 'warehouse'].includes(r)).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select></label>
      <button disabled={a.busy || (!f.email && !f.phone)} className="btn-primary self-end">{a.busy ? 'Sending…' : 'Send invite'}</button>
      <div className="flex flex-col gap-2 sm:col-span-4">
        <Msg error={a.error} ok={a.ok} />
        {link && <input readOnly value={link} onFocus={(e) => e.target.select()} className="input font-mono text-xs" />}
      </div>
    </form>
  );
}

export function MemberRole({ id, role, active }: { id: string; role: string; active: boolean }) {
  const a = useAction();
  return (
    <span className="inline-flex items-center gap-2">
      <select disabled={a.busy} defaultValue={role} className="input w-auto py-1.5" onChange={(e) => a.run(() => createClient().rpc('set_member_role', { p_membership: id, p_role: e.target.value, p_active: active }))}>
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <button disabled={a.busy} className="text-xs text-ink-3 hover:text-ink" onClick={() => a.run(() => createClient().rpc('set_member_role', { p_membership: id, p_role: role, p_active: !active }))}>{active ? 'Disable' : 'Enable'}</button>
      {a.error && <span className="text-xs text-danger-ink">{a.error}</span>}
    </span>
  );
}

export function RevokeInvite({ id }: { id: string }) {
  const a = useAction();
  return <button disabled={a.busy} className="text-xs text-danger-ink" onClick={() => a.run(() => createClient().rpc('revoke_invitation', { p_id: id }))}>Revoke</button>;
}
