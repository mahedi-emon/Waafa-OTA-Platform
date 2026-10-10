import { Module } from "@nestjs/common";
import { IntakeService } from "./intake.service";
import { PublicController } from "./public.controller";

/** The public site's reads and submissions (B3). Needs ServicesModule. */
@Module({
  controllers: [PublicController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class PublicModule {}
