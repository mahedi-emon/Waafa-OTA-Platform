import { loadFixtures } from "@waafa/fixtures";
import { describe, expect, it } from "vitest";
import { createFixtureRepositories } from "../fixtures/createFixtureRepositories";
import { previewDrafts } from "./previewDrafts";
import { parseSnapshot } from "./snapshot";

function wire() {
  return JSON.parse(JSON.stringify(loadFixtures())) as Record<string, unknown> & {
    tourPackages: Array<Record<string, unknown>>;
    blogPosts: Array<Record<string, unknown>>;
  };
}

describe("previewDrafts (D0 R7)", () => {
  it("shows drafts and scheduled records as Live and leaves archived ones hidden", async () => {
    const body = wire();
    const [draft, archived] = body.tourPackages;
    const [scheduled] = body.blogPosts;
    if (!draft || !archived || !scheduled) throw new Error("fixtures changed");
    draft.status = "draft";
    archived.status = "archived";
    scheduled.status = "scheduled";
    scheduled.publishAt = "2099-01-01T10:00:00+06:00";

    const live = createFixtureRepositories(parseSnapshot(body));
    const preview = createFixtureRepositories(parseSnapshot(previewDrafts(body)));
    const slugs = async (repositories: typeof live) =>
      (await repositories.travel.listPackages({ limit: 100 })).items.map((item) => item.slug);

    expect(await slugs(live)).not.toContain(draft.slug);
    expect(await slugs(preview)).toContain(draft.slug);
    expect(await slugs(preview)).not.toContain(archived.slug);
    expect(await preview.content.getBlogPost(String(scheduled.slug))).not.toBeNull();
    expect(await live.content.getBlogPost(String(scheduled.slug))).toBeNull();
  });

  it("starts a banner whose start is still to come, and keeps switched-off ones off", async () => {
    const now = new Date("2026-10-24T12:00:00+06:00");
    const body = wire() as ReturnType<typeof wire> & { banners: Array<Record<string, unknown>> };
    const offers = body.banners.filter((banner) => banner.placement === "home-offers");
    const [later, off] = offers;
    if (!later || !off) throw new Error("fixtures changed");
    later.startsAt = "2099-01-01T10:00:00+06:00";
    later.enabled = true;
    off.startsAt = "2099-01-01T10:00:00+06:00";
    off.enabled = false;

    const titles = async (data: Record<string, unknown>) =>
      (
        await createFixtureRepositories(parseSnapshot(data)).content.listBanners("home-offers", now)
      ).map((banner) => banner.title);
    expect(await titles(body)).not.toContain(later.title);
    const preview = await titles(previewDrafts(body, now));
    expect(preview).toContain(later.title);
    expect(preview).not.toContain(off.title);
  });

  it("drops the publish time and leaves other keys and the input untouched", () => {
    const body = wire();
    const [scheduled] = body.blogPosts;
    if (!scheduled) throw new Error("fixtures changed");
    scheduled.status = "scheduled";
    scheduled.publishAt = "2099-01-01T10:00:00+06:00";
    const next = previewDrafts(body) as typeof body;
    expect(next.blogPosts[0]).toMatchObject({ status: "published" });
    expect(next.blogPosts[0]).not.toHaveProperty("publishAt");
    expect(scheduled.status).toBe("scheduled");
    expect(next.siteSettings).toBe(body.siteSettings);
  });
});
