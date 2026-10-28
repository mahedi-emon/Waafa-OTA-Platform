import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "./config/env";
import { activeOffsite, signPut } from "./files/offsiteStorage";
import { PrismaClient } from "./generated/prisma/client";

/**
 * `node dist/offsite.js <name> < file` (issue 239): backup.sh pipes each backup file here and it goes to the off-site
 * storage card that is On in Admin › Integrations, under backups/<name>. With no card On it says so and succeeds, so
 * the local backup is never blocked. The file is staged in /tmp so its size is known for the signed upload.
 */
async function main() {
  const name = process.argv[2] ?? "";
  if (!/^waafa-[0-9-]+\.(sql\.gz|media\.tar\.gz|private\.tar\.gz)$/.test(name)) {
    throw new Error(
      "Usage: node dist/offsite.js waafa-<stamp>.<sql.gz|media.tar.gz|private.tar.gz>",
    );
  }
  const env = loadEnv();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  try {
    const target = await activeOffsite(prisma, env.PROVIDER_SECRET_KEY);
    if (!target) {
      console.warn(
        `Off-site copy off (no storage card On in Admin › Integrations): ${name} kept locally only`,
      );
      process.stdin.resume();
      return;
    }
    const folder = await mkdtemp(join(tmpdir(), "offsite-"));
    const staged = join(folder, name);
    try {
      await pipeline(process.stdin, createWriteStream(staged, { mode: 0o600 }));
      const { size } = await stat(staged);
      const { url, headers } = signPut(target, `backups/${name}`, size);
      // fetch sets Host itself; the signed value is the same host. Content-Length stays: S3 refuses a chunked PUT.
      const { host: _host, ...sent } = headers;
      const response = await fetch(url, {
        method: "PUT",
        headers: sent,
        body: Readable.toWeb(createReadStream(staged)) as ReadableStream,
        duplex: "half",
        signal: AbortSignal.timeout(30 * 60_000),
      } as RequestInit);
      if (!response.ok) throw new Error(`${target.provider} answered HTTP ${response.status}`);
      console.warn(
        `Off-site copy ok: ${name} (${Math.round(size / 1024)} KB) to ${target.provider}`,
      );
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
