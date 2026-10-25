import { Module } from "@nestjs/common";
import { AdminFilesController, PublicFilesController } from "./customer-files.controller";
import { CustomerFilesService } from "./customer-files.service";

/** The service alone, for the intake (claims) and the minute job (purge), without registering the routes twice. */
@Module({
  providers: [CustomerFilesService],
  exports: [CustomerFilesService],
})
export class FilesCoreModule {}

/** Customer files (issue 232): uploads, the staff list and signed links. */
@Module({
  imports: [FilesCoreModule],
  controllers: [PublicFilesController, AdminFilesController],
})
export class FilesModule {}
