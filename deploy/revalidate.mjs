// Expires every web cache tag after a deploy (issue 130). deploy.sh pipes this file into `node` inside the API
// container, which holds WEB_REVALIDATE_URL and REVALIDATE_SECRET; the call is signed the same way as the API's own
// revalidation (HMAC-SHA256 of the body, x-waafa-signature). Any key other than "products" expires every tag.
import { createHmac } from "node:crypto";

const url = process.env.WEB_REVALIDATE_URL;
const secret = process.env.REVALIDATE_SECRET;
if (!url || !secret) {
  console.error("WEB_REVALIDATE_URL or REVALIDATE_SECRET is missing in the API container");
  process.exit(1);
}

for (let attempt = 1; attempt <= 10; attempt += 1) {
  const body = JSON.stringify({ keys: ["deploy"], at: new Date().toISOString() });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-waafa-signature": createHmac("sha256", secret).update(body).digest("hex"),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      console.log("Web caches refreshed from the live database");
      process.exit(0);
    }
    console.error(`Revalidation answered ${response.status} (attempt ${attempt})`);
  } catch (error) {
    console.error(`Revalidation failed (attempt ${attempt}): ${String(error)}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 3_000));
}
process.exit(1);
