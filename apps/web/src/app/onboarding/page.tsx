import { redirect } from 'next/navigation';
import { getWorkspace, homeFor } from '@/lib/session';
import { Logo } from '@/components/Logo';
import { OnboardingForm } from './OnboardingForm';

export const metadata = { title: 'Set up your company' };

export default async function OnboardingPage() {
  const ws = await getWorkspace();
  if (!ws) redirect('/login');
  if (ws.role || ws.merchant) redirect(homeFor(ws));
  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-line bg-white px-8 py-4">
        <Logo dark />
        <form action="/auth/signout" method="post"><button className="text-[13px] text-ink-2 hover:text-ink">Sign out</button></form>
      </header>
      <main className="mx-auto flex max-w-[1040px] flex-wrap gap-6 px-6 py-10">
        <OnboardingForm fullName={ws.fullName} />
      </main>
    </div>
  );
}
