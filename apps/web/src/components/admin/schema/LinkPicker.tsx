"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ChevronsUpDown,
  FileText,
  Globe,
  Link2,
  Mail,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminThumb } from "@/components/admin/AdminThumb";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  describeHref,
  normaliseWebAddress,
  RECORD_LINKS,
  recordHref,
  SITE_PAGES,
} from "@/lib/admin/linkTargets";
import { wordFilter } from "@/lib/admin/commandFilter";
import { toE164 } from "@/lib/admin/phone";
import { SITE_URL } from "@/lib/siteUrl";
import { readOptions, useOptionsOf } from "./useContentOptions";

type Mode = "list" | "web" | "phone" | "email";

type LinkPickerProps = {
  id: string;
  /** The link as stored: "/visa", "/tour-packages/bali", "https://…", "tel:…", "mailto:…". */
  value: string;
  /** The new link, and whether it leaves the site (opens in a new tab). */
  onChange: (href: string, external: boolean) => void;
  describedBy?: string | undefined;
  invalid?: boolean;
  /** When the picker closes (the editor marks the field as visited). */
  onClose?: () => void;
};

const ALL_KEYS = RECORD_LINKS.map((link) => link.key);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Where a link goes (D0 R7, ADMIN.md principle 5): a page of the site or a record with its own page, picked by name
 * with its photo, or a web address, a phone number or an email typed in a box made for it. Staff never type a path.
 */
function LinkPicker({
  id,
  value,
  onChange,
  describedBy,
  invalid = false,
  onClose,
}: LinkPickerProps) {
  const t = useTranslations("Admin.link");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("list");
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const target = describeHref(value, SITE_URL);
  // The record's name for the button; every list once the picker opens.
  useOptionsOf(open ? ALL_KEYS : target?.kind === "record" ? [target.key] : []);

  const choose = (next: string, external: boolean) => {
    onChange(next, external);
    setOpen(false);
    setMode("list");
    setDraft("");
    setProblem(null);
    onClose?.();
  };

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (mode === "web") {
      const url = normaliseWebAddress(text, SITE_URL);
      if (!url) return setProblem(t("invalid.web"));
      return choose(url, !url.startsWith("/"));
    }
    if (mode === "phone") {
      const phone = toE164(text);
      if (!/^\+\d{8,15}$/.test(phone)) return setProblem(t("invalid.phone"));
      return choose(`tel:${phone}`, false);
    }
    if (!EMAIL.test(text)) return setProblem(t("invalid.email"));
    return choose(`mailto:${text}`, false);
  };

  /** The button's words: what the link points at, never its address (except another site's). */
  const shown = ((): { icon: LucideIcon; kind: string; text: string; image?: string } | null => {
    if (!target) return null;
    switch (target.kind) {
      case "page":
        return { icon: FileText, kind: t("kinds.page"), text: t(`pages.${target.page}`) };
      case "record": {
        const options = readOptions(target.key);
        const option = options.items.find((item) => item.id === target.id);
        return {
          icon: Link2,
          kind: t(`groups.${target.key}.one`),
          text: option?.title ?? (options.status === "ready" ? t("missing") : "…"),
          ...(option?.image ? { image: option.image } : {}),
        };
      }
      case "web":
        return { icon: Globe, kind: t("kinds.web"), text: target.url };
      case "phone":
        return { icon: Phone, kind: t("kinds.phone"), text: target.number };
      case "email":
        return { icon: Mail, kind: t("kinds.email"), text: target.address };
      case "path":
        return { icon: Link2, kind: t("kinds.path"), text: target.path };
    }
  })();

  const typed = (kind: Exclude<Mode, "list">, Icon: LucideIcon) => (
    <CommandItem
      value={t(`other.${kind}`)}
      onSelect={() => {
        setMode(kind);
        setDraft("");
        setProblem(null);
      }}
      className="min-h-11 gap-3"
    >
      <Icon aria-hidden="true" className="size-4 text-mist-600" />
      {t(`other.${kind}`)}
    </CommandItem>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setMode("list");
          setProblem(null);
          onClose?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
          className="h-auto min-h-11 w-full max-w-md justify-between gap-3 px-3 py-1.5 text-left font-normal"
        >
          {shown ? (
            <span className="flex min-w-0 items-center gap-3">
              {target?.kind === "record" ? (
                <AdminThumb src={shown.image} name={shown.text} size="sm" />
              ) : (
                <shown.icon aria-hidden="true" className="size-4 shrink-0 text-mist-600" />
              )}
              <span className="min-w-0">
                <span className="block text-[12px] text-mist-600">{shown.kind}</span>
                <span className="block truncate text-[15px] font-semibold text-navy-900">
                  {shown.text}
                </span>
              </span>
            </span>
          ) : (
            <span className="text-[15px] text-mist-600">{t("choose")}</span>
          )}
          <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-mist-500" />
        </Button>
      </PopoverTrigger>
      {/* As wide as the field, so it never sticks out of a side sheet. */}
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-72 p-0">
        {mode === "list" ? (
          <Command filter={wordFilter}>
            <CommandInput placeholder={t("search")} />
            <CommandList className="max-h-96">
              <CommandEmpty>{t("none")}</CommandEmpty>
              <CommandGroup heading={t("groups.pages")}>
                {SITE_PAGES.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={`${t(`pages.${page.id}`)} ${page.path}`}
                    onSelect={() => choose(page.path, false)}
                    className="min-h-11 gap-3"
                  >
                    <FileText aria-hidden="true" className="size-4 text-mist-600" />
                    {t(`pages.${page.id}`)}
                  </CommandItem>
                ))}
              </CommandGroup>
              {RECORD_LINKS.map((link) => {
                const state = readOptions(link.key);
                if (state.items.length === 0) return null;
                return (
                  <CommandGroup key={link.key} heading={t(`groups.${link.key}.other`)}>
                    {state.items.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={`${option.title} ${t(`groups.${link.key}.one`)} ${option.id}`}
                        onSelect={() => choose(recordHref(link.key, option.id), false)}
                        className="min-h-12 gap-3"
                      >
                        <AdminThumb src={option.image} name={option.title} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] text-navy-900">
                          {option.title}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              {ALL_KEYS.some((key) => readOptions(key).status === "loading") ? (
                <p className="px-3 py-3 text-[13px] text-mist-600">{t("loading")}</p>
              ) : null}
              <CommandGroup heading={t("groups.other")}>
                {typed("web", Globe)}
                {typed("phone", Phone)}
                {typed("email", Mail)}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <form className="flex flex-col gap-3 p-3" onSubmit={submitTyped}>
            <button
              type="button"
              onClick={() => setMode("list")}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full px-2 text-[13.5px] font-semibold text-brand-700 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t("back")}
            </button>
            <label className="flex flex-col gap-1.5 text-[14px] font-medium text-ink-900">
              {t(`typed.${mode}`)}
              <Input
                autoFocus
                value={draft}
                inputMode={mode === "phone" ? "tel" : mode === "email" ? "email" : "url"}
                type={mode === "email" ? "email" : mode === "phone" ? "tel" : "text"}
                placeholder={t(`placeholders.${mode}`)}
                aria-invalid={problem ? true : undefined}
                onChange={(event) => setDraft(event.target.value)}
                className="h-11"
              />
            </label>
            {problem ? (
              <p role="alert" className="text-[13.5px] font-medium text-danger-700">
                {problem}
              </p>
            ) : null}
            <Button type="submit" size="sm" className="self-end">
              {t("use")}
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { LinkPicker };
