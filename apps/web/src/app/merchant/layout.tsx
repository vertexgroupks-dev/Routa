import { requireMerchant } from '@/lib/session';
import { MerchantNav } from './MerchantNav';

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const ws = await requireMerchant();
  return (
    <div className="flex min-h-screen bg-canvas">
      <MerchantNav merchantName={ws.merchant.name} code={ws.merchant.code} userName={ws.fullName} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-7">{children}</main>
    </div>
  );
}
