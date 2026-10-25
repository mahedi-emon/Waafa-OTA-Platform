import type {
  LeadModule,
  LeadPriority,
  LeadStatus,
  OrderStatus,
  Role,
  VisaStage,
} from "@waafa/shared";

/* Shapes the admin API (B4, apps/api/src/admin) answers with. */

export type Paged<T> = { total: number; page: number; pageSize: number; items: T[] };

type WeekPair = { thisWeek: number; lastWeek: number };

export type DashboardSummary = {
  generatedAt: string;
  slaMinutes: number;
  /** When the longest-waiting new lead came in (the New leads card's timer). */
  oldestNewAt: string | null;
  /** The last 14 Dhaka days, today last; orders and revenue only for people who see orders. */
  series: Array<{
    day: string;
    leads: number;
    booked: number;
    bookedValue: number;
    orders?: number;
    revenue?: number;
  }>;
  weeks: {
    leads: WeekPair;
    booked: WeekPair;
    bookedValue: WeekPair;
    orders?: WeekPair;
    revenue?: WeekPair;
  };
  leads: {
    newToday: number;
    open: number;
    overdue: number;
    bookedThisMonth: number;
    byModule: Array<{ module: LeadModule; count: number }>;
    byStatus: Array<{ status: LeadStatus; count: number }>;
  };
  orders: { today: number; open: number; thisMonth: number; revenueThisMonth: number };
  feedbackPending: number;
  proofsPending: number;
  topRoutes: Array<{ module: string; summary: string; count: number }>;
  activity: Array<{
    id: string;
    leadId: string;
    reference: string;
    type: string;
    body: string;
    actor: string;
    createdAt: string;
  }>;
};

export type LeadRow = {
  id: string;
  reference: string;
  module: LeadModule;
  status: LeadStatus;
  priority: LeadPriority;
  name: string;
  phone: string;
  email: string | null;
  summary: string;
  travelDate: string | null;
  travellers: number | null;
  assignee: { id: string; name: string } | null;
  source: string;
  duplicateOf: string | null;
  createdAt: string;
  ageMinutes: number;
  overdue: boolean;
};

export type LeadList = Paged<LeadRow> & {
  slaMinutes: number;
  /** Open leads per module this person works on: the module tabs (D0 R6). */
  modules: Array<{ module: LeadModule; open: number }>;
};

/** One visa application in the list (D0 R6): a visa lead with the stage its checklist gives. */
export type VisaApplicationRow = {
  id: string;
  reference: string;
  status: LeadStatus;
  name: string;
  phone: string;
  summary: string;
  country: string | null;
  travelDate: string | null;
  assignee: { id: string; name: string } | null;
  stage: VisaStage;
  received: number;
  required: number;
  submittedOn: string | null;
  createdAt: string;
  ageMinutes: number;
  overdue: boolean;
};

export type VisaApplicationList = Paged<VisaApplicationRow> & {
  slaMinutes: number;
  /** How many applications sit at each stage (the stage chips). */
  stages: Record<VisaStage, number>;
};

export type LeadDetail = {
  id: string;
  reference: string;
  module: LeadModule;
  status: LeadStatus;
  priority: LeadPriority;
  contact: {
    name: string;
    phone: string;
    email?: string;
    preferredContact?: string;
    bestTime?: string;
  };
  payload: Record<string, unknown>;
  source: { channel?: string; page?: string; utm?: Record<string, string> };
  summary: string;
  travelDate: string | null;
  travellers: number | null;
  amount: number | null;
  reason: string | null;
  assignee: { id: string; name: string } | null;
  duplicateOf: { id: string; reference: string } | null;
  repeats: Array<{ id: string; reference: string }>;
  /** The reply target in minutes, and whether this new lead is past it (D0 R4). */
  slaMinutes: number;
  overdue: boolean;
  /** Visa leads: the documents checklist and the stage it gives (D0 R4, ADMIN.md §8.3). */
  visa: VisaApplicationProgress | null;
  /** Other requests and orders from the same phone (D0 R6); orders null when this role does not see them. */
  customer: {
    phone: string;
    leadCount: number;
    leads: Array<{
      id: string;
      reference: string;
      module: LeadModule;
      status: LeadStatus;
      summary: string;
      createdAt: string;
    }>;
    orderCount: number;
    orders: Array<{
      id: string;
      reference: string;
      status: OrderStatus;
      total: number;
      createdAt: string;
    }> | null;
  };
  firstResponseAt: string | null;
  closedAt: string | null;
  createdAt: string;
  activities: Array<{ id: string; type: string; body: string; actor: string; createdAt: string }>;
};

export type VisaApplicationProgress = {
  stage: VisaStage;
  received: number;
  required: number;
  checklist: Array<{ item: string; received: boolean }>;
  submittedOn?: string;
  submissionReference?: string;
  outcome?: "approved" | "rejected";
  decidedOn?: string;
  passportReturnedOn?: string;
};

export type StaffDirectoryEntry = { id: string; name: string; roles: Role[] };

export type OrderRow = {
  id: string;
  reference: string;
  status: OrderStatus;
  name: string;
  phone: string;
  total: number;
  items: number;
  payment: "cod" | "offline";
  paymentVerified: boolean;
  pickup: boolean;
  createdAt: string;
};

export type OrderDetail = {
  id: string;
  reference: string;
  status: OrderStatus;
  /** Cash on delivery is confirmed on the phone; other methods by a verified payment proof (D0 R4). */
  cashOnDelivery: boolean;
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    variantLabel?: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string | null;
  payment: { method: "cod" } | { method: "offline"; accountId: string; transactionId: string };
  paymentVerified: boolean;
  address: {
    name: string;
    phone: string;
    email?: string;
    division: string;
    district: string;
    area: string;
    street: string;
    note?: string;
  };
  pickup: boolean;
  invoice: { companyName: string; bin: string } | null;
  createdAt: string;
  history: Array<{
    status: string;
    note: string | null;
    courier: string | null;
    trackingNumber: string | null;
    actor: string | null;
    at: string;
  }>;
  proofs: Array<{
    id: string;
    amount: number;
    accountId: string;
    transactionId: string | null;
    status: string;
    createdAt: string;
  }>;
};

export type FeedbackRow = {
  id: string;
  name: string;
  phone: string;
  service: string;
  reference: string | null;
  rating: number | null;
  comment: string;
  photo: { fileName?: string } | null;
  consentToPublish: boolean;
  status: "pending" | "approved" | "rejected";
  moderatedBy: string | null;
  moderatedAt: string | null;
  createdAt: string;
};

export type ProofRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  amount: number;
  accountId: string;
  transactionId: string | null;
  proof: { fileName?: string } | null;
  status: "received" | "matched" | "verified" | "rejected";
  note: string | null;
  /** The order the reference names (D0 R4): matched when the amount covers its total. */
  order: { id: string; reference: string; total: number; status: OrderStatus } | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
};

/** A record in Trash (D0 R4). */
export type TrashRow = {
  id: string;
  collection: string;
  title: string;
  deletedAt: string;
  deletedBy: string;
  purgeAt: string;
};

export type SearchActivity = Paged<{
  id: string;
  module: string;
  summary: string;
  params: Record<string, unknown>;
  device: string | null;
  source: string | null;
  converted: boolean;
  createdAt: string;
}> & {
  leads: number;
  searchToLeadRate: number;
  topRoutes: Array<{ module: string; summary: string; count: number }>;
};

export type SubscriberRow = { id: string; email: string; source: string | null; createdAt: string };

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  at: string;
};

export type NotificationRow = {
  id: string;
  channel: string;
  recipient: string;
  template: string;
  subject: string;
  status: string;
  error: string | null;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
};

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: "active" | "deactivated" | "invited";
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** An invite email still waiting to be used (D0 R9); expired ones can be sent again. */
  invite: { expiresAt: string | null; expired: boolean } | null;
};

export type ContentOverviewItem = {
  key: string;
  kind: "singleton" | "collection";
  group: "settings" | "home" | "content" | "travel" | "visa" | "shop";
  idField?: string;
  titleField?: string;
  count?: number;
};

export type ContentSingleton = {
  key: string;
  kind: "singleton";
  value: unknown;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
};

export type ContentCollection = {
  key: string;
  kind: "collection";
  idField: string;
  titleField: string;
  items: Array<{
    id: string;
    title: string;
    position: number;
    version: number;
    updatedAt: string;
    updatedBy: string | null;
    data: unknown;
    /** Coupons: orders that used the code, cancelled ones not counted (D0 R4). */
    uses?: number;
  }>;
};

/** One page of a list's records, searched, filtered and sorted by the API (the DataTable, D0 R5). */
export type ContentRecordsPage = {
  key: string;
  total: number;
  page: number;
  pageSize: number;
  items: ContentCollection["items"];
};

export type ContentRecordResponse = {
  id: string;
  position: number;
  version: number;
  updatedAt: string;
  updatedBy?: string | null;
  data: unknown;
  /** The first staff save of a Sample record made it the team's own (D0 R4); the editor offers Undo. */
  sampleCleared?: boolean;
};
