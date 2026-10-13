"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The search card's client island, fetched only when it is first shown (issue 170): on the results pages the card
 * sits behind Edit, so its JavaScript stays off the first load. The skeleton keeps the card's height while it loads.
 */
const DeferredSearchCardClient = dynamic(
  () => import("./SearchCardClient").then((mod) => mod.SearchCardClient),
  { loading: () => <Skeleton className="h-[440px] rounded-[24px]" /> },
);

export { DeferredSearchCardClient };
