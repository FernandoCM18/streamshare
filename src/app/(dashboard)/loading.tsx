export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-neutral-800/70" />
        <div className="h-4 w-64 rounded-md bg-neutral-900" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-neutral-800 bg-neutral-900/30"
          />
        ))}
      </div>
    </div>
  );
}
