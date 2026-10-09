import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import type { Category, MenuItem } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Link } from "@/i18n/navigation";

type ShopMegaPanelProps = {
  storeName: string;
  storeIntro: string;
  /** Level-1 categories in admin order. */
  categories: Category[];
  /** The "shop-panel" menu: Printing Solutions, International Trading, Find by model. */
  services: MenuItem[];
  labels: { topCategories: string; services: string; shopAll: string };
};

/**
 * Waafas World menu panel (Home-shopmenu board): the store's own words and "Shop all", the top categories, and the
 * Waafa International services. Text only for the store name: the WAAFA logo stays once, in the header.
 * Items rise in with a 40 ms stagger (CSS, transform and opacity).
 */
function ShopMegaPanel({
  storeName,
  storeIntro,
  categories,
  services,
  labels,
}: ShopMegaPanelProps) {
  const visibleServices = services.filter((service) => service.visible && service.href);
  const lastService = visibleServices.length - 1;

  return (
    <div className="grid grid-cols-[250px_minmax(0,1fr)_252px]">
      <div className="flex flex-col justify-between gap-6 bg-(image:--ribbon-soft) p-6">
        <div className="flex flex-col gap-2.5">
          <p className="font-display text-[22px] leading-tight font-bold tracking-tight text-navy-900">
            {storeName}
          </p>
          <p className="text-[14.5px] leading-relaxed text-mist-700">{storeIntro}</p>
        </div>
        <Link
          href="/shop"
          className="inline-flex h-11 w-max items-center gap-2 rounded-full bg-navy-900 px-5 text-[14.5px] font-semibold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {labels.shopAll}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-3 border-x border-mist-200 p-5">
        <p className="px-2 text-[11px] font-semibold tracking-[0.1em] text-mist-600 uppercase">
          {labels.topCategories}
        </p>
        <ul className="grid grid-cols-2 gap-1">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
            >
              <Link
                href={`/shop/c/${category.slug}`}
                className="group/cat flex items-start gap-3 rounded-2xl p-2.5 transition-colors duration-150 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-mist-200 bg-white text-brand-700 transition-colors duration-150 group-hover/cat:border-electric-200 group-hover/cat:bg-electric-50">
                  <MenuIcon name={category.icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col pt-0.5">
                  <span className="text-[15px] font-semibold text-navy-900">{category.name}</span>
                  {category.description ? (
                    <span className="truncate text-[13px] text-mist-600">
                      {category.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-[0.1em] text-mist-600 uppercase">
          {labels.services}
        </p>
        {visibleServices.map((service, index) => {
          const featured = index === lastService;
          return (
            <Link
              key={service.id}
              href={service.href ?? "/shop"}
              className={cn(
                "group/svc flex gap-3 rounded-2xl p-3 transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40",
                featured
                  ? "bg-navy-900 text-white hover:bg-royal-800"
                  : "border border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-25",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  featured ? "bg-white/10 text-cyan-400" : "bg-electric-50 text-brand-700",
                )}
              >
                <MenuIcon name={service.icon} className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-[14.5px] font-semibold",
                    featured ? "text-white" : "text-navy-900",
                  )}
                >
                  {service.label}
                </span>
                {service.description ? (
                  <span
                    className={cn(
                      "text-[12.5px] leading-snug",
                      featured ? "text-white/75" : "text-mist-600",
                    )}
                  >
                    {service.description}
                  </span>
                ) : null}
                {service.cta ? (
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 text-[13px] font-semibold",
                      featured ? "text-cyan-400" : "text-brand-700",
                    )}
                  >
                    {service.cta}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-150 group-hover/svc:translate-x-0.5"
                    />
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { ShopMegaPanel };
