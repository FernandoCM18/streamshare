export default function DashboardLoading() {
  return (
    <div className="m-5 flex flex-col gap-5 lg:flex-row animate-pulse">
      {/* Gauge sidebar skeleton */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
          <div className="h-3 w-16 rounded bg-neutral-800" />
          <div className="mx-auto w-full max-w-[260px] aspect-[2/1] rounded-xl bg-neutral-800/50" />
          <div className="flex items-center justify-center gap-3">
            <div className="text-center space-y-1">
              <div className="h-2.5 w-10 rounded bg-neutral-800 mx-auto" />
              <div className="h-4 w-16 rounded bg-neutral-800 mx-auto" />
            </div>
            <div className="h-7 w-px bg-neutral-800" />
            <div className="text-center space-y-1">
              <div className="h-2.5 w-10 rounded bg-neutral-800 mx-auto" />
              <div className="h-4 w-16 rounded bg-neutral-800 mx-auto" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area skeleton */}
      <main className="flex-1 space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-neutral-800/70" />
          <div className="h-4 w-64 rounded-md bg-neutral-900" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-neutral-800 bg-neutral-900/30"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
