import { ExternalLink, Mail, Phone, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { displayPhone, formatDhakaDateTime, taka } from "@/lib/admin/format";

type CustomerCardProps = {
  name: string;
  phone: string;
  email?: string | undefined;
  /** "Prefers WhatsApp · Evenings", already in words. */
  preference?: string | undefined;
  /** "Website form · 24 Oct 2026, 9:05 am". */
  cameIn: string;
  /** The public page the request was sent from, opened in a new tab (its address never shows). */
  pageHref?: string | undefined;
  others: {
    leadCount: number;
    leads: Array<{ id: string; reference: string; label: string; createdAt: string }>;
    orderCount: number;
    /** Null when this role doesn't see orders. */
    orders: Array<{ id: string; reference: string; label: string; total: number }> | null;
  };
  strings: {
    phone: string;
    email: string;
    cameIn: string;
    page: string;
    /** Contains {count}. */
    otherRequests: string;
    noOtherRequests: string;
    /** Contains {count}. */
    orders: string;
    noOrders: string;
    /** Contains {count}. */
    more: string;
    profile: string;
  };
};

const fill = (text: string, count: number) => text.replace("{count}", String(count));

/**
 * Who is asking (ADMIN.md §5.5): how to reach them, how the request came in, and their other requests and orders by
 * the same phone, each one click away, with the full customer profile behind them.
 */
function CustomerCard({
  name,
  phone,
  email,
  preference,
  cameIn,
  pageHref,
  others,
  strings,
}: CustomerCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-[18px] font-bold text-navy-900">{name}</p>
        {preference ? <p className="text-[13.5px] text-mist-600">{preference}</p> : null}
      </div>
      <dl className="flex flex-col gap-2.5 text-[14.5px]">
        <div className="flex items-start gap-2.5">
          <dt className="sr-only">{strings.phone}</dt>
          <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mist-500" />
          <dd className="tabular-nums">
            <a href={`tel:${phone}`} className="font-medium text-brand-700 hover:underline">
              {displayPhone(phone)}
            </a>
          </dd>
        </div>
        {email ? (
          <div className="flex items-start gap-2.5">
            <dt className="sr-only">{strings.email}</dt>
            <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mist-500" />
            <dd className="min-w-0 break-all">
              <a href={`mailto:${email}`} className="font-medium text-brand-700 hover:underline">
                {email}
              </a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[12.5px] font-semibold text-mist-600">{strings.cameIn}</dt>
          <dd>
            {cameIn}
            {pageHref ? (
              <a
                href={pageHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex min-h-11 items-center gap-1 font-medium text-brand-700 hover:underline"
              >
                {strings.page}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            ) : null}
          </dd>
        </div>
      </dl>

      <section className="border-t border-mist-100 pt-3">
        <h3 className="text-[13px] font-semibold text-navy-900">
          {fill(strings.otherRequests, others.leadCount)}
        </h3>
        {others.leads.length === 0 ? (
          <p className="mt-1 text-[13.5px] text-mist-600">{strings.noOtherRequests}</p>
        ) : (
          <ul className="mt-1 flex flex-col">
            {others.leads.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/secure-admin-control/leads/${item.id}`}
                  prefetch={false}
                  className="flex min-h-11 flex-col justify-center rounded-lg px-2 py-1.5 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <span className="text-[14px] font-semibold text-navy-900">{item.reference}</span>
                  <span className="text-[13px] text-mist-600">
                    {item.label} · {formatDhakaDateTime(item.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {others.leadCount > others.leads.length ? (
          <p className="mt-1 px-2 text-[13px] text-mist-600">
            {fill(strings.more, others.leadCount - others.leads.length)}
          </p>
        ) : null}
      </section>

      {others.orders ? (
        <section className="border-t border-mist-100 pt-3">
          <h3 className="text-[13px] font-semibold text-navy-900">
            {fill(strings.orders, others.orderCount)}
          </h3>
          {others.orders.length === 0 ? (
            <p className="mt-1 text-[13.5px] text-mist-600">{strings.noOrders}</p>
          ) : (
            <ul className="mt-1 flex flex-col">
              {others.orders.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/secure-admin-control/orders/${item.id}`}
                    prefetch={false}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-navy-900">
                        {item.reference}
                      </span>
                      <span className="block text-[13px] text-mist-600">{item.label}</span>
                    </span>
                    <span className="shrink-0 text-[14px] font-semibold tabular-nums">
                      {taka(item.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {others.orderCount > others.orders.length ? (
            <p className="mt-1 px-2 text-[13px] text-mist-600">
              {fill(strings.more, others.orderCount - others.orders.length)}
            </p>
          ) : null}
        </section>
      ) : null}

      <Link
        href={`/secure-admin-control/customers/${encodeURIComponent(phone)}`}
        prefetch={false}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-full px-1 text-[14px] font-semibold text-brand-700 hover:underline"
      >
        <UserRound aria-hidden="true" className="size-4" />
        {strings.profile}
      </Link>
    </div>
  );
}

export { CustomerCard };
