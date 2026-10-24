/** One menu item as stored (MenuItemSchema). */
export type MenuItemValue = {
  id: string;
  label: string;
  href?: string;
  description?: string;
  icon?: string;
  panel?: "shop" | "more";
  cta?: string;
  visible: boolean;
};

/** One menu as the builder shows it (D0 R7). */
export type ManagedMenu = {
  key: string;
  name: string;
  /** Where it shows on the site. */
  lead: string;
  version: number;
  data: Record<string, unknown>;
  items: MenuItemValue[];
  /** The tab bar keeps exactly five tabs, all on show: no adding, removing or hiding. */
  fixedCount: boolean;
  /** The parts this menu's items use besides the label and link. */
  fields: { description: boolean; icon: boolean; cta: boolean };
};
