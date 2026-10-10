"use client";

import { useSyncExternalStore } from "react";
import { Phone, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type OfflineNoticeProps = {
  phoneE164: string;
  labels: { title: string; body: string; retry: string; call: string };
};

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * "You're offline" (Offline board) as a notice above the tab bar instead of a separate page: the site has no service
 * worker, so the page the visitor is on (and anything they typed) stays put; the notice offers Try again and a call.
 */
function OfflineNotice({ phoneE164, labels }: OfflineNoticeProps) {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(var(--tab-space,0px)+12px)] z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-navy-900 p-4 text-white shadow-xl sm:flex-row sm:items-center lg:bottom-6"
    >
      <WifiOff aria-hidden="true" className="size-6 shrink-0 text-cyan-400" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{labels.title}</p>
        <p className="text-[13.5px] text-white/80">{labels.body}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="white" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw aria-hidden="true" />
          {labels.retry}
        </Button>
        <Button asChild variant="glass" size="sm">
          <a href={`tel:${phoneE164}`}>
            <Phone aria-hidden="true" />
            {labels.call}
          </a>
        </Button>
      </div>
    </div>
  );
}

export { OfflineNotice };
