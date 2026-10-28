import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { ModerationItem } from "./_components/ModerationItem";

type Queue = {
  reviews: Array<{
    id: string;
    kind: "package" | "product";
    targetId: string;
    name: string;
    proof: string;
    rating: number;
    title: string | null;
    body: string;
    createdAt: string;
  }>;
  questions: Array<{
    id: string;
    productId: string;
    name: string;
    question: string;
    createdAt: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.reviewsAdmin");
  return { title: t("metaTitle") };
}

async function Reviews() {
  const [queue, t] = await Promise.all([
    adminGet<Queue>("/admin/reviews", { status: "pending" }),
    getTranslations("Admin.reviewsAdmin"),
  ]);
  const strings = {
    reply: t("reply"),
    answer: t("answer"),
    approve: t("approve"),
    reject: t("reject"),
    publish: t("publish"),
    hide: t("hide"),
    done: t("done"),
    failed: t("failed"),
  };
  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel id="reviews-waiting" title={t("reviews")}>
          {queue.reviews.length === 0 ? (
            <p className="text-[14px] text-mist-600">{t("noReviews")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist-100">
              {queue.reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-2 py-4 first:pt-0">
                  <p className="text-[13px] text-mist-600">
                    {review.kind === "package" ? t("package") : t("product")} · {review.targetId} ·{" "}
                    {t("proof", { proof: review.proof })} · {formatDhakaDateTime(review.createdAt)}
                  </p>
                  <p className="font-semibold text-navy-900">
                    {t("rating", { rating: review.rating })} · {review.name}
                  </p>
                  {review.title ? <p className="font-medium text-ink-900">{review.title}</p> : null}
                  <p className="text-[14.5px] break-words whitespace-pre-line text-ink-900">
                    {review.body}
                  </p>
                  <ModerationItem kind="review" id={review.id} strings={strings} />
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
        <AdminPanel id="questions-waiting" title={t("questions")}>
          {queue.questions.length === 0 ? (
            <p className="text-[14px] text-mist-600">{t("noQuestions")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist-100">
              {queue.questions.map((question) => (
                <li key={question.id} className="flex flex-col gap-2 py-4 first:pt-0">
                  <p className="text-[13px] text-mist-600">
                    {t("product")} · {question.productId} · {question.name} ·{" "}
                    {formatDhakaDateTime(question.createdAt)}
                  </p>
                  <p className="text-[14.5px] break-words text-ink-900">{question.question}</p>
                  <ModerationItem kind="question" id={question.id} strings={strings} />
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </>
  );
}

/** Admin › Reviews and questions (issue 245): the moderation queues. */
export default function ReviewsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <Reviews />
    </Suspense>
  );
}
