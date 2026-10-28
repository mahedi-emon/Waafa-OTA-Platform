-- Issue 245: reviews from real customers and product questions (additive).
-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reply" TEXT,
    "decidedAt" TIMESTAMPTZ(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductQuestion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answeredBy" TEXT,
    "answeredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_kind_targetId_status_idx" ON "Review"("kind", "targetId", "status");

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_kind_targetId_customerId_key" ON "Review"("kind", "targetId", "customerId");

-- CreateIndex
CREATE INDEX "ProductQuestion_productId_status_idx" ON "ProductQuestion"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductQuestion_status_createdAt_idx" ON "ProductQuestion"("status", "createdAt");
