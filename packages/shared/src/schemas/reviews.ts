import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common";

export const ReviewKindSchema = z.enum(["package", "product"]);

/** A review from a signed-in customer (issue 245); the API checks they booked or received the item. */
export const ReviewInputSchema = z
  .object({
    kind: ReviewKindSchema,
    targetId: IdSchema,
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(80).optional(),
    body: z.string().trim().min(10).max(2000),
  })
  .strict();

export const ReviewDecisionSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    reply: z.string().trim().max(1000).optional(),
  })
  .strict();

/** A visitor's question on a product, shown once answered. */
export const QuestionInputSchema = z
  .object({
    productId: IdSchema,
    name: z.string().trim().min(2).max(60),
    question: z.string().trim().min(5).max(500),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export const QuestionAnswerSchema = z
  .object({
    status: z.enum(["published", "hidden"]),
    answer: z.string().trim().min(2).max(1000).optional(),
  })
  .strict()
  .refine((value) => value.status === "hidden" || Boolean(value.answer), {
    message: "Write the answer before publishing",
    path: ["answer"],
  });

/** What the site shows: approved reviews (first name and initial only) and answered questions. */
export const PublicReviewSchema = z
  .object({
    id: IdSchema,
    kind: ReviewKindSchema,
    targetId: IdSchema,
    name: z.string(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    body: z.string(),
    reply: z.string().optional(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const PublicQuestionSchema = z
  .object({
    id: IdSchema,
    productId: IdSchema,
    name: z.string(),
    question: z.string(),
    answer: z.string(),
    answeredAt: IsoDateTimeSchema,
  })
  .strict();

export const PublicReviewsSchema = z
  .object({
    reviews: z.array(PublicReviewSchema),
    questions: z.array(PublicQuestionSchema),
  })
  .strict();

export type ReviewKind = z.infer<typeof ReviewKindSchema>;
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type PublicReview = z.infer<typeof PublicReviewSchema>;
export type PublicQuestion = z.infer<typeof PublicQuestionSchema>;
export type PublicReviews = z.infer<typeof PublicReviewsSchema>;

/** "Karim Uddin" → "Karim U." (the site never shows a full name). */
export function reviewerName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first!;
}

/** Average and count for structured data and the stars summary; null when there are none. */
export function ratingSummary(
  reviews: ReadonlyArray<{ rating: number }>,
): { average: number; count: number } | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}
