"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Command as CommandPrimitive } from "cmdk";
import {
  Clock,
  Contact,
  FileText,
  Inbox,
  LoaderCircle,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  X,
  type LucideIcon,
} from "lucide-react";
import { hasAnyRole, isManagerRole, type AdminSearchHit } from "@waafa/shared";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { displayPhone } from "@/lib/admin/format";
import type { AdminIconName, AdminNavItem } from "@/lib/admin/navigation";
import { AdminNavIcon } from "./AdminNavIcon";
import { useAdminNav } from "./AdminNavContext";
import { guardedNavigate } from "./navigationGuard";

const ADMIN = "/secure-admin-control";

type Action = { id: string; label: string; href: string; icon: AdminIconName | "plus" | "clock" };

const HIT_ICON: Record<AdminSearchHit["kind"], LucideIcon> = {
  lead: Inbox,
  order: ShoppingBag,
  customer: Contact,
  record: FileText,
};

function hitHref(hit: AdminSearchHit): string {
  if (hit.kind === "lead") return `${ADMIN}/leads/${encodeURIComponent(hit.id)}`;
  if (hit.kind === "order") return `${ADMIN}/orders/${encodeURIComponent(hit.id)}`;
  if (hit.kind === "customer") return `${ADMIN}/customers/${encodeURIComponent(hit.id)}`;
  return `${ADMIN}/content/${hit.contentKey ?? ""}/${encodeURIComponent(hit.id)}`;
}

/** "Tour package" → "tour package" inside a sentence; acronyms such as "FAQ" stay as they are. */
const lowerFirst = (text: string) =>
  /^[A-Z]{2}/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);

const matches = (needle: string, ...texts: string[]) =>
  !needle || texts.some((text) => text.toLowerCase().includes(needle));

type AdminCommandDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * The Ctrl K palette (ADMIN.md §3.2), loaded on the first open: everyday actions, every page this person can open, and
 * records by name, reference or phone (leads, orders, customers, website and catalogue records) from the API.
 */
function AdminCommandDialog({ open, onOpenChange }: AdminCommandDialogProps) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const nav = useAdminNav();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ needle: string; hits: AdminSearchHit[]; failed: boolean }>(
    {
      needle: "",
      hits: [],
      failed: false,
    },
  );

  const needle = query.trim().toLowerCase();

  // Results arrive for the needle they were asked for; an older answer never replaces a newer question.
  useEffect(() => {
    if (needle.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${ADMIN}/api/search?q=${encodeURIComponent(needle)}`, {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (cancelled) return;
        if (
          !response.ok ||
          !(response.headers.get("content-type") ?? "").includes("application/json")
        ) {
          setResult({ needle, hits: [], failed: true });
          return;
        }
        const body = (await response.json()) as { hits: AdminSearchHit[] };
        if (!cancelled) setResult({ needle, hits: body.hits, failed: false });
      } catch {
        if (!cancelled) setResult({ needle, hits: [], failed: true });
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needle]);

  const searching = needle.length >= 2;
  const answered = searching && result.needle === needle;
  const hits = answered ? result.hits : [];
  const status: "idle" | "loading" | "failed" = !searching
    ? "idle"
    : !answered
      ? "loading"
      : result.failed
        ? "failed"
        : "idle";

  const has = (key: string) => nav.items.some((item) => item.key === key);
  const manager = isManagerRole(nav.staff.roles);
  // Everyday jobs first; "New …" for every record type the role can create follows.
  const actions: Action[] = [
    // Shop managers can open proofs, but only Accounts verifies them.
    ...(has("proofs") && hasAnyRole(nav.staff.roles, "accounts")
      ? [
          {
            id: "proofs",
            label: t("command.verifyProofs"),
            href: `${ADMIN}/payments`,
            icon: "proofs" as const,
          },
        ]
      : []),
    ...(has("leads")
      ? [
          {
            id: "overdue",
            label: t("command.overdueLeads"),
            href: `${ADMIN}/leads?view=overdue`,
            icon: "clock" as const,
          },
        ]
      : []),
    ...(has("settings") && manager
      ? [
          {
            id: "hours",
            label: t("command.officeHours"),
            href: `${ADMIN}/settings/hours`,
            icon: "settings" as const,
          },
          {
            id: "modes",
            label: t("command.bookingModes"),
            href: `${ADMIN}/settings/modes`,
            icon: "modes" as const,
          },
        ]
      : []),
    ...(has("mediaLibrary")
      ? [
          {
            id: "media",
            label: t("command.uploadPhotos"),
            href: `${ADMIN}/media`,
            icon: "media" as const,
          },
        ]
      : []),
    ...(has("homePage")
      ? [
          {
            id: "home",
            label: t("command.editHome"),
            href: `${ADMIN}/website/home`,
            icon: "home" as const,
          },
        ]
      : []),
    ...nav.newRecords.flatMap((group) =>
      group.items.map((item) => ({
        id: `new-${item.key}`,
        label: t("command.newOf", {
          thing: lowerFirst(t(`newMenu.${item.label}` as "newMenu.tourPackage")),
        }),
        href: `${ADMIN}/content/${item.key}/new`,
        icon: "plus" as const,
      })),
    ),
  ];

  const pages = nav.items.filter((item: AdminNavItem) =>
    matches(
      needle,
      t(`nav.${item.label}` as "nav.dashboard"),
      t(`navHelp.${item.key}` as "navHelp.dashboard"),
    ),
  );
  const shownActions = actions
    .filter((action) => matches(needle, action.label))
    .slice(0, needle ? 6 : 8);
  const byKind = (kind: AdminSearchHit["kind"]) => hits.filter((hit) => hit.kind === kind);
  const groups: Array<{ kind: AdminSearchHit["kind"]; heading: string }> = [
    { kind: "lead", heading: t("command.leads") },
    { kind: "order", heading: t("command.orders") },
    { kind: "customer", heading: t("command.customers") },
    { kind: "record", heading: t("command.records") },
  ];
  const nothing =
    searching &&
    status === "idle" &&
    hits.length === 0 &&
    pages.length === 0 &&
    shownActions.length === 0;

  function go(href: string) {
    onOpenChange(false);
    setQuery("");
    // An editor with unsaved changes asks first (D0 R2).
    guardedNavigate(href, (target) => router.push(target));
  }

  const itemClass =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] text-ink-900 outline-none data-[selected=true]:bg-electric-50 data-[selected=true]:text-navy-900";
  const headingClass =
    "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-mist-600";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 max-sm:top-2 max-sm:w-[calc(100vw-16px)] max-sm:max-w-none sm:max-w-160"
      >
        <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("command.hint")}</DialogDescription>
        <CommandPrimitive
          shouldFilter={false}
          loop
          className="flex max-h-[min(72dvh,560px)] min-w-0 flex-col"
        >
          <div className="flex items-center gap-3 border-b border-mist-200 px-4">
            {status === "loading" ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 shrink-0 animate-spin text-mist-600 motion-reduce:animate-none"
              />
            ) : (
              <Search aria-hidden="true" className="size-5 shrink-0 text-mist-600" />
            )}
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder={t("command.placeholder")}
              className="h-14 w-full min-w-0 bg-transparent text-[16px] text-ink-900 outline-none placeholder:text-mist-500"
            />
            <Kbd className="max-sm:hidden">Esc</Kbd>
            <DialogClose
              aria-label={t("command.close")}
              className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-mist-600 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:hidden"
            >
              <X aria-hidden="true" className="size-5" />
            </DialogClose>
          </div>
          <CommandPrimitive.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {status === "failed" ? (
              <p role="alert" className="px-3 py-6 text-center text-[14px] text-danger-700">
                {t("command.failed")}
              </p>
            ) : null}
            {nothing ? (
              <p role="status" className="px-3 py-6 text-center text-[14px] text-mist-600">
                {t("command.empty")}
              </p>
            ) : null}
            {!needle ? (
              <p className="px-3 pt-2 pb-1 text-[13px] text-mist-600">{t("command.hint")}</p>
            ) : null}

            {groups.map(({ kind, heading }) =>
              byKind(kind).length > 0 ? (
                <CommandPrimitive.Group key={kind} heading={heading} className={headingClass}>
                  {byKind(kind).map((hit) => {
                    const Icon = HIT_ICON[hit.kind];
                    const noun = hit.contentKey
                      ? t(`content.keys.${hit.contentKey}` as "content.keys.tourPackages")
                      : null;
                    return (
                      <CommandPrimitive.Item
                        key={`${hit.kind}-${hit.contentKey ?? ""}-${hit.id}`}
                        value={`${hit.kind}-${hit.contentKey ?? ""}-${hit.id}`}
                        onSelect={() => go(hitHref(hit))}
                        className={itemClass}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist-100 text-mist-600">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-semibold">{hit.title}</span>
                          {hit.detail || noun ? (
                            <span className="truncate text-[13px] text-mist-600">
                              {noun ??
                                (hit.kind === "customer" ? displayPhone(hit.id) : hit.detail)}
                            </span>
                          ) : null}
                        </span>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              ) : null,
            )}

            {shownActions.length > 0 ? (
              <CommandPrimitive.Group heading={t("command.actions")} className={headingClass}>
                {shownActions.map((action) => (
                  <CommandPrimitive.Item
                    key={action.id}
                    value={`action-${action.id}`}
                    onSelect={() => go(action.href)}
                    className={itemClass}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-brand-700">
                      {action.icon === "plus" ? (
                        <Plus aria-hidden="true" className="size-4" />
                      ) : action.icon === "clock" ? (
                        <Clock aria-hidden="true" className="size-4" />
                      ) : action.icon === "proofs" ? (
                        <Receipt aria-hidden="true" className="size-4" />
                      ) : (
                        <AdminNavIcon name={action.icon} className="size-4" />
                      )}
                    </span>
                    <span className="truncate font-medium">{action.label}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}

            {pages.length > 0 ? (
              <CommandPrimitive.Group heading={t("command.goTo")} className={headingClass}>
                {pages.map((item) => (
                  <CommandPrimitive.Item
                    key={item.key}
                    value={`page-${item.key}`}
                    onSelect={() => go(item.href)}
                    className={itemClass}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mist-100 text-mist-700">
                      <AdminNavIcon name={item.icon} className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">
                        {t(`nav.${item.label}` as "nav.dashboard")}
                      </span>
                      <span className="truncate text-[13px] text-mist-600">
                        {t(`navHelp.${item.key}` as "navHelp.dashboard")}
                      </span>
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

export { AdminCommandDialog };
