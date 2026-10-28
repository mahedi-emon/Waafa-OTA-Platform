import type { Instrumentation } from "next";

/**
 * Errors while rendering pages, route handlers or server actions go to the API, which passes them to the error
 * tracking card that is On in Admin › Integrations (issue 238). No SDK in the site and nothing sent from browsers.
 * Reporting never throws and never slows the answer.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  const base = process.env.WAAFA_API_URL?.trim().replace(/\/+$/, "");
  const key = process.env.WAAFA_INTAKE_KEY?.trim();
  if (!base || !key) return;
  const plain = error instanceof Error ? error : new Error(String(error));
  try {
    await fetch(`${base}/api/v1/public/errors`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-intake-key": key },
      body: JSON.stringify({
        message: plain.message.slice(0, 1000) || "Unknown error",
        name: plain.name.slice(0, 100),
        ...(plain.stack ? { stack: plain.stack.slice(0, 8000) } : {}),
        path: request.path.split("?")[0]?.slice(0, 300),
      }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // The tracker being away must never become a second error.
  }
};
