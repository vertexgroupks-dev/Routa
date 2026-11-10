export function AuthAside() {
  return (
    <aside className="relative hidden min-h-[560px] flex-[1_1_520px] flex-col justify-end overflow-hidden bg-night p-12 lg:flex">
      <svg viewBox="0 0 700 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-55" aria-hidden="true">
        <g stroke="#232A42" strokeLinecap="round" fill="none">
          <path d="M-20 200 C 200 180, 400 240, 720 190" strokeWidth="16" /><path d="M330 -20 C 310 200, 380 420, 360 720" strokeWidth="16" />
          <path d="M-20 90 L720 70M-20 330 C 260 310, 480 360, 720 320M-20 470 L720 455M90 -20 L120 720M210 -20 L220 720M520 -20 C 500 220, 560 420, 540 720M640 -20 L620 720" strokeWidth="8" />
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6">
          <path d="M350 210 L520 200 L530 90 L640 75" stroke="#C8F25A" /><path d="M350 210 L340 330 L215 325 L210 460 L110 455" stroke="#5B5CF6" />
        </g>
        <g stroke="#0B0F1E" strokeWidth="4">
          <circle cx="520" cy="200" r="10" fill="#C8F25A" /><circle cx="530" cy="90" r="10" fill="#C8F25A" /><circle cx="640" cy="75" r="10" fill="#C8F25A" />
          <circle cx="215" cy="325" r="10" fill="#5B5CF6" /><circle cx="210" cy="460" r="10" fill="#5B5CF6" /><circle cx="110" cy="455" r="10" fill="#5B5CF6" />
        </g>
        <rect x="332" y="192" width="36" height="36" rx="9" fill="#C8F25A" />
      </svg>
      <div className="relative flex max-w-[520px] flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <span className="flex flex-col gap-0.5 rounded-xl border border-night-line bg-night-2 px-3.5 py-2.5"><span className="text-xs text-muted">Plan</span><span className="text-xl font-semibold text-white">Routes in minutes</span></span>
          <span className="flex flex-col gap-0.5 rounded-xl border border-night-line bg-night-2 px-3.5 py-2.5"><span className="text-xs text-muted">Prove</span><span className="text-xl font-semibold text-lime">Photo + GPS on every drop</span></span>
        </div>
        <p className="text-[28px] font-semibold leading-9 tracking-[-0.8px] text-white">One control room for the office, the warehouse and every driver on the road.</p>
        <p className="text-sm text-muted">Built for couriers and online stores across Kosovo · Shqip &amp; English</p>
      </div>
    </aside>
  );
}
