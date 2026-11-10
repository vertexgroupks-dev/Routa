'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ORDER_STATUS, type OrderStatus } from '@routa/shared';

// Mirrors private.allowed_transition in the database (the database is the real gatekeeper).
const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  confirmed: ['received', 'packed', 'cancelled'],
  received: ['packed', 'cancelled'],
  packed: ['received', 'cancelled'],
  assigned: ['out_for_delivery', 'packed', 'cancelled'],
  out_for_delivery: ['delivered', 'failed_attempt', 'returning'],
  failed_attempt: ['out_for_delivery', 'rescheduled', 'returning', 'returned_to_hub'],
  rescheduled: ['received', 'returning', 'cancelled'],
  returning: ['returned_to_hub'],
  returned_to_hub: ['received', 'rescheduled', 'returned_to_merchant']
};

export function OrderActions({ orderId, orgId, userId, status }: { orderId: string; orgId: string; userId: string; status: OrderStatus }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setError(null);
    const { error } = await fn();
    setBusy(false);
    if (error) setError(error.message); else { setNote(''); router.refresh(); }
  }

  return (
    <section className="card flex flex-col gap-3 p-5 text-[13px]">
      <h2 className="text-base font-semibold">Actions</h2>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional, saved on the timeline)" className="input min-h-16" />
      <div className="flex flex-wrap gap-2">
        {(NEXT[status] ?? []).map((s) => (
          <button key={s} disabled={busy} onClick={() => run(() => supabase.rpc('set_order_status', { p_order_id: orderId, p_status: s, p_note: note || null }))} className={s === 'cancelled' ? 'btn-ghost text-danger-ink' : 'btn-ghost'}>
            → {ORDER_STATUS[s].label}
          </button>
        ))}
      </div>
      {['failed_attempt', 'returned_to_hub', 'rescheduled', 'confirmed', 'received', 'packed'].includes(status) && (
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input py-2" />
          <button disabled={busy || !date} onClick={() => run(() => supabase.rpc('reschedule_order', { p_order_id: orderId, p_date: date, p_note: note || null }))} className="btn-primary whitespace-nowrap">Reschedule</button>
        </div>
      )}
      <button disabled={busy || !note} onClick={() => run(() => supabase.from('order_events').insert({ org_id: orgId, order_id: orderId, actor_id: userId, type: 'note', note, internal: true }))} className="btn-ghost self-start">Add note only</button>
      {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2 text-danger-ink">{error}</p>}
    </section>
  );
}
