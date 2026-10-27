"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const HINT = "waafa_customer_hint=1";
const subscribeNever = () => () => {};
const signedInNow = () => document.cookie.split("; ").includes(HINT);

type AccountLinkProps = {
  labels: { logIn: string; myAccount: string };
  icon?: ReactNode;
  className?: string;
  /** Classes for the words (e.g. visually hidden below 1280 px in the header). */
  labelClassName?: string;
};

/**
 * Log in, or My account once signed in (issue 241). Reads the readable hint cookie set with the session, so the page
 * shell stays static; the server and the first client render show Log in, then it switches after hydration.
 */
function AccountLink({ labels, icon, className, labelClassName }: AccountLinkProps) {
  const signedIn = useSyncExternalStore(subscribeNever, signedInNow, () => false);
  const label = signedIn ? labels.myAccount : labels.logIn;
  return (
    <Link href={signedIn ? "/account" : "/login"} title={label} className={className}>
      {icon}
      <span className={labelClassName}>{label}</span>
    </Link>
  );
}

export { AccountLink };
