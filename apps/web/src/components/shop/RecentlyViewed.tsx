"use client";

import { formatTaka } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Link } from "@/i18n/navigation";
import { useRecentlyViewed } from "./useRecentlyViewed";

type RecentlyViewedProps = {
  title: string;
  clearLabel: string;
  /** Leave out the product being viewed. */
  exclude?: string;
};

/** Recently viewed row (Shop, ShopProduct): this browser's history, hidden while empty. */
function RecentlyViewed({ title, clearLabel, exclude }: RecentlyViewedProps) {
  const { items, clear } = useRecentlyViewed();
  const shown = items.filter((item) => item.slug !== exclude).slice(0, 8);
  if (shown.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recently-viewed" className="font-display text-[22px] font-bold text-navy-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={clear}
          className="min-h-11 cursor-pointer rounded-full px-3 text-[14px] font-semibold text-brand-700 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {clearLabel}
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {shown.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/shop/p/${item.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {item.image ? (
                <SmartImage
                  src={item.image.src}
                  alt={item.image.alt}
                  ratio="1/1"
                  sizes="(min-width: 1024px) 180px, 45vw"
                  frameClassName="bg-mist-50"
                  className="object-contain p-3"
                />
              ) : null}
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="text-[12px] font-semibold text-mist-600">{item.brand}</span>
                <span className="line-clamp-2 text-[13.5px] font-semibold text-ink-900">
                  {item.title}
                </span>
                <span className="mt-auto pt-1 font-display text-[15px] font-extrabold text-navy-900 tabular-nums">
                  {formatTaka(item.price)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { RecentlyViewed };
