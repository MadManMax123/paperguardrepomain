import { Skeleton } from "@/components/ui/skeleton";
import { PaperCardSkeleton } from "@/components/paper-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <PaperCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
