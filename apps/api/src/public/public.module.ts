import { Module } from "@nestjs/common";
import { FilesCoreModule } from "../files/files.module";
import { IntakeService } from "./intake.service";
import { PublicController } from "./public.controller";

/** The public site's reads and submissions (B3). Needs ServicesModule. */
@Module({
  // Records claim the files their form uploaded (issue 232).
  imports: [FilesCoreModule],
  controllers: [PublicController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class PublicModule {}
