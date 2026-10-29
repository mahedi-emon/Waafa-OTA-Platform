import { Inject, Injectable } from "@nestjs/common";
import {
  formatTaka,
  OnlineGatewaySchema,
  providerDefinition,
  type OnlineGateway,
  type PaymentConfirmInput,
  type PaymentOutcome,
  type PaymentStartInput,
} from "@waafa/shared";
import { problems } from "../common/problem";
import { ENV, type Env } from "../config/env";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { adapterFor, type Fetcher } from "../providers/catalogAdapters";
import { PROVIDER_FETCH, ProvidersService } from "../providers/providers.service";
import { GatewayError, referenceOf, sessionId } from "./gateways";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

type OnlinePayment = {
  method: "online";
  gateway: OnlineGateway;
  attempts?: number;
  transactionId?: string;
  paidAt?: string;
};

/**
 * Online payment for Waafa’s World orders (FR-SHOP-07, issue 251): the order's total from the server goes to the
 * gateway; the result is believed only after the gateway itself confirms it (SSLCommerz validation, bKash execute,
 * Nagad verify) and the amount matches. Confirming twice changes nothing.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProvidersService) private readonly providers: ProvidersService,
    @Inject(PROVIDER_FETCH) private readonly fetcher: Fetcher,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private origin(): string {
    return (this.env.WEB_ORIGINS[0] ?? "https://waafasworld.com").replace(/\/+$/, "");
  }

  private async gateway(gateway: OnlineGateway) {
    const config = await this.providers.getIntegrationConfig("payment", gateway);
    const definition = providerDefinition(gateway);
    if (config.status !== "ready" || !definition)
      throw problems.conflict(
        "Online payment is not available now. Choose another way to pay.",
        "payment",
      );
    return {
      adapter: adapterFor(definition, this.fetcher),
      context: {
        environment: config.environment,
        settings: { ...config.settings, ipnUrl: `${this.origin()}/api/payments/${gateway}/ipn` },
        secrets: config.secrets,
      },
    };
  }

  /** Sends the visitor to the gateway for the order they just placed (their phone proves it is theirs). */
  async start(input: PaymentStartInput): Promise<{ redirectUrl: string }> {
    const order = await this.prisma.order.findUnique({ where: { reference: input.reference } });
    if (!order || order.phone !== input.phone) throw problems.notFound("Order not found");
    const payment = order.payment as OnlinePayment | { method: string };
    if (payment.method !== "online" || !("gateway" in payment))
      throw problems.conflict("This order is not paid online", "not-online");
    if (order.paymentVerified) throw problems.conflict("This order is already paid", "paid");
    if (order.status === "cancelled")
      throw problems.conflict("This order was cancelled", "cancelled");
    const { adapter, context } = await this.gateway(payment.gateway);
    if (adapter.kind !== "payment")
      throw problems.conflict("Online payment is not available now", "payment");
    const attempt = (payment.attempts ?? 0) + 1;
    await this.prisma.order.update({
      where: { id: order.id },
      data: { payment: json({ ...payment, attempts: attempt }) },
    });
    const back = (event: string) => `${this.origin()}/api/payments/${payment.gateway}/${event}`;
    try {
      const session = await adapter.initiate(
        {
          reference: sessionId(order.reference, attempt),
          amount: order.total,
          customer: {
            name: order.name,
            phone: order.phone,
            ...(order.email ? { email: order.email } : {}),
          },
          successUrl: payment.gateway === "sslcommerz" ? back("success") : back("callback"),
          failUrl: back("fail"),
          cancelUrl: back("cancel"),
        },
        context,
      );
      return { redirectUrl: session.redirectUrl };
    } catch (error) {
      throw problems.conflict(
        error instanceof GatewayError
          ? error.message
          : "The payment gateway did not answer. Try again.",
        "gateway",
      );
    }
  }

  /** The gateway's return: confirmed with the gateway, then the order is marked paid once. */
  async confirm(
    gatewayName: string,
    input: PaymentConfirmInput,
  ): Promise<{ reference: string; outcome: PaymentOutcome }> {
    const gateway = OnlineGatewaySchema.safeParse(gatewayName);
    if (!gateway.success) throw problems.notFound("Unknown gateway");
    const posted = referenceOf(input.params.tran_id ?? input.params.merchantInvoiceNumber ?? "");
    if (input.event === "cancel") return { reference: posted, outcome: "cancelled" };
    if (input.event === "fail") return { reference: posted, outcome: "failed" };
    if (gateway.data === "bkash" && (input.params.status ?? "").toLowerCase() === "cancel")
      return { reference: posted, outcome: "cancelled" };

    const { adapter, context } = await this.gateway(gateway.data);
    if (adapter.kind !== "payment") return { reference: posted, outcome: "failed" };
    let status;
    try {
      status = await adapter.verifyCallback(input.params, context);
    } catch {
      return { reference: posted, outcome: "pending" };
    }
    const reference = status.reference || posted;
    if (!status.paid || !reference) return { reference, outcome: "failed" };
    const order = await this.prisma.order.findUnique({ where: { reference } });
    if (!order) return { reference, outcome: "failed" };
    if (order.paymentVerified) return { reference, outcome: "paid" };
    const payment = order.payment as OnlinePayment;
    if (status.amount !== order.total) {
      await this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Online payment of ${formatTaka(status.amount)} doesn't match the total ${formatTaka(order.total)}: check it in the ${payment.gateway} panel before confirming.`,
          actorName: "Website",
        },
      });
      return { reference, outcome: "failed" };
    }
    const next = order.status === "placed" ? "confirmed" : order.status;
    const name = providerDefinition(gateway.data)?.name ?? gateway.data;
    await this.prisma.$transaction(async (tx) => {
      const marked = await tx.order.updateMany({
        where: { id: order.id, paymentVerified: false },
        data: {
          paymentVerified: true,
          status: next,
          payment: json({
            ...payment,
            transactionId: status.transactionId,
            paidAt: new Date().toISOString(),
          }),
        },
      });
      if (marked.count === 0) return;
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: next,
          note: `Paid online with ${name}${status.transactionId ? ` · ${status.transactionId}` : ""}`,
          actorName: "Website",
        },
      });
    });
    return { reference, outcome: "paid" };
  }
}
