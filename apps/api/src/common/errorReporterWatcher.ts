import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { activeDsn, ErrorReporter } from "./errorReporter";

/** First read a few seconds after start, so a short-lived app (tests, the seed) never queries while shutting down. */
const FIRST_READ_MS = 5_000;

/**
 * Keeps the API's error reporter on the DSN of the error tracking card in Admin › Integrations (issue 238): started
 * after the app boots and stopped before the database connection closes.
 */
@Injectable()
export class ErrorReporterWatcher implements OnApplicationBootstrap, OnModuleDestroy {
  private stop: (() => void) | null = null;

  constructor(
    @Inject(ErrorReporter) private readonly reporter: ErrorReporter,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  onApplicationBootstrap(): void {
    this.stop = this.reporter.watch(() => activeDsn(this.prisma), FIRST_READ_MS);
  }

  onModuleDestroy(): void {
    this.stop?.();
    this.stop = null;
  }
}
