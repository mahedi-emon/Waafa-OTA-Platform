import { getTranslations } from "next-intl/server";
import { LayoutDashboard, SearchX, Trash2 } from "lucide-react";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * A record or page that isn't there, inside the admin frame (ADMIN.md §5.9): what may have happened and where to look,
 * never "Try again" (issue 225). Record pages render it in place; other misses reach it through `not-found.tsx`.
 */
async function AdminNotFound() {
  const t = await getTranslations("Admin.states");

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-mist-200 bg-white">
      <AdminEmpty
        icons={[SearchX]}
        titleAs="h1"
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/secure-admin-control/trash" prefetch={false}>
                <Trash2 aria-hidden="true" />
                {t("trash")}
              </Link>
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
    </div>
  );
}

export { AdminNotFound };
