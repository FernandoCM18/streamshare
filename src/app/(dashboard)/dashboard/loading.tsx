export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting */}
      <div>
        <div className="h-7 w-52 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-40 rounded-md bg-neutral-900 mt-2" />
      </div>

      {/* Title + badges */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-44 rounded bg-neutral-800/70" />
        <div className="h-6 w-20 rounded-full bg-neutral-800" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-neutral-800/50" />
        ))}
      </div>

      {/* Service cards */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-neutral-800" />
                <div className="h-3 w-24 rounded bg-neutral-900" />
              </div>
              <div className="h-6 w-16 rounded-full bg-neutral-800" />
            </div>

            {/* Member rows */}
            <div className="space-y-3 pt-3 border-t border-neutral-800/50">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-28 rounded bg-neutral-800" />
                    <div className="h-3 w-20 rounded bg-neutral-900" />
                  </div>
                  <div className="h-8 w-20 rounded-lg bg-neutral-800/40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
