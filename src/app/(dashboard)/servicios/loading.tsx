export default function ServiciosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-neutral-800/70" />
          <div className="h-4 w-52 rounded-md bg-neutral-900" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-neutral-800" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-neutral-800/50" />
        ))}
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Icon + name */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-800" />
              <div className="h-6 w-16 rounded-full bg-neutral-800" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-32 rounded bg-neutral-800" />
              <div className="h-3 w-24 rounded bg-neutral-900" />
            </div>

            {/* Avatars */}
            <div className="flex -space-x-2 mb-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-900"
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-5 gap-2 pt-3 border-t border-neutral-800/50">
              <div className="col-span-2 h-8 rounded-lg bg-neutral-800/40" />
              <div className="col-span-2 h-8 rounded-lg bg-neutral-800/40" />
              <div className="col-span-1 h-8 rounded-lg bg-neutral-800/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
