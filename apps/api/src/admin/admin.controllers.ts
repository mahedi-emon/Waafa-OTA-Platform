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
  AuditListQuerySchema,
  ContentOrderInputSchema,
  ContentWriteInputSchema,
  FeedbackListQuerySchema,
  FeedbackModerationInputSchema,
  LeadBulkInputSchema,
  LeadListQuerySchema,
  LeadNoteInputSchema,
  LeadUpdateInputSchema,
  OrderListQuerySchema,
  OrderUpdateInputSchema,
  PagingQuerySchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofListQuerySchema,
  PaymentProofReviewInputSchema,
  SearchLogListQuerySchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { AdminContentService } from "./content-admin.service";
import { AdminDashboardService } from "./dashboard.service";
import { AdminInboxService } from "./inbox.service";
import { AdminLeadsService } from "./leads.service";
import { AdminOrdersService } from "./orders.service";
import { AdminUsersService } from "./users.service";

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
  constructor(@Inject(AdminLeadsService) private readonly leads: AdminLeadsService) {}

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

  @Get(":id")
  detail(@Staff() staff: StaffPrincipal, @Param("id") leadId: string) {
    return this.leads.detail(staff, id(leadId));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.update(staff, id(leadId), parseInput(LeadUpdateInputSchema, body));
  }

  @Post(":id/activities")
  @HttpCode(201)
  note(@Staff() staff: StaffPrincipal, @Param("id") leadId: string, @Body() body: unknown) {
    return this.leads.addNote(staff, id(leadId), parseInput(LeadNoteInputSchema, body));
  }
}

/** Waafas World orders (FR-SHOP-09). Accounts verifies payments. */
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

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") orderId: string, @Body() body: unknown) {
    const input = parseInput(OrderUpdateInputSchema, body);
    const onlyPayment = input.status === undefined && !input.courier && !input.trackingNumber;
    if (
      !onlyPayment &&
      !staff.roles.some((role) => ["super-admin", "admin", "shop-manager"].includes(role))
    ) {
      throw problems.forbidden("Accounts can verify payments only");
    }
    return this.orders.update(staff, id(orderId), input);
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

  @Patch(":id")
  @Roles("admin", "accounts")
  review(@Staff() staff: StaffPrincipal, @Param("id") proofId: string, @Body() body: unknown) {
    return this.inbox.reviewProof(
      staff,
      id(proofId),
      parseInput(PaymentProofReviewInputSchema, body),
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
    return this.inbox.subscribers(parseInput(PagingQuerySchema, query));
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
    return this.inbox.notifications(parseInput(PagingQuerySchema, query));
  }
}

/** Every content collection and settings key (CONTENT_MODEL), by role. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminContentController {
  constructor(@Inject(AdminContentService) private readonly content: AdminContentService) {}

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
    return this.content.create(staff, this.content.collectionKey(key), input.data);
  }

  @Put("content/:key/order")
  reorder(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentOrderInputSchema, body);
    return this.content.reorder(staff, this.content.collectionKey(key), input.ids);
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
    );
  }

  @Delete("content/:key/:id")
  @HttpCode(204)
  async remove(
    @Staff() staff: StaffPrincipal,
    @Param("key") key: string,
    @Param("id") recordId: string,
  ) {
    await this.content.remove(staff, this.content.collectionKey(key), id(recordId));
  }

  @Put("settings/:key")
  writeSetting(@Staff() staff: StaffPrincipal, @Param("key") key: string, @Body() body: unknown) {
    const input = parseInput(ContentWriteInputSchema, body);
    return this.content.writeSetting(staff, this.content.key(key), input.data, input.version);
  }
}

/** Users and roles (Super Admin), own password, staff directory, audit log. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminUsersController {
  constructor(@Inject(AdminUsersService) private readonly users: AdminUsersService) {}

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
