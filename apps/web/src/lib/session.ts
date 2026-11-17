import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Workspace = {
  userId: string;
  email: string | null;
  fullName: string;
  org: { id: string; name: string; is_demo: boolean; settings: Record<string, unknown> } | null;
  role: string | null;
  hub: { id: string; name: string; address: string | null } | null;
  merchant: { id: string; name: string; code: string; org_id: string } | null;
};

/** Who is signed in, their company, role, hub and shop — one database round trip, cached per request. */
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('my_workspace');
  if (error || !data) return null;
  const w = data as any;
  return {
    userId: w.user_id,
    email: w.email ?? null,
    fullName: w.full_name || (w.email ? String(w.email).split('@')[0] : 'You'),
    org: w.org ?? null,
    role: w.role ?? null,
    hub: w.hub ?? null,
    merchant: w.merchant ?? null
  };
});

/** Where a signed-in user should land. */
export function homeFor(ws: Workspace): string {
  if (ws.role && ws.role !== 'driver') return '/overview';
  if (ws.merchant) return '/merchant';
  if (ws.role === 'driver') return '/driver-app';
  return '/onboarding';
}

export async function requireStaff() {
  const ws = await getWorkspace();
  if (!ws) redirect('/login');
  if (!ws.role || ws.role === 'driver' || !ws.org) redirect(homeFor(ws));
  return ws as Workspace & { org: NonNullable<Workspace['org']>; role: string };
}

export async function requireMerchant() {
  const ws = await getWorkspace();
  if (!ws) redirect('/login');
  if (!ws.merchant) redirect(homeFor(ws));
  return ws as Workspace & { merchant: NonNullable<Workspace['merchant']> };
}
