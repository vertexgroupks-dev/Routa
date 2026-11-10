'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ZonePrice({ id, value }: { id: string; value: number }) {
  const router = useRouter();
  const [v, setV] = useState(value.toFixed(2));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  return (
    <span className="inline-flex items-center gap-2">
      <input className="input w-24 py-1.5 text-right font-mono" value={v} onChange={(e) => { setV(e.target.value); setState('idle'); }} />
      {Number(v) !== value && <button className="btn-primary py-1.5" onClick={async () => {
        setState('saving');
        const { error } = await createClient().from('zones').update({ base_fee: Number(v) }).eq('id', id);
        setState(error ? 'error' : 'saved'); if (!error) router.refresh();
      }}>{state === 'saving' ? '…' : 'Save'}</button>}
      {state === 'error' && <span className="text-xs text-danger-ink">No permission</span>}
    </span>
  );
}
