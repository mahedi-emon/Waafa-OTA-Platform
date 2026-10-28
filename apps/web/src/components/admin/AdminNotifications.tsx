"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { markAlertsRead } from "@/lib/admin/alertActions";
import { LiveAlerts } from "./LiveAlerts";
import { useAdminInbox } from "./useAdminInbox";
import { pollInboxNow } from "./useInboxSummary";
import { useStoredValue } from "./useStoredValue";

const SEEN_KEY = "waafa-admin-bell-seen";
/** The chime for new alerts, on unless the person turns it off on this device (issue 243). */
const SOUND_KEY = "waafa-admin-sound";

// The list (tabs, relative times) and the phone sheet (vaul) load on the first open.
const loadBody = () => import("./AdminNotificationsBody").then((mod) => mod.AdminNotificationsBody);
const loadDrawer = () =>
  import("./AdminNotificationsDrawer").then((mod) => mod.AdminNotificationsDrawer);
const AdminNotificationsBody = dynamic(loadBody, {
  ssr: false,
  loading: () => <Skeleton className="m-4 h-40 rounded-xl" />,
});
const AdminNotificationsDrawer = dynamic(loadDrawer, { ssr: false });

/**
 * The notification bell (ADMIN.md §3.2): new leads, orders and payment proofs, and the person's own alerts (mentions,
 * due reminders, leads handed to them; issue 243). Real time through the event stream with a chime, and polled every
 * 30 s underneath. A popover on desktop, a bottom sheet on phones; "New for you" counts what arrived since the person
 * last marked everything as seen (kept on this device).
 */
function AdminNotifications() {
  const t = useTranslations("Admin.bell");
  const isMobile = useIsMobile();
  const { summary } = useAdminInbox();
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const [seen, setSeen] = useStoredValue(SEEN_KEY, "");
  const [sound, setSound] = useStoredValue(SOUND_KEY, "on");
  const [, startRead] = useTransition();

  const items = useMemo(() => summary?.recent ?? [], [summary]);
  const alerts = useMemo(() => summary?.alerts ?? [], [summary]);
  const unreadAlerts = summary?.unreadAlerts ?? 0;
  const unseen = items.filter((item) => item.at > seen);
  const badge = unseen.length + unreadAlerts;
  const liveLabels = useMemo(
    () => ({ lead: t("lead"), order: t("order"), proof: t("proof"), alert: t("mine") }),
    [t],
  );
  const body = {
    items,
    unseen,
    seen,
    alerts,
    unreadAlerts,
    sound: sound !== "off",
    onSound: (next: boolean) => setSound(next ? "on" : "off"),
    onReadAlerts: (ids: string[] | "all") =>
      startRead(async () => {
        await markAlertsRead(ids);
        pollInboxNow();
      }),
    onMarkSeen: () => setSeen(new Date().toISOString()),
    onPick: () => setOpen(false),
  };
  const toggle = (next: boolean) => {
    setUsed(true);
    setOpen(next);
  };

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative shrink-0 text-navy-900 lg:size-10"
      onPointerEnter={() => void (isMobile ? loadDrawer() : loadBody())}
      {...(isMobile ? { onClick: () => toggle(true) } : {})}
    >
      <Bell aria-hidden="true" className="size-5" />
      {/* Named by words, not an aria-label: the badge shows "9+" while the name says the real count (axe 4.14). */}
      <span className="sr-only">
        {badge > 0 ? `${t("title")}, ${t("unseenCount", { count: badge })}` : t("title")}
      </span>
      {badge > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-600 px-1 text-[10.5px] font-bold text-white ring-2 ring-white"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Button>
  );

  const live = <LiveAlerts sound={sound !== "off"} labels={liveLabels} />;

  if (isMobile)
    return (
      <>
        {live}
        {trigger}
        {used ? <AdminNotificationsDrawer open={open} onOpenChange={setOpen} {...body} /> : null}
      </>
    );

  return (
    <>
      {live}
      <Popover open={open} onOpenChange={toggle}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          aria-labelledby="bell-title"
          className="w-[400px] gap-0 overflow-hidden p-0"
        >
          <p id="bell-title" className="px-4 pt-3 font-display text-[15px] font-bold text-navy-900">
            {t("title")}
          </p>
          {used ? <AdminNotificationsBody {...body} /> : null}
        </PopoverContent>
      </Popover>
    </>
  );
}

export { AdminNotifications };
