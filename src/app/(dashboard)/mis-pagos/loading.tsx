export default function MisPagosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-56 rounded-md bg-neutral-900" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-neutral-800/50" />
        ))}
      </div>

      {/* Payment cards list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4"
          >
            <div className="flex items-center gap-3">
              {/* Service icon */}
              <div className="w-10 h-10 rounded-xl bg-neutral-800" />

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-neutral-800" />
                <div className="h-3 w-24 rounded bg-neutral-900" />
              </div>

              {/* Amount + status */}
              <div className="text-right space-y-2">
                <div className="h-4 w-16 rounded bg-neutral-800 ml-auto" />
                <div className="h-5 w-20 rounded-full bg-neutral-800/50 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
