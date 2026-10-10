import { Skeleton } from "@/components/ui/skeleton";

/** Listing placeholder at the final height: header, filter rail and a grid of cards. */
function ListingSkeleton() {
  return (
    <main
      id="main"
      aria-busy="true"
      className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6"
    >
      <Skeleton className="h-5 w-56 rounded-full" />
      <Skeleton className="h-12 w-2/3 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[256px_minmax(0,1fr)]">
        <Skeleton className="h-12 rounded-full lg:h-[520px] lg:rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/5] rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}

export { ListingSkeleton };
