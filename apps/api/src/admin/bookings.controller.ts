import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { BookingStatusSchema, BookingUpdateInputSchema, PaymentStatusSchema } from "@waafa/shared";
import { Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput } from "../common/problem";
import { AdminBookingsService } from "./bookings.service";

const ListQuerySchema = z
  .object({
    status: BookingStatusSchema.optional(),
    payment: PaymentStatusSchema.optional(),
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(10_000).optional(),
  })
  .strict();
const IdSchema = z.string().regex(/^[a-z0-9]{10,40}$/, "Unknown booking");

/** Admin › Bookings (issue 242): every staff member who may open the lead, and Accounts for every booking. */
@Controller("admin/bookings")
@UseGuards(StaffGuard)
export class AdminBookingsController {
  constructor(@Inject(AdminBookingsService) private readonly bookings: AdminBookingsService) {}

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    const input = parseInput(ListQuerySchema, query);
    return this.bookings.list(staff, {
      ...(input.status ? { status: input.status } : {}),
      ...(input.payment ? { payment: input.payment } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.page ? { page: input.page } : {}),
    });
  }

  @Get(":id")
  get(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.bookings.get(staff, parseInput(IdSchema, id));
  }

  @Patch(":id")
  update(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.bookings.update(
      staff,
      parseInput(IdSchema, id),
      parseInput(BookingUpdateInputSchema, body),
    );
  }
}
