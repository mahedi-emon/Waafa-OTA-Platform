import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { features } from "./features";

/** API entry: validated env, the Nest app on Fastify, listening on all interfaces for the container. */
async function main() {
  const env = loadEnv();
  const app = await createApp(env, features);
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
