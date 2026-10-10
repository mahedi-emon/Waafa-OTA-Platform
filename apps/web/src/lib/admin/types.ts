import type { LeadModule, LeadPriority, LeadStatus, OrderStatus, Role } from "@waafa/shared";

/* Shapes the admin API (B4, apps/api/src/admin) answers with. */

export type Paged<T> = { total: number; page: number; pageSize: number; items: T[] };

export type DashboardSummary = {
  generatedAt: string;
  slaMinutes: number;
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

export type LeadList = Paged<LeadRow> & { slaMinutes: number };

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
  firstResponseAt: string | null;
  closedAt: string | null;
  createdAt: string;
  activities: Array<{ id: string; type: string; body: string; actor: string; createdAt: string }>;
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
  next: OrderStatus[];
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
  status: "received" | "verified" | "rejected";
  note: string | null;
  createdAt: string;
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
  }>;
};

export type ContentRecordResponse = {
  id: string;
  position: number;
  version: number;
  updatedAt: string;
  data: unknown;
};
