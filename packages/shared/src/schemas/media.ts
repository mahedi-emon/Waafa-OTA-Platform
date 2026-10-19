import { z } from "zod";

/** Media library contracts (D0 R3, docs/design/ADMIN.md §5.7 and §11), shared by the admin and the API. */

export const MediaIdSchema = z.string().regex(/^[a-z0-9]{8,40}$/, "Unknown file");
export const MediaKindSchema = z.enum(["photo", "video"]);

/** Alt text: what the photo shows, for people who can't see it (required, PRD accessibility). */
export const MediaAltSchema = z
  .string()
  .trim()
  .min(3, "Describe the photo in a few words")
  .max(200);

export const MediaAssetSchema = z
  .object({
    id: MediaIdSchema,
    url: z.string(),
    path: z.string(),
    kind: MediaKindSchema,
    mime: z.string(),
    alt: z.string(),
    credit: z.string().nullable(),
    creditUrl: z.string().nullable(),
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
    bytes: z.number().int().nonnegative(),
    originalName: z.string().nullable(),
    uploadedBy: z.string().nullable(),
    createdAt: z.string(),
    /** How many records and settings show it. */
    uses: z.number().int().nonnegative(),
  })
  .strict();

export const MediaListSchema = z
  .object({
    items: z.array(MediaAssetSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .strict();

export const MediaListQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(500).optional(),
    kind: MediaKindSchema.optional(),
    /** Only files no record or setting shows. */
    unused: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const MediaUploadQuerySchema = z
  .object({
    alt: MediaAltSchema,
    name: z.string().trim().max(160).optional(),
    credit: z.string().trim().max(120).optional(),
  })
  .strict();

export const MediaUpdateInputSchema = z
  .object({
    alt: MediaAltSchema,
    credit: z.string().trim().max(120).optional(),
    creditUrl: z.url().optional(),
  })
  .strict();

/** A crop of a library photo in its own pixels; the crop is saved as a new photo. */
export const MediaCropInputSchema = z
  .object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().min(16),
    height: z.number().int().min(16),
  })
  .strict();

/** Show another library file everywhere this one is shown. */
export const MediaReplaceInputSchema = z.object({ with: MediaIdSchema }).strict();

export const MediaUseSchema = z
  .object({
    area: z.enum(["content", "setting"]),
    key: z.string(),
    recordId: z.string().nullable(),
    /** The record's or setting's name, as staff know it. */
    title: z.string(),
    /** Where in it, as a dotted path ("gallery.2.src"). */
    field: z.string(),
  })
  .strict();

export const MediaUsageSchema = z.object({ items: z.array(MediaUseSchema) }).strict();

export const MediaReplaceResultSchema = z
  .object({ replaced: z.number().int().nonnegative(), failed: z.array(z.string()) })
  .strict();

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type MediaList = z.infer<typeof MediaListSchema>;
export type MediaListQuery = z.infer<typeof MediaListQuerySchema>;
export type MediaUse = z.infer<typeof MediaUseSchema>;
export type MediaUsage = z.infer<typeof MediaUsageSchema>;
export type MediaCropInput = z.infer<typeof MediaCropInputSchema>;
export type MediaReplaceResult = z.infer<typeof MediaReplaceResultSchema>;
