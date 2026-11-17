export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-4"><span className="h-11 w-11 rounded-2xl bg-white/60" /><span className="flex flex-col gap-2"><span className="h-5 w-52 rounded-lg bg-white/70" /><span className="h-3.5 w-80 rounded-lg bg-white/50" /></span></div>
      <div className="card h-[104px]" />
      <div className="grid gap-5 lg:grid-cols-3"><div className="card h-[320px] lg:col-span-2" /><div className="card h-[320px]" /></div>
    </div>
  );
}
