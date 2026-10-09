import { z } from "zod";
import {
  IdSchema,
  ImageSchema,
  IsoDateTimeSchema,
  PublishStatusSchema,
  SampleFlagSchema,
  SeoSchema,
  SlugSchema,
  TakaSchema,
} from "./common";
import { PrivateFileSchema } from "./leads";

/** Attribute in a category's attribute set: drives the product form, listing filters and the spec table (FR-CAT-02). */
export const AttributeSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
    label: z.string().min(1).max(40),
    type: z.enum(["select", "number", "text", "boolean"]),
    unit: z.string().max(12).optional(),
    options: z.array(z.string().min(1)).optional(),
    filterable: z.boolean().default(false),
  })
  .strict();

export const AttributeSetSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(60),
    attributes: z.array(AttributeSchema).min(1),
  })
  .strict();

/** Category tree up to three levels (FR-CAT-01). `compatibility` turns on "Compatible with" (FR-CAT-05). */
export const CategorySchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(60),
    parentId: IdSchema.nullable(),
    level: z.number().int().min(1).max(3),
    icon: z.string().min(1),
    description: z.string().max(200).optional(),
    banner: ImageSchema.optional(),
    attributeSetId: IdSchema.optional(),
    compatibility: z.boolean().default(false),
    order: z.number().int().min(0),
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict();

export const BrandSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(60),
    logo: ImageSchema.optional(),
    description: z.string().max(200).optional(),
    sample: SampleFlagSchema,
  })
  .strict();

export const ProductOptionSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
    label: z.string().min(1).max(30),
    display: z.enum(["swatch", "pill", "size"]),
    values: z
      .array(
        z
          .object({
            value: z.string().min(1).max(40),
            /** Product colour for swatches (data, not a brand token). */
            swatch: z
              .string()
              .regex(/^#[0-9A-Fa-f]{6}$/)
              .optional(),
            hint: z.string().max(40).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const StockStatusSchema = z.enum(["in-stock", "low-stock", "out-of-stock", "pre-order"]);

/** Each sellable variant has its own SKU, price, MRP, stock and images (FR-CAT-03). */
export const VariantSchema = z
  .object({
    id: IdSchema,
    sku: z.string().min(1).max(40),
    /** Option key → value, e.g. { colour: "Navy", size: "M" }; empty for single-variant products. */
    options: z.record(z.string(), z.string()),
    price: TakaSchema,
    mrp: TakaSchema.optional(),
    stock: z.number().int().min(0),
    lowStockAt: z.number().int().min(0).default(3),
    preOrder: z.boolean().default(false),
    images: z.array(ImageSchema).default([]),
  })
  .strict()
  .refine((variant) => variant.mrp === undefined || variant.mrp >= variant.price, {
    message: "MRP can't be lower than the price",
    path: ["mrp"],
  });

export const ProductBadgeSchema = z.enum(["best-seller", "new", "featured", "deal"]);

export const ProductSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    title: z.string().min(1).max(140),
    shortTitle: z.string().min(1).max(60),
    brandId: IdSchema,
    categoryId: IdSchema,
    badges: z.array(ProductBadgeSchema).default([]),
    /** One line on cards, e.g. "Sizes S to XXL · 4 colours". */
    cardSpec: z.string().max(80).optional(),
    highlights: z
      .array(z.object({ icon: z.string().min(1), text: z.string().min(1).max(60) }).strict())
      .max(6),
    description: z.array(z.string().min(1).max(600)).min(1),
    specs: z.array(
      z.object({ label: z.string().min(1).max(40), value: z.string().min(1).max(120) }).strict(),
    ),
    warranty: z
      .object({
        short: z.string().min(1).max(60),
        returnsShort: z.string().min(1).max(80),
        items: z
          .array(
            z
              .object({
                icon: z.string().min(1),
                title: z.string().min(1).max(40),
                detail: z.string().min(1).max(160),
              })
              .strict(),
          )
          .default([]),
      })
      .strict(),
    images: z.array(ImageSchema).min(1),
    video: z
      .object({
        mp4: z.string().min(1),
        webm: z.string().optional(),
        poster: ImageSchema,
        caption: z.string().max(80),
      })
      .strict()
      .optional(),
    options: z.array(ProductOptionSchema).default([]),
    variants: z.array(VariantSchema).min(1),
    defaultVariantId: IdSchema,
    compatibleModelIds: z.array(IdSchema).default([]),
    collectionIds: z.array(IdSchema).default([]),
    codEligible: z.boolean().default(true),
    /** Bulk quote button threshold, e.g. 20 units (FR-SHOP-04). */
    bulkFrom: z.number().int().positive().optional(),
    popularity: z.number().int().min(0),
    createdAt: IsoDateTimeSchema,
    status: PublishStatusSchema,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .superRefine((product, ctx) => {
    if (!product.variants.some((variant) => variant.id === product.defaultVariantId)) {
      ctx.addIssue({
        code: "custom",
        message: "Default variant must be one of the variants",
        path: ["defaultVariantId"],
      });
    }
    const optionKeys = product.options
      .map((option) => option.key)
      .sort()
      .join(",");
    for (const [index, variant] of product.variants.entries()) {
      const keys = Object.keys(variant.options).sort().join(",");
      if (keys !== optionKeys) {
        ctx.addIssue({
          code: "custom",
          message: "Every variant sets every option",
          path: ["variants", index, "options"],
        });
      }
    }
    if (new Set(product.variants.map((variant) => variant.sku)).size !== product.variants.length) {
      ctx.addIssue({ code: "custom", message: "SKUs must be unique", path: ["variants"] });
    }
  });

/** Hand-picked or rule-based collections (FR-CAT-04), e.g. "Office essentials", "Under ৳999". */
export const CollectionSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(60),
    description: z.string().max(160).optional(),
    image: ImageSchema.optional(),
    rule: z.discriminatedUnion("type", [
      z.object({ type: z.literal("manual"), productIds: z.array(IdSchema) }).strict(),
      z
        .object({
          type: z.literal("rule"),
          maxPrice: TakaSchema.optional(),
          categoryIds: z.array(IdSchema).optional(),
          brandIds: z.array(IdSchema).optional(),
          badges: z.array(ProductBadgeSchema).optional(),
        })
        .strict(),
    ]),
    order: z.number().int().min(0),
    sample: SampleFlagSchema,
  })
  .strict();

/** Printer (or device) models for Find by model, imported by CSV (FR-CAT-05, FR-SHOP-05). */
export const CompatibleModelSchema = z
  .object({
    id: IdSchema,
    brand: z.string().min(1).max(40),
    model: z.string().min(1).max(80),
    partCodes: z.array(z.string().min(1).max(30)).default([]),
  })
  .strict();

export const DealSchema = z
  .object({
    id: IdSchema,
    productId: IdSchema,
    variantId: IdSchema,
    dealPrice: TakaSchema,
    endsAt: IsoDateTimeSchema,
    sample: SampleFlagSchema,
  })
  .strict();

export const StoreRowKeySchema = z.enum([
  "campaigns",
  "categories",
  "collections",
  "deals",
  "bestSellers",
  "brands",
  "newArrivals",
  "recentlyViewed",
  "services",
  "bulkBanner",
  "trust",
]);

export const StoreRowSchema = z
  .object({ key: StoreRowKeySchema, enabled: z.boolean(), order: z.number().int().min(0) })
  .strict();

export const CouponSchema = z
  .object({
    code: z.string().regex(/^[A-Z0-9-]{3,24}$/),
    type: z.enum(["percent", "fixed"]),
    value: z.number().positive(),
    minOrder: TakaSchema.default(0),
    maxDiscount: TakaSchema.optional(),
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema.optional(),
    enabled: z.boolean(),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((coupon) => coupon.type !== "percent" || coupon.value <= 90, {
    message: "Percent coupons can be up to 90%",
    path: ["value"],
  });

export const CartLineSchema = z
  .object({
    productId: IdSchema,
    variantId: IdSchema,
    quantity: z.number().int().min(1).max(999),
  })
  .strict();

export const CartSchema = z
  .object({
    lines: z.array(CartLineSchema),
    couponCode: z.string().optional(),
  })
  .strict();

export const DeliveryAddressSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Enter a valid phone number"),
    email: z.email().optional(),
    division: z.string().min(1).max(40),
    district: z.string().min(1).max(40),
    area: z.string().min(1).max(60),
    street: z.string().trim().min(3).max(160),
    note: z.string().max(300).optional(),
  })
  .strict();

export const PaymentChoiceSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("cod") }).strict(),
  z
    .object({
      method: z.literal("offline"),
      accountId: IdSchema,
      transactionId: z.string().trim().min(4).max(40),
      proof: PrivateFileSchema.optional(),
    })
    .strict(),
]);

/** FR-SHOP-09 statuses. */
export const OrderStatusSchema = z.enum([
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const OrderItemSchema = z
  .object({
    productId: IdSchema,
    variantId: IdSchema,
    title: z.string().min(1),
    variantLabel: z.string().max(80).optional(),
    sku: z.string().min(1),
    unitPrice: TakaSchema,
    quantity: z.number().int().positive(),
    lineTotal: TakaSchema,
    image: ImageSchema.optional(),
  })
  .strict();

export const OrderSchema = z
  .object({
    id: IdSchema,
    reference: z.string().regex(/^ORD-\d{6}-\d{4}$/),
    items: z.array(OrderItemSchema).min(1),
    subtotal: TakaSchema,
    discount: TakaSchema,
    delivery: TakaSchema,
    total: TakaSchema,
    couponCode: z.string().optional(),
    payment: PaymentChoiceSchema,
    paymentVerified: z.boolean().default(false),
    address: DeliveryAddressSchema,
    status: OrderStatusSchema,
    history: z
      .array(
        z
          .object({
            status: OrderStatusSchema,
            at: IsoDateTimeSchema,
            note: z.string().max(200).optional(),
            courier: z.string().max(40).optional(),
            trackingNumber: z.string().max(40).optional(),
          })
          .strict(),
      )
      .min(1),
    createdAt: IsoDateTimeSchema,
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((order) => order.total === order.subtotal - order.discount + order.delivery, {
    message: "Total must equal subtotal minus discount plus delivery",
    path: ["total"],
  });

export type Attribute = z.infer<typeof AttributeSchema>;
export type AttributeSet = z.infer<typeof AttributeSetSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type ProductOption = z.infer<typeof ProductOptionSchema>;
export type StockStatus = z.infer<typeof StockStatusSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type ProductBadge = z.infer<typeof ProductBadgeSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type CompatibleModel = z.infer<typeof CompatibleModelSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type StoreRowKey = z.infer<typeof StoreRowKeySchema>;
export type StoreRow = z.infer<typeof StoreRowSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type CartLine = z.infer<typeof CartLineSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>;
export type PaymentChoice = z.infer<typeof PaymentChoiceSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
