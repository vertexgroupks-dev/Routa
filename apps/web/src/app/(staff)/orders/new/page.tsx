import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui';
import { NewOrderForm } from './NewOrderForm';

export const metadata = { title: 'New order' };

export default async function NewOrderPage() {
  const ws = await requireStaff('/orders/new');
  const supabase = await createClient();
  const [{ data: merchants }, { data: zones }, { data: hub }] = await Promise.all([
    supabase.from('merchants').select('id, name, code').eq('org_id', ws.org.id).eq('status', 'active').order('name'),
    supabase.from('zones').select('name, base_fee, sla, color').eq('org_id', ws.org.id).eq('active', true).order('sort'),
    supabase.rpc('hub_point', { p_org: ws.org.id })
  ]);
  return (
    <>
      <PageHeader title="New order" subtitle="Front desk · walk-in or phone order. Zone, fees and delivery date are calculated automatically when you save." />
      <NewOrderForm orgId={ws.org.id} merchants={merchants ?? []} zones={zones ?? []} hub={hub ?? null} />
    </>
  );
}
