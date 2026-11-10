import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { STAFF_ROLES } from '@routa/shared';

export type Workspace = {
  userId: string;
  email: string | null;
  fullName: string;
  org: { id: string; name: string; is_demo: boolean; settings: Record<string, unknown> } | null;
  role: string | null;
  hub: { id: string; name: string; address: string | null } | null;
  merchant: { id: string; name: string; code: string; org_id: string } | null;
};

/** Who is signed in, which company they belong to and in what role. Cached per request. */
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: memberships }, { data: merchantLinks }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('memberships').select('role, hub_id, org:organizations(id, name, is_demo, settings)').eq('user_id', user.id).eq('active', true),
    supabase.from('merchant_users').select('merchant:merchants(id, name, code, org_id)').eq('user_id', user.id)
  ]);

  const staff = (memberships ?? []).find((m) => (STAFF_ROLES as readonly string[]).includes(m.role as string)) ?? (memberships ?? [])[0];
  const org = (staff?.org as unknown as Workspace['org']) ?? null;
  let hub: Workspace['hub'] = null;
  if (org) {
    const { data } = await supabase.from('hubs').select('id, name, address').eq('org_id', org.id).order('is_default', { ascending: false }).limit(1).maybeSingle();
    hub = data;
  }
  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'You',
    org,
    role: (staff?.role as string) ?? null,
    hub,
    merchant: ((merchantLinks ?? [])[0]?.merchant as unknown as Workspace['merchant']) ?? null
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
  if (!ws.role || ws.role === 'driver') redirect(homeFor(ws));
  return ws as Workspace & { org: NonNullable<Workspace['org']>; role: string };
}

export async function requireMerchant() {
  const ws = await getWorkspace();
  if (!ws) redirect('/login');
  if (!ws.merchant) redirect(homeFor(ws));
  return ws as Workspace & { merchant: NonNullable<Workspace['merchant']> };
}
