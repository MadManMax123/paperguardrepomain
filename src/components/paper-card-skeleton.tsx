import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaperCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-2">
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/5" />
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2.5 border-t border-border pt-3">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function PaperGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PaperCardSkeleton key={i} />
      ))}
    </div>
  );
}
