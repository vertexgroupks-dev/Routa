import { requireMerchant } from '@/lib/session';
import { PageHeader } from '@/components/ui';
import { CsvImport } from './CsvImport';
export const metadata = { title: 'Import CSV' };
export default async function Page() {
  const ws = await requireMerchant();
  return (<>
    <PageHeader title="Import orders from CSV" subtitle="Columns: name, phone, address, city, cod, weight, ref (header row required). Each row becomes an order with fees calculated automatically." />
    <CsvImport orgId={ws.merchant.org_id} merchantId={ws.merchant.id} />
  </>);
}
