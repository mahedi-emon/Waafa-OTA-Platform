import { Body, Controller, HttpCode, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { PaymentConfirmInputSchema, PaymentStartInputSchema } from "@waafa/shared";
import { IntakeKeyGuard } from "../common/serverKey";
import { parseInput } from "../common/problem";
import { PaymentsService } from "./payments.service";

/**
 * Online payment for the web server (issue 251): start the gateway for an order, and pass on a gateway's return to be
 * confirmed with the gateway itself. The intake key keeps everyone else out; amounts never come from the browser.
 */
@Controller("public/payments")
@UseGuards(IntakeKeyGuard)
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly payments: PaymentsService) {}

  @Post("start")
  @HttpCode(200)
  start(@Body() body: unknown) {
    return this.payments.start(parseInput(PaymentStartInputSchema, body));
  }

  @Post(":gateway/confirm")
  @HttpCode(200)
  confirm(@Param("gateway") gateway: string, @Body() body: unknown) {
    return this.payments.confirm(gateway, parseInput(PaymentConfirmInputSchema, body));
  }
}
