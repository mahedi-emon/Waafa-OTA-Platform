import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { IdSchema } from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { IntakeKeyGuard } from "../common/serverKey";
import { BOOKABLE_COURIERS, CouriersService } from "./couriers.service";

const CourierSchema = z.enum(BOOKABLE_COURIERS);
const BookSchema = z
  .object({ courier: CourierSchema, note: z.string().trim().max(200).optional() })
  .strict();

/** Courier booking from the order page (issue 253): the people who pack and ship. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminCouriersController {
  constructor(@Inject(CouriersService) private readonly couriers: CouriersService) {}

  /** The couriers that are on, for the "Book with …" button. */
  @Get("couriers")
  @Roles("admin", "shop-manager")
  available() {
    return this.couriers.available();
  }

  @Post("orders/:id/courier")
  @HttpCode(200)
  @Roles("admin", "shop-manager")
  book(@Staff() staff: StaffPrincipal, @Param("id") orderId: string, @Body() body: unknown) {
    const input = parseInput(BookSchema, body);
    return this.couriers.book(staff, parseInput(IdSchema, orderId), input.courier, input.note);
  }

  /** The token the owner pastes into the courier's webhook settings (Super Admin, like the rest of Integrations). */
  @Get("providers/:courier/webhook-token")
  @Roles("super-admin")
  token(@Param("courier") courier: string) {
    return { token: this.couriers.webhookToken(parseInput(CourierSchema, courier)) };
  }
}

/**
 * The courier's status webhook (issue 253), forwarded by the web server (/api/couriers/<id>/webhook) with the bearer
 * token the courier sent. A wrong token is 401; anything else is acknowledged so the courier stops retrying.
 */
@Controller("public/couriers")
@UseGuards(IntakeKeyGuard)
export class PublicCouriersController {
  constructor(@Inject(CouriersService) private readonly couriers: CouriersService) {}

  @Post(":courier/webhook")
  @HttpCode(200)
  async webhook(
    @Param("courier") courier: string,
    @Headers("x-courier-token") token: string | undefined,
    @Body() body: unknown,
  ) {
    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const ok = await this.couriers.webhook(
      parseInput(CourierSchema, courier),
      token ?? "",
      payload,
    );
    if (!ok) throw problems.unauthorized("Wrong webhook token");
    return { status: "success", message: "Webhook received" };
  }
}
