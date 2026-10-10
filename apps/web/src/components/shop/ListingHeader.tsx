import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type ListingHeaderProps = {
  crumbs: Array<{ label: string; href?: string }>;
  title: string;
  lead?: string;
  children?: ReactNode;
};

/** Listing heading (ShopList): breadcrumbs, one h1, a lead line and optional chips or strips below. */
function ListingHeader({ crumbs, title, lead, children }: ListingHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <Breadcrumbs items={crumbs} />
      <h1 className="font-display text-[28px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[38px]">
        {title}
      </h1>
      {lead ? (
        <p className="max-w-[68ch] text-[15.5px] leading-relaxed text-mist-700">{lead}</p>
      ) : null}
      {children}
    </header>
  );
}

export { ListingHeader };
