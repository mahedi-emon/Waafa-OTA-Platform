import { Controller, Get, Module } from "@nestjs/common";
import { z, type ZodType } from "zod";
import {
  FeedbackCreateInputSchema,
  LeadCreateInputSchema,
  OrderCreateInputSchema,
  OrderTrackInputSchema,
  PaymentProofInputSchema,
  SearchLogInputSchema,
  SubscriberInputSchema,
} from "@waafa/shared";

type Auth = "none" | "intake" | "staff";

export type RouteDoc = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary: string;
  tag: string;
  auth: Auth;
  body?: ZodType;
  idempotent?: boolean;
  responses: Record<string, string>;
};

/** Every route the API serves, with the shared zod contract of its body; later issues add theirs. */
export const ROUTES: RouteDoc[] = [
  { method: "get", path: "/health", summary: "Liveness", tag: "health", auth: "none", responses: { 200: "Up" } },
  {
    method: "get",
    path: "/ready",
    summary: "Readiness (database reachable)",
    tag: "health",
    auth: "none",
    responses: { 200: "Ready", 503: "Not ready" },
  },
  {
    method: "post",
    path: "/api/v1/auth/login",
    summary: "Staff sign-in",
    tag: "auth",
    auth: "none",
    body: z.object({ email: z.email(), password: z.string() }),
    responses: { 200: "Tokens", 401: "Wrong email or password", 429: "Locked or too many attempts" },
  },
  {
    method: "post",
    path: "/api/v1/auth/refresh",
    summary: "Rotate the refresh token",
    tag: "auth",
    auth: "none",
    body: z.object({ refreshToken: z.string() }),
    responses: { 200: "New tokens", 401: "Expired, revoked or reused" },
  },
  {
    method: "post",
    path: "/api/v1/auth/logout",
    summary: "End the session",
    tag: "auth",
    auth: "none",
    body: z.object({ refreshToken: z.string() }),
    responses: { 204: "Signed out" },
  },
  { method: "get", path: "/api/v1/auth/me", summary: "Who is signed in", tag: "auth", auth: "staff", responses: { 200: "Staff" } },
  {
    method: "get",
    path: "/api/v1/public/snapshot",
    summary: "Published content and settings the site renders (ETag, If-None-Match → 304)",
    tag: "public",
    auth: "intake",
    responses: { 200: "Snapshot", 304: "Not modified" },
  },
  {
    method: "post",
    path: "/api/v1/public/leads",
    summary: "Lead for any module (FLT, HTL, PKG, CTR, VSA, PRN, TRD, CNT, EMI, QTE)",
    tag: "public",
    auth: "intake",
    body: LeadCreateInputSchema,
    idempotent: true,
    responses: { 201: "Reference", 422: "Validation failed", 429: "Too many requests" },
  },
  {
    method: "post",
    path: "/api/v1/public/orders",
    summary: "Order priced on the server; stock taken in the same transaction",
    tag: "public",
    auth: "intake",
    body: OrderCreateInputSchema,
    idempotent: true,
    responses: { 201: "Order number and total", 409: "Not placed: changed, minimum, cod or pickup (with a quote)" },
  },
  {
    method: "post",
    path: "/api/v1/public/orders/track",
    summary: "Order status by number and phone",
    tag: "public",
    auth: "intake",
    body: OrderTrackInputSchema,
    responses: { 200: "Order", 404: "No match" },
  },
  {
    method: "post",
    path: "/api/v1/public/feedback",
    summary: "Feedback for moderation",
    tag: "public",
    auth: "intake",
    body: FeedbackCreateInputSchema,
    idempotent: true,
    responses: { 201: "First name" },
  },
  {
    method: "post",
    path: "/api/v1/public/payment-proofs",
    summary: "Offline payment proof",
    tag: "public",
    auth: "intake",
    body: PaymentProofInputSchema,
    idempotent: true,
    responses: { 201: "Reference and time" },
  },
  {
    method: "post",
    path: "/api/v1/public/search-logs",
    summary: "Search activity",
    tag: "public",
    auth: "intake",
    body: SearchLogInputSchema,
    responses: { 204: "Logged" },
  },
  {
    method: "post",
    path: "/api/v1/public/subscribers",
    summary: "Newsletter sign-up",
    tag: "public",
    auth: "intake",
    body: SubscriberInputSchema,
    responses: { 204: "Subscribed" },
  },
];

const security: Record<Auth, Array<Record<string, string[]>>> = {
  none: [],
  intake: [{ intakeKey: [] }],
  staff: [{ bearer: [] }],
};

/** OpenAPI 3.1 built from the route table and the shared zod contracts (served outside production only). */
export function buildOpenApi(routes: RouteDoc[] = ROUTES) {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of routes) {
    const parameters = route.idempotent
      ? [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", format: "uuid" } }]
      : [];
    (paths[route.path] ??= {})[route.method] = {
      summary: route.summary,
      tags: [route.tag],
      security: security[route.auth],
      ...(parameters.length ? { parameters } : {}),
      ...(route.body
        ? {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: z.toJSONSchema(route.body, { io: "input", unrepresentable: "any" }),
                },
              },
            },
          }
        : {}),
      responses: Object.fromEntries(
        Object.entries(route.responses).map(([status, description]) => [status, { description }]),
      ),
    };
  }
  return {
    openapi: "3.1.0",
    info: { title: "WAAFA API", version: "1.0.0" },
    components: {
      securitySchemes: {
        intakeKey: { type: "apiKey", in: "header", name: "x-intake-key" },
        bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths,
  };
}

@Controller("openapi.json")
class OpenApiController {
  private readonly document = buildOpenApi();

  @Get()
  get() {
    return this.document;
  }
}

/** Mounted outside production only (B3 acceptance: OpenAPI in development). */
@Module({ controllers: [OpenApiController] })
export class OpenApiModule {}
