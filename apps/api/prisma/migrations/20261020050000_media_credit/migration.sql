-- Media library v2 (D0 R3): the photo credit kept with a library file, offered to every field that uses it.
-- Additive and nullable: existing files keep working; nothing is rewritten.
ALTER TABLE "MediaAsset" ADD COLUMN "credit" TEXT,
    ADD COLUMN "creditUrl" TEXT;
