export default function PersonasLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header: title + badge + CTA */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 rounded-lg bg-neutral-800/70" />
            <div className="h-6 w-16 rounded-full bg-neutral-800" />
          </div>
          <div className="h-4 w-80 rounded-md bg-neutral-900 mt-2" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-neutral-800/50" />
      </div>

      {/* Filter chips (two groups: status + account) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[14, 14, 20, 18].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-neutral-800/50"
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>
        <div className="w-px h-6 bg-neutral-800/60 hidden sm:block" />
        <div className="flex gap-2">
          {[14, 20, 18].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-neutral-800/50"
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>
      </div>

      {/* Persona cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-neutral-800 bg-neutral-900/30 p-5"
          >
            {/* Avatar + name + amount */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-neutral-800" />
                  <div className="h-3 w-32 rounded bg-neutral-900" />
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className="h-4 w-12 rounded bg-neutral-800 ml-auto" />
                <div className="h-3 w-8 rounded bg-neutral-900 ml-auto" />
              </div>
            </div>

            {/* Service pills */}
            <div className="mt-4 mb-3">
              <div className="h-3 w-20 rounded bg-neutral-900 mb-2" />
              <div className="flex gap-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-6 w-20 rounded-md bg-neutral-800/40 border border-neutral-700/50"
                  />
                ))}
              </div>
            </div>

            {/* Status badge */}
            <div className="mb-4">
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
