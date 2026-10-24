import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { canEditContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MenuCard } from "@/components/admin/website/MenuCard";
import type { ManagedMenu, MenuItemValue } from "@/components/admin/website/menuTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import type { ContentRecordsPage } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.menus");
  return { title: t("metaTitle") };
}

/** The menus in the order staff find them on the site: header, phone, footer. */
const GROUPS = [
  { id: "header", menus: ["header", "more", "shop-panel"] },
  { id: "phone", menus: ["drawer", "tabbar", "more-phone"] },
  { id: "footer", menus: ["footer-travel", "footer-shop", "footer-help", "legal"] },
] as const;

/** Which parts each menu's items use besides the label and the link. */
const FIELDS: Record<string, ManagedMenu["fields"]> = {
  more: { description: true, icon: true, cta: false },
  "more-phone": { description: false, icon: true, cta: false },
  "shop-panel": { description: true, icon: true, cta: true },
  tabbar: { description: false, icon: true, cta: false },
  drawer: { description: false, icon: true, cta: false },
};
const PLAIN = { description: false, icon: false, cta: false };

/** Only the builder's, the link picker's and the drag list's words reach the browser (scoped provider, D190). */
const BUILDER_MESSAGES = ["Admin.menus", "Admin.link", "Admin.editor.widgets"];

async function Menus() {
  const [staff, t, messages] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.menus"),
    getMessages(),
  ]);
  if (!canEditContentKey(staff.roles, "menus")) {
    const tf = await getTranslations("Admin.forbidden");
    return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  }
  const records = await adminGet<ContentRecordsPage>("/admin/content/menus/records", {
    pageSize: 100,
  });
  const byKey = new Map(records.items.map((item) => [item.id, item]));
  const menuOf = (key: string): ManagedMenu | null => {
    const record = byKey.get(key);
    if (!record) return null;
    const data = (record.data ?? {}) as Record<string, unknown>;
    return {
      key,
      name: t(`menus.${key}.name` as "menus.header.name"),
      lead: t(`menus.${key}.lead` as "menus.header.lead"),
      version: record.version,
      data,
      items: (Array.isArray(data.items) ? data.items : []) as MenuItemValue[],
      fixedCount: key === "tabbar",
      fields: FIELDS[key] ?? PLAIN,
    };
  };

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <NextIntlClientProvider messages={pickMessagePaths(messages, BUILDER_MESSAGES)}>
        <div className="flex flex-col gap-8">
          {GROUPS.map((group) => {
            const menus = group.menus.flatMap((key) => {
              const menu = menuOf(key);
              return menu ? [menu] : [];
            });
            if (menus.length === 0) return null;
            return (
              <section
                key={group.id}
                aria-labelledby={`group-${group.id}`}
                className="flex flex-col gap-3"
              >
                <div>
                  <h2
                    id={`group-${group.id}`}
                    className="font-display text-[18px] font-bold text-navy-900"
                  >
                    {t(`groups.${group.id}.title`)}
                  </h2>
                  <p className="text-[14px] text-mist-600">{t(`groups.${group.id}.lead`)}</p>
                  {group.id === "footer" ? (
                    <Link
                      href="/secure-admin-control/content/footerSettings"
                      className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-[14px] font-semibold text-brand-700 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      {t("groups.footer.settings")}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                  {menus.map((menu) => (
                    <MenuCard key={menu.key} menu={menu} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </NextIntlClientProvider>
    </>
  );
}

/** Website › Menus (ADMIN.md §5.8, D0 R7): every menu of the site, its items in order, each link picked by name. */
export default function MenusPage() {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <Menus />
    </Suspense>
  );
}
