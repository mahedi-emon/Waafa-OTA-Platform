"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The month calendar of the date pickers, loaded the first time one opens: editors without dates don't carry the
 * calendar and its date library (D0 R2).
 */
const LazyCalendar = dynamic(
  () => import("@/components/ui/calendar").then((module) => module.Calendar),
  { ssr: false, loading: () => <Skeleton className="h-64 w-53 rounded-xl" /> },
);

export { LazyCalendar };
