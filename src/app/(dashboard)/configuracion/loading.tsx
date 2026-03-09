export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-56 rounded-md bg-neutral-900 mt-2" />
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-linear-to-b from-neutral-800/40 to-neutral-900/40 border border-neutral-800/60 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700" />
          {/* Name + email + badges */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="h-6 w-36 rounded bg-neutral-800 mx-auto sm:mx-0" />
            <div className="h-4 w-48 rounded bg-neutral-900 mx-auto sm:mx-0" />
            <div className="flex gap-2 justify-center sm:justify-start">
              <div className="h-5 w-12 rounded-full bg-orange-500/10" />
              <div className="h-5 w-32 rounded-full bg-neutral-800" />
            </div>
          </div>
          {/* Edit button */}
          <div className="h-8 w-28 rounded-lg bg-neutral-800/40" />
        </div>
      </div>

      {/* Preferencias card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 space-y-5">
        <div className="h-5 w-28 rounded bg-neutral-800" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-neutral-800/70" />
            <div className="h-11 w-full rounded-xl bg-neutral-900/50 border border-neutral-800" />
          </div>
        ))}
      </div>

      {/* Notificaciones card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 space-y-5">
        <div className="h-5 w-32 rounded bg-neutral-800" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-neutral-800" />
              <div className="h-3 w-52 rounded bg-neutral-900" />
            </div>
            <div className="w-10 h-6 rounded-full bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* Zona peligro */}
      <div className="rounded-2xl border border-red-500/10 bg-neutral-900/30 p-6">
        <div className="h-5 w-28 rounded bg-neutral-800" />
        <div className="h-3 w-64 rounded bg-neutral-900 mt-2" />
        <div className="h-9 w-36 rounded-lg bg-red-500/10 mt-4" />
      </div>
    </div>
  );
}
