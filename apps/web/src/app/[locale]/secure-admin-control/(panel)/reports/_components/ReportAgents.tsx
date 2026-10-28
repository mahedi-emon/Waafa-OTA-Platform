import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AgentRow = {
  staffId: string | null;
  name: string;
  leads: number;
  booked: number;
  wonRate: number;
  medianFirstResponseMinutes: number | null;
};

type ReportAgentsProps = {
  rows: AgentRow[];
  strings: {
    title: string;
    lead: string;
    agent: string;
    leads: string;
    booked: string;
    wonRate: string;
    reply: string;
    minutes: (count: number) => string;
    empty: string;
  };
};

/** Leads by the person they are assigned to (issue 244): how many, booked, won rate and the median first reply. */
function ReportAgents({ rows, strings }: ReportAgentsProps) {
  return (
    <section
      aria-labelledby="report-agents"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
    >
      <div>
        <h2 id="report-agents" className="font-display text-lg font-bold text-navy-900">
          {strings.title}
        </h2>
        <p className="text-[13.5px] text-mist-600">{strings.lead}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-[14px] text-mist-600">{strings.empty}</p>
      ) : (
        <Table scrollLabel={strings.title}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{strings.agent}</TableHead>
              <TableHead scope="col" className="text-right">
                {strings.leads}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {strings.booked}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {strings.wonRate}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {strings.reply}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.staffId ?? "none"}>
                <TableCell className="font-medium text-ink-900">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">{row.leads}</TableCell>
                <TableCell className="text-right tabular-nums">{row.booked}</TableCell>
                <TableCell className="text-right tabular-nums">{row.wonRate}%</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.medianFirstResponseMinutes === null
                    ? "—"
                    : strings.minutes(row.medianFirstResponseMinutes)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export { ReportAgents };
