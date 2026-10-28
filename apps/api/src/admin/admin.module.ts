import { Module } from "@nestjs/common";
import {
  AdminActivityController,
  AdminContentController,
  AdminDashboardController,
  AdminFeedbackController,
  AdminLeadsController,
  AdminMediaReplaceController,
  AdminOrdersController,
  AdminPaymentProofsController,
  AdminUsersController,
  AdminVisaApplicationsController,
  AdminWorkbenchController,
} from "./admin.controllers";
import { AdminContentService } from "./content-admin.service";
import { AdminCustomerAccountsService } from "./customerAccounts.service";
import { AdminCustomersService } from "./customers.service";
import { AdminDashboardService } from "./dashboard.service";
import { AdminInboxService } from "./inbox.service";
import { MediaCoreModule } from "../media/media.module";
import { FilesCoreModule } from "../files/files.module";
import { AdminLeadsService } from "./leads.service";
import { MediaReplaceService } from "./media-replace.service";
import { AdminOrdersService } from "./orders.service";
import { AdminCustomersController, AdminReportsController } from "./reports.controller";
import { AdminReportsService } from "./reports.service";
import { AdminBookingsController } from "./bookings.controller";
import { AdminBookingsService } from "./bookings.service";
import { AdminQuotesController, PublicQuotesController } from "./quotes.controller";
import { AdminQuotesService } from "./quotes.service";
import { AdminStatusController } from "./status.controller";
import { StatusService } from "./status.service";
import { ContentScheduler } from "./scheduler.service";
import { AdminUsersService } from "./users.service";
import { StaffInviteController } from "./invite.controller";
import { AdminWorkbenchService } from "./workbench.service";

/** The admin API (B4): staff only, by role; needs AuthModule and ServicesModule. */
@Module({
  // Replace everywhere reads where library files are shown (D0 R3).
  // Customer files: the minute job deletes them when their time is up (issue 232).
  imports: [MediaCoreModule, FilesCoreModule],
  controllers: [
    AdminBookingsController,
    // Quotes (issue 298): the admin side and the customer's page by its signed link.
    AdminQuotesController,
    PublicQuotesController,
    AdminStatusController,
    AdminLeadsController,
    AdminVisaApplicationsController,
    AdminMediaReplaceController,
    AdminOrdersController,
    AdminFeedbackController,
    AdminPaymentProofsController,
    AdminActivityController,
    AdminContentController,
    AdminUsersController,
    StaffInviteController,
    AdminDashboardController,
    AdminReportsController,
    AdminCustomersController,
    AdminWorkbenchController,
  ],
  providers: [
    AdminBookingsService,
    AdminQuotesService,
    StatusService,
    AdminLeadsService,
    MediaReplaceService,
    AdminOrdersService,
    AdminInboxService,
    AdminContentService,
    AdminUsersService,
    AdminDashboardService,
    AdminReportsService,
    AdminCustomersService,
    AdminCustomerAccountsService,
    AdminWorkbenchService,
    // The minute job: scheduled publishing, window refreshes, Trash purge, overdue alerts (D0 R4).
    ContentScheduler,
  ],
})
export class AdminModule {}
