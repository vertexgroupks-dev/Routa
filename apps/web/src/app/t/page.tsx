import { redirect } from 'next/navigation';

// /t?code=B3629AB3E1 → /t/B3629AB3E1 (the "Track a parcel" box on the home page)
export default async function TrackRedirect({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const clean = (code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  redirect(clean ? `/t/${clean}` : '/');
}
