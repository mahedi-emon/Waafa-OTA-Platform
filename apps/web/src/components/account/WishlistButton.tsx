"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { postAccount } from "./postAccount";

const HINT = "waafa_customer_hint=1";

type WishlistButtonProps = {
  kind: "package" | "product";
  slug: string;
  labels: { save: string; saved: string; savedLink: string; open: string; failed: string };
};

/**
 * Save a holiday or a product to the wishlist in My account (issue 278). The page stays static: after hydration a
 * signed-in visitor's list is fetched to show "Saved"; a signed-out visitor is sent to sign in and comes back here.
 */
function WishlistButton({ kind, slug, labels }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!document.cookie.split("; ").includes(HINT)) return;
    const controller = new AbortController();
    fetch("/api/account/summary", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { wishlist?: Array<{ kind: string; slug: string }> } | null) => {
        if (body?.wishlist?.some((item) => item.kind === kind && item.slug === slug))
          setSaved(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [kind, slug]);

  function toggle() {
    if (!document.cookie.split("; ").includes(HINT)) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const answer = await postAccount(next ? "wishlist.add" : "wishlist.remove", { kind, slug });
      if (!answer.ok) {
        setSaved(!next);
        if (answer.error === "signed-out") {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        toast.error(labels.failed);
        return;
      }
      if (next) {
        toast.success(labels.savedLink, {
          action: { label: labels.open, onClick: () => router.push("/account#account-wishlist") },
        });
      }
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-pressed={saved}
      disabled={pending}
      onClick={toggle}
    >
      <Heart aria-hidden="true" className={saved ? "fill-current text-danger-600" : undefined} />
      {saved ? labels.saved : labels.save}
    </Button>
  );
}

export { WishlistButton };
