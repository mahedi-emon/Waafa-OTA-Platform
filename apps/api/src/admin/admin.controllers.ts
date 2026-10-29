import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import {
  AdminSearchQuerySchema,
  AuditListQuerySchema,
  ContentBulkInputSchema,
  ContentImportInputSchema,
  CsvImportKeySchema,
  ContentListQuerySchema,
  ContentMoveInputSchema,
  ContentOptionsQuerySchema,
  ContentOrderInputSchema,
  ContentRestoreInputSchema,
  ContentWriteInputSchema,
  FeedbackListQuerySchema,
  FeedbackModerationInputSchema,
  LeadBulkInputSchema,
  LeadDraftActionSchema,
  LeadDraftListQuerySchema,
  LeadListQuerySchema,
  VisaApplicationListQuerySchema,
  LeadNoteInputSchema,
  LeadActionInputSchema,
  LeadUpdateInputSchema,
  MediaIdSchema,
  MediaReplaceInputSchema,
  OrderListQuerySchema,
  OrderActionInputSchema,
  OrderUpdateInputSchema,
  RefundRecordInputSchema,
  NotificationListQuerySchema,
  SubscriberListQuerySchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofListQuerySchema,
  PaymentProofActionInputSchema,
  SearchLogListQuerySchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
  TrashListQuerySchema,
  VisaProgressInputSchema,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import { TwoStepService } from "../auth/twoStep.service";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { AdminContentService } from "./content-admin.service";
import { AdminDashboardService } from "./dashboard.service";
import { AdminInboxService } from "./inbox.service";
import { AdminLeadsService } from "./leads.service";
import { MediaReplaceService } from "./media-replace.service";
import { ContentImportService } from "./contentImport.service";
import { LeadDraftsService } from "./leadDrafts.service";
import { AdminOrdersService } from "./orders.service";
import { AdminUsersService } from "./users.service";
import { AdminWorkbenchService } from "./workbench.service";

/** Excel reads UTF-8 CSV (taka sign, Bangla names) only with a byte order mark. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const ID = /^[\w-]{1,160}$/;
const id = (value: string) => {
  if (!ID.test(value)) throw problems.notFound();
  return value;
};

/** Leads (FR-ADM-LEAD). Every role with lead access sees the modules it works on. */
@Controller("admin/leads")
@UseGuards(StaffGuard)
@Roles("admin", "travel-sales", "visa-officer", "shop-manager")
export class AdminLeadsController {
  constructor(
    @Inject(AdminLeadsService) private readonly leads: AdminLeadsService,
    @Inject(LeadDraftsService) private readonly drafts: LeadDraftsService,
  ) {}

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.leads.list(staff, parseInput(LeadListQuerySchema, query));
  }

  @Get("export.csv")
  async csv(@Staff() staff: StaffPrincipal, @Query() query: unknown, @Res() reply: FastifyReply) {
    const body = await this.leads.csv(staff, parseInput(LeadListQuerySchema, query));
    return reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", 'attachment; filename="leads.csv"')
      .send(`${BYTE_ORDER_MARK}${body}`);
  }

  @Post("bulk")
  @HttpCode(200)
  bulk(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.leads.bulk(staff, parseInput(LeadBulkInputSchema, body));
  }

  /** Incomplete requests: step 1 done, never sent (FR-FLT-08, issue 250). */
  @Get("incomplete")
  incomplete(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.drafts.list(staff, parseInput(LeadDraftListQuerySchema, query));
  }

  @Post("incomplete/:id/actions")
  @HttpCode(200)
  incompleteAction(
    @Staff() staff: StaffPrincipal,
    @Param("id") draftId: string,
    @Body() body: unknown,
  ) {
    return this.drafts.act(staff, id(draftId), parseInput(LeadDraftActionSchema, body));
  }

  @Get(":id")
  detail(@Staff() staff: StaffPrincipal, @Param("id") leadId: string) {
    return this.leads.detail(staff, id(leadId));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.update(staff, id(leadId), parseInput(LeadUpdateInputSchema, body));
  }

  /** One step (contact, quote, convert, close…): the status follows (D0 R4). */
  @Post(":id/actions")
  @HttpCode(200)
  act(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.act(staff, id(leadId), parseInput(LeadActionInputSchema, body));
  }

  /** A visa application's checklist, submission and outcome (D0 R4). */
  @Post(":id/visa")
  @HttpCode(200)
  visa(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.visa(staff, id(leadId), parseInput(VisaProgressInputSchema, body));
  }

  @Post(":id/activities")
  @HttpCode(201)
  note(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.addNote(staff, id(leadId), parseInput(LeadNoteInputSchema, body));
  }
}

/** Visa applications (D0 R6): visa leads by checklist stage, for the people who work on visas. */
@Controller("admin/visa-applications")
@UseGuards(StaffGuard)
@Roles("admin", "visa-officer")
export class AdminVisaApplicationsController {
  constructor(@Inject(AdminLeadsService) private readonly leads: AdminLeadsService) {}

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.leads.visaApplications(staff, parseInput(VisaApplicationListQuerySchema, query));
  }
}

const sendOrderPdf = (reply: FastifyReply, file: { name: string; pdf: Buffer }) =>
  reply
    .header("content-type", "application/pdf")
    .header("content-disposition", `inline; filename="${file.name}"`)
    .header("cache-control", "private, no-store")
    .header("x-content-type-options", "nosniff")
    .send(file.pdf);

/** Waafa’s World orders (FR-SHOP-09). Accounts verifies payments. */
@Controller("admin/orders")
@UseGuards(StaffGuard)
@Roles("admin", "shop-manager", "accounts")
export class AdminOrdersController {
  constructor(@Inject(AdminOrdersService) private readonly orders: AdminOrdersService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.orders.list(parseInput(OrderListQuerySchema, query));
  }

  @Get(":id")
  detail(@Param("id") orderId: string) {
    return this.orders.detail(id(orderId));
  }

  /** The invoice PDF (issue 248): the team and Accounts. */
  @Get(":id/invoice")
  async invoice(@Param("id") orderId: string, @Res() reply: FastifyReply) {
    return sendOrderPdf(reply, await this.orders.document(id(orderId), "invoice"));
  }

  /** A refund made in the gateway's or bank's panel, written on the order (issue 251). */
  @Post(":id/refunds")
  @HttpCode(200)
  @Roles("admin", "accounts")
  refund(@Staff() staff: StaffPrincipal, @Param("id") orderId: string, @Body() body: unknown) {
    return this.orders.recordRefund(staff, id(orderId), parseInput(RefundRecordInputSchema, body));
  }

  /** The packing slip PDF (issue 248): the people who pack. */
  @Get(":id/packing-slip")
  @Roles("admin", "shop-manager")
  async packingSlip(@Param("id") orderId: string, @Res() reply: FastifyReply) {
    return sendOrderPdf(reply, await this.orders.document(id(orderId), "packing-slip"));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") orderId: string, @Body() body: unknown) {
    return this.orders.update(staff, id(orderId), parseInput(OrderUpdateInputSchema, body));
  }

  /** One step (confirm, pack, ship, deliver, cancel, return): the status follows (D0 R4). */
  @Post(":id/actions")
  @HttpCode(200)
  @Roles("admin", "shop-manager")
  act(@Staff() staff: StaffPrincipal, @Param("id") orderId: string, @Body() body: unknown) {
    return this.orders.act(staff, id(orderId), parseInput(OrderActionInputSchema, body));
  }
}

/** Feedback moderation (Content Editor). */
@Controller("admin/feedback")
@UseGuards(StaffGuard)
@Roles("admin", "content-editor")
export class AdminFeedbackController {
  constructor(@Inject(AdminInboxService) private readonly inbox: AdminInboxService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.inbox.feedback(parseInput(FeedbackListQuerySchema, query));
  }

  @Patch(":id")
  moderate(@Staff() staff: StaffPrincipal, @Param("id") feedbackId: string, @Body() body: unknown) {
    return this.inbox.moderateFeedback(
      staff,
      id(feedbackId),
      parseInput(FeedbackModerationInputSchema, body),
    );
  }
}

/** Offline payment proofs (Accounts). */
@Controller("admin/payment-proofs")
@UseGuards(StaffGuard)
@Roles("admin", "accounts", "shop-manager")
export class AdminPaymentProofsController {
  constructor(@Inject(AdminInboxService) private readonly inbox: AdminInboxService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.inbox.proofs(parseInput(PaymentProofListQuerySchema, query));
  }

  /** Verify (the order becomes paid and confirmed) or Reject with a reason (D0 R4). */
  @Post(":id/actions")
  @HttpCode(200)
  @Roles("admin", "accounts")
  act(@Staff() staff: StaffPrincipal, @Param("id") proofId: string, @Body() body: unknown) {
    return this.inbox.actOnProof(
      staff,
      id(proofId),
      parseInput(PaymentProofActionInputSchema, body),
    );
  }
}

/** Search activity, newsletter subscribers and the email log. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminActivityController {
  constructor(@Inject(AdminInboxService) private readonly inbox: AdminInboxService) {}

  @Get("search-logs")
  @Roles("admin", "travel-sales")
  searchLogs(@Query() query: unknown) {
    return this.inbox.searchLogs(parseInput(SearchLogListQuerySchema, query));
  }

  @Get("subscribers")
  @Roles("admin", "content-editor")
  subscribers(@Query() query: unknown) {
    return this.inbox.subscribers(parseInput(SubscriberListQuerySchema, query));
  }

  @Delete("subscribers/:id")
  @Roles("admin", "content-editor")
  @HttpCode(204)
  async unsubscribe(@Staff() staff: StaffPrincipal, @Param("id") subscriberId: string) {
    await this.inbox.unsubscribe(staff, id(subscriberId));
  }

  @Get("notifications")
  @Roles("admin")
  notifications(@Query() query: unknown) {
    return this.inbox.notifications(parseInput(NotificationListQuerySchema, query));
  }
}

/** Every content collection and settings key (CONTENT_MODEL), by role. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminContentController {
  constructor(
    @Inject(AdminContentService) private readonly content: AdminContentService,
    @Inject(ContentImportService) private readonly imports: ContentImportService,
  ) {}

  @Get("content")
  overview(@Staff() staff: StaffPrincipal) {
    return this.content.overview(staff);
  }

  @Get("content/:key")
  read(@Staff() staff: StaffPrincipal, @Param("key") key: string) {
    return this.content.read(staff, this.content.key(key));
  }

  @Post("content/:key")
  @HttpCode(201)
  create(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentWriteInputSchema, body);
    return this.content.create(staff, this.content.collectionKey(key), input.data, {
      ...(input.action ? { button: input.action } : {}),
    });
  }

  /** The list as a CSV file, the template for an import (issue 248). */
  @Get("content/:key/export.csv")
  async exportCsv(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Res() reply: FastifyReply,
  ) {
    const list = parseInput(CsvImportKeySchema, key);
    const body = await this.imports.exportCsv(staff, list);
    return reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="${list}.csv"`)
      .header("cache-control", "private, no-store")
      .send(`${BYTE_ORDER_MARK}${body}`);
  }

  /** What importing a CSV file would do, line by line; nothing is saved (issue 248). */
  @Post("content/:key/import/preview")
  @HttpCode(200)
  previewImport(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    return this.imports.preview(
      staff,
      parseInput(CsvImportKeySchema, key),
      parseInput(ContentImportInputSchema, body).csv,
    );
  }

  /** Import a CSV file: every line or none (issue 248). */
  @Post("content/:key/import")
  @HttpCode(200)
  applyImport(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    return this.imports.apply(
      staff,
      parseInput(CsvImportKeySchema, key),
      parseInput(ContentImportInputSchema, body).csv,
    );
  }

  /** One page of a list: search, chip, sort (D0 R5). */
  @Get("content/:key/records")
  records(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Query() query: unknown) {
    return this.content.records(
      staff,
      this.content.collectionKey(key),
      parseInput(ContentListQuerySchema, query),
    );
  }

  /** Publish, unpublish, archive or move to Trash several records (D0 R5). */
  @Post("content/:key/bulk")
  @HttpCode(200)
  bulk(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    return this.content.bulk(
      staff,
      this.content.collectionKey(key),
      parseInput(ContentBulkInputSchema, body),
    );
  }

  /** One record a place earlier or later (D0 R5). */
  @Post("content/:key/:id/move")
  @HttpCode(200)
  move(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
    @Body() body: unknown,
  ) {
    const input = parseInput(ContentMoveInputSchema, body);
    return this.content.move(staff, this.content.collectionKey(key), id(recordId), input.by);
  }

  @Put("content/:key/order")
  reorder(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentOrderInputSchema, body);
    return this.content.reorder(staff, this.content.collectionKey(key), input.ids);
  }

  /** Reference pickers: lists other editors pick from are open to any staff member; the rest need edit access. */
  @Get("content/:key/options")
  options(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Query() query: unknown) {
    const input = parseInput(ContentOptionsQuerySchema, query);
    return this.content.options(staff, this.content.collectionKey(key), input.q);
  }

  @Get("content/:key/:id/history")
  history(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
  ) {
    return this.content.history(staff, this.content.collectionKey(key), id(recordId));
  }

  @Post("content/:key/:id/restore")
  @HttpCode(200)
  restore(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
    @Body() body: unknown,
  ) {
    const input = parseInput(ContentRestoreInputSchema, body);
    return this.content.restore(
      staff,
      this.content.collectionKey(key),
      id(recordId),
      input.auditId,
      input.version,
      input.side,
    );
  }

  @Post("content/:key/:id/duplicate")
  @HttpCode(201)
  duplicate(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
  ) {
    return this.content.duplicate(staff, this.content.collectionKey(key), id(recordId));
  }

  @Get("content/:key/:id")
  readOne(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
  ) {
    return this.content.readOne(staff, this.content.collectionKey(key), id(recordId));
  }

  @Put("content/:key/:id")
  update(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
    @Body() body: unknown,
  ) {
    const input = parseInput(ContentWriteInputSchema, body);
    return this.content.update(
      staff,
      this.content.collectionKey(key),
      id(recordId),
      input.data,
      input.version,
      {
        ...(input.action ? { button: input.action } : {}),
        ...(input.keepSample ? { keepSample: true } : {}),
      },
    );
  }

  /** Moves the record to Trash (D0 R4); the answer names the Trash item, so the toast can undo it. */
  @Delete("content/:key/:id")
  @HttpCode(200)
  remove(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Param("id") recordId: string) {
    return this.content.remove(staff, this.content.collectionKey(key), id(recordId));
  }

  @Get("trash")
  trash(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.content.trash(staff, parseInput(TrashListQuerySchema, query));
  }

  @Post("trash/:id/restore")
  @HttpCode(200)
  untrash(@Staff() staff: StaffPrincipal, @Param("id") trashId: string) {
    return this.content.untrash(staff, id(trashId));
  }

  /** Delete forever: Super Admin only (ADMIN.md §9). */
  @Delete("trash/:id")
  @HttpCode(204)
  @Roles("super-admin")
  async purge(@Staff() staff: StaffPrincipal, @Param("id") trashId: string) {
    await this.content.purge(staff, id(trashId));
  }

  @Put("settings/:key")
  writeSetting(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentWriteInputSchema, body);
    return this.content.writeSetting(staff, this.content.key(key), input.data, input.version);
  }

  @Get("settings/:key/history")
  settingHistory(@Staff() staff: StaffPrincipal, @Param("key") key: string) {
    const setting = this.content.settingKey(key);
    return this.content.history(staff, setting, setting);
  }

  @Post("settings/:key/restore")
  @HttpCode(200)
  restoreSetting(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentRestoreInputSchema, body);
    const setting = this.content.settingKey(key);
    return this.content.restore(staff, setting, setting, input.auditId, input.version, input.side);
  }
}

/** Users and roles (Super Admin), own password, staff directory, audit log. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminUsersController {
  constructor(
    @Inject(AdminUsersService) private readonly users: AdminUsersService,
    @Inject(TwoStepService) private readonly twoStep: TwoStepService,
  ) {}

  @Get("users")
  @Roles("super-admin")
  list() {
    return this.users.list();
  }

  @Post("users")
  @Roles("super-admin")
  @HttpCode(201)
  create(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.users.create(staff, parseInput(StaffCreateInputSchema, body));
  }

  @Patch("users/:id")
  @Roles("super-admin")
  update(@Staff() staff: StaffPrincipal, @Param("id") userId: string, @Body() body: unknown) {
    return this.users.update(staff, id(userId), parseInput(StaffUpdateInputSchema, body));
  }

  @Post("users/:id/invite")
  @Roles("super-admin")
  @HttpCode(200)
  resendInvite(@Staff() staff: StaffPrincipal, @Param("id") userId: string) {
    return this.users.resendInvite(staff, id(userId));
  }

  @Post("users/:id/password")
  @Roles("super-admin")
  @HttpCode(204)
  async resetPassword(
    @Staff() staff: StaffPrincipal,
    @Param("id") userId: string,
    @Body() body: unknown,
  ) {
    await this.users.resetPassword(
      staff,
      id(userId),
      parseInput(PasswordSetInputSchema, body).password,
    );
  }

  /** Issue 234: the person's last 30 sign-in attempts. */
  @Get("users/:id/logins")
  @Roles("super-admin")
  logins(@Param("id") userId: string) {
    return this.twoStep.history(id(userId));
  }

  /** Issue 234: lost phone and recovery codes; the next sign-in sets two-step sign-in up again. */
  @Post("users/:id/two-step/reset")
  @Roles("super-admin")
  @HttpCode(204)
  async resetTwoStep(@Staff() staff: StaffPrincipal, @Param("id") userId: string) {
    await this.twoStep.reset(staff, id(userId));
  }

  @Post("me/password")
  @HttpCode(204)
  async changePassword(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    const input = parseInput(PasswordChangeInputSchema, body);
    await this.users.changeOwnPassword(staff, input.current, input.next);
  }

  @Get("staff")
  directory() {
    return this.users.directory();
  }

  @Get("audit")
  @Roles("admin")
  audit(@Query() query: unknown) {
    return this.users.auditLog(parseInput(AuditListQuerySchema, query));
  }
}

/** Dashboard KPIs for the modules this person works on. */
@Controller("admin/dashboard")
@UseGuards(StaffGuard)
export class AdminDashboardController {
  constructor(@Inject(AdminDashboardService) private readonly dashboard: AdminDashboardService) {}

  @Get()
  summary(@Staff() staff: StaffPrincipal) {
    return this.dashboard.summary(staff);
  }
}

/** What waits for this person and the Ctrl+K search (D0 R1); scoped to the caller's roles and lead modules. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminWorkbenchController {
  constructor(@Inject(AdminWorkbenchService) private readonly workbench: AdminWorkbenchService) {}

  @Get("inbox")
  inbox(@Staff() staff: StaffPrincipal) {
    return this.workbench.inbox(staff);
  }

  @Get("search")
  search(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.workbench.search(staff, parseInput(AdminSearchQuerySchema, query).q);
  }
}

/** Admin › Media library: show another file wherever one is shown (D0 R3, ADMIN.md §5.7). */
@Controller("admin/media")
@UseGuards(StaffGuard)
@Roles("admin", "content-editor", "shop-manager", "travel-sales")
export class AdminMediaReplaceController {
  constructor(@Inject(MediaReplaceService) private readonly replacer: MediaReplaceService) {}

  @Post(":id/replace")
  @HttpCode(200)
  replace(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    if (!MediaIdSchema.safeParse(id).success) throw problems.notFound();
    return this.replacer.replace(staff, id, parseInput(MediaReplaceInputSchema, body).with);
  }
}
