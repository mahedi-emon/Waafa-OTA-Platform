import { NextResponse } from "next/server";
import { QuestionInputSchema } from "@waafa/shared";
import { apiConfig, ApiError, callApi } from "@/lib/data/api/apiClient";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });

/** A visitor's question on a product (issue 245): same-site, 2 KB, 5 a minute, Turnstile when it is on. */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`question:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 2_048);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let parsed;
  try {
    parsed = QuestionInputSchema.safeParse(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip)))
    return NextResponse.json({ error: "challenge" }, { status: 400 });
  const api = apiConfig();
  if (!api) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const { turnstileToken: _token, ...question } = parsed.data;
    await callApi(api, "/api/v1/public/questions", {
      body: question,
      clientIp: ip,
      timeoutMs: 8_000,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    return NextResponse.json({ error: status === 429 ? "busy" : "unavailable" }, { status });
  }
}
