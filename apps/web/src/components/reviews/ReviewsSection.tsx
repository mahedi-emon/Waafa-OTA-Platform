import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@waafa/shared";
import { getQuestionsFor, getReviewsFor } from "@/lib/data/reviews";
import { Stars } from "./Stars";

// The forms are client leaves loaded with the section, so the page's first JavaScript stays small.
const WriteReview = dynamic(() => import("./WriteReview").then((mod) => mod.WriteReview));
const AskQuestion = dynamic(() => import("./AskQuestion").then((mod) => mod.AskQuestion));

type ReviewsSectionProps = {
  kind: "package" | "product";
  targetId: string;
  /** This page's address, for sign-in to come back to. */
  path: string;
};

/**
 * Reviews from real customers and, on products, answered questions (issue 245). Only approved reviews show; the
 * section says plainly who can write one. Nothing here is invented: with no reviews it shows none.
 */
async function ReviewsSection({ kind, targetId, path }: ReviewsSectionProps) {
  const [{ reviews, summary }, questions, t] = await Promise.all([
    getReviewsFor(kind, targetId),
    kind === "product" ? getQuestionsFor(targetId) : Promise.resolve([]),
    getTranslations("Reviews"),
  ]);
  const outOf = (value: number) => t("outOf", { value: String(value) });

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="reviews-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="reviews-title" className="font-display text-[22px] font-bold text-navy-900">
            {t("title")}
          </h2>
          {summary ? (
            <p className="flex items-center gap-2 text-[14.5px] text-mist-700">
              <Stars rating={summary.average} label={outOf(summary.average)} />
              <span className="tabular-nums">
                {t("summary", { average: String(summary.average), count: summary.count })}
              </span>
            </p>
          ) : null}
        </div>
        {reviews.length === 0 ? (
          <p className="text-[14.5px] text-mist-700">
            {kind === "package" ? t("emptyPackage") : t("emptyProduct")}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {reviews.slice(0, 12).map((review) => (
              <li
                key={review.id}
                className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-mist-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <Stars rating={review.rating} label={outOf(review.rating)} />
                  <time dateTime={review.createdAt} className="text-[12.5px] text-mist-600">
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                {review.title ? (
                  <p className="font-semibold text-navy-900">{review.title}</p>
                ) : null}
                <p className="text-[14.5px] break-words whitespace-pre-line text-ink-900">
                  {review.body}
                </p>
                <p className="text-[13px] text-mist-600">
                  {t("by", { name: review.name })} ·{" "}
                  {kind === "package" ? t("verifiedTrip") : t("verifiedOrder")}
                </p>
                {review.reply ? (
                  <p className="rounded-xl bg-mist-25 p-3 text-[13.5px] text-mist-700">
                    <span className="font-semibold text-navy-900">{t("reply")}</span> {review.reply}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <WriteReview
          kind={kind}
          targetId={targetId}
          path={path}
          strings={{
            write: t("write"),
            signIn: kind === "package" ? t("signInPackage") : t("signInProduct"),
            notEligible: kind === "package" ? t("notEligiblePackage") : t("notEligibleProduct"),
            reviewed: t("reviewed"),
            rating: t("rating"),
            ratingOption: t("ratingOption", { value: "{value}" }),
            title: t("reviewTitle"),
            body: t("body"),
            bodyHint: t("bodyHint"),
            submit: t("submit"),
            thanks: t("thanks"),
            failed: t("failed"),
          }}
        />
      </section>

      {kind === "product" ? (
        <section aria-labelledby="questions-title" className="flex flex-col gap-4">
          <h2 id="questions-title" className="font-display text-[22px] font-bold text-navy-900">
            {t("questions")}
          </h2>
          {questions.length === 0 ? (
            <p className="text-[14.5px] text-mist-700">{t("noQuestions")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist-100">
              {questions.slice(0, 20).map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3">
                  <p className="font-semibold break-words text-navy-900">{item.question}</p>
                  <p className="text-[14.5px] break-words text-ink-900">{item.answer}</p>
                  <p className="text-[12.5px] text-mist-600">{t("askedBy", { name: item.name })}</p>
                </li>
              ))}
            </ul>
          )}
          <AskQuestion
            productId={targetId}
            strings={{
              ask: t("ask"),
              name: t("yourName"),
              question: t("question"),
              submit: t("askSubmit"),
              thanks: t("askThanks"),
              failed: t("failed"),
            }}
          />
        </section>
      ) : null}
    </div>
  );
}

export { ReviewsSection };
