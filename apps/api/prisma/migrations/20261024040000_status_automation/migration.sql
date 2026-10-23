-- Status automation (D0 R4): Trash, slug redirects, payment proofs linked to their order, visa application progress.
-- Additive only: new tables and nullable columns; existing rows, statuses and live records are untouched.
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "progress" JSONB;

-- AlterTable
ALTER TABLE "PaymentProof" ADD COLUMN     "decidedAt" TIMESTAMPTZ(3),
ADD COLUMN     "decidedBy" TEXT,
ADD COLUMN     "orderId" TEXT;

-- CreateTable
CREATE TABLE "TrashItem" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrashItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugRedirect" (
    "collection" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("collection","fromId")
);

-- CreateIndex
CREATE INDEX "TrashItem_deletedAt_idx" ON "TrashItem"("deletedAt");

-- CreateIndex
CREATE INDEX "TrashItem_collection_docId_idx" ON "TrashItem"("collection", "docId");

-- CreateIndex
CREATE INDEX "SlugRedirect_collection_toId_idx" ON "SlugRedirect"("collection", "toId");

-- CreateIndex
CREATE INDEX "PaymentProof_orderId_idx" ON "PaymentProof"("orderId");

