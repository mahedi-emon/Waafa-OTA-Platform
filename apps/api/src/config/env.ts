import { z } from "zod";

/** Comma-separated list → trimmed, non-empty items. */
const list = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const optional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : undefined));

/**
 * The API's environment, validated once at start-up (B1). Secrets come only from the environment; production refuses
 * to start without Redis, an email provider and real secrets.
 */
export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: optional,
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    REVALIDATE_SECRET: z.string().min(24, "REVALIDATE_SECRET must be at least 24 characters"),
    INTAKE_KEY: z.string().min(24, "INTAKE_KEY must be at least 24 characters"),
    WEB_ORIGINS: list,
    WEB_REVALIDATE_URL: optional,
    RESEND_API_KEY: optional,
    SMTP_URL: optional,
    MAIL_FROM: z.string().default("Waafa <no-reply@waafasworld.com>"),
    STAFF_ALERT_EMAIL: optional,
    SEED_ADMIN_EMAIL: optional,
    SEED_ADMIN_PASSWORD: optional,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    const need = (ok: boolean, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: "custom", path: [path], message });
    };
    need(Boolean(env.REDIS_URL), "REDIS_URL", "Production needs Redis for the job queue");
    need(
      Boolean(env.RESEND_API_KEY || env.SMTP_URL),
      "RESEND_API_KEY",
      "Production needs RESEND_API_KEY or SMTP_URL",
    );
    need(env.WEB_ORIGINS.length > 0, "WEB_ORIGINS", "Production needs the web origin");
    need(!/change-me|dev-only/.test(env.JWT_SECRET), "JWT_SECRET", "Set a real JWT_SECRET");
  });

export type Env = z.infer<typeof EnvSchema>;

/** Injection token for the parsed environment. */
export const ENV = Symbol("ENV");

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid API environment:\n${problems.join("\n")}`);
  }
  return parsed.data;
}
