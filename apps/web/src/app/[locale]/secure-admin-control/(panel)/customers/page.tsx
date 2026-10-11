import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
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
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";

type CustomerRow = {
  phone: string;
  name: string;
  email: string | null;
  leads: number;
  orders: number;
  spent: number;
  lastActivityAt: string;
};
type CustomerList = { items: CustomerRow[]; total: number; page: number; pageSize: number };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.customers");
  return { title: t("metaTitle") };
}

async function Customers({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/customers">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [list, t, tc] = await Promise.all([
    adminGet<CustomerList>("/admin/customers", { page, ...(q ? { q } : {}) }),
    getTranslations("Admin.customers"),
    getTranslations("Admin.common"),
  ]);

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <form role="search" className="flex max-w-md gap-2" action="/secure-admin-control/customers">
        <label htmlFor="customer-search" className="sr-only">
          {t("search")}
        </label>
        <Input
          id="customer-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("search")}
        />
        <Button type="submit" variant="secondary">
          {tc("search")}
        </Button>
      </form>
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead>{t("colPhone")}</TableHead>
                <TableHead className="text-right">{t("colLeads")}</TableHead>
                <TableHead className="text-right">{t("colOrders")}</TableHead>
                <TableHead className="text-right">{t("colSpent")}</TableHead>
                <TableHead>{t("colLast")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((row) => (
                <TableRow key={row.phone}>
                  <TableCell>
                    <Link
                      href={`/secure-admin-control/customers/${encodeURIComponent(row.phone)}`}
                      className="font-semibold text-navy-900 hover:underline"
                    >
                      {row.name || row.phone}
                    </Link>
                    {row.email ? (
                      <span className="block text-[13px] break-all text-mist-600">{row.email}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{row.phone}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.leads}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.orders}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatTaka(row.spent)}
                  </TableCell>
                  <TableCell className="text-[13px] whitespace-nowrap text-mist-600">
                    {formatDhakaDateTime(row.lastActivityAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/customers"
          query={q ? { q } : {}}
          strings={{
            previous: tc("previous"),
            next: tc("next"),
            summary: tc("showing", { shown: list.items.length, total: list.total }),
          }}
        />
      </section>
    </>
  );
}

/** Admin › Customers (issue 111): one row per phone number across leads and orders. */
export default function CustomersPage(
  props: PageProps<"/[locale]/secure-admin-control/customers">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Customers searchParams={props.searchParams} />
    </Suspense>
  );
}
