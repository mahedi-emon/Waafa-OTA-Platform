"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

type OfflineBannerProps = { message: string };

/** A calm strip under the top bar while the network is down (ADMIN.md §5.9); nothing typed is thrown away. */
function OfflineBanner({ message }: OfflineBannerProps) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 border-b border-warning-800/15 bg-warning-50 px-4 py-2.5 text-[14px] font-medium text-warning-800 md:px-6 lg:px-8"
    >
      <WifiOff aria-hidden="true" className="size-4 shrink-0" />
      {message}
    </div>
  );
}

export { OfflineBanner };
