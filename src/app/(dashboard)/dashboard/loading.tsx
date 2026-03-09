export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting + date */}
      <div>
        <div className="h-7 w-52 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-40 rounded-md bg-neutral-900 mt-2" />
      </div>

      {/* Title + badge */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-44 rounded bg-neutral-800/70" />
        <div className="h-6 w-20 rounded-full bg-neutral-800" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[16, 20, 24, 22].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-neutral-800/50"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Service cards with member rows */}
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Service header: icon + name + badge */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-neutral-800" />
                <div className="h-3 w-36 rounded bg-neutral-900" />
              </div>
              <div className="h-6 w-16 rounded-full bg-neutral-800/50" />
            </div>

            {/* Member payment rows */}
            <div className="space-y-3 pt-3 border-t border-neutral-800/50">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-neutral-800" />
                    <div className="h-3 w-32 rounded bg-neutral-900" />
                  </div>
                  <div className="h-3.5 w-14 rounded bg-neutral-800/60" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
