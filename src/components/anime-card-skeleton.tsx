import { cn } from "@/lib/utils";

export function AnimeCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card",
        className
      )}
    >
      <div className="aspect-[2/3] w-full shimmer" />
      <div className="space-y-2 p-2.5">
        <div className="h-3.5 w-full shimmer rounded" />
        <div className="h-3.5 w-2/3 shimmer rounded" />
        <div className="h-3 w-1/3 shimmer rounded" />
      </div>
    </div>
  );
}

export function AnimeCardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}
