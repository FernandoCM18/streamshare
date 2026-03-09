export default function MisPagosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-80 rounded-md bg-neutral-900 mt-2" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[14, 20, 18, 16].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-neutral-800/50"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Payment cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4"
          >
            {/* Service icon + name + status */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-neutral-800 border border-neutral-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-neutral-800" />
                  <div className="h-3 w-32 rounded bg-neutral-900" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-neutral-800/50" />
            </div>

            {/* Amount + due date */}
            <div className="mb-4 flex items-end justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-neutral-900" />
                <div className="h-6 w-20 rounded bg-neutral-800" />
              </div>
              <div className="h-3.5 w-28 rounded bg-neutral-900" />
            </div>

            {/* Action button */}
            <div className="h-10 w-full rounded-xl bg-neutral-800/30 border border-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
