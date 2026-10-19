"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCheck, Inbox, Receipt, ShoppingBag, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { InboxItem } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";

const ICONS: Record<InboxItem["kind"], LucideIcon> = {
  lead: Inbox,
  order: ShoppingBag,
  proof: Receipt,
};
const HREF: Record<InboxItem["kind"], (id: string) => string> = {
  lead: (id) => `/secure-admin-control/leads/${id}`,
  order: (id) => `/secure-admin-control/orders/${id}`,
  proof: () => "/secure-admin-control/payments",
};

/** Start of today in Dhaka (UTC+6 all year), as an ISO string for comparisons. */
function dhakaToday(): string {
  const shifted = new Date(Date.now() + 6 * 3_600_000);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 6 * 3_600_000,
  ).toISOString();
}

function NotificationList({
  items,
  seen,
  onPick,
}: {
  items: InboxItem[];
  seen: string;
  onPick: () => void;
}) {
  const t = useTranslations("Admin.bell");
  const today = dhakaToday();
  const groups = [
    { label: t("today"), items: items.filter((item) => item.at >= today) },
    { label: t("earlier"), items: items.filter((item) => item.at < today) },
  ].filter((group) => group.items.length > 0);

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-success-50 text-success-700">
          <CheckCheck aria-hidden="true" className="size-5" />
        </span>
        <p className="font-display text-[15px] font-bold text-navy-900">{t("empty")}</p>
        <p className="max-w-60 text-[13.5px] text-mist-600">{t("emptyBody")}</p>
      </div>
    );

  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="sticky top-0 bg-white/95 px-4 pt-3 pb-1 text-[12px] font-semibold text-mist-600">
            {group.label}
          </h3>
          <ul>
            {group.items.map((item) => {
              const Icon = ICONS[item.kind];
              const unseen = item.at > seen;
              return (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={HREF[item.kind](item.id)}
                    prefetch={false}
                    onClick={onPick}
                    className="flex min-h-14 items-start gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mist-25 focus-visible:bg-mist-25 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        unseen ? "bg-electric-50 text-brand-700" : "bg-mist-100 text-mist-600",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[12.5px] font-semibold text-mist-600">
                        {t(item.kind)}
                      </span>
                      <span className="truncate text-[14.5px] font-semibold text-ink-900">
                        {item.title}
                      </span>
                      <span className="truncate text-[13px] text-mist-600">{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-mist-600 tabular-nums">
                      {formatDistanceToNowStrict(new Date(item.at), { addSuffix: true })}
                    </span>
                    {unseen ? (
                      <span
                        aria-hidden="true"
                        className="mt-2 size-2 shrink-0 rounded-full bg-electric-600"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

type AdminNotificationsBodyProps = {
  items: InboxItem[];
  unseen: InboxItem[];
  seen: string;
  onMarkSeen: () => void;
  onPick: () => void;
};

/**
 * The bell's panel (loaded on first open; structure after 21st.dev patrick-xin/vercel-notification-popover): All and
 * New for you, grouped by day, with Mark all as seen.
 */
function AdminNotificationsBody({
  items,
  unseen,
  seen,
  onMarkSeen,
  onPick,
}: AdminNotificationsBodyProps) {
  const t = useTranslations("Admin.bell");
  const [tab, setTab] = useState<"all" | "unseen">("all");

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value === "unseen" ? "unseen" : "all")}
      className="flex max-h-[min(70dvh,520px)] min-h-0 flex-col gap-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-mist-200 px-4">
        <TabsList variant="line" className="h-11 gap-4">
          <TabsTrigger value="all" className="text-[13.5px]">
            {t("all")}
          </TabsTrigger>
          <TabsTrigger value="unseen" className="text-[13.5px]">
            {t("unseen")}
            {unseen.length > 0 ? ` (${unseen.length})` : null}
          </TabsTrigger>
        </TabsList>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkSeen}
          disabled={unseen.length === 0}
          className="h-9 text-[13px]"
        >
          <CheckCheck aria-hidden="true" className="size-4" />
          {t("markSeen")}
        </Button>
      </div>
      <TabsContent value="all" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <NotificationList items={items} seen={seen} onPick={onPick} />
      </TabsContent>
      <TabsContent value="unseen" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <NotificationList items={unseen} seen={seen} onPick={onPick} />
      </TabsContent>
    </Tabs>
  );
}

export { AdminNotificationsBody };
