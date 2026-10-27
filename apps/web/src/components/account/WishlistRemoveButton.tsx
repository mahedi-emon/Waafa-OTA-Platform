"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { accountError, postAccount, type AccountErrors } from "./postAccount";

type WishlistRemoveButtonProps = {
  kind: "package" | "product";
  slug: string;
  label: string;
  removed: string;
  errors: AccountErrors;
};

/** Removes one saved holiday or product from My account's wishlist (issue 278). */
function WishlistRemoveButton({ kind, slug, label, removed, errors }: WishlistRemoveButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const answer = await postAccount("wishlist.remove", { kind, slug });
          if (!answer.ok) {
            toast.error(accountError(answer, errors));
            return;
          }
          toast.success(removed);
          router.refresh();
        })
      }
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-mist-600 outline-none hover:bg-mist-50 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
    >
      <X aria-hidden="true" className="size-5" />
    </button>
  );
}

export { WishlistRemoveButton };
