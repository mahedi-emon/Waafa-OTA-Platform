import { Inject, Injectable } from "@nestjs/common";
import { formatTaka, toDhakaDateString, toDhakaWallClock } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { AdminReportsService } from "./reports.service";

/** When the summaries go out: 09:00 Asia/Dhaka; the weekly one on Saturdays (the office week starts then). */
const SEND_HOUR = 9;
const SATURDAY = 6;
const DAY = 86_400_000;
/** Remembers what went out, so a restart or a second API process never sends one twice. */
export const SUMMARY_MARKER = "_reportsSent";

/** Everything, as the owner sees it: summaries go to the people chosen for them in Settings. */
const OWNER_VIEW: StaffPrincipal = {
  id: "summary",
  name: "Summary",
  email: "summary@waafa.local",
  roles: ["super-admin"],
  sessionId: "summary",
};

type Summary = Awaited<ReturnType<AdminReportsService["summary"]>>;

/** The email's numbers in plain lines (issue 244). */
export function summaryText(report: Summary): { headline: string; text: string } {
  const lines = [
    `Requests: ${report.leads.total} (booked ${report.leads.won}, ${report.leads.wonRate}%)`,
    `Median first reply: ${
      report.leads.medianFirstResponseMinutes === null
        ? "no replies yet"
        : `${report.leads.medianFirstResponseMinutes} min`
    }`,
  ];
  if (report.orders) {
    lines.push(
      `Store orders: ${report.orders.sold} sold of ${report.orders.total}, ${formatTaka(report.orders.revenue)}`,
    );
  }
  lines.push(`Searches on the site: ${report.searches.total}`);
  const agents = report.byAgent.filter((row) => row.staffId).slice(0, 5);
  if (agents.length > 0) {
    lines.push("", "By agent:");
    for (const row of agents)
      lines.push(`- ${row.name}: ${row.leads} requests, ${row.booked} booked`);
  }
  const sources = report.sources.slice(0, 3);
  if (sources.length > 0) {
    lines.push("", "Top sources:");
    for (const row of sources) lines.push(`- ${row.source}: ${row.leads} requests`);
  }
  return {
    headline: `${report.leads.total} requests, ${report.leads.won} booked`,
    text: lines.join("\n"),
  };
}

/**
 * The daily and weekly summary emails (issue 244): at 09:00 in Dhaka the people chosen for "Daily summary" get
 * yesterday's numbers; on Saturdays those chosen for "Weekly summary" get the last seven days. The minute job calls
 * `sendDue`; a marker setting keeps each one to a single send.
 */
@Injectable()
export class SummaryReportsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminReportsService) private readonly reports: AdminReportsService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
  ) {}

  async sendDue(now = new Date()): Promise<Array<"daily" | "weekly">> {
    const local = toDhakaWallClock(now);
    if (local.getUTCHours() < SEND_HOUR) return [];
    const today = toDhakaDateString(now);
    const yesterday = toDhakaDateString(new Date(now.getTime() - DAY));
    const marker = await this.prisma.setting.findUnique({ where: { key: SUMMARY_MARKER } });
    const sent = (marker?.value ?? {}) as { daily?: string; weekly?: string };
    const due: Array<"daily" | "weekly"> = [];
    if (sent.daily !== today) due.push("daily");
    if (local.getUTCDay() === SATURDAY && sent.weekly !== today) due.push("weekly");
    if (due.length === 0) return [];
    // Claim first: record the day before sending, so two processes never both send.
    const next = { ...sent, ...Object.fromEntries(due.map((kind) => [kind, today])) };
    await this.prisma.setting.upsert({
      where: { key: SUMMARY_MARKER },
      update: { value: next as Prisma.InputJsonValue, updatedBy: "summary" },
      create: { key: SUMMARY_MARKER, value: next as Prisma.InputJsonValue, updatedBy: "summary" },
    });
    for (const kind of due) {
      const from =
        kind === "daily" ? yesterday : toDhakaDateString(new Date(now.getTime() - 7 * DAY));
      const report = await this.reports.summary(OWNER_VIEW, { from, to: yesterday });
      const { headline, text } = summaryText(report);
      void this.notifications.notifyStaff(
        "summary-report-staff",
        kind === "daily" ? "daily-report" : "weekly-report",
        {
          period: kind === "daily" ? "daily" : "weekly",
          headline,
          range: from === yesterday ? from : `${from} to ${yesterday}`,
          summary: text,
          link: this.notifications.adminLink(`/reports?from=${from}&to=${yesterday}`),
        },
      );
    }
    return due;
  }
}
