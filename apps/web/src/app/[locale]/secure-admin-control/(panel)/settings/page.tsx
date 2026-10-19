import type { Metadata } from "next";
import {
  Building2,
  ChartLine,
  ChevronRight,
  Construction,
  CreditCard,
  FileClock,
  Globe,
  LayoutList,
  Mail,
  MailCheck,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ToggleRight,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { canEditContentKey, type ContentKey, type Role } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Link } from "@/i18n/navigation";
import { hasRole, requireStaff } from "@/lib/admin/adminApi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settingsIndex");
  return { title: t("metaTitle") };
}

type Entry = {
  key: string;
  href: string;
  icon: LucideIcon;
  /** Visible when the person can edit this content key… */
  contentKey?: ContentKey;
  /** …or holds one of these roles (Super Admin always passes). */
  roles?: Role[];
};

const ADMIN = "/secure-admin-control";

const GROUPS: Array<{ key: string; entries: Entry[] }> = [
  {
    key: "business",
    entries: [
      {
        key: "contact",
        href: `${ADMIN}/content/contactSettings`,
        icon: Building2,
        contentKey: "contactSettings",
      },
      {
        key: "modes",
        href: `${ADMIN}/content/bookingModes`,
        icon: ToggleRight,
        contentKey: "bookingModes",
      },
    ],
  },
  {
    key: "selling",
    entries: [
      {
        key: "payments",
        href: `${ADMIN}/content/paymentSettings`,
        icon: Wallet,
        contentKey: "paymentSettings",
      },
      {
        key: "shipping",
        href: `${ADMIN}/content/shippingSettings`,
        icon: Truck,
        contentKey: "shippingSettings",
      },
      {
        key: "emi",
        href: `${ADMIN}/content/emiSettings`,
        icon: CreditCard,
        contentKey: "emiSettings",
      },
    ],
  },
  {
    key: "messages",
    entries: [
      {
        key: "leadForms",
        href: `${ADMIN}/content/leadFormSettings`,
        icon: SlidersHorizontal,
        contentKey: "leadFormSettings",
      },
      {
        key: "templates",
        href: `${ADMIN}/content/notificationTemplates`,
        icon: Mail,
        contentKey: "notificationTemplates",
      },
      { key: "sent", href: `${ADMIN}/notifications`, icon: MailCheck, roles: ["admin"] },
    ],
  },
  {
    key: "website",
    entries: [
      {
        key: "site",
        href: `${ADMIN}/content/siteSettings`,
        icon: Globe,
        contentKey: "siteSettings",
      },
      {
        key: "tracking",
        href: `${ADMIN}/content/trackingSettings`,
        icon: ChartLine,
        contentKey: "trackingSettings",
      },
      {
        key: "search",
        href: `${ADMIN}/content/searchSettings`,
        icon: Search,
        contentKey: "searchSettings",
      },
      {
        key: "maintenance",
        href: `${ADMIN}/content/maintenanceSettings`,
        icon: Construction,
        contentKey: "maintenanceSettings",
      },
    ],
  },
  {
    key: "team",
    entries: [
      { key: "users", href: `${ADMIN}/users`, icon: ShieldCheck, roles: [] },
      { key: "integrations", href: `${ADMIN}/integrations`, icon: PlugZap, roles: [] },
      { key: "audit", href: `${ADMIN}/audit`, icon: FileClock, roles: ["admin"] },
    ],
  },
  {
    key: "advanced",
    entries: [{ key: "allContent", href: `${ADMIN}/content`, icon: LayoutList, roles: [] }],
  },
];

/**
 * Settings, one door (ADMIN.md §5.6): every setting in plain sections with what it controls. R9 turns this index into
 * one page with a left sub-navigation; each card already opens the screen that edits it today.
 */
export default async function SettingsPage() {
  const [staff, t] = await Promise.all([requireStaff(), getTranslations("Admin.settingsIndex")]);
  const visible = (entry: Entry) =>
    entry.contentKey
      ? canEditContentKey(staff.roles, entry.contentKey)
      : hasRole(staff, ...(entry.roles ?? []));
  const groups = GROUPS.map((group) => ({
    ...group,
    entries: group.entries.filter(visible),
  })).filter((group) => group.entries.length > 0);

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`settings-${group.key}`}>
            <h2
              id={`settings-${group.key}`}
              className="mb-3 font-display text-[17px] font-bold text-navy-900"
            >
              {t(`groups.${group.key}` as "groups.business")}
            </h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.entries.map(({ key, href, icon: Icon }) => (
                <li key={key}>
                  <Link
                    href={href}
                    prefetch={false}
                    className="group flex h-full min-h-[88px] items-start gap-3.5 rounded-2xl border border-mist-200 bg-white p-4 transition-colors duration-150 hover:border-electric-200 hover:bg-mist-25 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-50 text-brand-700">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold text-navy-900">
                        {t(`items.${key}.title` as "items.contact.title")}
                      </span>
                      <span className="text-[13.5px] leading-snug text-mist-600">
                        {t(`items.${key}.body` as "items.contact.body")}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-2.5 size-4 shrink-0 text-mist-400 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
