import { Phone } from "lucide-react";
import type { ContactSettings, MenuItem } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Link } from "@/i18n/navigation";
import { OfficeStatusChip } from "./OfficeStatusChip";

type MorePanelProps = {
  items: MenuItem[];
  contact: ContactSettings;
  labels: { checkingHours: string; call: string };
};

/**
 * Desktop More panel (Home-moremenu board): two columns of icon, title and one line, and a footer strip with the
 * live office status, the hours and the hotline.
 */
function MorePanel({ items, contact, labels }: MorePanelProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <ul className="grid grid-cols-2 gap-1">
        {items
          .filter((item) => item.visible && item.href)
          .map((item, index) => (
            <li
              key={item.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
            >
              <Link
                href={item.href ?? "/"}
                className="group/more flex items-start gap-3 rounded-2xl p-3 transition-colors duration-150 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-mist-200 bg-white text-brand-700 transition-colors duration-150 group-hover/more:border-electric-200 group-hover/more:bg-electric-50">
                  <MenuIcon name={item.icon} className="size-5" />
                </span>
                <span className="flex flex-col gap-0.5 pt-0.5">
                  <span className="text-[15px] font-semibold text-navy-900">{item.label}</span>
                  {item.description ? (
                    <span className="text-[13px] leading-snug text-mist-600">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-mist-50 px-3 py-2.5">
        <OfficeStatusChip hours={contact.officeHours} pendingLabel={labels.checkingHours} />
        <span className="text-[13.5px] text-mist-700">{contact.officeHoursText}</span>
        <a
          href={`tel:${contact.phoneE164}`}
          aria-label={`${labels.call} ${contact.phoneDisplay}`}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-[15px] font-semibold text-brand-700 tabular-nums hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {contact.phoneDisplay}
          <Phone aria-hidden="true" className="size-4" />
        </a>
      </div>
    </div>
  );
}

export { MorePanel };
