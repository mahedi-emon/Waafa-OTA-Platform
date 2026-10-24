"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { exitPreviewHref } from "@/lib/admin/preview";

/** Ends the preview and stays on the page it was on (a plain link: never prefetched). */
function PreviewExitLink({ label }: { label: string }) {
  const pathname = usePathname();
  return (
    <a
      href={exitPreviewHref(pathname)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-navy-900 px-4 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <LogOut aria-hidden="true" className="size-4" />
      {label}
    </a>
  );
}

export { PreviewExitLink };
