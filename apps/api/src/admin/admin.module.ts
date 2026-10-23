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
  AdminWorkbenchController,
} from "./admin.controllers";
import { AdminContentService } from "./content-admin.service";
import { AdminCustomersService } from "./customers.service";
import { AdminDashboardService } from "./dashboard.service";
import { AdminInboxService } from "./inbox.service";
import { MediaCoreModule } from "../media/media.module";
import { AdminLeadsService } from "./leads.service";
import { MediaReplaceService } from "./media-replace.service";
import { AdminOrdersService } from "./orders.service";
import { AdminCustomersController, AdminReportsController } from "./reports.controller";
import { AdminReportsService } from "./reports.service";
import { ContentScheduler } from "./scheduler.service";
import { AdminUsersService } from "./users.service";
import { AdminWorkbenchService } from "./workbench.service";

/** The admin API (B4): staff only, by role; needs AuthModule and ServicesModule. */
@Module({
  // Replace everywhere reads where library files are shown (D0 R3).
  imports: [MediaCoreModule],
  controllers: [
    AdminLeadsController,
    AdminMediaReplaceController,
    AdminOrdersController,
    AdminFeedbackController,
    AdminPaymentProofsController,
    AdminActivityController,
    AdminContentController,
    AdminUsersController,
    AdminDashboardController,
    AdminReportsController,
    AdminCustomersController,
    AdminWorkbenchController,
  ],
  providers: [
    AdminLeadsService,
    MediaReplaceService,
    AdminOrdersService,
    AdminInboxService,
    AdminContentService,
    AdminUsersService,
    AdminDashboardService,
    AdminReportsService,
    AdminCustomersService,
    AdminWorkbenchService,
    // The minute job: scheduled publishing, window refreshes, Trash purge, overdue alerts (D0 R4).
    ContentScheduler,
  ],
})
export class AdminModule {}
