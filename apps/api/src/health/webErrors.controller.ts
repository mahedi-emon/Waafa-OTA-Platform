import { Body, Controller, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { ErrorReporter } from "../common/errorReporter";
import { parseInput } from "../common/problem";
import { IntakeKeyGuard } from "../common/serverKey";

const WebErrorSchema = z
  .object({
    message: z.string().min(1).max(1000),
    name: z.string().max(100).optional(),
    stack: z.string().max(8000).optional(),
    path: z.string().max(300).optional(),
  })
  .strict();

/**
 * An error on the web server, sent with the intake key and passed on to the error tracking card that is On in Admin
 * › Integrations (issue 238). Nothing is stored here; with no card on it is dropped.
 */
@Controller("public/errors")
@UseGuards(IntakeKeyGuard)
export class WebErrorsController {
  constructor(@Inject(ErrorReporter) private readonly reporter: ErrorReporter) {}

  @Post()
  @HttpCode(204)
  report(@Body() body: unknown) {
    const input = parseInput(WebErrorSchema, body);
    const error = Object.assign(new Error(input.message), {
      name: input.name ?? "Error",
      ...(input.stack ? { stack: input.stack } : {}),
    });
    this.reporter.report(error, { source: "web", ...(input.path ? { path: input.path } : {}) });
  }
}
