import { requireMerchant } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Pill, Empty } from '@/components/ui';
import { NewKey, RevokeKey, Webhooks } from './DevActions';

export const metadata = { title: 'API & webhooks' };

export default async function Page() {
  const ws = await requireMerchant();
  const sb = await createClient();
  const [{ data: keys }, { data: hooks }] = await Promise.all([
    sb.from('api_keys').select('id, name, key_prefix, last_used_at, revoked_at, created_at').eq('merchant_id', ws.merchant.id).order('created_at', { ascending: false }),
    sb.from('webhook_endpoints').select('id, url, secret, events, active').eq('merchant_id', ws.merchant.id).order('created_at')
  ]);
  const api = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/merchant-api`;
  return (
    <>
      <PageHeader title="API & webhooks" subtitle="Send orders automatically from your shop, and get told when they are delivered." />
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="text-base font-semibold">API keys</h2>
        <NewKey merchantId={ws.merchant.id} />
        {(keys ?? []).map((k) => (
          <div key={k.id} className="flex flex-wrap items-center gap-3 border-t border-line py-2.5 text-[13px]">
            <span className="flex-1 font-medium">{k.name}</span><span className="font-mono text-ink-2">{k.key_prefix}…</span>
            <span className="text-xs text-ink-3">{k.last_used_at ? `used ${k.last_used_at.slice(0, 16).replace('T', ' ')}` : 'never used'}</span>
            {k.revoked_at ? <Pill bg="#FDECEC" ink="#B42318">Revoked</Pill> : <RevokeKey id={k.id} />}
          </div>
        ))}
        {(keys ?? []).length === 0 && <Empty title="No keys yet" />}
      </section>
      <Webhooks orgId={ws.merchant.org_id} merchantId={ws.merchant.id} hooks={(hooks ?? []) as any[]} />
      <section className="card flex flex-col gap-3 p-5 text-[13px]">
        <h2 className="text-base font-semibold">How to use the API</h2>
        <p className="text-ink-2">Create an order (fees, zone and tracking link come back in the answer):</p>
        <pre className="overflow-x-auto rounded-[10px] bg-night p-4 font-mono text-xs leading-5 text-[#E4E7EF]">{`curl -X POST ${api}/orders \\
  -H "Authorization: Bearer rk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"customer_name":"Liridona Berisha","customer_phone":"+38344123456",
       "address":"Rr. Agim Ramadani 14","city":"Prishtinë","cod_amount":42.5,
       "weight_kg":1.2,"ref":"#1042"}'`}</pre>
        <p className="text-ink-2">Other calls: <span className="font-mono">GET /orders</span> (latest), <span className="font-mono">GET /orders/KS-20412</span> (status + timeline, also works with your own ref), <span className="font-mono">POST /orders/KS-20412/cancel</span> (only while “Confirmed”). Up to 200 orders can be sent at once as an array.</p>
        <p className="text-ink-2">Webhooks are sent as POST with the header <span className="font-mono">X-Routa-Signature</span> = HMAC-SHA256 of the body with your endpoint secret.</p>
      </section>
    </>
  );
}
