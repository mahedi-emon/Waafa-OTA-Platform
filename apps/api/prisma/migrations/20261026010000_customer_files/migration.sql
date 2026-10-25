-- CreateTable
CREATE TABLE "CustomerFile" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ownerType" TEXT,
    "ownerId" TEXT,
    "scanStatus" TEXT NOT NULL DEFAULT 'unscanned',
    "uploaderIp" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachedAt" TIMESTAMPTZ(3),
    "deleteAfter" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CustomerFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFile_storageKey_key" ON "CustomerFile"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFile_path_key" ON "CustomerFile"("path");

-- CreateIndex
CREATE INDEX "CustomerFile_ownerType_ownerId_idx" ON "CustomerFile"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "CustomerFile_status_createdAt_idx" ON "CustomerFile"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerFile_deleteAfter_idx" ON "CustomerFile"("deleteAfter");

