'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Row = { name: string; phone: string; address: string; city: string; cod: string; weight: string; ref: string; error?: string };

function parse(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0]!.includes(';') ? ';' : ',';
  const head = lines[0]!.split(sep).map((h) => h.trim().toLowerCase());
  const idx = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const c = { name: idx('name', 'emri', 'customer'), phone: idx('phone', 'tel'), address: idx('address', 'adresa', 'street'), city: idx('city', 'qyteti'), cod: idx('cod', 'amount', 'shuma'), weight: idx('weight', 'kg', 'pesha'), ref: idx('ref', 'order') };
  return lines.slice(1).map((l) => {
    const v = l.split(sep).map((x) => x.trim().replace(/^"|"$/g, ''));
    const r: Row = { name: v[c.name] ?? '', phone: v[c.phone] ?? '', address: v[c.address] ?? '', city: v[c.city] ?? 'Prishtinë', cod: v[c.cod] ?? '0', weight: v[c.weight] ?? '1', ref: v[c.ref] ?? '' };
    if (!r.name) r.error = 'Missing name'; else if (!/^\+?\d{8,15}$/.test(r.phone.replace(/\s/g, ''))) r.error = 'Bad phone'; else if (!r.address) r.error = 'Missing address';
    return r;
  });
}

export function CsvImport({ orgId, merchantId }: { orgId: string; merchantId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ok = rows.filter((r) => !r.error);
  return (
    <div className="flex flex-col gap-4">
      <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center text-sm text-ink-2">
        <span className="font-medium text-ink">Choose a CSV file</span>
        <span className="text-xs">Exported from Shopify, WooCommerce or Excel (Save as CSV)</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setRows(parse(await f.text())); setMsg(null); } }} />
      </label>
      {rows.length > 0 && (
        <section className="card overflow-x-auto">
          <div className="flex items-center gap-3 px-5 pt-4 text-[13px]"><span className="flex-1">{ok.length} ready · {rows.length - ok.length} with errors</span>
            <button disabled={busy || !ok.length} className="btn-primary" onClick={async () => {
              setBusy(true);
              const { error } = await createClient().from('orders').insert(ok.map((r) => ({ org_id: orgId, merchant_id: merchantId, source: 'csv', customer_name: r.name, customer_phone: r.phone.replace(/\s/g, ''), address_line: r.address, address_raw: `${r.address}, ${r.city}`, city: r.city, cod_amount: Number(r.cod.replace(',', '.')) || 0, weight_kg: Number(r.weight.replace(',', '.')) || null, merchant_ref: r.ref || null })));
              setBusy(false);
              if (error) setMsg(error.message); else { setMsg(`${ok.length} orders imported.`); setRows([]); router.refresh(); }
            }}>{busy ? 'Importing…' : `Import ${ok.length} orders`}</button></div>
          <table className="mt-3 w-full min-w-[720px] border-collapse text-[13px]"><tbody>{rows.map((r, i) => (
            <tr key={i} className={`border-t border-line ${r.error ? 'bg-danger-tint' : ''}`}><td className="td pl-5">{r.name}</td><td className="td font-mono">{r.phone}</td><td className="td">{r.address}, {r.city}</td><td className="td text-right font-mono">{r.cod}</td><td className="td pr-5 text-danger-ink">{r.error ?? ''}</td></tr>))}</tbody></table>
        </section>
      )}
      {msg && <p className="rounded-[10px] bg-success-tint px-3 py-2 text-[13px] text-success-ink">{msg}</p>}
    </div>
  );
}
