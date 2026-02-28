export default function ConfiguracionLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-56 rounded-md bg-neutral-900" />
      </div>

      {/* Profile section */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5 space-y-5">
        <div className="h-5 w-24 rounded bg-neutral-800" />

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-neutral-800" />
            <div className="h-3 w-40 rounded bg-neutral-900" />
          </div>
        </div>

        {/* Input fields */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-neutral-800/70" />
            <div className="h-11 w-full rounded-xl bg-neutral-900/50 border border-neutral-800" />
          </div>
        ))}
      </div>

      {/* Settings section */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5 space-y-5">
        <div className="h-5 w-32 rounded bg-neutral-800" />

        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-40 rounded bg-neutral-800" />
              <div className="h-3 w-56 rounded bg-neutral-900" />
            </div>
            <div className="w-10 h-6 rounded-full bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="h-12 w-full rounded-2xl bg-neutral-800/50" />
    </div>
  );
}
