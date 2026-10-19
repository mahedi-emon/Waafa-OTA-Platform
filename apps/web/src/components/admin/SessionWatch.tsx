"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useSignedOut } from "./sessionStore";

/**
 * Tells staff their session has ended before they try to save (D0 R2, ADMIN.md §9). Signing in again comes back to
 * the same screen, where the editor offers the draft it kept on this device.
 */
function SessionWatch() {
  const t = useTranslations("Admin.editor.session");
  const router = useRouter();
  const signedOut = useSignedOut();

  const signIn = () => {
    const here = `${window.location.pathname}${window.location.search}`;
    router.push(`/secure-admin-control/sign-in?next=${encodeURIComponent(here)}`);
  };

  return (
    <AlertDialog open={signedOut}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("body")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" onClick={signIn}>
            <LogIn aria-hidden="true" className="size-4" />
            {t("signIn")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { SessionWatch };
