import { Controller, Get, Module } from "@nestjs/common";
import { z, type ZodType } from "zod";
import {
  ContentOrderInputSchema,
  ContentWriteInputSchema,
  FeedbackModerationInputSchema,
  LeadBulkInputSchema,
  LeadNoteInputSchema,
  LeadUpdateInputSchema,
  OrderUpdateInputSchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofReviewInputSchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
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
  ...adminRoutes(),
];

/** The admin endpoints (B4), all with a staff Bearer token. */
function adminRoutes(): RouteDoc[] {
  const route = (
    method: RouteDoc["method"],
    path: string,
    summary: string,
    body?: ZodType,
    responses: Record<string, string> = { 200: "OK" },
  ): RouteDoc => ({ method, path: `/api/v1/admin${path}`, summary, tag: "admin", auth: "staff", ...(body ? { body } : {}), responses });
  return [
    route("get", "/dashboard", "KPIs, leads by module and status, top routes, activity"),
    route("get", "/leads", "Lead list: view, module, status, assignee, created dates, search, paging"),
    route("get", "/leads/export.csv", "CSV of the current filter"),
    route("post", "/leads/bulk", "Bulk assign or status change", LeadBulkInputSchema),
    route("get", "/leads/{id}", "Lead detail with the timeline"),
    route("patch", "/leads/{id}", "Status, priority, assignee (Booked needs an amount; Cancelled and Lost a reason)", LeadUpdateInputSchema),
    route("post", "/leads/{id}/activities", "Note, call, email or WhatsApp entry", LeadNoteInputSchema, { 201: "Lead" }),
    route("get", "/orders", "Order list"),
    route("get", "/orders/{id}", "Order detail with history and proofs"),
    route("patch", "/orders/{id}", "Status with courier and tracking number, payment verified", OrderUpdateInputSchema),
    route("get", "/feedback", "Feedback by status"),
    route("patch", "/feedback/{id}", "Approve, reject or return to pending", FeedbackModerationInputSchema),
    route("get", "/payment-proofs", "Payment proofs by status"),
    route("patch", "/payment-proofs/{id}", "Verify or reject (verifying marks the order paid)", PaymentProofReviewInputSchema),
    route("get", "/search-logs", "Search activity with top routes and the search-to-lead rate"),
    route("get", "/subscribers", "Newsletter list"),
    route("delete", "/subscribers/{id}", "Remove from the list", undefined, { 204: "Removed" }),
    route("get", "/notifications", "Email log"),
    route("get", "/content", "Content areas this person may edit"),
    route("get", "/content/{key}", "A setting or a list with its records"),
    route("post", "/content/{key}", "New record (validated with the key's schema)", ContentWriteInputSchema, { 201: "Record", 409: "Exists" }),
    route("put", "/content/{key}/order", "New list order", ContentOrderInputSchema),
    route("get", "/content/{key}/{id}", "One record"),
    route("put", "/content/{key}/{id}", "Save a record (version for optimistic locking)", ContentWriteInputSchema, { 200: "Record", 409: "Stale or exists" }),
    route("delete", "/content/{key}/{id}", "Delete a record", undefined, { 204: "Deleted" }),
    route("put", "/settings/{key}", "Save a setting", ContentWriteInputSchema, { 200: "Setting", 409: "Stale" }),
    route("get", "/users", "Staff (Super Admin)"),
    route("post", "/users", "Add staff with a first password", StaffCreateInputSchema, { 201: "Staff", 409: "Email in use" }),
    route("patch", "/users/{id}", "Name, roles, deactivate", StaffUpdateInputSchema),
    route("post", "/users/{id}/password", "Reset a password (ends their sessions)", PasswordSetInputSchema, { 204: "Reset" }),
    route("post", "/me/password", "Change my password", PasswordChangeInputSchema, { 204: "Changed" }),
    route("get", "/staff", "Active staff for pickers"),
    route("get", "/audit", "Audit log"),
  ];
}

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
