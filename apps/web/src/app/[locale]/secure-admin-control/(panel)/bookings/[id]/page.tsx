import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  BOOKING_STATUSES,
  formatDate,
  formatTaka,
  formatTime,
  type BookingView,
} from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BookingDocumentUpload } from "@/components/admin/bookings/BookingDocumentUpload";
import { BookingEditor } from "@/components/admin/bookings/BookingEditor";
import { PAYMENT_VARIANT } from "@/components/admin/bookings/paymentVariant";
import { CustomerFiles } from "@/components/admin/files/CustomerFiles";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";

const ADMIN = "/secure-admin-control";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.bookings");
  return { title: t("metaTitle") };
}

async function Booking({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/bookings/[id]">["params"];
}) {
  const [{ id }, t] = await Promise.all([params, getTranslations("Admin.bookings")]);
  const booking = await adminGet<BookingView>(`/admin/bookings/${encodeURIComponent(id)}`);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AdminPageHeader
        title={`${booking.reference} · ${booking.customerName}`}
        lead={t("edit.fromLead", { reference: booking.leadReference })}
      />
      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-mist-200 bg-white p-5 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-mist-600">{t("amount")}</dt>
          <dd className="font-semibold text-navy-900 tabular-nums">{formatTaka(booking.amount)}</dd>
        </div>
        <div>
          <dt className="text-sm text-mist-600">{t("paid")}</dt>
          <dd className="font-semibold text-navy-900 tabular-nums">{formatTaka(booking.paid)}</dd>
        </div>
        <div>
          <dt className="text-sm text-mist-600">{t("due")}</dt>
          <dd className="font-semibold text-navy-900 tabular-nums">{formatTaka(booking.due)}</dd>
        </div>
        <div>
          <dt className="text-sm text-mist-600">{t("payment")}</dt>
          <dd>
            <Badge variant={PAYMENT_VARIANT[booking.paymentStatus]}>
              {t(`payments.${booking.paymentStatus}`)}
            </Badge>
          </dd>
        </div>
      </dl>
      <p className="text-sm text-mist-600">
        <Link
          href={`${ADMIN}/leads/${booking.leadId}`}
          className="font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          {booking.leadReference}
        </Link>
        {booking.updatedBy
          ? ` · ${t("edit.updated", {
              time: `${formatDate(booking.updatedAt)}, ${formatTime(booking.updatedAt)}`,
              name: booking.updatedBy,
            })}`
          : null}
      </p>
      <BookingEditor
        booking={booking}
        statuses={BOOKING_STATUSES.map((value) => ({ value, label: t(`statuses.${value}`) }))}
        labels={{
          details: t("edit.details"),
          status: t("status"),
          pnr: t("edit.pnr"),
          tickets: t("edit.tickets"),
          ticketsHint: t("edit.ticketsHint"),
          supplier: t("edit.supplier"),
          supplierHint: t("edit.supplierHint"),
          travelDate: t("edit.travelDate"),
          amount: t("edit.amount"),
          paidAmount: t("edit.paidAmount"),
          refunded: t("edit.refunded"),
          refundedHint: t("edit.refundedHint"),
          notes: t("edit.notes"),
          save: t("edit.save"),
          saved: t("edit.saved"),
          failed: t("edit.failed"),
        }}
      />
      <section
        aria-labelledby="booking-documents"
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="booking-documents" className="font-display text-lg font-bold text-navy-900">
              {t("documents.title")}
            </h2>
            <p className="text-[13.5px] text-mist-600">{t("documents.lead")}</p>
          </div>
          <BookingDocumentUpload
            bookingId={booking.id}
            labels={{
              add: t("documents.add"),
              adding: t("documents.adding"),
              added: t("documents.added"),
              failed: t("documents.failed"),
            }}
          />
        </div>
        <CustomerFiles owner="booking" id={booking.id} expected={[]} />
      </section>
    </div>
  );
}

/** Admin › Bookings › one booking (issue 242): the record, its payments and its documents. */
export default function BookingPage(
  props: PageProps<"/[locale]/secure-admin-control/bookings/[id]">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Booking params={props.params} />
    </Suspense>
  );
}
