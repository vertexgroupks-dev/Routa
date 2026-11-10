import Link from 'next/link';
import { notFound } from 'next/navigation';

const STAGES: Record<string, [string, string]> = { import: ['Import CSV', 'Stage 3 · CSV import with column mapping'], stock: ['Stock', 'Stage 7 · Warehouse'], payouts: ['Payouts', 'Stage 7 · Money'] };

export default async function MerchantSoon({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const s = STAGES[section];
  if (!s) notFound();
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
      <h1 className="text-xl font-semibold">{s[0]}</h1>
      <p className="max-w-md text-sm text-ink-2">Designed and ready in the database — built in <b>{s[1]}</b>.</p>
      <Link href="/merchant" className="btn-ghost">Back to dashboard</Link>
    </div>
  );
}
