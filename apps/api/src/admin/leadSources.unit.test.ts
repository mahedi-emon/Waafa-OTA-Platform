import { describe, expect, it } from "vitest";
import { groupBySource, sourceLabel } from "./leadSources";

describe("where leads come from (issue 237)", () => {
  it("names a source by its UTM tag, the site it came from, or the channel", () => {
    expect(
      sourceLabel({ channel: "web", utm: { source: "facebook", medium: "cpc", campaign: "eid" } }),
    ).toEqual({ source: "Facebook (cpc)", campaign: "eid" });
    expect(sourceLabel({ channel: "web", referrer: "www.google.com.bd/search" })).toEqual({
      source: "Google",
      campaign: null,
    });
    expect(sourceLabel({ channel: "web", referrer: "l.facebook.com/l.php" }).source).toBe(
      "Facebook",
    );
    expect(sourceLabel({ channel: "web", referrer: "www.travelblog.example" }).source).toBe(
      "travelblog.example",
    );
    expect(sourceLabel({ channel: "walk-in" }).source).toBe("Walk in");
    expect(sourceLabel({ channel: "web" }).source).toBe("Direct or unknown");
    expect(sourceLabel(null).source).toBe("Direct or unknown");
  });

  it("counts leads, bookings, orders and revenue per source, most leads first", () => {
    const google = { channel: "web", referrer: "www.google.com" };
    const eid = { channel: "web", utm: { source: "facebook", campaign: "eid" } };
    expect(
      groupBySource(
        [
          { source: google, status: "new" },
          { source: google, status: "booked" },
          { source: eid, status: "new" },
        ],
        [
          { source: eid, total: 146480 },
          { source: null, total: 2500 },
        ],
      ),
    ).toEqual([
      { source: "Google", campaign: null, leads: 2, booked: 1, orders: 0, revenue: 0 },
      { source: "Facebook", campaign: "eid", leads: 1, booked: 0, orders: 1, revenue: 146480 },
      {
        source: "Direct or unknown",
        campaign: null,
        leads: 0,
        booked: 0,
        orders: 1,
        revenue: 2500,
      },
    ]);
  });
});
