import { Module } from "@nestjs/common";
import { AdminMediaController, PublicMediaController } from "./media.controller";
import { MediaService } from "./media.service";

/** Media library (#109): uploads, alt text, deletes, and the public file route behind /uploads/. */
@Module({
  controllers: [AdminMediaController, PublicMediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
