"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  title: string;
  labels: { share: string; copied: string; failed: string };
};

/** Share (PackageDetail): the system share sheet on phones, copy link elsewhere. */
function ShareButton({ title, labels }: ShareButtonProps) {
  async function share() {
    const url = window.location.href.split("#")[0] ?? window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(labels.copied);
    } catch {
      toast.error(labels.failed);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={share}>
      <Share2 aria-hidden="true" />
      {labels.share}
    </Button>
  );
}

export { ShareButton };
