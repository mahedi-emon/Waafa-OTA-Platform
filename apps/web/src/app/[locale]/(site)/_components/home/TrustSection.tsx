import { getTranslations } from "next-intl/server";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { listTrustItems } from "@/lib/data/content";

/** Trust strip under the hero (FR-HOME 2): four admin items, one line each. */
async function TrustSection() {
  const [items, t] = await Promise.all([listTrustItems(), getTranslations("Home.sectionLabels")]);
  if (items.length === 0) return null;

  return (
    <section aria-label={t("trust")} className="site-container pt-10 md:pt-14">
      <ul className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700">
              <MenuIcon name={item.icon} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-navy-900">{item.title}</span>
              <span className="block text-[13.5px] leading-snug text-mist-600">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { TrustSection };
