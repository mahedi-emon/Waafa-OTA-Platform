import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  BOOKING_STATUSES,
  formatDate,
  formatTaka,
  PAYMENT_STATUSES,
  type BookingStatus,
  type BookingView,
  type PaymentStatus,
} from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PAYMENT_VARIANT } from "@/components/admin/bookings/paymentVariant";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminGet } from "@/lib/admin/adminApi";

const ADMIN = "/secure-admin-control";

type BookingList = { items: BookingView[]; total: number; page: number; pages: number };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.bookings");
  return { title: t("metaTitle") };
}

async function Bookings({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/bookings">["searchParams"];
}) {
  const [t, params] = await Promise.all([getTranslations("Admin.bookings"), searchParams]);
  const pick = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const status = (BOOKING_STATUSES as readonly string[]).includes(pick("status"))
    ? pick("status")
    : "";
  const payment = (PAYMENT_STATUSES as readonly string[]).includes(pick("payment"))
    ? pick("payment")
    : "";
  const q = pick("q").slice(0, 80);
  const page = Math.max(1, Number(pick("page")) || 1);
  const query: Record<string, string> = {
    ...(status ? { status } : {}),
    ...(payment ? { payment } : {}),
    ...(q ? { q } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  };
  const data = await adminGet<BookingList>("/admin/bookings", query);
  const href = (next: Record<string, string>) => {
    const merged = { ...query, ...next };
    for (const key of Object.keys(merged)) if (!merged[key]) delete merged[key];
    const search = new URLSearchParams(merged).toString();
    return `${ADMIN}/bookings${search ? `?${search}` : ""}`;
  };
  const chip = (active: boolean) =>
    active
      ? "border-electric-600 bg-electric-50 text-brand-700"
      : "border-mist-300 bg-white text-mist-700 hover:border-mist-400";

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <form method="get" className="flex min-w-0 flex-wrap items-end gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {payment ? <input type="hidden" name="payment" value={payment} /> : null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-navy-900 sm:max-w-md">
          {t("search")}
          <Input type="search" name="q" defaultValue={q} />
        </label>
        <Button type="submit" variant="secondary">
          {t("searchButton")}
        </Button>
      </form>
      <nav aria-label={t("status")} className="flex flex-wrap gap-2">
        {["", ...BOOKING_STATUSES].map((value) => (
          <Link
            key={value || "all"}
            href={href({ status: value, page: "" })}
            aria-current={status === value ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${chip(status === value)}`}
          >
            {value ? t(`statuses.${value as BookingStatus}`) : t("allStatuses")}
          </Link>
        ))}
      </nav>
      <nav aria-label={t("payment")} className="flex flex-wrap gap-2">
        {["", ...PAYMENT_STATUSES].map((value) => (
          <Link
            key={value || "any"}
            href={href({ payment: value, page: "" })}
            aria-current={payment === value ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${chip(payment === value)}`}
          >
            {value ? t(`payments.${value as PaymentStatus}`) : t("allPayments")}
          </Link>
        ))}
      </nav>
      {data.items.length === 0 ? (
        <p className="rounded-2xl border border-mist-200 bg-white p-5 text-sm text-mist-600">
          {t("empty")}
        </p>
      ) : (
        <div className="min-w-0 rounded-2xl border border-mist-200 bg-white">
          <Table scrollLabel={t("tableLabel")}>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{t("reference")}</TableHead>
                <TableHead scope="col">{t("customer")}</TableHead>
                <TableHead scope="col">{t("travel")}</TableHead>
                <TableHead scope="col" className="text-right">
                  {t("amount")}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {t("due")}
                </TableHead>
                <TableHead scope="col">{t("payment")}</TableHead>
                <TableHead scope="col">{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold whitespace-nowrap">
                    <Link
                      href={`${ADMIN}/bookings/${booking.id}`}
                      className="text-brand-700 underline-offset-4 hover:underline"
                    >
                      {booking.reference}
                    </Link>
                    <span className="block text-[12.5px] font-normal text-mist-600">
                      {booking.pnr ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {booking.customerName}
                    <span className="block text-[12.5px] text-mist-600">
                      {booking.leadReference}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {booking.travelDate ? formatDate(booking.travelDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTaka(booking.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTaka(booking.due)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PAYMENT_VARIANT[booking.paymentStatus]}>
                      {t(`payments.${booking.paymentStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{t(`statuses.${booking.status}`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data.pages > 1 ? (
        <nav
          aria-label={t("pageOf", { page: data.page, pages: data.pages })}
          className="flex items-center gap-3"
        >
          {data.page > 1 ? (
            <Button asChild variant="secondary">
              <Link href={href({ page: String(data.page - 1) })}>{t("previous")}</Link>
            </Button>
          ) : null}
          <span className="text-sm text-mist-600">
            {t("pageOf", { page: data.page, pages: data.pages })}
          </span>
          {data.page < data.pages ? (
            <Button asChild variant="secondary">
              <Link href={href({ page: String(data.page + 1) })}>{t("next")}</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

/** Admin › Bookings (issue 242): every booking from a converted lead, with filters by status and payment. */
export default function BookingsPage(props: PageProps<"/[locale]/secure-admin-control/bookings">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Bookings searchParams={props.searchParams} />
    </Suspense>
  );
}
