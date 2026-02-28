export default function PersonasLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-neutral-800/70" />
          <div className="h-4 w-48 rounded-md bg-neutral-900" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-neutral-800" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-neutral-800/50" />
        ))}
      </div>

      {/* Persona cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-neutral-800" />
                <div className="h-3 w-36 rounded bg-neutral-900" />
              </div>
            </div>

            {/* Service chips */}
            <div className="flex gap-2 mb-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="h-6 w-20 rounded-full bg-neutral-800/50"
                />
              ))}
            </div>

            {/* Debt info */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
              <div className="h-3 w-20 rounded bg-neutral-900" />
              <div className="h-4 w-16 rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
