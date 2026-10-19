import { Skeleton } from "@/components/ui/skeleton";

/** While an admin page loads: the shape of a page header and a list, so nothing jumps when it arrives. */
export default function PanelLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48 rounded-full" />
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
