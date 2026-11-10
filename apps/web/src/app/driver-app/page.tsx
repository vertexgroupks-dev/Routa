import { Logo } from '@/components/Logo';

export default function DriverAppPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
      <Logo dark />
      <h1 className="text-2xl font-semibold tracking-[-0.6px]">Drivers use the Routa Driver app</h1>
      <p className="max-w-md text-sm text-ink-2">Your account is a driver account. Open the Routa Driver app on your phone and sign in with the same phone number.</p>
      <form action="/auth/signout" method="post"><button className="btn-ghost">Sign out</button></form>
    </main>
  );
}
