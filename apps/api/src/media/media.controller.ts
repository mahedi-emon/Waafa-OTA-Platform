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
import { z } from "zod";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { ProblemException, parseInput, problems } from "../common/problem";
import { MEDIA_TYPES, MediaService } from "./media.service";

const AltSchema = z.string().trim().min(3, "Describe the photo in a few words").max(200);
const UploadQuerySchema = z
  .object({
    alt: AltSchema,
    name: z.string().trim().max(160).optional(),
  })
  .strict();
const ListQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(500).optional(),
  })
  .strict();
const ID = /^[a-z0-9]{8,40}$/;

/** Admin › Media library (#109): content editors, admins, store and travel staff upload; editors and admins delete. */
@Controller("admin/media")
@UseGuards(StaffGuard)
@Roles("admin", "content-editor", "shop-manager", "travel-sales")
export class AdminMediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.media.list(parseInput(ListQuerySchema, query));
  }

  /** The photo is the raw request body with its type in Content-Type; alt text and file name in the query. */
  @Post()
  @HttpCode(201)
  upload(@Staff() staff: StaffPrincipal, @Req() request: FastifyRequest, @Query() query: unknown) {
    const meta = parseInput(UploadQuerySchema, query);
    const type = (request.headers["content-type"] ?? "").split(";")[0]?.trim() ?? "";
    if (!(MEDIA_TYPES as readonly string[]).includes(type) || !Buffer.isBuffer(request.body)) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Unsupported file",
        "Upload a JPEG, PNG, WebP or AVIF photo",
      );
    }
    return this.media.upload(staff, request.body, type, {
      alt: meta.alt,
      ...(meta.name ? { originalName: meta.name } : {}),
    });
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    if (!ID.test(id)) throw problems.notFound();
    const { alt } = parseInput(z.object({ alt: AltSchema }).strict(), body);
    return this.media.updateAlt(staff, id, alt);
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
 * The stored photos (#109), public: nginx serves them at /uploads/ with a year-long cache (the file name is the
 * asset id, so a path never changes content).
 */
@Controller("media")
export class PublicMediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Get(":year/:month/:file")
  async file(
    @Param("year") year: string,
    @Param("month") month: string,
    @Param("file") file: string,
    @Res() reply: FastifyReply,
  ) {
    const found = await this.media.open(`${year}/${month}/${file}`);
    if (!found) throw problems.notFound();
    return reply
      .header("content-type", "image/webp")
      .header("content-length", String(found.size))
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("x-content-type-options", "nosniff")
      .send(found.stream);
  }
}
