import { Controller, Get, Module } from "@nestjs/common";
import { z, type ZodType } from "zod";
import {
  ContentOrderInputSchema,
  ContentRestoreInputSchema,
  MediaCropInputSchema,
  MediaReplaceInputSchema,
  MediaUpdateInputSchema,
  ContentImportInputSchema,
  ContentWriteInputSchema,
  FeedbackModerationInputSchema,
  LeadBulkInputSchema,
  LeadNoteInputSchema,
  LeadActionInputSchema,
  LeadUpdateInputSchema,
  OrderActionInputSchema,
  OrderUpdateInputSchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofActionInputSchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
  VisaProgressInputSchema,
  FeedbackCreateInputSchema,
  LeadCreateInputSchema,
  LeadDraftActionSchema,
  LeadDraftInputSchema,
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
  {
    method: "get",
    path: "/health",
    summary: "Liveness",
    tag: "health",
    auth: "none",
    responses: { 200: "Up" },
  },
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
    responses: {
      200: "Tokens",
      401: "Wrong email or password",
      429: "Locked or too many attempts",
    },
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
  {
    method: "get",
    path: "/api/v1/auth/me",
    summary: "Who is signed in",
    tag: "auth",
    auth: "staff",
    responses: { 200: "Staff" },
  },
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
    path: "/api/v1/public/leads/drafts",
    summary:
      "Step 1 of a request with the visitor's OK to be called if they don't finish (one per phone and service; the full request completes it)",
    tag: "public",
    auth: "intake",
    body: LeadDraftInputSchema,
    responses: { 204: "Kept", 422: "Validation failed", 429: "Too many requests" },
  },
  {
    method: "post",
    path: "/api/v1/public/orders",
    summary: "Order priced on the server; stock taken in the same transaction",
    tag: "public",
    auth: "intake",
    body: OrderCreateInputSchema,
    idempotent: true,
    responses: {
      201: "Order number and total",
      409: "Not placed: changed, minimum, cod or pickup (with a quote)",
    },
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
  ): RouteDoc => ({
    method,
    path: `/api/v1/admin${path}`,
    summary,
    tag: "admin",
    auth: "staff",
    ...(body ? { body } : {}),
    responses,
  });
  return [
    route("get", "/dashboard", "KPIs, leads by module and status, top routes, activity"),
    route(
      "get",
      "/inbox",
      "Work waiting for this person (counts by queue) and the newest leads, orders and proofs",
    ),
    route(
      "get",
      "/search",
      "Ctrl+K search: leads, orders, customers by phone and content records the role can edit",
    ),
    route(
      "get",
      "/leads",
      "Lead list: view, module, status, assignee, created dates, search, paging",
    ),
    route("get", "/leads/export.csv", "CSV of the current filter"),
    route(
      "get",
      "/leads/incomplete",
      "Incomplete requests: step 1 done more than 30 minutes ago and never sent (view open or done)",
    ),
    route(
      "post",
      "/leads/incomplete/{id}/actions",
      "Mark an Incomplete request contacted or set it aside (audited)",
      LeadDraftActionSchema,
    ),
    route(
      "post",
      "/leads/bulk",
      "Bulk assign or Mark as spam (a booked lead is skipped)",
      LeadBulkInputSchema,
    ),
    route("get", "/leads/{id}", "Lead detail with the timeline"),
    route(
      "patch",
      "/leads/{id}",
      "Priority, assignee, a booked lead's corrected amount",
      LeadUpdateInputSchema,
    ),
    route(
      "post",
      "/leads/{id}/actions",
      "A step: contact, quote, ask for documents or payment, customer replied, convert (amount), close (outcome and reason), mark as spam, reopen (reason); the status follows",
      LeadActionInputSchema,
      { 200: "Lead", 409: "Not allowed now" },
    ),
    route(
      "post",
      "/leads/{id}/visa",
      "Visa checklist, submission, outcome and passport returned (visa leads)",
      VisaProgressInputSchema,
      { 200: "Lead", 409: "Not allowed now" },
    ),
    route(
      "post",
      "/leads/{id}/activities",
      "Note, call, email or WhatsApp entry",
      LeadNoteInputSchema,
      { 201: "Lead" },
    ),
    route("get", "/orders", "Order list"),
    route("get", "/orders/{id}", "Order detail with history and proofs"),
    route("patch", "/orders/{id}", "A note on the order's history", OrderUpdateInputSchema),
    route(
      "get",
      "/orders/{id}/invoice",
      "Invoice PDF (the customer's company and BIN when they asked for a VAT invoice)",
      undefined,
      { 200: "PDF" },
    ),
    route(
      "get",
      "/orders/{id}/packing-slip",
      "Packing slip PDF (no prices; the cash to collect for cash on delivery)",
      undefined,
      { 200: "PDF" },
    ),
    route(
      "post",
      "/orders/{id}/actions",
      "A step: confirm (proof or call), start packing, ship (courier and tracking), deliver, cancel or return (reason, stock goes back); the status follows",
      OrderActionInputSchema,
      { 200: "Order", 409: "Not allowed now" },
    ),
    route("get", "/feedback", "Feedback by status"),
    route(
      "patch",
      "/feedback/{id}",
      "Approve, reject or return to pending",
      FeedbackModerationInputSchema,
    ),
    route("get", "/payment-proofs", "Payment proofs by status"),
    route(
      "post",
      "/payment-proofs/{id}/actions",
      "Verify (the order becomes paid and confirmed) or reject with a reason (the customer is emailed)",
      PaymentProofActionInputSchema,
      { 200: "Proof", 409: "Already decided" },
    ),
    route("get", "/search-logs", "Search activity with top routes and the search-to-lead rate"),
    route("get", "/subscribers", "Newsletter list"),
    route("delete", "/subscribers/{id}", "Remove from the list", undefined, { 204: "Removed" }),
    route("get", "/notifications", "Email log"),
    route("get", "/content", "Content areas this person may edit"),
    route("get", "/content/{key}", "A setting or a list with its records"),
    route(
      "post",
      "/content/{key}",
      "New record (validated with the key's schema)",
      ContentWriteInputSchema,
      { 201: "Record", 409: "Exists" },
    ),
    route("put", "/content/{key}/order", "New list order", ContentOrderInputSchema),
    route(
      "get",
      "/content/{key}/export.csv",
      "Products (one row per variant), group fares or compatible models as CSV: the import template",
    ),
    route(
      "post",
      "/content/{key}/import/preview",
      "What importing the CSV would do, line by line (nothing saved)",
      ContentImportInputSchema,
      { 200: "Report" },
    ),
    route(
      "post",
      "/content/{key}/import",
      "Import the CSV through the normal save; the whole file is refused while a line has a problem; never deletes",
      ContentImportInputSchema,
      { 200: "Report", 422: "Problems (report attached)" },
    ),
    route(
      "get",
      "/content/{key}/options",
      "Choices for reference pickers: any staff member for the lists editors pick from, edit access for the rest; title, photo, Sample, status and the values records point at",
    ),
    route("get", "/content/{key}/{id}", "One record"),
    route(
      "put",
      "/content/{key}/{id}",
      "Save a record (version for optimistic locking; the button sets the status, a plain save keeps it)",
      ContentWriteInputSchema,
      { 200: "Record", 409: "Stale, exists or not allowed now" },
    ),
    route(
      "delete",
      "/content/{key}/{id}",
      "Move a record to Trash (restorable for 30 days)",
      undefined,
      { 200: "Trash item" },
    ),
    route(
      "get",
      "/trash",
      "Deleted records this person may edit, newest first, with the day each is purged",
    ),
    route("post", "/trash/{id}/restore", "Put a record back from Trash", undefined, {
      200: "Restored",
      409: "Address taken or no longer valid",
    }),
    route("delete", "/trash/{id}", "Delete forever (Super Admin)", undefined, { 204: "Deleted" }),
    route(
      "get",
      "/content/{key}/{id}/history",
      "Saved versions of a record from the audit log, newest first (follows slug changes)",
    ),
    route(
      "post",
      "/content/{key}/{id}/restore",
      "Restore a saved version (audited as a restore)",
      ContentRestoreInputSchema,
      { 200: "Record", 404: "Version not available", 409: "Stale" },
    ),
    route(
      "post",
      "/content/{key}/{id}/duplicate",
      "Copy a record as a hidden draft with a free id (a product copy gets its own variant ids and SKUs; 409 noCopy for lists of fixed places or codes)",
      undefined,
      { 201: "Record" },
    ),
    route(
      "get",
      "/media",
      "Library files with how many places show each (filters: q, kind, unused)",
    ),
    route(
      "post",
      "/media",
      "Upload a photo (raw body, JPEG, PNG, WebP or AVIF up to 12 MB; re-encoded to WebP)",
      undefined,
      { 201: "File", 413: "Too large", 415: "Not a photo" },
    ),
    route(
      "post",
      "/media/video",
      "Upload a video (raw body, MP4 or WebM up to 50 MB; kept as it is)",
      undefined,
      { 201: "File", 413: "Too large", 415: "Not a video" },
    ),
    route("get", "/media/{id}", "One library file"),
    route("get", "/media/{id}/usage", "Every record and setting that shows a file"),
    route(
      "post",
      "/media/{id}/crop",
      "Save a crop of a photo as a new photo",
      MediaCropInputSchema,
      { 201: "File", 400: "Past the edge or not a photo" },
    ),
    route(
      "post",
      "/media/{id}/replace",
      "Show another file wherever this one is shown (through the normal saves)",
      MediaReplaceInputSchema,
      { 200: "Replaced and failed records" },
    ),
    route("patch", "/media/{id}", "Alt text and photo credit", MediaUpdateInputSchema),
    route("delete", "/media/{id}", "Delete a file nothing shows", undefined, {
      204: "Deleted",
      409: "Still shown somewhere",
    }),
    route("put", "/settings/{key}", "Save a setting", ContentWriteInputSchema, {
      200: "Setting",
      409: "Stale",
    }),
    route("get", "/settings/{key}/history", "Saved versions of a setting, newest first"),
    route(
      "post",
      "/settings/{key}/restore",
      "Restore a saved version of a setting",
      ContentRestoreInputSchema,
      { 200: "Setting", 404: "Version not available", 409: "Stale" },
    ),
    route("get", "/users", "Staff (Super Admin)"),
    route("post", "/users", "Add staff with a first password", StaffCreateInputSchema, {
      201: "Staff",
      409: "Email in use",
    }),
    route("patch", "/users/{id}", "Name, roles, deactivate", StaffUpdateInputSchema),
    route(
      "post",
      "/users/{id}/password",
      "Reset a password (ends their sessions)",
      PasswordSetInputSchema,
      { 204: "Reset" },
    ),
    route("post", "/me/password", "Change my password", PasswordChangeInputSchema, {
      204: "Changed",
    }),
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
      ? [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ]
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
