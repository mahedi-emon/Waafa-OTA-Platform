import {
  Building2,
  Clock,
  Construction,
  FileClock,
  LayoutList,
  Mail,
  PlugZap,
  Search,
  ShieldCheck,
  ToggleRight,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import {
  sectionHref,
  type SettingsSection,
  type SettingsSectionId,
} from "@/lib/admin/settingsSections";

const ICONS: Record<SettingsSectionId, LucideIcon> = {
  business: Building2,
  hours: Clock,
  modes: ToggleRight,
  payments: Wallet,
  forms: Mail,
  seo: TrendingUp,
  search: Search,
  integrations: PlugZap,
  users: ShieldCheck,
  audit: FileClock,
  maintenance: Construction,
  advanced: LayoutList,
};

type SettingsNavProps = {
  sections: readonly SettingsSection[];
  current?: SettingsSectionId;
  label: string;
  titles: Record<SettingsSectionId, string>;
  /** "rail": the frame's left column; "list": the settings home on phones, with each section's line. */
  variant?: "rail" | "list";
  lines?: Partial<Record<SettingsSectionId, string>>;
};

/** The settings sub-navigation (ADMIN.md §5.6): one entry per section this person may open. */
function SettingsNav({
  sections,
  current,
  label,
  titles,
  variant = "rail",
  lines = {},
}: SettingsNavProps) {
  return (
    <nav aria-label={label}>
      <ul className={cn("flex flex-col", variant === "rail" ? "gap-0.5" : "gap-2")}>
        {sections.map((section) => {
          const Icon = ICONS[section.id];
          const active = section.id === current;
          return (
            <li key={section.id}>
              <Link
                href={sectionHref(section)}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-navy-900 transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
                  variant === "rail"
                    ? "min-h-11 px-3 text-[14.5px] hover:bg-white"
                    : "min-h-16 border border-mist-200 bg-white px-4 py-3 hover:border-electric-200",
                  active && "bg-white font-semibold shadow-xs ring-1 ring-mist-200",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-[18px] shrink-0",
                    active ? "text-brand-700" : "text-mist-500",
                  )}
                />
                <span className="flex min-w-0 flex-col">
                  <span className={variant === "list" ? "font-semibold" : undefined}>
                    {titles[section.id]}
                  </span>
                  {variant === "list" && lines[section.id] ? (
                    <span className="text-[13.5px] leading-snug text-mist-600">
                      {lines[section.id]}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { SettingsNav };
