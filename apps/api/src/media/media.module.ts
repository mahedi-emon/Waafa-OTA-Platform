import { Module } from "@nestjs/common";
import { AdminMediaController, PublicMediaController } from "./media.controller";
import { MediaService } from "./media.service";

/**
 * The media service alone, without routes, so the admin's Replace everywhere (D0 R3) can use it too without
 * registering the library's routes twice.
 */
@Module({
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaCoreModule {}

/** Media library (#109, D0 R3): uploads, crops, videos, words, uses, deletes, and the public file route behind /uploads/. */
@Module({
  imports: [MediaCoreModule],
  controllers: [AdminMediaController, PublicMediaController],
  exports: [MediaCoreModule],
})
export class MediaModule {}
