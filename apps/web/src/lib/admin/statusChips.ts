import {
  Archive,
  BadgeCheck,
  Ban,
  BookCheck,
  CalendarX,
  ClipboardCheck,
  CircleCheck,
  CircleDot,
  CircleX,
  Eye,
  EyeOff,
  Clock,
  FileClock,
  FileText,
  Hourglass,
  Inbox,
  Link2,
  LockKeyhole,
  PackageCheck,
  PackageOpen,
  PackageX,
  Pencil,
  PhoneCall,
  Plane,
  Radio,
  Send,
  ShieldAlert,
  Truck,
  Undo2,
  UserCheck,
  UserMinus,
  type LucideIcon,
} from "lucide-react";
import type { LeadStatus, OrderStatus, VisaStage } from "@waafa/shared";
import type { RecordChipName } from "@waafa/shared/workflow/chips";

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
  /** The reference and amount match an order (D0 R4): ready to verify. */
  matched: { tone: "info", icon: Link2 },
  verified: { tone: "success", icon: BadgeCheck },
  rejected: { tone: "danger", icon: CircleX },
} satisfies Record<string, ChipSpec>;

export const FEEDBACK_CHIPS = {
  pending: { tone: "warning", icon: Hourglass },
  approved: { tone: "success", icon: CircleCheck },
  rejected: { tone: "neutral", icon: CircleX },
  /** Private feedback: it can be read and answered, never published. */
  noConsent: { tone: "warning", icon: EyeOff },
} satisfies Record<string, ChipSpec>;

/** Content lifecycle (R4 adds Scheduled and Expired from dates). */
export const CONTENT_CHIPS = {
  draft: { tone: "neutral", icon: Pencil },
  scheduled: { tone: "info", icon: Clock },
  live: { tone: "success", icon: Radio },
  expired: { tone: "warning", icon: CalendarX },
  archived: { tone: "neutral", icon: Archive },
} satisfies Record<string, ChipSpec>;

/** List chips (D0 R4): from a record's status, dates, limits, seats or stock; see lib/admin/recordChips.ts. */
export const RECORD_CHIPS = {
  draft: { tone: "neutral", icon: Pencil },
  scheduled: { tone: "info", icon: Clock },
  live: { tone: "success", icon: Radio },
  expired: { tone: "warning", icon: CalendarX },
  archived: { tone: "neutral", icon: Archive },
  off: { tone: "neutral", icon: EyeOff },
  ended: { tone: "neutral", icon: CalendarX },
  active: { tone: "success", icon: CircleCheck },
  usedUp: { tone: "warning", icon: Ban },
  open: { tone: "success", icon: Plane },
  fewSeats: { tone: "warning", icon: Hourglass },
  endingSoon: { tone: "warning", icon: Hourglass },
  soldOut: { tone: "danger", icon: Ban },
  inStock: { tone: "success", icon: PackageCheck },
  lowStock: { tone: "warning", icon: PackageOpen },
  outOfStock: { tone: "danger", icon: PackageX },
  shown: { tone: "success", icon: Eye },
  hidden: { tone: "neutral", icon: EyeOff },
} satisfies Record<RecordChipName, ChipSpec>;

export const USER_CHIPS = {
  active: { tone: "success", icon: UserCheck },
  invited: { tone: "info", icon: Clock },
  disabled: { tone: "neutral", icon: UserMinus },
  locked: { tone: "danger", icon: LockKeyhole },
} satisfies Record<string, ChipSpec>;

/** Visa applications by checklist stage (ADMIN.md §8.3, D0 R6). */
export const VISA_CHIPS = {
  documentsPending: { tone: "warning", icon: FileClock },
  readyToSubmit: { tone: "info", icon: ClipboardCheck },
  submitted: { tone: "progress", icon: Send },
  approved: { tone: "success", icon: BadgeCheck },
  rejected: { tone: "danger", icon: CircleX },
  passportReturned: { tone: "success", icon: BookCheck },
  cancelled: { tone: "neutral", icon: Ban },
} satisfies Record<VisaStage, ChipSpec>;
