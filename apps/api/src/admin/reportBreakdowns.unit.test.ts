import { describe, expect, it } from "vitest";
import { byAgent, funnel } from "./reportBreakdowns";

const at = (minutes: number) => new Date(Date.UTC(2026, 10, 1, 4, minutes));

describe("report breakdowns (issue 244)", () => {
  it("groups leads by agent with booked, won rate and median first reply", () => {
    const rows = byAgent(
      [
        { assigneeId: "a", status: "booked", createdAt: at(0), firstResponseAt: at(10) },
        { assigneeId: "a", status: "lost", createdAt: at(0), firstResponseAt: at(30) },
        { assigneeId: "a", status: "new", createdAt: at(0), firstResponseAt: null },
        { assigneeId: null, status: "new", createdAt: at(0), firstResponseAt: null },
      ],
      new Map([["a", "Rima Akter"]]),
      "Unassigned",
    );
    expect(rows).toEqual([
      {
        staffId: "a",
        name: "Rima Akter",
        leads: 3,
        booked: 1,
        wonRate: 33.3,
        medianFirstResponseMinutes: 20,
      },
      {
        staffId: null,
        name: "Unassigned",
        leads: 1,
        booked: 0,
        wonRate: 0,
        medianFirstResponseMinutes: null,
      },
    ]);
  });

  it("counts the funnel from searches to bookings", () => {
    const steps = funnel(
      40,
      [
        { id: "1", status: "booked", firstResponseAt: at(5) },
        { id: "2", status: "in-progress", firstResponseAt: at(5) },
        { id: "3", status: "new", firstResponseAt: null },
      ],
      new Set(["2"]),
    );
    expect(steps.map((step) => step.count)).toEqual([40, 3, 2, 2, 1]);
  });
});
