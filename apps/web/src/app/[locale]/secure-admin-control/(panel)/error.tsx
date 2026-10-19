"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { CloudOff, LayoutDashboard, RotateCcw } from "lucide-react";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type PanelErrorProps = { error: Error & { digest?: string }; reset: () => void };

/** A page that failed inside the admin frame (ADMIN.md §5.9): a plain sentence, Try again and a way home. */
export default function PanelError({ error, reset }: PanelErrorProps) {
  const t = useTranslations("Admin.states");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-mist-200 bg-white">
      <AdminEmpty
        icons={[CloudOff]}
        title={t("errorTitle")}
        body={t("errorBody")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              {t("retry")}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/secure-admin-control" prefetch={false}>
                <LayoutDashboard aria-hidden="true" />
                {t("home")}
              </Link>
            </Button>
          </div>
        }
      />
      {error.digest ? (
        <p className="pb-5 text-center text-[12.5px] text-mist-600 tabular-nums">{error.digest}</p>
      ) : null}
    </div>
  );
}
