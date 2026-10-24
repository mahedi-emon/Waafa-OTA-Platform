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
