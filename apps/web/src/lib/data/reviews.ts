import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  PublicReviewsSchema,
  ratingSummary,
  type PublicQuestion,
  type PublicReview,
  type PublicReviews,
  type ReviewKind,
} from "@waafa/shared";
import { apiConfig, callApi } from "./api/apiClient";
import { CACHE_TAGS } from "./tags";

const EMPTY: PublicReviews = { reviews: [], questions: [] };
let lastGood: PublicReviews | null = null;

/**
 * Approved reviews and answered product questions (issue 245), read once for the whole site and expired by every
 * moderation in Admin, so product and package pages stay static. Fixture mode has none: reviews are never invented.
 */
async function getPublicReviews(): Promise<PublicReviews> {
  "use cache";
  cacheTag(CACHE_TAGS.reviews);
  const config = apiConfig();
  if (!config) {
    cacheLife("hours");
    return EMPTY;
  }
  try {
    lastGood = PublicReviewsSchema.parse(
      await callApi<unknown>(config, "/api/v1/public/reviews", { timeoutMs: 5_000 }),
    );
    cacheLife("hours");
    return lastGood;
  } catch {
    cacheLife("seconds");
    return lastGood ?? EMPTY;
  }
}

/** One package's or product's approved reviews, newest first, with the average and count. */
export async function getReviewsFor(
  kind: ReviewKind,
  targetId: string,
): Promise<{ reviews: PublicReview[]; summary: { average: number; count: number } | null }> {
  const all = await getPublicReviews();
  const reviews = all.reviews.filter(
    (review) => review.kind === kind && review.targetId === targetId,
  );
  return { reviews, summary: ratingSummary(reviews) };
}

/** One product's answered questions, newest answer first. */
export async function getQuestionsFor(productId: string): Promise<PublicQuestion[]> {
  const all = await getPublicReviews();
  return all.questions.filter((question) => question.productId === productId);
}
