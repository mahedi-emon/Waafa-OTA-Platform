import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

/** Stop counting a folder after this many entries: an estimate is fine, a slow Status page is not. */
const MAX_ENTRIES = 200_000;

/**
 * Bytes inside a folder and every folder under it (issue 303), or null when the folder is not there (not mounted
 * into this container). Symbolic links are not followed; a file with several hard links (a backup identical to the
 * day before, issue 332) counts once.
 */
export async function folderBytes(dir: string): Promise<number | null> {
  try {
    if (!(await stat(dir)).isDirectory()) return null;
  } catch {
    return null;
  }
  let total = 0;
  let seen = 0;
  const counted = new Set<string>();
  const queue = [dir];
  while (queue.length > 0 && seen < MAX_ENTRIES) {
    const current = queue.pop()!;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      seen += 1;
      const full = join(current, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else if (entry.isFile()) {
        try {
          const info = await stat(full);
          if (info.nlink > 1) {
            const inode = `${info.dev}:${info.ino}`;
            if (counted.has(inode)) continue;
            counted.add(inode);
          }
          total += info.size;
        } catch {
          // Removed while counting.
        }
      }
    }
  }
  return total;
}

export type DiskUsage = {
  database: number | null;
  uploads: number | null;
  customerFiles: number | null;
  backups: number | null;
};
