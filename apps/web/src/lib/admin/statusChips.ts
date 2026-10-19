import {
  Archive,
  BadgeCheck,
  Ban,
  CalendarX,
  CircleCheck,
  CircleDot,
  CircleX,
  Clock,
  FileText,
  Hourglass,
  Inbox,
  LockKeyhole,
  PackageCheck,
  PackageOpen,
  Pencil,
  PhoneCall,
  Radio,
  ShieldAlert,
  Truck,
  Undo2,
  UserCheck,
  UserMinus,
  type LucideIcon,
} from "lucide-react";
import type { LeadStatus, OrderStatus } from "@waafa/shared";

/** Status families (ADMIN.md §4.1, D185): colour is never the only signal; every chip also has an icon and a word. */
export type ChipTone = "info" | "progress" | "success" | "warning" | "danger" | "neutral";
export type ChipSpec = { tone: ChipTone; icon: LucideIcon };

export const LEAD_CHIPS: Record<LeadStatus, ChipSpec> = {
  new: { tone: "info", icon: CircleDot },
  "in-progress": { tone: "progress", icon: PhoneCall },
  quoted: { tone: "progress", icon: FileText },
  pending: { tone: "warning", icon: Hourglass },
  booked: { tone: "success", icon: BadgeCheck },
  lost: { tone: "neutral", icon: CircleX },
  cancelled: { tone: "neutral", icon: Ban },
  spam: { tone: "danger", icon: ShieldAlert },
};

/** A new lead past the reply target: an overlay on top of its status. */
export const OVERDUE_CHIP: ChipSpec = { tone: "danger", icon: Clock };

export const ORDER_CHIPS: Record<OrderStatus, ChipSpec> = {
  placed: { tone: "info", icon: Inbox },
  confirmed: { tone: "success", icon: CircleCheck },
  processing: { tone: "progress", icon: PackageOpen },
  shipped: { tone: "progress", icon: Truck },
  delivered: { tone: "success", icon: PackageCheck },
  cancelled: { tone: "neutral", icon: Ban },
  returned: { tone: "warning", icon: Undo2 },
};

export const PROOF_CHIPS = {
  received: { tone: "warning", icon: Hourglass },
  verified: { tone: "success", icon: BadgeCheck },
  rejected: { tone: "danger", icon: CircleX },
} satisfies Record<string, ChipSpec>;

export const FEEDBACK_CHIPS = {
  pending: { tone: "warning", icon: Hourglass },
  approved: { tone: "success", icon: CircleCheck },
  rejected: { tone: "neutral", icon: CircleX },
} satisfies Record<string, ChipSpec>;

/** Content lifecycle (R4 adds Scheduled and Expired from dates). */
export const CONTENT_CHIPS = {
  draft: { tone: "neutral", icon: Pencil },
  scheduled: { tone: "info", icon: Clock },
  live: { tone: "success", icon: Radio },
  expired: { tone: "warning", icon: CalendarX },
  archived: { tone: "neutral", icon: Archive },
} satisfies Record<string, ChipSpec>;

export const USER_CHIPS = {
  active: { tone: "success", icon: UserCheck },
  invited: { tone: "info", icon: Clock },
  disabled: { tone: "neutral", icon: UserMinus },
  locked: { tone: "danger", icon: LockKeyhole },
} satisfies Record<string, ChipSpec>;
