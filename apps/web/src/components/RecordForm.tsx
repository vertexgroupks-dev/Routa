'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAction, Msg } from './useAction';

export type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'select' | 'json-number'; options?: [string, string][]; span?: 2 | 3; placeholder?: string; jsonKey?: string };

/** Add or edit one row of a table (RLS decides who may). jsonKey fields are stored inside a jsonb column (e.g. pricing.delivery_fee). */
export function RecordForm({ table, id, fields, initial, extra, label, kind = 'ghost' }: { table: string; id?: string; fields: Field[]; initial?: Record<string, any>; extra?: Record<string, unknown>; label: string; kind?: 'ghost' | 'primary' }) {
  const [open, setOpen] = useState(false);
  const init = () => Object.fromEntries(fields.map((f) => [f.key, f.jsonKey ? initial?.[f.jsonKey]?.[f.key] ?? '' : initial?.[f.key] ?? '']));
  const [v, setV] = useState<Record<string, any>>(init);
  const a = useAction();
  if (!open) return <button type="button" className={kind === 'primary' ? 'btn-primary' : 'text-xs font-medium text-brand-hover'} onClick={() => { setV(init()); setOpen(true); }}>{label}</button>;
  return (
    <form className="col-span-full grid w-full gap-3 rounded-xl border border-line bg-canvas p-4 sm:grid-cols-3" onSubmit={async (e) => {
      e.preventDefault();
      const row: Record<string, any> = { ...(extra ?? {}) };
      for (const f of fields) {
        const raw = v[f.key];
        const val = raw === '' ? null : f.type === 'number' || f.type === 'json-number' ? Number(raw) : raw;
        if (f.jsonKey) { row[f.jsonKey] = { ...(initial?.[f.jsonKey] ?? {}), ...(row[f.jsonKey] ?? {}) }; if (val === null) delete row[f.jsonKey][f.key]; else row[f.jsonKey][f.key] = val; }
        else row[f.key] = val;
      }
      const sb = createClient();
      const ok = await a.run(() => (id ? sb.from(table).update(row).eq('id', id) : sb.from(table).insert(row)), 'Saved.');
      if (ok) setOpen(false);
    }}>
      {fields.map((f) => (
        <label key={f.key} className={`label ${f.span === 2 ? 'sm:col-span-2' : f.span === 3 ? 'sm:col-span-3' : ''}`}>{f.label}
          {f.type === 'select'
            ? <select className="input py-2" value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}>{f.options!.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
            : <input className="input py-2" type={f.type === 'json-number' ? 'number' : f.type ?? 'text'} step="any" placeholder={f.placeholder} value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
        </label>
      ))}
      <div className="flex items-center gap-2 sm:col-span-3">
        <button disabled={a.busy} className="btn-primary">{a.busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <Msg error={a.error} />
      </div>
    </form>
  );
}
