import { Socket } from "node:net";

export type ScanVerdict = { infected: false } | { infected: true; signature: string };

/** "tcp://clamav:3310" → host and port; null for anything else. */
export function parseClamdUrl(url: string | undefined): { host: string; port: number } | null {
  if (!url) return null;
  const match = /^tcp:\/\/([^:/]+):(\d{1,5})\/?$/.exec(url.trim());
  if (!match) return null;
  const port = Number(match[2]);
  return port > 0 && port < 65536 ? { host: match[1] ?? "", port } : null;
}

/** clamd's answer to INSTREAM: "stream: OK", "stream: <name> FOUND" or an error. */
export function readVerdict(reply: string): ScanVerdict {
  const text = reply.replace(/\0/g, "").trim();
  if (/:\s*OK$/.test(text)) return { infected: false };
  const found = /:\s*(.+)\s+FOUND$/.exec(text);
  if (found) return { infected: true, signature: (found[1] ?? "unknown").slice(0, 120) };
  throw new Error(`Scanner error: ${text.slice(0, 200) || "no answer"}`);
}

const CHUNK = 64 * 1024;

/**
 * A small clamd client (issue 235): the INSTREAM command over TCP, the file sent in length-prefixed chunks. No
 * dependency; clamd is the ClamAV container on the private network.
 */
export class ClamdClient {
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs = 60_000,
  ) {}

  scan(bytes: Buffer): Promise<ScanVerdict> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const parts: Buffer[] = [];
      let settled = false;
      const done = (error: Error | null, verdict?: ScanVerdict) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (error) reject(error);
        else if (verdict) resolve(verdict);
      };
      socket.setTimeout(this.timeoutMs, () => done(new Error("Scanner timed out")));
      socket.on("error", (error) => done(error));
      socket.on("data", (chunk: Buffer) => parts.push(chunk));
      socket.on("end", () => {
        try {
          done(null, readVerdict(Buffer.concat(parts).toString("utf8")));
        } catch (error) {
          done(error as Error);
        }
      });
      socket.connect(this.port, this.host, () => {
        socket.write("zINSTREAM\0");
        for (let offset = 0; offset < bytes.length; offset += CHUNK) {
          const piece = bytes.subarray(offset, offset + CHUNK);
          const size = Buffer.alloc(4);
          size.writeUInt32BE(piece.length);
          socket.write(size);
          socket.write(piece);
        }
        socket.write(Buffer.alloc(4));
      });
    });
  }

  /** True when clamd answers PONG. */
  ping(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new Socket();
      let reply = "";
      socket.setTimeout(5_000, () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("error", () => resolve(false));
      socket.on("data", (chunk: Buffer) => {
        reply += chunk.toString("utf8");
      });
      socket.on("end", () => resolve(reply.replace(/\0/g, "").trim() === "PONG"));
      socket.connect(this.port, this.host, () => socket.write("zPING\0"));
    });
  }
}
