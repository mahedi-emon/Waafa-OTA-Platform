import { NextResponse } from "next/server";
import {
  CUSTOMER_FILE_MAX_BYTES,
  CUSTOMER_FILE_TYPES,
  CustomerFileUploadQuerySchema,
  sniffCustomerFile,
  type CustomerFileType,
} from "@waafa/shared";
import { ApiError } from "@/lib/data/api/apiClient";
import { uploadCustomerFile } from "@/lib/data/files";
import { isSameSite, readCappedBytes } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

/** Twenty files a minute per visitor is more than any form needs (a visa application has four slots). */
const allow = createRateLimiter({ limit: 20, windowMs: 60_000 });

const refuse = (status: number, error: string) => NextResponse.json({ error }, { status });

/**
 * A visitor's file for a form (issue 232): visa documents, a payment slip, a printing or trading attachment, a
 * feedback photo. The browser posts the file as the raw body with its kind and name in the query, as soon as it is
 * picked; the reply's storage key goes back with the form. Same-site only, rate limited, JPG, PNG or PDF up to 5 MB
 * checked by its bytes. Unclaimed files are deleted after a day.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return refuse(403, "forbidden");
  const ip = clientKey(request.headers);
  if (!allow(`uploads:${ip}`)) return refuse(429, "rate-limited");

  const url = new URL(request.url);
  const query = CustomerFileUploadQuerySchema.safeParse({
    kind: url.searchParams.get("kind"),
    name: url.searchParams.get("name")?.slice(0, 120),
  });
  if (!query.success) return refuse(400, "invalid");
  const type = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!(CUSTOMER_FILE_TYPES as readonly string[]).includes(type)) return refuse(415, "file-type");

  const bytes = await readCappedBytes(request, CUSTOMER_FILE_MAX_BYTES);
  if (bytes === null) return refuse(413, "file-size");
  if (bytes.length === 0) return refuse(400, "file-empty");
  if (sniffCustomerFile(bytes) !== type) return refuse(415, "file-type");

  try {
    const stored = await uploadCustomerFile(bytes, type as CustomerFileType, query.data, {
      clientIp: ip,
    });
    return NextResponse.json(stored, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError && [413, 415, 429].includes(error.status)) {
      return refuse(error.status, error.status === 429 ? "rate-limited" : "file-type");
    }
    return refuse(503, "unavailable");
  }
}
