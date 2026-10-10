import { ArrowRight, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type EmptyCartProps = {
  storeName: string;
  categories: Array<{ slug: string; name: string }>;
};

/** Empty cart (ShopCart-empty): one line, category shortcuts and a way back to the store. */
function EmptyCart({ storeName, categories }: EmptyCartProps) {
  const t = useTranslations("Cart.empty");
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-mist-200 bg-white px-5 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-electric-50 text-brand-700">
        <ShoppingCart aria-hidden="true" className="size-7" />
      </span>
      <h2 className="font-display text-[22px] font-extrabold text-navy-900">{t("title")}</h2>
      <p className="max-w-[40ch] text-[15px] text-mist-700">{t("lead")}</p>
      {categories.length > 0 ? (
        <ul className="flex max-w-[60ch] flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop/c/${category.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-mist-200 bg-white px-4 text-[14px] font-medium text-ink-900 hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Button asChild>
        <Link href="/shop">
          {t("browse", { store: storeName })}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

export { EmptyCart };
