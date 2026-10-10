"use client";

import { useSyncExternalStore } from "react";
import { todayInDhaka } from "@/lib/search/isoDate";

const subscribe = () => () => {};

/** Today in Asia/Dhaka, read on the client only (static pages must not bake in the build date). "" on the server. */
export function useDhakaToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => todayInDhaka(),
    () => "",
  );
}
