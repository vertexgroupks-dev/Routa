import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';
import { ROLE_LABEL } from '@routa/shared';
import { AcceptButton } from './AcceptButton';

export const metadata = { title: 'Join your team' };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sb = await createClient();
  const [{ data: inv }, { data: { user } }] = await Promise.all([sb.rpc('get_invitation', { p_token: token }), sb.auth.getUser()]);
  const i = inv as { company: string; role: string; email: string | null; phone: string | null; valid: boolean } | null;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6">
      <Logo dark />
      <div className="card flex w-full max-w-[420px] flex-col gap-4 p-7 text-center">
        {!i ? (<><h1 className="text-xl font-semibold">Invitation not found</h1><p className="text-sm text-ink-2">Ask your manager to send you a new link.</p></>)
        : !i.valid ? (<><h1 className="text-xl font-semibold">This invitation has expired</h1><p className="text-sm text-ink-2">Ask {i.company} to send you a new link.</p></>)
        : (<>
          <h1 className="text-xl font-semibold tracking-[-0.4px]">Join {i.company}</h1>
          <p className="text-sm text-ink-2">You are invited as <b>{ROLE_LABEL[i.role] ?? i.role}</b>{i.email ? ` (${i.email})` : ''}.</p>
          {i.role === 'driver' && <p className="rounded-[10px] bg-brand-tint p-3 text-[13px] text-brand-deep">Drivers: after joining, open the Routa Driver app and sign in with the same account.</p>}
          {user ? <AcceptButton token={token} />
            : <div className="flex flex-col gap-2">
                <Link href={`/register?next=/invite/${token}${i.email ? `&email=${encodeURIComponent(i.email)}` : ''}`} className="btn-primary py-3">Create my account</Link>
                <Link href={`/login?next=/invite/${token}`} className="btn-ghost py-3">I already have an account</Link>
              </div>}
        </>)}
      </div>
    </main>
  );
}
