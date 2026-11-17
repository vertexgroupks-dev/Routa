import { requireMerchant } from '@/lib/session';
import { LiveRefresh } from '@/components/LiveRefresh';
import { MerchantNav } from './MerchantNav';

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const ws = await requireMerchant();
  return (
    <div className="flex min-h-screen">
      <div className="app-bg" aria-hidden="true" />
      <LiveRefresh />
      <MerchantNav merchantName={ws.merchant.name} code={ws.merchant.code} userName={ws.fullName} />
      <main className="mx-auto flex w-full min-w-0 max-w-[1300px] flex-col gap-5 px-3 py-6 lg:px-6">{children}</main>
    </div>
  );
}
