// Keeps the newest releases on Docker Hub and deletes older sha tags (issue 231).
// Every release pushes api-<sha7>, web-<sha7> and nginx-<sha7> (plus the moving *-latest tags, never touched here).
// The newest KEEP releases (by push time) stay so `IMAGE_TAG=<sha> sh deploy.sh` can roll back to any of them, and
// every --protect release (the one live on the server, deploy/LIVE_RELEASE) stays whatever its age (issue 303).
//
//   DOCKERHUB_USERNAME=... DOCKERHUB_TOKEN=... node scripts/dockerhub-cleanup.mjs <namespace/repo> [--keep 10] [--protect <sha7>] [--dry-run]
//
// The token needs Read, Write and Delete access. Without delete rights the script reports it and exits 0, so a
// release push never fails because of the clean-up.

const args = process.argv.slice(2);
const repoArg = args.find((arg) => !arg.startsWith("--") && arg.includes("/"));
const keepIndex = args.indexOf("--keep");
const KEEP = keepIndex >= 0 ? Number(args[keepIndex + 1]) : 10;
const PROTECTED = new Set(
  args.flatMap((arg, index) => (args[index - 1] === "--protect" ? [arg.trim().slice(0, 7)] : [])),
);
const DRY_RUN = args.includes("--dry-run");
const HUB = "https://hub.docker.com/v2";
const SHA_TAG = /^(api|web|nginx)-([0-9a-f]{7})$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!repoArg)
  fail(
    "Usage: node scripts/dockerhub-cleanup.mjs <namespace/repo> [--keep 10] [--protect <sha7>] [--dry-run]",
  );
if (!Number.isInteger(KEEP) || KEEP < 3) fail("--keep must be a whole number of at least 3");
const [namespace, repo] = repoArg.split("/");
const username = process.env.DOCKERHUB_USERNAME;
const secret = process.env.DOCKERHUB_TOKEN;
if (!username || !secret) fail("DOCKERHUB_USERNAME and DOCKERHUB_TOKEN must be set");

async function token() {
  const response = await fetch(`${HUB}/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: username, secret }),
  });
  if (!response.ok) fail(`Docker Hub sign-in failed (${response.status})`);
  const body = await response.json();
  return body.access_token ?? body.token;
}

/** Groups sha tags by release; a release's time is its newest push. */
function releasesToDelete(tags, keep) {
  const releases = new Map();
  for (const tag of tags) {
    const match = SHA_TAG.exec(tag.name);
    if (!match) continue;
    const sha = match[2];
    const at = Date.parse(tag.last_updated ?? tag.tag_last_pushed ?? 0) || 0;
    const release = releases.get(sha) ?? { sha, at: 0, tags: [] };
    release.at = Math.max(release.at, at);
    release.tags.push(tag.name);
    releases.set(sha, release);
  }
  return [...releases.values()]
    .sort((a, b) => b.at - a.at)
    .slice(keep)
    .filter((release) => !PROTECTED.has(release.sha));
}

async function listTags(auth) {
  const tags = [];
  let url = `${HUB}/namespaces/${namespace}/repositories/${repo}/tags?page_size=100`;
  while (url) {
    const response = await fetch(url, { headers: { authorization: `Bearer ${auth}` } });
    if (!response.ok) fail(`Could not list tags (${response.status})`);
    const page = await response.json();
    tags.push(...(page.results ?? []));
    url = page.next ?? null;
  }
  return tags;
}

const auth = await token();
const old = releasesToDelete(await listTags(auth), KEEP);
if (old.length === 0) {
  console.log(`Nothing to delete: ${KEEP} or fewer releases on Docker Hub.`);
  process.exit(0);
}

let deleted = 0;
for (const release of old) {
  for (const tag of release.tags) {
    if (DRY_RUN) {
      console.log(`would delete ${tag}`);
      continue;
    }
    const response = await fetch(
      `${HUB}/namespaces/${namespace}/repositories/${repo}/tags/${tag}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${auth}` },
      },
    );
    if (response.status === 401 || response.status === 403) {
      console.log(
        `::warning title=Docker Hub clean-up::The token cannot delete tags (${response.status}). Give the DOCKERHUB_TOKEN secret Read, Write and Delete access.`,
      );
      process.exit(0);
    }
    if (!response.ok && response.status !== 404)
      fail(`Could not delete ${tag} (${response.status})`);
    deleted += 1;
  }
}
console.log(
  `${DRY_RUN ? "Dry run: " : ""}${old.length} old releases, ${deleted} tags deleted; the newest ${KEEP} stay.`,
);
