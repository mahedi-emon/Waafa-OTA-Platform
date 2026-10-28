import { formatGrouped, formatTaka } from "@waafa/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SourceRow = {
  source: string;
  campaign: string | null;
  leads: number;
  booked: number;
  orders: number;
  revenue: number;
};

type ReportSourcesProps = {
  rows: SourceRow[];
  /** Orders and revenue only for people who see orders. */
  showOrders: boolean;
  strings: {
    title: string;
    lead: string;
    source: string;
    campaign: string;
    leads: string;
    booked: string;
    orders: string;
    revenue: string;
    empty: string;
  };
};

/**
 * Where leads come from (issue 237): the UTM source, referring site or channel of every lead and order in the range,
 * so the owner sees which ads, posts and searches bring work. Plain table, scrolls sideways inside its card on phones.
 */
function ReportSources({ rows, showOrders, strings }: ReportSourcesProps) {
  return (
    <section
      aria-labelledby="report-sources"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5 lg:col-span-2"
    >
      <div>
        <h2 id="report-sources" className="font-display text-lg font-bold text-navy-900">
          {strings.title}
        </h2>
        <p className="text-[13.5px] text-mist-600">{strings.lead}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-mist-600">{strings.empty}</p>
      ) : (
        <div className="min-w-0">
          <Table scrollLabel={strings.title}>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{strings.source}</TableHead>
                <TableHead scope="col">{strings.campaign}</TableHead>
                <TableHead scope="col" className="text-right">
                  {strings.leads}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {strings.booked}
                </TableHead>
                {showOrders ? (
                  <>
                    <TableHead scope="col" className="text-right">
                      {strings.orders}
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      {strings.revenue}
                    </TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.source}|${row.campaign ?? ""}`}>
                  <TableCell className="font-semibold text-navy-900">{row.source}</TableCell>
                  <TableCell className="text-mist-700">{row.campaign ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatGrouped(row.leads)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatGrouped(row.booked)}
                  </TableCell>
                  {showOrders ? (
                    <>
                      <TableCell className="text-right tabular-nums">
                        {formatGrouped(row.orders)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(row.revenue)}
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

export { ReportSources };
