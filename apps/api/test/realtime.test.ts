import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { InboxSummary, ReminderList, Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ContentScheduler } from "../src/admin/scheduler.service";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { RoundRobinService } from "../src/realtime/roundRobin.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const TRIP = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
/** Saturday 28 Nov 2026, 11:00 and 20:00 in Dhaka (UTC+6); Friday 27 Nov 11:00. */
const SAT_OPEN = new Date("2026-11-28T05:00:00Z");
const SAT_LATE = new Date("2026-11-28T14:00:00Z");
const SUN_OPEN = new Date("2026-11-29T04:30:00Z");
const FRIDAY = new Date("2026-11-27T05:00:00Z");

type Person = { id: string; headers: { authorization: string } };

describe.skipIf(!dbAvailable)(
  "reminders, mentions, round-robin and the live stream (issue 243)",
  () => {
    let app: NestFastifyApplication;
    let prisma: PrismaClient;
    let ip = 0;
    let manager: Person;
    let agent: Person;
    let agentTwo: Person;
    let visaOfficer: Person;

    async function person(name: string, roles: Role[], takesLeads = false): Promise<Person> {
      const user = await prisma.staffUser.create({
        data: {
          name,
          email: `${randomUUID()}@example.com`,
          passwordHash: "x",
          roles,
          takesLeads,
        },
      });
      const session = await prisma.staffSession.create({
        data: {
          userId: user.id,
          refreshHash: randomUUID(),
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
      const { token } = await signAccessToken(
        { sub: user.id, sid: session.id, name, email: user.email, roles },
        JWT_SECRET,
      );
      return { id: user.id, headers: { authorization: `Bearer ${token}` } };
    }

    const call = (who: Person, method: string, url: string, payload?: unknown) =>
      app.inject({
        method: method as "GET",
        url: `/api/v1/admin${url}`,
        headers: who.headers,
        ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
      });

    async function officeHours(hours: { opensAt: number; closesAt: number; days: number[] }) {
      const row = await prisma.setting.findUniqueOrThrow({ where: { key: "contactSettings" } });
      await prisma.setting.update({
        where: { key: "contactSettings" },
        data: { value: { ...(row.value as object), officeHours: hours } as Prisma.InputJsonValue },
      });
      app.get(ContentService).invalidate();
    }

    async function lead(module: "flights" | "visa" = "flights"): Promise<string> {
      ip += 1;
      const payload =
        module === "flights"
          ? {
              module,
              search: {
                tripType: "one-way",
                legs: [{ from: "DAC", to: "DXB", date: TRIP }],
                travellers: { adults: 1, childAges: [], infants: 0 },
                cabin: "economy",
              },
            }
          : {
              module,
              countrySlug: "thailand",
              countryName: "Thailand",
              visaType: "tourist",
              applicants: 1,
              travelDate: TRIP,
            };
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/public/leads",
        headers: { ...INTAKE, "x-client-ip": `10.24.3.${ip}`, "idempotency-key": randomUUID() },
        payload: {
          contact: {
            name: "Sample Traveller",
            phone: `+88010000243${String(ip).padStart(2, "0")}`,
          },
          consent: true,
          payload,
        },
      });
      expect(response.statusCode, response.body).toBe(201);
      const { reference } = response.json<{ reference: string }>();
      return (await prisma.lead.findUniqueOrThrow({ where: { reference } })).id;
    }

    beforeAll(async () => {
      prisma = testPrisma();
      await resetDatabase(prisma);
      await seedDatabase(prisma, loadFixtures());
      app = await testApp(featureModules({ mailer: new MemoryMailer() }));
      app.get(ContentService).invalidate();
      // Round-robin is off for everyone in the seed; these tests turn it on for their own people.
      await prisma.staffUser.updateMany({ data: { takesLeads: false } });
      manager = await person("Sample Manager", ["super-admin"]);
      agent = await person("Rima Akter", ["travel-sales"], true);
      agentTwo = await person("Tanvir Alam", ["travel-sales"], true);
      visaOfficer = await person("Nadia Islam", ["visa-officer"]);
    });

    afterAll(async () => {
      await app.get(NotificationService).idle();
      await app.close();
      await prisma.$disconnect();
    });

    it("keeps each person's reminders, alerts once when due, and lets only the owner finish or move them", async () => {
      await officeHours({ opensAt: 0, closesAt: 1440, days: [0, 1, 2, 3, 4, 5, 6] });
      const leadId = await lead();
      const soon = new Date(Date.now() + 60 * 60_000).toISOString();
      const created = await call(agent, "POST", "/reminders", {
        leadId,
        note: "Call back about fares",
        dueAt: soon,
      });
      expect(created.statusCode, created.body).toBe(201);
      const [reminder] = created.json<ReminderList>().items;
      expect(reminder).toMatchObject({ note: "Call back about fares", when: expect.any(String) });
      expect(reminder?.lead?.id).toBe(leadId);

      // Nobody else sees it or can touch it.
      expect((await call(agentTwo, "GET", "/reminders")).json<ReminderList>().items).toEqual([]);
      expect(
        (await call(agentTwo, "PATCH", `/reminders/${reminder!.id}`, { done: true })).statusCode,
      ).toBe(404);
      expect((await call(agentTwo, "DELETE", `/reminders/${reminder!.id}`)).statusCode).toBe(404);

      // Refused: a time that has passed, an empty note, a lead the person cannot open.
      const past = await call(agent, "POST", "/reminders", {
        note: "x",
        dueAt: "2020-01-01T10:00:00+06:00",
      });
      expect(past.statusCode, past.body).toBe(400);
      expect((await call(agent, "POST", "/reminders", { note: "", dueAt: soon })).statusCode).toBe(
        422,
      );
      const visaLead = await lead("visa");
      expect(
        (await call(agent, "POST", "/reminders", { leadId: visaLead, note: "x", dueAt: soon }))
          .statusCode,
      ).toBe(404);

      // Due: one alert, never two.
      const scheduler = app.get(ContentScheduler);
      const later = new Date(Date.now() + 2 * 60 * 60_000);
      expect((await scheduler.tick(later)).reminders).toBe(1);
      expect((await scheduler.tick(new Date(later.getTime() + 60_000))).reminders).toBe(0);
      const inbox = (await call(agent, "GET", "/inbox")).json<InboxSummary>();
      expect(inbox.unreadAlerts).toBeGreaterThanOrEqual(1);
      expect(inbox.alerts[0]).toMatchObject({
        kind: "reminder",
        read: false,
        detail: "Call back about fares",
      });

      // Snooze alerts again later; done takes it off the list.
      const moved = await call(agent, "PATCH", `/reminders/${reminder!.id}`, {
        dueAt: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
      });
      expect(moved.statusCode).toBe(200);
      expect(
        (
          await call(agent, "PATCH", `/reminders/${reminder!.id}`, { done: true })
        ).json<ReminderList>().items,
      ).toEqual([]);

      const read = await call(agent, "POST", "/alerts/read", { all: true });
      expect(read.json<{ unread: number }>().unread).toBe(0);
    });

    it("alerts colleagues named in a note who can open the lead, never the writer", async () => {
      const leadId = await lead();
      const before = await prisma.staffAlert.count();
      const note = await call(agent, "POST", `/leads/${leadId}/activities`, {
        type: "note",
        body: "@Tanvir Alam can you check Emirates? cc @Nadia Islam and @Rima Akter, email desk@Tanvir Alam",
      });
      expect(note.statusCode, note.body).toBe(201);
      const alerts = await prisma.staffAlert.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 60_000) } },
        orderBy: { createdAt: "desc" },
      });
      const mentions = alerts.filter(
        (alert) => alert.kind === "mention" && alert.href.endsWith(leadId),
      );
      // Tanvir only: Nadia (visa) cannot open a flights lead, Rima wrote it, the email address is not a mention.
      expect(mentions.map((alert) => alert.staffId)).toEqual([agentTwo.id]);
      expect(mentions[0]?.title).toContain("Rima Akter mentioned you on FLT-");
      expect(await prisma.staffAlert.count()).toBe(before + 1);
    });

    it("hands new leads out in turn during office hours, waits after hours and catches up at opening", async () => {
      await officeHours({ opensAt: 600, closesAt: 1080, days: [6, 0, 1, 2, 3, 4] });
      const roundRobin = app.get(RoundRobinService);
      await prisma.staffUser.updateMany({
        where: { id: { in: [agent.id, agentTwo.id] } },
        data: { lastLeadAt: null },
      });

      const first = await lead();
      const second = await lead();
      // The intake ran at the real time; reset both and hand them out on a Saturday morning.
      await prisma.lead.updateMany({
        where: { id: { in: [first, second] } },
        data: { assigneeId: null },
      });
      await prisma.leadActivity.deleteMany({
        where: { leadId: { in: [first, second] }, type: "assign" },
      });
      await prisma.staffUser.updateMany({
        where: { id: { in: [agent.id, agentTwo.id] } },
        data: { lastLeadAt: null },
      });

      const a = await roundRobin.assign(first, SAT_OPEN);
      const b = await roundRobin.assign(second, new Date(SAT_OPEN.getTime() + 1000));
      expect(new Set([a, b])).toEqual(new Set([agent.id, agentTwo.id]));
      const timeline = await prisma.leadActivity.findFirstOrThrow({
        where: { leadId: first, type: "assign" },
      });
      expect(timeline.body).toMatch(/in turn$/);
      expect(
        await prisma.staffAlert.count({ where: { kind: "assigned", href: { endsWith: first } } }),
      ).toBe(1);

      // After hours and on Friday nothing moves; Sunday morning the minute job hands it out.
      const late = await lead();
      await prisma.lead.update({
        where: { id: late },
        data: { assigneeId: null, createdAt: SAT_LATE },
      });
      await prisma.leadActivity.deleteMany({ where: { leadId: late, type: "assign" } });
      expect(await roundRobin.assign(late, SAT_LATE)).toBeNull();
      expect(await roundRobin.assign(late, FRIDAY)).toBeNull();
      expect(await roundRobin.catchUp(SUN_OPEN)).toBeGreaterThanOrEqual(1);
      expect(
        (await prisma.lead.findUniqueOrThrow({ where: { id: late } })).assigneeId,
      ).not.toBeNull();

      // A lead that was assigned once and then unassigned on purpose stays unassigned.
      await call(manager, "PATCH", `/leads/${late}`, { assigneeId: null });
      expect(await roundRobin.assign(late, SUN_OPEN)).toBeNull();

      // Nobody takes visa leads: they wait for a person.
      const visa = await lead("visa");
      await prisma.lead.update({ where: { id: visa }, data: { assigneeId: null } });
      expect(await roundRobin.assign(visa, SAT_OPEN)).toBeNull();
    });

    it("lets a manager turn Takes new leads on and off, audited", async () => {
      const response = await call(manager, "PATCH", `/users/${visaOfficer.id}`, {
        takesLeads: true,
      });
      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<{ takesLeads: boolean }>().takesLeads).toBe(true);
      const audit = await prisma.auditLog.findFirstOrThrow({
        where: { action: "staff.update" },
        orderBy: { at: "desc" },
      });
      expect(audit.after).toMatchObject({ takesLeads: true });
      expect(
        (await call(agent, "PATCH", `/users/${visaOfficer.id}`, { takesLeads: false })).statusCode,
      ).toBe(403);
    });

    it("streams events the person may see and refuses a stream without a session", async () => {
      expect((await app.inject({ method: "GET", url: "/api/v1/admin/events" })).statusCode).toBe(
        401,
      );
      await app.listen(0, "127.0.0.1");
      const address = app.getHttpServer().address() as { port: number };
      const base = `http://127.0.0.1:${address.port}/api/v1/admin/events`;

      async function open(who: Person) {
        const controller = new AbortController();
        const response = await fetch(base, { headers: who.headers, signal: controller.signal });
        expect(response.headers.get("content-type")).toContain("text/event-stream");
        expect(response.headers.get("cache-control")).toContain("no-transform");
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let text = "";
        const until = async (needle: string, ms = 5000) => {
          const end = Date.now() + ms;
          while (!text.includes(needle) && Date.now() < end) {
            const chunk = await Promise.race([
              reader.read(),
              new Promise<{ done: true; value: undefined }>((resolve) =>
                setTimeout(() => resolve({ done: true, value: undefined }), end - Date.now()),
              ),
            ]);
            if (chunk.done) break;
            text += decoder.decode(chunk.value, { stream: true });
          }
          return text.includes(needle);
        };
        return { until, text: () => text, close: () => controller.abort() };
      }

      const agentStream = await open(agent);
      const visaStream = await open(visaOfficer);
      expect(await agentStream.until("event: ready")).toBe(true);
      expect(await visaStream.until("event: ready")).toBe(true);
      await officeHours({ opensAt: 0, closesAt: 1440, days: [0, 1, 2, 3, 4, 5, 6] });
      await lead();
      expect(await agentStream.until('"type":"lead"')).toBe(true);
      // A visa officer never hears about a flights lead.
      expect(await visaStream.until('"type":"lead"', 800)).toBe(false);
      agentStream.close();
      visaStream.close();
    });
  },
);
