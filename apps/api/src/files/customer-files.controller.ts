import { Body, Controller, Get, Inject, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CUSTOMER_FILE_OWNERS,
  CustomerFileLinkInputSchema,
  CustomerFileUploadQuerySchema,
} from "@waafa/shared";
import { Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { parseInput, problems } from "../common/problem";
import { RateLimitService } from "../common/rateLimit.service";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { rawBody } from "../media/media.controller";
import { CustomerFilesService } from "./customer-files.service";

const typeOf = (request: FastifyRequest) =>
  (request.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";

/** Staff uploads go to bookings only for now; customer records get their files from the customer. */
const StaffAttachQuerySchema = z
  .object({
    owner: z.literal("booking"),
    id: z.string().min(1).max(64),
    kind: CustomerFileUploadQuerySchema.shape.kind,
    name: CustomerFileUploadQuerySchema.shape.name,
  })
  .strict();

const ListQuerySchema = z
  .object({ owner: z.enum(CUSTOMER_FILE_OWNERS), id: z.string().min(1).max(64) })
  .strict();

/** A content-disposition filename that can't break the header (ASCII fallback plus RFC 5987 UTF-8). */
export function dispositionName(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Customer uploads from the web server (issue 232): the raw file with its kind and name in the query, and the signed
 * download a staff link points at. Both need the intake key: the site's own route handlers check same-site, size,
 * type and the visitor's rate limit first, and the admin route checks the staff session before it asks for a link.
 */
@Controller("public/files")
@UseGuards(IntakeKeyGuard)
export class PublicFilesController {
  constructor(
    @Inject(CustomerFilesService) private readonly files: CustomerFilesService,
    @Inject(ENV) private readonly env: Env,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
  ) {}

  @Post()
  async upload(
    @Req() request: FastifyRequest,
    @Query() query: unknown,
    @Res() reply: FastifyReply,
  ) {
    const ip = clientIp(request, this.env);
    // Twice the web's limit per visitor, like the other intake routes.
    if (!(await this.limits.allow("uploads", ip))) throw problems.tooMany();
    const input = parseInput(CustomerFileUploadQuerySchema, query);
    const body = rawBody(request.body);
    if (!body) throw problems.badRequest("Send the file as the request body", "file-type");
    const stored = await this.files.store(body, typeOf(request), input, ip);
    return reply.status(201).send(stored);
  }

  /** The token rides in the query: it is longer than Fastify's path parameter limit. */
  @Get("signed")
  async signed(@Query("token") token: unknown, @Res() reply: FastifyReply) {
    const file =
      typeof token === "string" && token.length <= 300 ? await this.files.open(token) : null;
    if (!file)
      throw problems.notFound("This link has expired. Open the file again from the admin.");
    return (
      reply
        .header("content-type", file.mimeType)
        .header("content-length", String(file.size))
        .header("content-disposition", dispositionName(file.fileName))
        .header("cache-control", "private, no-store")
        .header("x-content-type-options", "nosniff")
        // Images open sandboxed; Chrome's PDF viewer refuses a sandboxed or object-src 'none' page, so a PDF only
        // gets the framing and form limits (its scripts run inside the viewer, never in the site's origin).
        .header(
          "content-security-policy",
          file.mimeType === "application/pdf"
            ? "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
            : "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        )
        .header("referrer-policy", "no-referrer")
        .send(file.stream)
    );
  }
}

/** Staff side: the files a record holds and a ten-minute signed link to one of them (audited). */
@Controller("admin/files")
@UseGuards(StaffGuard)
export class AdminFilesController {
  constructor(
    @Inject(CustomerFilesService) private readonly files: CustomerFilesService,
    @Inject(ENV) private readonly env: Env,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
  ) {}

  /** Staff add a document to a booking (issue 242): the file is the body, owner, id, kind and name in the query. */
  @Post("attach")
  async attach(
    @Staff() staff: StaffPrincipal,
    @Req() request: FastifyRequest,
    @Query() query: unknown,
    @Res() reply: FastifyReply,
  ) {
    const ip = clientIp(request, this.env);
    if (!(await this.limits.allow("uploads", ip))) throw problems.tooMany();
    const input = parseInput(StaffAttachQuerySchema, query);
    const body = rawBody(request.body);
    if (!body) throw problems.badRequest("Send the file as the request body", "file-type");
    const files = await this.files.attachForStaff(
      staff,
      input.owner,
      input.id,
      body,
      typeOf(request),
      { kind: input.kind, name: input.name },
      ip,
    );
    return reply.status(201).send(files);
  }

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    const input = parseInput(ListQuerySchema, query);
    return this.files.list(staff, input.owner, input.id);
  }

  @Post("link")
  link(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    const input = parseInput(CustomerFileLinkInputSchema, body);
    return this.files.link(staff, input.storageKey);
  }
}
