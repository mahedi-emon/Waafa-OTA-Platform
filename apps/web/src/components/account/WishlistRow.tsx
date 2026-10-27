"use client";

import { useState, useTransition, type ReactNode } from "react";
import { X } from "lucide-react";
import { notify } from "@/components/feedback/notify";
import { accountError, postAccount, type AccountErrors } from "./postAccount";

type WishlistRowProps = {
  kind: "package" | "product";
  slug: string;
  label: string;
  removed: string;
  errors: AccountErrors;
  /** The photo, title and note, rendered on the server. */
  children: ReactNode;
};

/**
 * One saved holiday or product in My account's wishlist with its Remove button (issue 278). A removed row leaves the
 * list at once (no page reload); an empty list shows the empty note through CSS.
 */
function WishlistRow({ kind, slug, label, removed, errors, children }: WishlistRowProps) {
  const [pending, startTransition] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-mist-200 bg-white p-2.5">
      {children}
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const answer = await postAccount("wishlist.remove", { kind, slug });
            if (!answer.ok) {
              notify("error", accountError(answer, errors));
              return;
            }
            notify("success", removed);
            setGone(true);
          })
        }
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-mist-600 outline-none hover:bg-mist-50 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </li>
  );
}

export { WishlistRow };
