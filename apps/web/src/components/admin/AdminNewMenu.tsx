"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { AdminNavIcon } from "./AdminNavIcon";
import { useAdminNav } from "./AdminNavContext";

/** "+ New" (ADMIN.md §3.2): create any record this person's role can edit, grouped like the sidebar. */
function AdminNewMenu() {
  const t = useTranslations("Admin");
  const { newRecords } = useAdminNav();
  if (newRecords.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 max-sm:size-11 max-sm:px-0"
          aria-label={t("shell.newRecord")}
        >
          <Plus aria-hidden="true" className="size-[18px]" />
          <span className="max-sm:sr-only">{t("shell.newRecord")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[min(70dvh,560px)] w-60 overflow-y-auto">
        <DropdownMenuLabel className="text-[13px] text-mist-600">
          {t("shell.newMenuTitle")}
        </DropdownMenuLabel>
        {newRecords.map((group, index) => (
          <Fragment key={group.label}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="pt-1.5 pb-1 text-[12px] font-semibold text-mist-500">
                {t(`newMenu.${group.label}` as "newMenu.travel")}
              </DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem key={item.key} asChild className="min-h-10">
                  <Link href={`/secure-admin-control/content/${item.key}/new`} prefetch={false}>
                    <AdminNavIcon name={item.icon} className="size-4 text-mist-600" />
                    {t(`newMenu.${item.label}` as "newMenu.tourPackage")}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AdminNewMenu };
