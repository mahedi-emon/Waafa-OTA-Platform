import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { CircleCheck } from "@/components/icons/server/CircleCheck";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Payment");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const OUTCOMES = ["paid", "failed", "cancelled", "pending"] as const;
type Outcome = (typeof OUTCOMES)[number];

/**
 * Where the customer lands after the payment gateway (issue 251): paid, failed, cancelled or still being checked.
 * It shows no order details (the address carries only the outcome and the reference); /track has the rest.
 */
export default async function PaymentResultPage({
  searchParams,
}: PageProps<"/[locale]/shop/payment">) {
  const search = await searchParams;
  const outcome: Outcome = OUTCOMES.includes(search.outcome as Outcome)
    ? (search.outcome as Outcome)
    : "pending";
  const order =
    typeof search.order === "string" && /^ORD-\d{6}-\d{4,6}$/.test(search.order)
      ? search.order
      : null;
  const t = await getTranslations("Payment");
  const good = outcome === "paid";
  const Icon = good ? CircleCheck : CircleAlert;
  return (
    <main
      id="main"
      className="site-container flex flex-col items-center gap-5 pt-10 pb-28 text-center md:pt-16"
    >
      <Icon
        aria-hidden="true"
        className={good ? "size-12 text-success-600" : "text-warning-600 size-12"}
      />
      <h1 className="font-display text-[28px] font-extrabold text-navy-900 md:text-[34px]">
        {t(`${outcome}.title`)}
      </h1>
      <p className="max-w-[52ch] text-[16px] text-mist-700">{t(`${outcome}.body`)}</p>
      {order ? (
        <p className="font-display text-[18px] font-bold text-navy-900 tabular-nums">{order}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={order ? `/track?reference=${order}` : "/track"}>{t("track")}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/shop">{t("store")}</Link>
        </Button>
      </div>
    </main>
  );
}
