import { LeadCardHeader } from "@/components/leads/LeadCardHeader";
import { Skeleton } from "@/components/ui/skeleton";

type RequestSkeletonProps = {
  card: { kicker: string; title: string; lead: string; badges: string[] };
};

/**
 * While a results page streams: the summary bar and preferences as skeletons, and the request card with its real
 * header, so the page's largest text is in the first HTML and the card does not jump when the form arrives (issues 170
 * and 271). Shared by /flights and /hotels.
 */
function RequestSkeleton({ card }: RequestSkeletonProps) {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-[72px] rounded-2xl" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)] xl:gap-8">
          <Skeleton className="hidden h-[420px] rounded-2xl xl:block" />
          <div className="flex min-w-0 flex-col gap-4">
            <Skeleton className="h-11 w-44 rounded-xl xl:hidden" />
            <div className="overflow-hidden rounded-[20px] border border-mist-200 bg-white shadow-sm">
              <LeadCardHeader {...card} />
              <div className="flex flex-col gap-4 px-5 py-6 md:px-7">
                <Skeleton className="h-8 w-48 rounded-full" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <Skeleton className="hidden h-[360px] rounded-2xl lg:block" />
      </div>
    </div>
  );
}

export { RequestSkeleton };
