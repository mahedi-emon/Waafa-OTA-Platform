import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const call = (path: string, headers: Record<string, string> = {}) =>
  GET(new Request(`http://localhost/uploads/${path}`, { headers }), {
    params: Promise.resolve({ path: path.split("/") }),
  });

describe("library files through the web (D0 R3)", () => {
  beforeEach(() => {
    vi.stubEnv("WAAFA_API_URL", "http://api.test");
    vi.stubEnv("WAAFA_INTAKE_KEY", "key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("streams photos and videos with their own type, and passes byte ranges through", async () => {
    const fetchMock = vi.fn(
      async (_url: string, init?: RequestInit) =>
        new Response("0123456789", {
          status: (init?.headers as Record<string, string> | undefined)?.range ? 206 : 200,
          headers: { "content-length": "10", "content-range": "bytes 0-9/2048" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const photo = await call("2026/10/abc12345.webp");
    expect(photo.status).toBe(200);
    expect(photo.headers.get("content-type")).toBe("image/webp");

    const part = await call("2026/10/abc12345.mp4", { range: "bytes=0-9" });
    expect(part.status).toBe(206);
    expect(part.headers.get("content-type")).toBe("video/mp4");
    expect(part.headers.get("content-range")).toBe("bytes 0-9/2048");
    expect(part.headers.get("accept-ranges")).toBe("bytes");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://api.test/api/v1/media/2026/10/abc12345.mp4",
      expect.objectContaining({ headers: { range: "bytes=0-9" } }),
    );
  });

  it("serves nothing outside the library's own file names", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await call("2026/10/../../secret.webp")).status).toBe(404);
    expect((await call("2026/10/abc12345.mov")).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
