import { Module } from "@nestjs/common";
import {
  AdminActivityController,
  AdminContentController,
  AdminDashboardController,
  AdminFeedbackController,
  AdminLeadsController,
  AdminOrdersController,
  AdminPaymentProofsController,
  AdminUsersController,
} from "./admin.controllers";
import { AdminContentService } from "./content-admin.service";
import { AdminCustomersService } from "./customers.service";
import { AdminDashboardService } from "./dashboard.service";
import { AdminInboxService } from "./inbox.service";
import { AdminLeadsService } from "./leads.service";
import { AdminOrdersService } from "./orders.service";
import { AdminCustomersController, AdminReportsController } from "./reports.controller";
import { AdminReportsService } from "./reports.service";
import { AdminUsersService } from "./users.service";

/** The admin API (B4): staff only, by role; needs AuthModule and ServicesModule. */
@Module({
  controllers: [
    AdminLeadsController,
    AdminOrdersController,
    AdminFeedbackController,
    AdminPaymentProofsController,
    AdminActivityController,
    AdminContentController,
    AdminUsersController,
    AdminDashboardController,
    AdminReportsController,
    AdminCustomersController,
  ],
  providers: [
    AdminLeadsService,
    AdminOrdersService,
    AdminInboxService,
    AdminContentService,
    AdminUsersService,
    AdminDashboardService,
    AdminReportsService,
    AdminCustomersService,
  ],
})
export class AdminModule {}
