import {
  Bell,
  FileText,
  FolderTree,
  Globe,
  House,
  IdCard,
  Image,
  Images,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutList,
  ChartLine,
  Mail,
  Map,
  MessageSquareQuote,
  Package,
  PlaneTakeoff,
  Receipt,
  Rows3,
  ScrollText,
  Settings,
  ShoppingBag,
  TicketPercent,
  ToggleRight,
  UserCog,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AdminIconName } from "@/lib/admin/navigation";

const ICONS: Record<AdminIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  leads: Inbox,
  search: ChartLine,
  fares: PlaneTakeoff,
  packages: Map,
  visa: Globe,
  passport: IdCard,
  orders: ShoppingBag,
  proofs: Receipt,
  products: Package,
  categories: FolderTree,
  collections: Layers,
  coupons: TicketPercent,
  home: House,
  team: UsersRound,
  gallery: Images,
  feedback: MessageSquareQuote,
  pages: FileText,
  media: Image,
  content: LayoutList,
  modes: ToggleRight,
  footer: Rows3,
  payments: Wallet,
  notifications: Bell,
  users: UserCog,
  general: Settings,
  newsletter: Mail,
  audit: ScrollText,
};

type AdminNavIconProps = { name: AdminIconName; className?: string };

/** The lucide icon for an admin navigation item (AdminSide board). */
function AdminNavIcon({ name, className }: AdminNavIconProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" className={className ?? "size-[18px] shrink-0"} />;
}

export { AdminNavIcon };
