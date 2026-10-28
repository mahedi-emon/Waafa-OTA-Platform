import { readFile, statfs } from "node:fs/promises";
import { freemem, totalmem } from "node:os";

/** Below these the server is "running low" (issue 239). */
export const DISK_FREE_MIN_RATIO = 0.1;
export const DISK_FREE_MIN_BYTES = 2 * 1024 ** 3;
export const MEMORY_FREE_MIN_RATIO = 0.05;

export type Resources = {
  disk: { totalBytes: number; freeBytes: number } | null;
  memory: { totalBytes: number; freeBytes: number };
};

const gb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

/** What is low, in plain words for the alert email; an empty list when all is well. */
export function lowResources(resources: Resources): Array<{ what: string; detail: string }> {
  const low: Array<{ what: string; detail: string }> = [];
  const { disk, memory } = resources;
  if (
    disk &&
    disk.totalBytes > 0 &&
    (disk.freeBytes / disk.totalBytes < DISK_FREE_MIN_RATIO || disk.freeBytes < DISK_FREE_MIN_BYTES)
  ) {
    low.push({
      what: "disk space",
      detail: `${gb(disk.freeBytes)} free of ${gb(disk.totalBytes)}`,
    });
  }
  if (memory.totalBytes > 0 && memory.freeBytes / memory.totalBytes < MEMORY_FREE_MIN_RATIO) {
    low.push({
      what: "memory",
      detail: `${gb(memory.freeBytes)} available of ${gb(memory.totalBytes)}`,
    });
  }
  return low;
}

/** Disk of the root file system and the memory the server can still use (MemAvailable on Linux). */
export async function readResources(): Promise<Resources> {
  let disk: Resources["disk"] = null;
  try {
    const stats = await statfs("/");
    disk = { totalBytes: stats.blocks * stats.bsize, freeBytes: stats.bavail * stats.bsize };
  } catch {
    disk = null;
  }
  let memory = { totalBytes: totalmem(), freeBytes: freemem() };
  try {
    const info = await readFile("/proc/meminfo", "utf8");
    const kb = (name: string) => Number(new RegExp(`^${name}:\\s+(\\d+) kB`, "m").exec(info)?.[1]);
    const total = kb("MemTotal");
    const available = kb("MemAvailable");
    if (total > 0 && available >= 0)
      memory = { totalBytes: total * 1024, freeBytes: available * 1024 };
  } catch {
    // Not Linux: the operating system's free memory is close enough.
  }
  return { disk, memory };
}
