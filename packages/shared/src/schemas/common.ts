import { z } from "zod";

/** Stable record id (fixtures use readable ids such as "pkg-maldives-4d"; the API uses cuid/uuid strings). */
export const IdSchema = z.string().min(1).max(64);

/** URL slug: lowercase words joined by hyphens. */
export const SlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

/** Whole taka, VAT included (PRD: prices are VAT-inclusive; ৳ with Indian grouping when shown). */
export const TakaSchema = z.number().int().nonnegative();

/** Calendar date without time, "2026-10-12". */
export const IsoDateSchema = z.iso.date();

/** Timestamp with offset, "2026-10-12T09:30:00+06:00". */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/** Marks Phase A Sample data so it can never be mistaken for live content (CLAUDE.md). */
export const SampleFlagSchema = z.boolean();

/** Bangladeshi mobile number in national format with no spaces: 01 + operator digit 3-9 + 8 digits. */
export const BdMobileSchema = z
  .string()
  .regex(/^01[3-9]\d{8}$/, "Enter an 11-digit mobile number starting with 01");

/** Any phone in E.164 (international customers and diaspora numbers). */
export const E164PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Enter the number with its country code");

export const EmailSchema = z.email();

/** Site-relative path ("/tour-packages") or absolute https URL. */
export const HrefSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:"),
    {
      message: "Use a site path, an https URL, mailto: or tel:",
    },
  );

export const LinkSchema = z
  .object({
    label: z.string().min(1).max(80),
    href: HrefSchema,
    /** Opens in a new tab with rel="noopener" (external sites only). */
    external: z.boolean().default(false),
  })
  .strict();

/** Photo or image slot. `credit` is required for Unsplash/Pexels photos (IMAGE_CREDITS.md). */
export const ImageSchema = z
  .object({
    src: z.string().min(1),
    alt: z.string().max(200),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    credit: z.string().max(120).optional(),
  })
  .strict();

/** Per-page SEO fields managed in admin (NFR-SEO). Empty fields fall back to templated defaults. */
export const SeoSchema = z
  .object({
    title: z.string().max(70).optional(),
    description: z.string().max(170).optional(),
    image: ImageSchema.optional(),
    noIndex: z.boolean().default(false),
  })
  .strict();

export const PublishStatusSchema = z.enum(["draft", "published", "archived"]);

export type Id = z.infer<typeof IdSchema>;
export type Slug = z.infer<typeof SlugSchema>;
export type Taka = z.infer<typeof TakaSchema>;
export type IsoDate = z.infer<typeof IsoDateSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type Href = z.infer<typeof HrefSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type PublishStatus = z.infer<typeof PublishStatusSchema>;
