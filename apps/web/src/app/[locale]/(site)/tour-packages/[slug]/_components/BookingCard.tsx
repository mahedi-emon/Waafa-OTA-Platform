"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useTranslations } from "next-intl";
import { formatTaka } from "@waafa/shared";
import { NumberStepper } from "@/components/forms/NumberStepper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { estimatePackageTotal } from "@/lib/leads/packageLeadForm";
import type { PackagePrice, RoomSharing } from "@waafa/shared";
import { usePackageBooking } from "./usePackageBooking";

type BookingCardProps = {
  fromPrice: number;
  prices: PackagePrice[];
  departures: Array<{ value: string; label: string }>;
  whatsappHref: string;
};

/** Opens the query section and moves focus to its heading. */
function openQuery() {
  const card = document.getElementById("query");
  card?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("package-query-title")?.focus({ preventScroll: true });
}

/**
 * Sticky booking card (PackageDetail, desktop): departure, travellers and room give an indicative estimate; "Send
 * query" opens the query below with the same choices.
 */
function BookingCard({ fromPrice, prices, departures, whatsappHref }: BookingCardProps) {
  const t = useTranslations("Packages");
  const { query, updateFromCard } = usePackageBooking();
  const total = estimatePackageTotal(prices, query);
  const people = query.adults + query.children + query.infants;
  const room = prices.find((price) => price.sharing === query.roomSharing)?.label ?? "";

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-mist-200 bg-white p-5 shadow-md">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[13px] text-mist-600">{t("detail.priceFrom")}</span>
        <span className="font-display text-[26px] font-extrabold text-navy-900 tabular-nums">
          {formatTaka(fromPrice)}
        </span>
        <span className="text-[13px] text-mist-600">{t("detail.perPerson")}</span>
      </p>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-900">
        {t("query.departure")}
        <Select
          value={query.departure || undefined}
          onValueChange={(departure) => updateFromCard({ departure })}
        >
          <SelectTrigger className="h-12 w-full rounded-xl">
            <SelectValue>
              {departures.find((departure) => departure.value === query.departure)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {departures.map((departure) => (
              <SelectItem key={departure.value} value={departure.value}>
                {departure.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="divide-y divide-mist-200 rounded-xl border border-mist-200 px-3">
        {(["adults", "children", "infants"] as const).map((name) => (
          <NumberStepper
            key={name}
            label={t(`query.${name}`)}
            sub={t(`query.${name}Sub`)}
            value={query[name]}
            min={name === "adults" ? 1 : 0}
            max={name === "adults" ? 40 : name === "infants" ? query.adults : 20}
            onChange={(value) => updateFromCard({ [name]: value })}
            labels={{
              decrease: t("query.decrease", { label: t(`query.${name}`) }),
              increase: t("query.increase", { label: t(`query.${name}`) }),
            }}
          />
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-900">
        {t("detail.room")}
        <Select
          value={query.roomSharing}
          onValueChange={(sharing) => updateFromCard({ roomSharing: sharing as RoomSharing })}
        >
          <SelectTrigger className="h-12 w-full rounded-xl">
            <SelectValue>{room}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {prices
              .filter((price) => ["twin", "triple", "single"].includes(price.sharing))
              .map((price) => (
                <SelectItem key={price.sharing} value={price.sharing}>
                  {price.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex items-end justify-between gap-3 rounded-xl bg-mist-50 px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-ink-900">{t("detail.estimate")}</p>
          <p className="text-[12.5px] text-mist-600">
            {t("detail.estimateLine", { people, room })}
          </p>
        </div>
        <div className="text-right">
          <p
            aria-live="polite"
            className="font-display text-[20px] font-extrabold text-navy-900 tabular-nums"
          >
            {formatTaka(total)}
          </p>
          <p className="text-[12px] font-semibold text-warning-700">
            {t("detail.indicativeShort")}
          </p>
        </div>
      </div>
      <Button size="lg" onClick={openQuery}>
        {t("detail.sendQuery")}
      </Button>
      <Button size="lg" variant="whatsapp" asChild>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="size-5" />
          {t("detail.askWhatsapp")}
        </a>
      </Button>
      <p className="text-center text-[13px] font-semibold text-success-600">
        {t("detail.noPayment")}
      </p>
    </div>
  );
}

export { BookingCard, openQuery };
