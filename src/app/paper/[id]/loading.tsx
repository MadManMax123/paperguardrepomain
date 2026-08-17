import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-1 h-8 w-3/4" />
      <Skeleton className="mb-6 h-4 w-1/3" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-[70vh] w-full rounded-lg" />
    </div>
  );
}
