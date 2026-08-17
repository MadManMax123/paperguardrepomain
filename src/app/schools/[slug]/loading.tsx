import { Skeleton } from "@/components/ui/skeleton";
import { PaperGridSkeleton } from "@/components/paper-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-40" />
      <PaperGridSkeleton count={6} />
    </div>
  );
}
