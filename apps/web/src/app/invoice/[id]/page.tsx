import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrintButton } from '../../labels/PrintButton';
import { euro } from '@routa/shared';

export const metadata = { title: 'Invoice' };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: inv } = await sb.from('invoices').select('*, lines:invoice_lines(*), merchant:merchants(name, code, address, email, payout_iban), org:organizations(name, settings)').eq('id', id).maybeSingle();
  if (!inv) notFound();
  const s = (inv.org?.settings ?? {}) as Record<string, string>;
  return (
    <main className="mx-auto flex max-w-[800px] flex-col gap-8 bg-white p-10 text-ink print:p-0">
      <div className="noprint flex justify-end print:hidden"><PrintButton /></div>
      <header className="flex justify-between">
        <div><h1 className="text-2xl font-semibold">{inv.org?.name}</h1><p className="text-sm text-ink-2">{s.address ?? 'Prishtinë, Kosovë'}{s.nui ? ` · NUI ${s.nui}` : ''}</p></div>
        <div className="text-right"><p className="text-xs uppercase text-ink-3">Faturë / Invoice</p><p className="font-mono text-xl font-semibold">{inv.number}</p><p className="text-sm text-ink-2">Lëshuar {String(inv.issued_at ?? '').slice(0, 10)} · Afati {inv.due_at}</p></div>
      </header>
      <section className="flex justify-between text-sm">
        <div><p className="text-xs uppercase text-ink-3">Për / Bill to</p><p className="font-semibold">{inv.merchant?.name}</p><p className="text-ink-2">{inv.merchant?.address ?? ''}</p><p className="text-ink-2">{inv.merchant?.email ?? ''}</p></div>
        <div className="text-right"><p className="text-xs uppercase text-ink-3">Periudha / Period</p><p>{inv.period_start} → {inv.period_end}</p></div>
      </section>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b-2 border-ink text-left"><th className="py-2">Përshkrimi</th><th className="py-2 text-right">Sasia</th><th className="py-2 text-right">Çmimi</th><th className="py-2 text-right">Shuma</th></tr></thead>
        <tbody>{(inv.lines ?? []).map((l: any) => <tr key={l.id} className="border-b border-line"><td className="py-2">{l.description}</td><td className="py-2 text-right font-mono">{Number(l.qty)}</td><td className="py-2 text-right font-mono">{euro(l.unit_price)}</td><td className="py-2 text-right font-mono">{euro(l.amount)}</td></tr>)}</tbody>
      </table>
      <div className="ml-auto flex w-[280px] flex-col gap-1 text-sm">
        <span className="flex justify-between"><span>Nëntotali</span><span className="font-mono">{euro(inv.subtotal)}</span></span>
        <span className="flex justify-between"><span>TVSH {Number(inv.vat_rate)}%</span><span className="font-mono">{euro(inv.vat_amount)}</span></span>
        <span className="flex justify-between border-t-2 border-ink pt-1 text-base font-semibold"><span>Totali</span><span className="font-mono">{euro(inv.total)}</span></span>
      </div>
      <p className="text-xs text-ink-3">Tarifat janë zbritur nga shumat e mbledhura me para në dorë (COD) gjatë periudhës. Fees were deducted from the cash-on-delivery collected in this period.</p>
    </main>
  );
}
