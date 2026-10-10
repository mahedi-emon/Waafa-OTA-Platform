import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError, type ZodType, type z } from "zod";

/** An RFC 7807 problem with an optional list of field errors. */
export class ProblemException extends HttpException {
  constructor(
    status: number,
    readonly title: string,
    readonly detail?: string,
    readonly fields?: Array<{ path: string; message: string }>,
    readonly code?: string,
  ) {
    super({ title, detail, fields, code }, status);
  }
}

export const problems = {
  badRequest: (detail?: string, code?: string) =>
    new ProblemException(HttpStatus.BAD_REQUEST, "Bad request", detail, undefined, code),
  unauthorized: (detail = "Sign in again") =>
    new ProblemException(HttpStatus.UNAUTHORIZED, "Unauthorized", detail),
  forbidden: (detail = "Your role cannot do this") =>
    new ProblemException(HttpStatus.FORBIDDEN, "Forbidden", detail),
  notFound: (detail = "Not found") =>
    new ProblemException(HttpStatus.NOT_FOUND, "Not found", detail),
  conflict: (detail: string, code?: string) =>
    new ProblemException(HttpStatus.CONFLICT, "Conflict", detail, undefined, code),
  tooMany: (detail = "Too many requests, try again later") =>
    new ProblemException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests", detail),
};

/** Validates input against a shared zod contract; failures become a 422 problem listing every field. */
export function parseInput<S extends ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw validationProblem(result.error);
}

export function validationProblem(error: ZodError): ProblemException {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    "Validation failed",
    "Some fields are missing or invalid",
    error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  );
}

/**
 * Every error leaves as application/problem+json (RFC 7807) with the request ID, never a stack trace. Unknown errors
 * are logged and reported as a plain 500.
 */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger("Problem");

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = { title: "Internal server error" };

    if (exception instanceof ZodError) {
      exception = validationProblem(exception);
    }
    if (exception instanceof ProblemException) {
      status = exception.getStatus();
      body = {
        title: exception.title,
        ...(exception.detail ? { detail: exception.detail } : {}),
        ...(exception.fields ? { fields: exception.fields } : {}),
        ...(exception.code ? { code: exception.code } : {}),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      body = {
        title: HttpStatus[status]?.replace(/_/g, " ").toLowerCase() ?? "Error",
        ...(typeof response === "string" ? { detail: response } : {}),
      };
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    void reply
      .status(status)
      .header("content-type", "application/problem+json")
      .send({
        type: "about:blank",
        status,
        ...body,
        instance: request.url,
        requestId: request.id,
      });
  }
}
