import { describe, expect, it } from "vitest";
import { contentChip, isDue, isLiveNow, nextContentStatus } from "./content";

const now = new Date("2026-10-23T10:00:00+06:00");
const later = "2026-10-24T09:00:00+06:00";
const earlier = "2026-10-22T09:00:00+06:00";

describe("content status buttons (D0 R4)", () => {
  it("publishes a draft or a scheduled record at once, stamped with the time it went live", () => {
    expect(nextContentStatus({ status: "draft" }, { type: "publish" }, now)).toEqual({
      ok: true,
      next: { status: "published", liveSince: now.toISOString() },
    });
    expect(
      nextContentStatus({ status: "scheduled", publishAt: later }, { type: "publish" }, now),
    ).toEqual({ ok: true, next: { status: "published", liveSince: now.toISOString() } });
  });

  it("keeps the first live-since stamp when a live record is published again", () => {
    expect(
      nextContentStatus({ status: "published", liveSince: earlier }, { type: "publish" }, now),
    ).toEqual({
      ok: true,
      next: { status: "published", liveSince: new Date(earlier).toISOString() },
    });
  });

  it("schedules only for a time still to come", () => {
    expect(nextContentStatus({ status: "draft" }, { type: "schedule", at: later }, now)).toEqual({
      ok: true,
      next: { status: "scheduled", publishAt: new Date(later).toISOString() },
    });
    expect(nextContentStatus({ status: "draft" }, { type: "schedule", at: earlier }, now)).toEqual({
      ok: false,
      reason: "past",
    });
    expect(
      nextContentStatus({ status: "draft" }, { type: "schedule", at: "next week" }, now),
    ).toEqual({ ok: false, reason: "invalidDate" });
  });

  it("keeps what is stored on Update, without a stale time", () => {
    expect(
      nextContentStatus({ status: "scheduled", publishAt: later }, { type: "update" }, now),
    ).toEqual({
      ok: true,
      next: { status: "scheduled", publishAt: new Date(later).toISOString() },
    });
    expect(
      nextContentStatus(
        { status: "draft", publishAt: later, liveSince: earlier },
        { type: "update" },
        now,
      ),
    ).toEqual({ ok: true, next: { status: "draft" } });
    // Live today without a stamp (before R4): stays live, no invented date.
    expect(nextContentStatus({ status: "published" }, { type: "update" }, now)).toEqual({
      ok: true,
      next: { status: "published" },
    });
  });

  it("never saves a live record as a draft: it is unpublished instead", () => {
    expect(nextContentStatus({ status: "published" }, { type: "saveDraft" }, now)).toEqual({
      ok: false,
      reason: "live",
    });
    expect(
      nextContentStatus({ status: "published" }, { type: "schedule", at: later }, now),
    ).toEqual({ ok: false, reason: "live" });
    expect(nextContentStatus({ status: "published" }, { type: "unpublish" }, now)).toEqual({
      ok: true,
      next: { status: "draft" },
    });
  });

  it("restores an archived record to a draft before anything else", () => {
    for (const type of ["publish", "saveDraft", "unpublish"] as const) {
      expect(nextContentStatus({ status: "archived" }, { type }, now)).toEqual({
        ok: false,
        reason: "archived",
      });
    }
    expect(nextContentStatus({ status: "archived" }, { type: "restore" }, now)).toEqual({
      ok: true,
      next: { status: "draft" },
    });
    expect(nextContentStatus({ status: "published" }, { type: "archive" }, now)).toEqual({
      ok: true,
      next: { status: "archived" },
    });
  });

  it("reads an unknown or missing status as a draft", () => {
    expect(nextContentStatus({}, { type: "publish" }, now)).toMatchObject({
      next: { status: "published" },
    });
    expect(contentChip({ status: "pending" }, now)).toEqual({ state: "draft" });
  });
});

describe("content chips from dates (D0 R4)", () => {
  it("shows Scheduled until the time comes, then Live even before the minute job runs", () => {
    expect(contentChip({ status: "scheduled", publishAt: later }, now)).toEqual({
      state: "scheduled",
      at: new Date(later).toISOString(),
    });
    expect(contentChip({ status: "scheduled", publishAt: earlier }, now)).toEqual({
      state: "live",
      since: new Date(earlier).toISOString(),
    });
    expect(isDue({ status: "scheduled", publishAt: earlier }, now)).toBe(true);
    expect(isDue({ status: "scheduled", publishAt: later }, now)).toBe(false);
    expect(isDue({ status: "published", publishAt: earlier }, now)).toBe(false);
  });

  it("keeps a window: Scheduled before it starts, Expired after it ends", () => {
    expect(contentChip({ status: "published", startsAt: later }, now)).toMatchObject({
      state: "scheduled",
    });
    expect(contentChip({ status: "published", endsAt: earlier }, now)).toEqual({
      state: "expired",
      at: new Date(earlier).toISOString(),
    });
    expect(contentChip({ status: "published", liveSince: earlier, endsAt: later }, now)).toEqual({
      state: "live",
      since: new Date(earlier).toISOString(),
      until: new Date(later).toISOString(),
    });
  });

  it("puts only Live records on the site", () => {
    expect(isLiveNow({ status: "published" }, now)).toBe(true);
    expect(isLiveNow({ status: "draft" }, now)).toBe(false);
    expect(isLiveNow({ status: "archived" }, now)).toBe(false);
    expect(isLiveNow({ status: "scheduled", publishAt: later }, now)).toBe(false);
    expect(isLiveNow({ status: "published", endsAt: earlier }, now)).toBe(false);
    // A scheduled record without a time never goes live by itself.
    expect(isLiveNow({ status: "scheduled" }, now)).toBe(false);
  });
});
