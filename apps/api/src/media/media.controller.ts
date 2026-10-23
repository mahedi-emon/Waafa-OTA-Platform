import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  MediaCropInputSchema,
  MediaListQuerySchema,
  MediaUpdateInputSchema,
  MediaUploadQuerySchema,
  PHOTO_TYPES,
  VIDEO_TYPES,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { ProblemException, parseInput, problems } from "../common/problem";
import { MediaService } from "./media.service";

const ID = /^[a-z0-9]{8,40}$/;

const typeOf = (request: FastifyRequest) =>
  (request.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";

/**
 * The raw upload the content-type parser left in the body, or null. A parsed body can be a string or an array, so
 * those are refused before the Buffer check (CodeQL js/type-confusion-through-parameter-tampering).
 */
export function rawBody(body: unknown): Buffer | null {
  if (typeof body !== "object" || Array.isArray(body) || !Buffer.isBuffer(body)) return null;
  return body;
}

/** "bytes=start-end", "bytes=start-" or "bytes=-suffix" for a file of `size` bytes; null when absent or invalid. */
export function parseRange(header: unknown, size: number): { start: number; end: number } | null {
  if (typeof header !== "string") return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return null;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  // "bytes=N-" past the end is a real request the file can't meet (416); "bytes=5-2" is no range at all.
  if (match[2] === "") return { start, end: size - 1 };
  const end = Number(match[2]);
  return end < start ? null : { start, end };
}

/**
 * Admin › Media library (#109, D0 R3): content editors, admins, store and travel staff upload, crop and describe files;
 * editors and admins delete files nothing shows.
 */
@Controller("admin/media")
@UseGuards(StaffGuard)
@Roles("admin", "content-editor", "shop-manager", "travel-sales")
export class AdminMediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.media.list(parseInput(MediaListQuerySchema, query));
  }

  /** The photo is the raw request body with its type in Content-Type; alt text, name and credit in the query. */
  @Post()
  @HttpCode(201)
  upload(@Staff() staff: StaffPrincipal, @Req() request: FastifyRequest, @Query() query: unknown) {
    const meta = parseInput(MediaUploadQuerySchema, query);
    const type = typeOf(request);
    const body = rawBody(request.body);
    if (!(PHOTO_TYPES as readonly string[]).includes(type) || !body) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Unsupported file",
        "Upload a JPEG, PNG, WebP or AVIF photo",
      );
    }
    return this.media.upload(staff, body, type, {
      alt: meta.alt,
      ...(meta.name ? { originalName: meta.name } : {}),
      ...(meta.credit ? { credit: meta.credit } : {}),
    });
  }

  /** MP4 or WebM up to 50 MB as the raw body (this route alone has the higher limit). */
  @Post("video")
  @HttpCode(201)
  uploadVideo(
    @Staff() staff: StaffPrincipal,
    @Req() request: FastifyRequest,
    @Query() query: unknown,
  ) {
    const meta = parseInput(MediaUploadQuerySchema, query);
    const type = typeOf(request);
    const body = rawBody(request.body);
    if (!(VIDEO_TYPES as readonly string[]).includes(type) || !body) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Unsupported file",
        "Upload an MP4 or WebM video",
      );
    }
    return this.media.uploadVideo(staff, body, type, {
      alt: meta.alt,
      ...(meta.name ? { originalName: meta.name } : {}),
      ...(meta.credit ? { credit: meta.credit } : {}),
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    if (!ID.test(id)) throw problems.notFound();
    return this.media.get(id);
  }

  /** Every record and setting that shows the file. */
  @Get(":id/usage")
  usage(@Param("id") id: string) {
    if (!ID.test(id)) throw problems.notFound();
    return this.media.usage(id);
  }

  /** A crop saved as a new photo. */
  @Post(":id/crop")
  @HttpCode(201)
  crop(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    if (!ID.test(id)) throw problems.notFound();
    return this.media.crop(staff, id, parseInput(MediaCropInputSchema, body));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    if (!ID.test(id)) throw problems.notFound();
    return this.media.update(staff, id, parseInput(MediaUpdateInputSchema, body));
  }

  @Delete(":id")
  @Roles("admin", "content-editor")
  @HttpCode(204)
  async remove(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    if (!ID.test(id)) throw problems.notFound();
    await this.media.remove(staff, id);
  }
}

/**
 * The stored photos and videos (#109, D0 R3), public: nginx serves them at /uploads/ (the file name is the asset id,
 * so a path never changes content). Videos answer range requests so browsers can seek.
 */
@Controller("media")
export class PublicMediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Get(":year/:month/:file")
  async file(
    @Param("year") year: string,
    @Param("month") month: string,
    @Param("file") file: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const relative = `${year}/${month}/${file}`;
    const whole = await this.media.open(relative);
    if (!whole?.stream) throw problems.notFound();
    const range = parseRange(request.headers.range, whole.size);
    reply
      .header("content-type", whole.type)
      .header("accept-ranges", "bytes")
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("x-content-type-options", "nosniff");
    if (!range) return reply.header("content-length", String(whole.size)).send(whole.stream);
    whole.stream.destroy();
    const part = await this.media.open(relative, range);
    if (!part?.stream || !part.range) {
      return reply
        .code(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
        .header("content-range", `bytes */${whole.size}`)
        .send();
    }
    return reply
      .code(HttpStatus.PARTIAL_CONTENT)
      .header("content-range", `bytes ${part.range.start}-${part.range.end}/${part.size}`)
      .header("content-length", String(part.range.end - part.range.start + 1))
      .send(part.stream);
  }
}
