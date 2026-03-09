export default function ServiciosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header: title + badge + CTA */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 rounded-lg bg-neutral-800/70" />
            <div className="h-6 w-16 rounded-full bg-neutral-800" />
          </div>
          <div className="h-4 w-72 rounded-md bg-neutral-900 mt-2" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-neutral-800/50" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[14, 16, 18].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-neutral-800/50"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Icon + name + owner badge */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-neutral-800" />
                  <div className="h-3 w-32 rounded bg-neutral-900" />
                </div>
              </div>
            </div>

            {/* Members + status */}
            <div className="mt-5 mb-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-neutral-900"
                  />
                ))}
              </div>
              <div className="h-6 w-16 rounded-full bg-neutral-800/50" />
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
