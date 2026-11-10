import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NAV, NAV_FOOTER } from '@/components/nav';
import { Icon } from '@/components/Icon';

// Screens that are designed but scheduled for a later build stage.
export default async function ComingSoon({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = [...NAV.flatMap((g) => g.items), ...NAV_FOOTER].find((i) => i.href === `/${section}`);
  if (!item) notFound();
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-tint"><Icon name={item.icon} size={22} color="#4A49E3" /></span>
      <h1 className="text-xl font-semibold tracking-[-0.4px]">{item.label}</h1>
      <p className="max-w-md text-sm text-ink-2">This screen is designed and the database for it is ready. It gets built in <b>{item.stage ?? 'a later stage'}</b> of the project plan.</p>
      <Link href="/overview" className="btn-ghost">Back to overview</Link>
    </div>
  );
}
