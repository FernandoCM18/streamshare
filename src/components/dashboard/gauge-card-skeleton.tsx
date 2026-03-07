import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function GaugeCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-neutral-800/60 bg-neutral-900/40 py-4 ring-0 lg:py-6 animate-pulse">
      <CardHeader className="flex items-center justify-between pb-3">
        <div className="h-3 w-16 rounded bg-neutral-800" />
        <div className="h-5 w-16 rounded-full bg-neutral-800" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mx-auto w-full max-w-[260px] lg:max-w-none aspect-[2/1] rounded-xl bg-neutral-800/50" />
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          <div className="text-center space-y-1">
            <div className="h-2.5 w-10 rounded bg-neutral-800 mx-auto" />
            <div className="h-4 w-16 rounded bg-neutral-800 mx-auto" />
          </div>
          <div className="h-7 w-px bg-neutral-800 lg:h-8" />
          <div className="text-center space-y-1">
            <div className="h-2.5 w-10 rounded bg-neutral-800 mx-auto" />
            <div className="h-4 w-16 rounded bg-neutral-800 mx-auto" />
          </div>
        </div>
      </CardContent>
      <div className="mx-4 h-px bg-neutral-800" />
      <CardFooter className="flex-col items-start gap-3 border-t-0 bg-transparent pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="h-3 w-20 rounded bg-neutral-800" />
          <div className="h-5 w-6 rounded-full bg-neutral-800" />
        </div>
        <div className="space-y-3 w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 rounded bg-neutral-800" />
                <div className="h-2.5 w-32 rounded bg-neutral-800" />
              </div>
              <div className="h-3 w-12 rounded bg-neutral-800" />
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
