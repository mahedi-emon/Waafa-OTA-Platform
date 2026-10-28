import { Controller, Get, Inject, Req, Res, UseGuards } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { canSeeEvent, LiveBus } from "./liveBus";

/** A comment line keeps proxies (nginx reads for 60 s) from closing a quiet stream. */
const HEARTBEAT_MS = 25_000;
/** Streams end after ten minutes; the browser reconnects at once, which checks the session again. */
const LIFETIME_MS = 10 * 60_000;

/**
 * GET /admin/events (issue 243): Server-Sent Events for one signed-in person. Sends `ready`, then `live` events
 * they may see (a lead of a service their roles open, an order or a payment proof for the roles that handle them,
 * their own alerts). The admin's 30-second polling stays as the fallback when a proxy or network drops the stream.
 */
@Controller("admin/events")
@UseGuards(StaffGuard)
export class AdminEventsController {
  constructor(@Inject(LiveBus) private readonly bus: LiveBus) {}

  @Get()
  stream(
    @Staff() staff: StaffPrincipal,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): void {
    reply.hijack();
    const out = reply.raw;
    out.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      // no-transform: no proxy or compression step may hold events back to compress them.
      "cache-control": "no-cache, no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    out.write("retry: 5000\n\nevent: ready\ndata: {}\n\n");
    const stop = this.bus.listen((message) => {
      if (!canSeeEvent(staff, message.audience)) return;
      out.write(`event: live\ndata: ${JSON.stringify(message.event)}\n\n`);
    });
    const beat = setInterval(() => out.write(": beat\n\n"), HEARTBEAT_MS);
    const end = setTimeout(() => out.end(), LIFETIME_MS);
    const cleanup = () => {
      stop();
      clearInterval(beat);
      clearTimeout(end);
    };
    request.raw.on("close", cleanup);
    out.on("close", cleanup);
  }
}
