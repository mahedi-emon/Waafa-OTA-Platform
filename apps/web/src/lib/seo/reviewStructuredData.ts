import type { PublicReview } from "@waafa/shared";

/**
 * AggregateRating and Review for structured data (issue 245), only from approved reviews of real customers and only
 * when there is at least one, matching what the page shows (Google's rule and ours: never invented ratings).
 */
export function reviewStructuredData(input: {
  reviews: PublicReview[];
  summary: { average: number; count: number } | null;
}): Record<string, unknown> {
  if (!input.summary) return {};
  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: input.summary.average,
      reviewCount: input.summary.count,
      bestRating: 5,
      worstRating: 1,
    },
    review: input.reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.name },
      datePublished: review.createdAt.slice(0, 10),
      reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
      reviewBody: review.body,
      ...(review.title ? { name: review.title } : {}),
    })),
  };
}
