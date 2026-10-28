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
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  IdSchema,
  ReminderInputSchema,
  ReminderListQuerySchema,
  ReminderUpdateInputSchema,
  StaffAlertReadInputSchema,
} from "@waafa/shared";
import { Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { StaffAlertsService } from "./alerts.service";
import { RemindersService } from "./reminders.service";

const id = (value: string) => {
  if (!IdSchema.safeParse(value).success) throw problems.notFound();
  return value;
};

/** Each person's own reminders (issue 243). Every staff role has them; nobody reaches another person's. */
@Controller("admin/reminders")
@UseGuards(StaffGuard)
export class AdminRemindersController {
  constructor(@Inject(RemindersService) private readonly reminders: RemindersService) {}

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.reminders.list(staff, parseInput(ReminderListQuerySchema, query).leadId);
  }

  @Post()
  create(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.reminders.create(staff, parseInput(ReminderInputSchema, body));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") reminderId: string, @Body() body: unknown) {
    return this.reminders.update(
      staff,
      id(reminderId),
      parseInput(ReminderUpdateInputSchema, body),
    );
  }

  @Delete(":id")
  @HttpCode(200)
  remove(@Staff() staff: StaffPrincipal, @Param("id") reminderId: string) {
    return this.reminders.remove(staff, id(reminderId));
  }
}

/** The bell's personal alerts (issue 243): mark one, several or all read. */
@Controller("admin/alerts")
@UseGuards(StaffGuard)
export class AdminAlertsController {
  constructor(@Inject(StaffAlertsService) private readonly alerts: StaffAlertsService) {}

  @Get()
  latest(@Staff() staff: StaffPrincipal) {
    return this.alerts.latest(staff.id);
  }

  @Post("read")
  @HttpCode(200)
  read(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.alerts.markRead(staff.id, parseInput(StaffAlertReadInputSchema, body));
  }
}
